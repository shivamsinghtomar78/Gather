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
    Check,
    Expand,
    X,
    Calendar,
    Tag as TagIcon,
    Globe,
    Lock,
    GraduationCap
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MediaEmbed } from './MediaEmbed';
import { Button } from './ui/button';
import { contentApi } from '@/lib/api';
import { FlashcardModal } from './FlashcardModal';

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
    searchQuery?: string;
    isPublic?: boolean;
    isOwner?: boolean;
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
    onShare,
    searchQuery = '',
    isPublic: initialIsPublic = false,
    isOwner = true
}: ContentCardProps) {
    const [isPublic, setIsPublic] = useState(initialIsPublic);
    const [isUpdating, setIsUpdating] = useState(false);

    const togglePublic = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOwner || isUpdating) return;
        setIsUpdating(true);
        try {
            await contentApi.updatePublicStatus(id, !isPublic);
            setIsPublic(!isPublic);
        } catch (error) {
            console.error('Failed to update public status:', error);
        } finally {
            setIsUpdating(false);
        }
    };
    const Icon = typeIcons[type] || FileText;
    const iconColor = typeColors[type] || 'text-slate-400';
    const [isCopied, setIsCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);

    const handleCopyLink = () => {
        if (link) {
            navigator.clipboard.writeText(link);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase()
                        ? <span key={i} className="bg-yellow-400/30 text-yellow-200 px-0.5 rounded">{part}</span>
                        : part
                )}
            </>
        );
    };

    const cardContent = (
        <div
            onClick={() => setIsExpanded(true)}
            className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-5 hover:bg-slate-900/80 hover:border-purple-500/40 transition-all duration-200 group backdrop-blur-sm glow-purple-sm h-full flex flex-col cursor-pointer select-none ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className={cn("w-5 h-5 shrink-0", iconColor)} />
                    <h3 className="font-semibold text-slate-100 line-clamp-1">{highlightText(title, searchQuery)}</h3>
                </div>

                {/* Actions (Desktop Hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isOwner && (
                        <button
                            onClick={togglePublic}
                            className={cn(
                                "p-1 px-1.5 transition-colors",
                                isPublic ? "text-purple-400 hover:text-purple-300" : "text-slate-500 hover:text-slate-100"
                            )}
                            title={isPublic ? "Public (Visible on profile)" : "Private"}
                            disabled={isUpdating}
                        >
                            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                        className="p-1 px-1.5 text-slate-500 hover:text-slate-100"
                    >
                        <Expand className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 px-1.5 text-slate-500 hover:text-slate-100"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Preview */}
            <div className="mb-4 relative flex-shrink-0">
                <MediaEmbed type={type} url={link} imageUrl={imageUrl} title={title} />
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
                                className={cn(
                                    "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                                    tag.toLowerCase().includes(searchQuery.toLowerCase()) && searchQuery.trim()
                                        ? "bg-yellow-400/20 text-yellow-200 border-yellow-500/30"
                                        : "bg-purple-600/20 text-purple-300 border-purple-500/20"
                                )}
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
        <>
            <ContextMenu.Root>
                <ContextMenu.Trigger asChild>
                    {cardContent}
                </ContextMenu.Trigger>

                <ContextMenu.Portal>
                    <ContextMenu.Content
                        className="min-w-[160px] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-2xl z-[100] animate-in fade-in zoom-in duration-200"
                    >
                        <ContextMenu.Item
                            onClick={() => setIsExpanded(true)}
                            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white outline-none cursor-pointer"
                        >
                            <Expand className="w-4 h-4" />
                            Expand Details
                        </ContextMenu.Item>

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

                        <ContextMenu.Item
                            onClick={() => setIsFlashcardOpen(true)}
                            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-purple-400 rounded-lg hover:bg-purple-950/30 hover:text-purple-300 outline-none cursor-pointer"
                        >
                            <GraduationCap className="w-4 h-4" />
                            Study Flashcards
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

            <Dialog.Root open={isExpanded} onOpenChange={setIsExpanded}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] animate-in fade-in duration-300" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-purple-500/20 rounded-3xl p-0 shadow-2xl z-[120] animate-in zoom-in-95 duration-300 focus:outline-none no-scrollbar">
                        <div className="relative">
                            <MediaEmbed type={type} url={link} imageUrl={imageUrl} title={title} />
                            <Dialog.Close className="absolute top-6 right-6 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md">
                                <X className="w-6 h-6" />
                            </Dialog.Close>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("w-6 h-6", iconColor)} />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{type}</span>
                                    </div>
                                    <Dialog.Title className="text-3xl font-bold text-white leading-tight">
                                        {title}
                                    </Dialog.Title>
                                </div>
                                {link && (
                                    <Button
                                        onClick={() => window.open(link, '_blank')}
                                        className="glow-purple"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Visit Link
                                    </Button>
                                )}
                            </div>

                            {description && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes & Content</h4>
                                    <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                                        {description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-purple-500/10">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <TagIcon className="w-3 h-3" />
                                        Tags
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-purple-600/20 text-purple-300 text-xs font-bold rounded-lg border border-purple-500/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        Metadata
                                    </h4>
                                    <p className="text-sm text-slate-400">
                                        Added on {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <FlashcardModal
                contentId={id}
                open={isFlashcardOpen}
                onOpenChange={setIsFlashcardOpen}
            />
        </>
    );
}
