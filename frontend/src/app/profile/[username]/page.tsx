'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { profileApi } from '@/lib/api';
import { ContentCard } from '@/components/ContentCard';
import { Brain, Globe, Github, Twitter, ExternalLink, Hash } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Masonry from 'react-masonry-css';

export default function ProfilePage() {
    const { username } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await profileApi.getProfile(username as string);
                setProfile(response.data.user);
                setContent(response.data.content);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-8">
                <h1 className="text-4xl font-bold text-white mb-4">Brain Not Found</h1>
                <p className="text-slate-400">This user hasn't shared their brain with the world yet.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 selection:bg-purple-500/30">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            <main className="max-w-6xl mx-auto px-6 py-16 relative">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-16">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 p-1 mb-6 shadow-2xl glow-purple"
                    >
                        <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                            <Brain className="w-16 h-16 text-white" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-black text-white mb-2 tracking-tight"
                    >
                        @{profile.username}
                    </motion.h1>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2 text-purple-400/80 mb-6 bg-purple-500/5 px-4 py-1.5 rounded-full border border-purple-500/10"
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-widest">Shared Brain</span>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex gap-4"
                    >
                        {/* Placeholder for social links */}
                        <button className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/50 transition-all">
                            <Twitter className="w-5 h-5" />
                        </button>
                        <button className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-purple-500/50 transition-all">
                            <Github className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>

                {/* Content Grid */}
                <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Hash className="w-5 h-5 text-purple-500" />
                            Public Curations
                        </h2>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                            {content.length} Items
                        </span>
                    </div>

                    {content.length === 0 ? (
                        <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                            <p className="text-slate-500">No public content shared yet.</p>
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
                            {content.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="mb-6"
                                >
                                    <ContentCard
                                        {...item}
                                        onDelete={() => { }} // No delete on public profile
                                        isOwner={false} // Disable owner-only actions
                                    />
                                </motion.div>
                            ))}
                        </Masonry>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-24 pt-8 border-t border-slate-800 text-center">
                    <p className="text-slate-500 text-sm mb-4">Powered by</p>
                    <div className="inline-flex items-center gap-2 bg-purple-600/10 text-purple-400 px-4 py-2 rounded-xl border border-purple-500/20 font-bold hover:scale-105 transition-transform cursor-pointer">
                        <Brain className="w-5 h-5" />
                        Gather Brain
                    </div>
                </footer>
            </main>
        </div>
    );
}
