'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ContentCard } from '@/components/ContentCard';
import { AddContentModal } from '@/components/AddContentModal';
import { ShareBrainModal } from '@/components/ShareBrainModal';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { contentApi, searchApi } from '@/lib/api';
import { Plus, Share2, LogOut } from 'lucide-react';

type FilterType = 'all' | 'tweet' | 'youtube' | 'document' | 'link' | 'tags';

interface Content {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link: string;
    tags: string[];
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
        const token = localStorage.getItem('gather_token');
        if (!token) {
            router.push('/auth');
            return;
        }
        fetchContent();
    }, [router, fetchContent]);

    const handleDelete = async (id: string) => {
        try {
            await contentApi.delete(id);
            setContent(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete content:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('gather_token');
        router.push('/');
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setIsSearching(true);
        try {
            const response = await searchApi.search(query, activeFilter === 'all' ? undefined : activeFilter);
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

    // Use search results if searching, otherwise use filtered content
    const displayContent = searchQuery
        ? searchResults
        : (activeFilter === 'all' || activeFilter === 'tags'
            ? content
            : content.filter(c => c.type === activeFilter));

    const getPageTitle = () => {
        switch (activeFilter) {
            case 'tweet': return 'Tweets';
            case 'youtube': return 'Videos';
            case 'document': return 'Documents';
            case 'link': return 'Links';
            case 'tags': return 'All Tags';
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
            <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* Main Content */}
            <main className="ml-64 min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-md border-b border-purple-500/10">
                    <div className="px-8 py-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-slate-100">{getPageTitle()}</h1>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setShareModalOpen(true)}
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Brain
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => setAddModalOpen(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Content
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLogout}
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <SearchBar
                            onSearch={handleSearch}
                            onClear={handleClearSearch}
                            isSearching={isSearching}
                        />

                        {/* Search Results Info */}
                        {searchQuery && (
                            <div className="flex items-center justify-between text-sm">
                                <p className="text-slate-400">
                                    {isSearching ? (
                                        <span>Searching...</span>
                                    ) : (
                                        <span>
                                            Found <span className="text-purple-400 font-semibold">{searchResults.length}</span> result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Grid */}
                <div className="p-8">
                    {displayContent.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                                <Plus className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-100 mb-2">
                                {searchQuery ? 'No results found' : 'No content yet'}
                            </h3>
                            <p className="text-slate-400 mb-6">
                                {searchQuery
                                    ? `No content matches "${searchQuery}". Try a different search term.`
                                    : 'Start adding tweets, videos, documents, and links to your second brain.'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setAddModalOpen(true)}>
                                    Add Your First Content
                                </Button>
                            )}
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
                                    tags={item.tags}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <AddContentModal
                open={addModalOpen}
                onOpenChange={setAddModalOpen}
                onSuccess={fetchContent}
            />

            <ShareBrainModal
                open={shareModalOpen}
                onOpenChange={setShareModalOpen}
                contentCount={content.length}
            />
        </div>
    );
}
