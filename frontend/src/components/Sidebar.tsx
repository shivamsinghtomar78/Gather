'use client';

import {
    Twitter,
    Video,
    FileText,
    Link2,
    Hash,
    Brain,
    Clock,
    Zap,
    Inbox,
    Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'tweet' | 'youtube' | 'document' | 'link' | 'tags' | 'smart-recent' | 'smart-uncategorized' | 'smart-deepwork';

interface SidebarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    recentActivity?: { id: string; title: string; time: string }[];
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
    return (
        <aside className="w-64 h-screen bg-slate-900/80 border-r border-purple-500/20 flex flex-col fixed left-0 top-0 backdrop-blur-sm z-50 overflow-y-auto no-scrollbar">
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
            </div>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-purple-500/10 bg-slate-900/40">
                <p className="text-[10px] text-slate-500 text-center font-medium">
                    © Gather Brain v1.2
                </p>
            </div>
        </aside>
    );
}
