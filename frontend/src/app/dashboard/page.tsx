'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, FilterType } from '@/components/Sidebar';
import { ContentCard } from '@/components/ContentCard';
import { AddContentModal } from '@/components/AddContentModal';
import { ShareBrainModal } from '@/components/ShareBrainModal';
import { Button } from '@/components/ui/button';
import { authApi, contentApi, tokenManager } from '@/lib/api';
import { Plus, Share2, LogOut, Grid } from 'lucide-react';
import { io } from 'socket.io-client';
import { SkeletonCard } from '@/components/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';

interface Content {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link?: string;
    imageUrl?: string;
    description?: string;
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
    const [editingContent, setEditingContent] = useState<Content | null>(null);

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
            if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInput) {
                e.preventDefault();
                setAddModalOpen(true);
            }
            if (e.key === 'Escape') {
                setAddModalOpen(false);
                setShareModalOpen(false);
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

    const handleEdit = (id: string) => {
        const item = content.find(c => c.id === id);
        if (item) {
            setEditingContent(item);
            setAddModalOpen(true);
        }
    };

    const handleLogout = async () => {
        await authApi.logout();
        router.push('/');
    };

    const displayContent = useMemo(() => {
        let filtered = content;

        if (activeFilter !== 'all') {
            filtered = filtered.filter(c => c.type === activeFilter);
        }

        return filtered;
    }, [content, activeFilter]);

    const getPageTitle = () => {
        switch (activeFilter) {
            case 'tweet': return 'Tweets';
            case 'youtube': return 'Videos';
            case 'document': return 'Documents';
            case 'link': return 'Links';
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
            />

            <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
                <header className="sticky top-0 z-40 bg-slate-900/50 backdrop-blur-md border-b border-purple-500/10">
                    <div className="px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-slate-100">{getPageTitle()}</h1>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" className="gap-2" onClick={() => setShareModalOpen(true)}>
                                    <Share2 className="w-4 h-4" />
                                    Share Brain
                                </Button>
                                <Button className="gap-2" onClick={() => { setEditingContent(null); setAddModalOpen(true); }}>
                                    <Plus className="w-4 h-4" />
                                    Add Content
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
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
                            <Button className="glow-purple" onClick={() => { setEditingContent(null); setAddModalOpen(true); }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Item
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode='popLayout'>
                                {displayContent.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full"
                                    >
                                        <ContentCard
                                            id={item.id}
                                            type={item.type}
                                            title={item.title}
                                            link={item.link}
                                            imageUrl={item.imageUrl}
                                            description={item.description}
                                            isPublic={item.isPublic}
                                            isOwner={true}
                                            onDelete={handleDelete}
                                            onEdit={handleEdit}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            <AddContentModal
                open={addModalOpen}
                onOpenChange={(open) => {
                    setAddModalOpen(open);
                    if (!open) setEditingContent(null);
                }}
                onSuccess={fetchContent}
                initialData={editingContent || undefined}
                mode={editingContent ? 'edit' : 'add'}
            />
            <ShareBrainModal open={shareModalOpen} onOpenChange={setShareModalOpen} contentCount={content.length} />
        </div>
    );
}
