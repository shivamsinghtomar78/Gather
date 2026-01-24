'use client';

import {
    Twitter,
    Video,
    FileText,
    Link2,
    Brain,
    Menu,
    X,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type FilterType = 'all' | 'tweet' | 'youtube' | 'document' | 'link';

interface SidebarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

const navItems = [
    { id: 'all' as const, label: 'Home', icon: Brain, href: '/dashboard' },
    { id: 'tweet' as const, label: 'Tweets', icon: Twitter, href: '/dashboard' },
    { id: 'youtube' as const, label: 'Videos', icon: Video, href: '/dashboard' },
    { id: 'document' as const, label: 'Documents', icon: FileText, href: '/dashboard' },
    { id: 'link' as const, label: 'Links', icon: Link2, href: '/dashboard' },
];

const secondaryNavItems = [
    { id: 'profile' as const, label: 'Profile', icon: User, href: '/profile' },
];

export function Sidebar({ activeFilter, onFilterChange }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isDashboard = pathname === '/dashboard';

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
                {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                                isActive ? "text-purple-400" : "text-slate-500"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
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
                        <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Account</h3>
                        <nav className="space-y-1">
                            {secondaryNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                            isActive
                                                ? "bg-purple-600/30 text-white border border-purple-500/30 glow-purple-sm"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-purple-300"
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-transform duration-300 group-hover:scale-110", isActive ? "text-purple-400" : "text-slate-500")} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-auto p-4 border-t border-purple-500/10 bg-slate-900/40">
                </div>
            </aside>
        </>
    );
}
