'use client';

import {
    Twitter,
    Video,
    FileText,
    Link2,
    Hash,
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'tweet' | 'youtube' | 'document' | 'link' | 'tags';

interface SidebarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

const navItems = [
    { id: 'tweet' as const, label: 'Tweets', icon: Twitter },
    { id: 'youtube' as const, label: 'Videos', icon: Video },
    { id: 'document' as const, label: 'Documents', icon: FileText },
    { id: 'link' as const, label: 'Links', icon: Link2 },
    { id: 'tags' as const, label: 'Tags', icon: Hash },
];

export function Sidebar({ activeFilter, onFilterChange }: SidebarProps) {
    return (
        <aside className="w-64 h-screen bg-slate-900/80 border-r border-purple-500/20 flex flex-col fixed left-0 top-0 backdrop-blur-sm">
            {/* Logo */}
            <div className="p-6 border-b border-purple-500/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center glow-purple">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">Gather</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFilter === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onFilterChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
                                isActive
                                    ? "bg-purple-600/40 text-purple-100 border border-purple-500/30 glow-purple-sm"
                                    : "text-slate-300 hover:bg-slate-800/50 hover:text-purple-200 hover:border-purple-500/20"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-purple-500/10">
                <p className="text-xs text-slate-400 text-center">
                    © 2024 Gather
                </p>
            </div>
        </aside>
    );
}
