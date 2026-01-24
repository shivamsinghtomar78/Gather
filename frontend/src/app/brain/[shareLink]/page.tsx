'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { brainApi } from '@/lib/api';
import { ContentCard } from '@/components/ContentCard';
import { Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Content {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link?: string;
    description?: string;
    imageUrl?: string;
    isPublic?: boolean;
}

interface SharedBrain {
    username: string;
    displayName?: string;
    profilePicUrl?: string;
    content: Content[];
}

export default function SharedBrainPage() {
    const params = useParams();
    const shareLink = params.shareLink as string;

    const [data, setData] = useState<SharedBrain | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSharedBrain = async () => {
            try {
                const response = await brainApi.getShared(shareLink);
                setData(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load shared brain');
            } finally {
                setLoading(false);
            }
        };

        if (shareLink) {
            fetchSharedBrain();
        }
    }, [shareLink]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-pulse shadow-lg glow-purple">
                    <Brain className="w-7 h-7 text-white" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                        <Brain className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Brain Not Found</h1>
                        <p className="text-slate-400">{error}</p>
                    </div>
                    <Link href="/" className="block">
                        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border-0 py-6">
                            Go to Homepage
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500/30">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-purple-500/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center overflow-hidden shadow-lg glow-purple-sm group-hover:scale-105 transition-all duration-300">
                                {data?.profilePicUrl ? (
                                    <img src={data.profilePicUrl} alt="Owner" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-950">
                                        <span className="text-sm font-black text-white">
                                            {data?.username?.[0]?.toUpperCase() || <Brain className="w-6 h-6" />}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className="h-6 w-px bg-slate-800" />

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-200">
                                    {data?.displayName || data?.username}&apos;s Brain
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Public View</span>
                            </div>
                        </div>
                    </div>

                    <Link href="/auth?mode=signup">
                        <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-lg glow-purple border-0">
                            Create Your Own
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="p-2 -ml-2 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Explore this Second Brain
                            </h1>
                        </div>
                        <p className="text-slate-400 text-sm pl-9">
                            Curated collection of {data?.content.length || 0} items by <span className="text-purple-400 font-medium">@{data?.username}</span>
                        </p>
                    </div>
                </div>

                {data?.content.length === 0 ? (
                    <div className="text-center py-32 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/20 backdrop-blur-sm">
                        <Brain className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 font-medium">This brain is currently empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data?.content.map((item) => (
                            <ContentCard
                                key={item.id}
                                id={item.id}
                                type={item.type}
                                title={item.title}
                                link={item.link}
                                description={item.description}
                                imageUrl={item.imageUrl}
                                isPublic={item.isPublic}
                                isOwner={false}
                                onDelete={() => { }} // Read-only view
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Footer Watermark (Subtle) */}
            <div className="py-12 text-center">
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">
                    Powered by Gather Brain
                </p>
            </div>
        </div>
    );
}
