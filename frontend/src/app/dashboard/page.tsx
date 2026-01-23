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
import { Plus, Share2, LogOut } from 'lucide-react';
import { io } from 'socket.io-client';

interface Content {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link?: string;
    imageUrl?: string;
    description?: string;
    tags: string[];
    createdAt?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [content, setContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Content[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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
        if (searchQuery) return searchResults;

        switch (activeFilter) {
            case 'smart-recent':
                const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
                return content.filter(item => new Date(item.createdAt || '').getTime() > oneDayAgo);
            case 'smart-uncategorized':
                return content.filter(item => !item.tags || item.tags.length === 0);
            case 'smart-deepwork':
                const deepWorkTags = ['deep', 'focus', 'study', 'work', 'project'];
                return content.filter(item => item.tags?.some(tag => deepWorkTags.includes(tag.toLowerCase())));
            case 'all':
            case 'tags':
                return content;
            default:
                return content.filter(c => c.type === activeFilter);
        }
    }, [content, searchQuery, searchResults, activeFilter]);

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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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

            <main className="ml-64 min-h-screen">
                <header className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-md border-b border-purple-500/10">
                    <div className="px-8 py-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-slate-100">{getPageTitle()}</h1>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="gap-2" onClick={() => setShareModalOpen(true)}>
                                    <Share2 className="w-4 h-4" />
                                    Share Brain
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
                        <SearchBar onSearch={handleSearch} onClear={handleClearSearch} isSearching={isSearching} />
                        {searchQuery && (
                            <p className="text-sm text-slate-400">
                                Found <span className="text-purple-400 font-semibold">{searchResults.length}</span> results for "{searchQuery}"
                            </p>
                        )}
                    </div>
                </header>

                <div className="p-8">
                    {displayContent.length === 0 ? (
                        <div className="text-center py-16">
                            <Plus className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-100 mb-2">No items found</h3>
                            <p className="text-sm text-slate-400 mb-6">Try adjusting your filters or adding new content.</p>
                            <Button onClick={() => setAddModalOpen(true)}>Add Content</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayContent.map((item) => (
                                <ContentCard
                                    key={item.id}
                                    id={item.id}
                                    type={item.type}
                                    title={item.title}
                                    link={item.link}
                                    imageUrl={item.imageUrl}
                                    description={item.description}
                                    tags={item.tags}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <AddContentModal open={addModalOpen} onOpenChange={setAddModalOpen} onSuccess={fetchContent} />
            <ShareBrainModal open={shareModalOpen} onOpenChange={setShareModalOpen} contentCount={content.length} />
        </div>
    );
}
