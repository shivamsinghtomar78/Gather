'use client';

import {
    Twitter,
    Video,
    FileText,
    Link2,
    Share2,
    Trash2,
    ExternalLink,
    MoreVertical,
    Check
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface ContentCardProps {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link?: string;
    imageUrl?: string;
    description?: string;
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
    description,
    tags,
    onDelete,
    onShare
}: ContentCardProps) {
    const Icon = typeIcons[type] || FileText;
    const iconColor = typeColors[type] || 'text-slate-400';
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyLink = () => {
        if (link) {
            navigator.clipboard.writeText(link);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const cardContent = (
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-5 hover:bg-slate-900/80 hover:border-purple-500/40 transition-all duration-200 group backdrop-blur-sm glow-purple-sm h-full flex flex-col cursor-context-menu select-none">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className={cn("w-5 h-5 shrink-0", iconColor)} />
                    <h3 className="font-semibold text-slate-100 line-clamp-1">{title}</h3>
                </div>

                {/* Actions (Desktop Hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button className="p-1 px-1.5 text-slate-500 hover:text-slate-100">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Preview */}
            <div className="mb-4 relative flex-shrink-0">
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
                ) : link ? (
                    <div className="bg-slate-800/50 rounded-lg p-4 h-32 flex items-center justify-center border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                        <Icon className={cn("w-12 h-12", iconColor, "opacity-20")} />
                    </div>
                ) : (
                    <div className="bg-slate-800/20 rounded-lg p-4 h-32 flex items-center justify-center border border-slate-700/20 border-dashed">
                        <FileText className="w-12 h-12 text-slate-600/30" />
                    </div>
                )}
            </div>

            {/* Description / Notes */}
            {description && (
                <div className="mb-4 flex-1">
                    <p className="text-sm text-slate-400 line-clamp-4 leading-relaxed italic">
                        "{description}"
                    </p>
                </div>
            )}

            {/* Tags */}
            <div className={cn("flex-1", !description && "mt-auto")}>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2.5 py-1 bg-purple-600/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded-md border border-purple-500/20"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <p className="text-[10px] text-slate-500 mt-auto pt-3 border-t border-purple-500/10 flex items-center justify-between">
                <span>Added on {new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                <span className="capitalize opacity-60">{type}</span>
            </p>
        </div>
    );

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                {cardContent}
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content
                    className="min-w-[160px] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-2xl z-[100] animate-in fade-in zoom-in duration-200"
                >
                    <ContextMenu.Item
                        onClick={() => link && window.open(link, '_blank')}
                        disabled={!link}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white outline-none cursor-pointer data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open Link
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={handleCopyLink}
                        disabled={!link}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white outline-none cursor-pointer data-[disabled]:opacity-30"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                        {isCopied ? 'Copied!' : 'Copy Link'}
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        onClick={() => onShare?.(id)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white outline-none cursor-pointer"
                    >
                        <Share2 className="w-4 h-4" />
                        Share Brain
                    </ContextMenu.Item>

                    <ContextMenu.Separator className="h-px bg-slate-800 my-1 mx-1" />

                    <ContextMenu.Item
                        onClick={() => onDelete(id)}
                        className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 rounded-lg hover:bg-red-950/30 hover:text-red-300 outline-none cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Item
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}
