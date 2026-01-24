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
    link: string;
}

interface SharedBrain {
    username: string;
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Brain Not Found</h1>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Link href="/">
                        <Button>Go to Homepage</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Gather</span>
                        </Link>

                        <span className="text-gray-300">|</span>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                    {data?.username[0].toUpperCase()}
                                </span>
                            </div>
                            <span className="font-medium text-gray-700">{data?.username}&apos;s Brain</span>
                        </div>
                    </div>

                    <Link href="/auth">
                        <Button>Create Your Own</Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/" className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {data?.username}&apos;s Second Brain
                    </h1>
                    <span className="text-sm text-gray-500">
                        ({data?.content.length || 0} items)
                    </span>
                </div>

                {data?.content.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500">This brain is empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data?.content.map((item) => (
                            <ContentCard
                                key={item.id}
                                id={item.id}
                                type={item.type}
                                title={item.title}
                                link={item.link}
                                onDelete={() => { }} // Read-only for shared content
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
