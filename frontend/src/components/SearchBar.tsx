'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onClear: () => void;
    isSearching?: boolean;
}

export function SearchBar({ onSearch, onClear, isSearching }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const handleClear = () => {
        setQuery('');
        onClear();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            handleClear();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search by title or tags..."
                    className="pl-10 pr-10 bg-slate-800/50 border-purple-500/30 text-slate-100 placeholder:text-slate-500 focus:border-purple-500/50 transition-colors"
                    disabled={isSearching}
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            {query && (
                <div className="absolute top-full mt-2 text-xs text-slate-500">
                    Press Enter to search • Esc to clear
                </div>
            )}
        </form>
    );
}
