'use client';

import {
    Twitter,
    Video,
    FileText,
    Link2,
    Brain,
    Clock,
    Zap,
    Inbox,
    Flame,
    Moon,
    Sun,
    Palette,
    Sliders,
    Menu,
    X,
    Hash,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export type FilterType = 'all' | 'tweet' | 'youtube' | 'document' | 'link' | 'tags' | 'smart-recent' | 'smart-uncategorized' | 'smart-deepwork';

interface SidebarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    recentActivity?: { id: string; title: string; time: string; tags?: string[] }[];
}

const navItems = [
    { id: 'all' as const, label: 'Home', icon: Brain },
    { id: 'tweet' as const, label: 'Tweets', icon: Twitter },
    { id: 'youtube' as const, label: 'Videos', icon: Video },
    { id: 'document' as const, label: 'Documents', icon: FileText },
    { id: 'link' as const, label: 'Links', icon: Link2 },
];

const smartFolders = [
    { id: 'smart-recent' as const, label: 'Recently Added', icon: Clock },
    { id: 'smart-uncategorized' as const, label: 'Uncategorized', icon: Inbox },
    { id: 'smart-deepwork' as const, label: 'Deep Work', icon: Flame },
];

export function Sidebar({ activeFilter, onFilterChange, recentActivity = [] }: SidebarProps) {
    const [theme, setTheme] = useState<'default' | 'midnight' | 'dracula'>('default');
    const [blur, setBlur] = useState(20);
    const [isOpen, setIsOpen] = useState(false);
    const [summarizeTag, setSummarizeTag] = useState<string | null>(null);

    const tags = Array.from(new Set(recentActivity.flatMap(item => item.tags || []))).slice(0, 10);

    useEffect(() => {
        const savedTheme = localStorage.getItem('gather-theme') as any;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
        const savedBlur = localStorage.getItem('gather-blur');
        if (savedBlur) {
            const b = parseInt(savedBlur);
            setBlur(b);
            document.documentElement.style.setProperty('--glass-blur', `${b}px`);
        }
    }, []);

    const toggleTheme = (newTheme: 'default' | 'midnight' | 'dracula') => {
        setTheme(newTheme);
        if (newTheme === 'default') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', newTheme);
        }
        localStorage.setItem('gather-theme', newTheme);
    };

    const handleBlurChange = (val: number) => {
        setBlur(val);
        document.documentElement.style.setProperty('--glass-blur', `${val}px`);
        localStorage.setItem('gather-blur', val.toString());
    };

    return (
        <>
            {/* Mobile Bottom Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-md border-t border-purple-500/20 z-[60] flex items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFilter === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onFilterChange(item.id)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                                isActive ? "text-purple-400" : "text-slate-500"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        isOpen ? "text-purple-400" : "text-slate-500"
                    )}
                >
                    <Menu className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>

            {/* Backdrop for mobile sidebar */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={cn(
                "w-64 h-screen bg-slate-900/80 border-r border-purple-500/20 flex flex-col fixed left-0 top-0 backdrop-blur-sm z-[80] transition-transform duration-300 overflow-y-auto no-scrollbar lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Close button for mobile */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
                {/* Logo */}
                <div className="p-6 border-b border-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center glow-purple">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Gather</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-4 space-y-6">
                    <section>
                        <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Categories</h3>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeFilter === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onFilterChange(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                            isActive
                                                ? "bg-purple-600/30 text-white border border-purple-500/30 glow-purple-sm"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-purple-300"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-purple-400" : "text-slate-500")} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </section>

                    <section>
                        <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Smart Folders</h3>
                        <nav className="space-y-1">
                            {smartFolders.map((folder) => {
                                const Icon = folder.icon;
                                const isActive = activeFilter === folder.id;

                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => onFilterChange(folder.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                            isActive
                                                ? "bg-indigo-600/30 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.15)]"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-indigo-300"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-indigo-400" : "text-slate-500")} />
                                        {folder.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </section>

                    {/* Tags Section */}
                    <section>
                        <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                            Tags
                            <Hash className="w-3 h-3" />
                        </h3>
                        <nav className="space-y-1 px-2">
                            {tags.length > 0 ? (
                                tags.map((tag) => (
                                    <div key={tag} className="group/tag relative">
                                        <button
                                            onClick={() => onFilterChange('tags')}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-purple-400 hover:bg-purple-500/5 rounded-lg transition-all"
                                        >
                                            <span className="text-purple-500/50">#</span>
                                            {tag}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSummarizeTag(tag); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-500/0 group-hover/tag:text-purple-500 hover:scale-110 transition-all"
                                            title="Summarize with AI"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="px-2 text-[10px] text-slate-600 italic">No tags yet</p>
                            )}
                        </nav>
                    </section>

                    {/* Activity Feed */}
                    <section>
                        <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Activity Feed
                        </h3>
                        <div className="px-2 space-y-3">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, idx) => (
                                    <div key={activity.id + idx} className="flex flex-col gap-0.5 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                                        <span className="text-[11px] font-medium text-slate-200 line-clamp-1">{activity.title}</span>
                                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {activity.time}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="px-3 text-[10px] text-slate-600 italic">No recent activity</p>
                            )}
                        </div>
                    </section>

                    <section className="px-4 space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Palette className="w-3 h-3" />
                            Aesthetics
                        </h3>

                        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                            <button
                                onClick={() => toggleTheme('default')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                    theme === 'default' ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                Default
                            </button>
                            <button
                                onClick={() => toggleTheme('midnight')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                    theme === 'midnight' ? "bg-slate-950 text-white shadow-lg ring-1 ring-slate-800" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                Midnight
                            </button>
                            <button
                                onClick={() => toggleTheme('dracula')}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                    theme === 'dracula' ? "bg-[#bd93f9] text-[#282a36] shadow-lg" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                Dracula
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Sliders className="w-3 h-3" />
                                    Glass Blur
                                </span>
                                <span className="text-purple-400">{blur}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                value={blur}
                                onChange={(e) => handleBlurChange(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-auto p-4 border-t border-purple-500/10 bg-slate-900/40">
                    <p className="text-[10px] text-slate-500 text-center font-medium">
                        © Gather Brain v1.2
                    </p>
                </div>
            </aside>
            <TagSummaryModal
                tag={summarizeTag}
                open={!!summarizeTag}
                onOpenChange={(open) => !open && setSummarizeTag(null)}
            />
        </>
    );
}
