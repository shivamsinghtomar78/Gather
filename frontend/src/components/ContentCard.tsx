'use client';

import { Twitter, Video, FileText, Link2, Share2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ContentCardProps {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link: string;
    imageUrl?: string;
    tags: string[];
    onDelete: (id: string) => void;
    onShare?: (id: string) => void;
}

const typeIcons = {
    tweet: Twitter,
    youtube: Video,
    document: FileText,
    link: Link2,
};

const typeColors = {
    tweet: 'text-blue-400',
    youtube: 'text-red-400',
    document: 'text-emerald-400',
    link: 'text-purple-400',
};

export function ContentCard({
    id,
    type,
    title,
    link,
    imageUrl,
    tags,
    onDelete,
    onShare
}: ContentCardProps) {
    const Icon = typeIcons[type] || FileText;
    const iconColor = typeColors[type] || 'text-slate-400';

    return (
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-5 hover:bg-slate-900/80 hover:border-purple-500/40 transition-all duration-200 group backdrop-blur-sm glow-purple-sm h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className={cn("w-5 h-5 shrink-0", iconColor)} />
                    <h3 className="font-semibold text-slate-100 line-clamp-1">{title}</h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onShare && (
                        <button
                            onClick={() => onShare(id)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-purple-400 transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(id)}
                        className="p-1.5 rounded-lg hover:bg-red-950/30 text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Preview */}
            <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-4 relative"
            >
                {imageUrl ? (
                    <div className="relative h-44 w-full overflow-hidden rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
                    </div>
                ) : (
                    <div className="bg-slate-800/50 rounded-lg p-4 h-32 flex items-center justify-center border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                        <Icon className={cn("w-12 h-12", iconColor, "opacity-20")} />
                    </div>
                )}
            </a>

            {/* Tags */}
            <div className="flex-1">
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2.5 py-1 bg-purple-600/30 text-purple-200 text-xs font-medium rounded-full border border-purple-500/30"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <p className="text-xs text-slate-500 mt-auto pt-3 border-t border-purple-500/10">
                Added on {new Date().toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })}
            </p>
        </div>
    );
}
