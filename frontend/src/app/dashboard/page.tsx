'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, FilterType } from '@/components/Sidebar';
import { ContentCard } from '@/components/ContentCard';
import { AddContentModal } from '@/components/AddContentModal';
import { ShareBrainModal } from '@/components/ShareBrainModal';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { authApi, contentApi, searchApi, tokenManager } from '@/lib/api';
import { Plus, Share2, LogOut, Grid, X, Tag, Maximize2 } from 'lucide-react';
import { io } from 'socket.io-client';
import Masonry from 'react-masonry-css';
import { SkeletonCard } from '@/components/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ChatInterface } from '@/components/ChatInterface';
import { MindMapView } from '@/components/MindMapView';

const Brain3D = dynamic(() => import('@/components/Brain3D').then(mod => mod.Brain3D), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-purple-500/5 animate-pulse rounded-full" />
});

interface Content {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link?: string;
    imageUrl?: string;
    description?: string;
    tags: string[];
    isPublic?: boolean;
    createdAt?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [content, setContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [isMindMapOpen, setIsMindMapOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Content[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Get API base URL for socket connection
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const fetchContent = useCallback(async () => {
        try {
            const response = await contentApi.getAll();
            setContent(response.data.content || []);
        } catch (error: any) {
            if (error.response?.status === 401) {
                router.push('/auth');
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const checkAuth = () => {
            if (!tokenManager.isAuthenticated()) {
                router.push('/auth');
                return false;
            }
            return true;
        };

        if (checkAuth()) {
            fetchContent();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInput) {
                e.preventDefault();
                setAddModalOpen(true);
            }
            if (e.key === 'Escape') {
                setAddModalOpen(false);
                setShareModalOpen(false);
                handleClearSearch();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Real-time listener setup
        const socket = io(socketUrl);
        const userInfo = tokenManager.getUserInfo();

        if (userInfo) {
            console.log(`📡 Joining real-time channel for user: ${userInfo.username}`);

            socket.on(`content:added:${userInfo.id}`, (data) => {
                console.log('✨ New content added in another tab:', data.title);
                fetchContent();
            });

            socket.on(`content:deleted:${userInfo.id}`, () => {
                console.log('🗑️ Content deleted in another tab');
                fetchContent();
            });
        }

        window.addEventListener('focus', checkAuth);
        return () => {
            window.removeEventListener('focus', checkAuth);
            window.removeEventListener('keydown', handleKeyDown);
            socket.disconnect();
        };
    }, [router, fetchContent, socketUrl]);

    const handleDelete = async (id: string) => {
        try {
            await contentApi.delete(id);
            setContent(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete content:', error);
        }
    };

    const handleLogout = async () => {
        await authApi.logout();
        router.push('/');
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setIsSearching(true);
        try {
            const response = await searchApi.search(query,
                ['all', 'tags', 'smart-recent', 'smart-uncategorized', 'smart-deepwork'].includes(activeFilter)
                    ? undefined
                    : activeFilter as any
            );
            setSearchResults(response.data.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
        setActiveFilter('tags');
    };

    const recentActivity = useMemo(() => {
        return [...content]
            .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
            .slice(0, 5)
            .map(item => ({
                id: item.id,
                title: item.title,
                time: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
            }));
    }, [content]);

    const displayContent = useMemo(() => {
        let filtered = searchQuery ? searchResults : content;

        // Apply active filter if not searching
        if (!searchQuery) {
            switch (activeFilter) {
                case 'smart-recent':
                    const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
                    filtered = filtered.filter(item => new Date(item.createdAt || '').getTime() > oneDayAgo);
                    break;
                case 'smart-uncategorized':
                    filtered = filtered.filter(item => !item.tags || item.tags.length === 0);
                    break;
                case 'smart-deepwork':
                    const deepWorkTags = ['deep', 'focus', 'study', 'work', 'project'];
                    filtered = filtered.filter(item => item.tags?.some(tag => deepWorkTags.includes(tag.toLowerCase())));
                    break;
                case 'all':
                case 'tags':
                    break;
                default:
                    filtered = filtered.filter(c => c.type === activeFilter);
            }
        }

        // Apply tag filtering if selectedTags exist
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                selectedTags.every(tag => item.tags.includes(tag))
            );
        }

        return filtered;
    }, [content, searchQuery, searchResults, activeFilter, selectedTags]);

    const getPageTitle = () => {
        switch (activeFilter) {
            case 'tweet': return 'Tweets';
            case 'youtube': return 'Videos';
            case 'document': return 'Documents';
            case 'link': return 'Links';
            case 'tags': return 'All Tags';
            case 'smart-recent': return 'Recently Added';
            case 'smart-uncategorized': return 'Uncategorized Content';
            case 'smart-deepwork': return 'Deep Work Mode';
            default: return 'All Notes';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950">
                <Sidebar
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                />
                <main className="ml-64 p-8">
                    <div className="h-40 mb-8 border-b border-purple-500/10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                recentActivity={recentActivity}
            />

            <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
                <header className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-md border-b border-purple-500/10">
                    <div className="px-8 py-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-slate-100">{getPageTitle()}</h1>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="gap-2" onClick={() => setShareModalOpen(true)}>
                                    <Share2 className="w-4 h-4" />
                                    Share Brain
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border-purple-500/20"
                                    onClick={() => setIsMindMapOpen(true)}
                                >
                                    <Maximize2 className="w-4 h-4" />
                                    Mind Map
                                </Button>
                                <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                    Add Content
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            <div className="flex-1 w-full">
                                <SearchBar onSearch={handleSearch} onClear={handleClearSearch} isSearching={isSearching} />
                            </div>

                            <div className="hidden lg:block w-48 h-32 relative">
                                <Brain3D tags={Array.from(new Set(content.flatMap(c => c.tags)))} onTagClick={toggleTag} />
                            </div>
                        </div>

                        <AnimatePresence>
                            {(searchQuery || selectedTags.length > 0) && (
                                <motion.div
                                    className="flex flex-wrap gap-2 pt-2"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {searchQuery && (
                                        <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md flex items-center gap-2 border border-purple-500/30">
                                            Search: {searchQuery}
                                            <button onClick={handleClearSearch}><X className="w-3 h-3 hover:text-white" /></button>
                                        </div>
                                    )}
                                    {selectedTags.map(tag => (
                                        <div key={tag} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md flex items-center gap-2 border border-indigo-500/30">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                            <button onClick={() => toggleTag(tag)}><X className="w-3 h-3 hover:text-white" /></button>
                                        </div>
                                    ))}
                                    {displayContent.length > 0 && (
                                        <span className="text-xs text-slate-500 self-center">
                                            {displayContent.length} results
                                        </span>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <div className="p-8">
                    {displayContent.length === 0 ? (
                        <div className="text-center py-24 glass rounded-3xl border-dashed border-2 border-purple-500/10">
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full animate-pulse" />
                                <Grid className="w-16 h-16 text-slate-700 absolute inset-0 m-auto" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 mb-2">Your Mind is Clear</h3>
                            <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto">This space is ready for your next big idea. Start by adding a tweet, video, or link.</p>
                            <Button className="glow-purple" onClick={() => setAddModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Item
                            </Button>
                        </div>
                    ) : (
                        <Masonry
                            breakpointCols={{
                                default: 3,
                                1100: 2,
                                700: 1
                            }}
                            className="flex -ml-6 w-auto"
                            columnClassName="pl-6 bg-clip-padding"
                        >
                            <AnimatePresence mode='popLayout'>
                                {displayContent.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className="mb-6"
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ContentCard
                                            id={item.id}
                                            type={item.type}
                                            title={item.title}
                                            link={item.link}
                                            imageUrl={item.imageUrl}
                                            description={item.description}
                                            tags={item.tags}
                                            isPublic={item.isPublic}
                                            isOwner={true}
                                            onDelete={handleDelete}
                                            searchQuery={searchQuery}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </Masonry>
                    )}
                </div>
            </main>

            <AddContentModal open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={fetchContent} />
            <ShareBrainModal open={shareModalOpen} onOpenChange={setShareModalOpen} contentCount={content.length} />
            <ChatInterface />
            <MindMapView
                content={content}
                isOpen={isMindMapOpen}
                onClose={() => setIsMindMapOpen(false)}
            />
        </div>
    );
}
