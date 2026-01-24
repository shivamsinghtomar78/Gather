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
    Globe,
    Lock,
    Pencil,
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MediaEmbed } from './MediaEmbed';
import { Button } from './ui/button';
import { contentApi } from '@/lib/api';

export interface ContentCardProps {
    id: string;
    type: 'tweet' | 'youtube' | 'document' | 'link';
    title: string;
    link?: string;
    imageUrl?: string;
    description?: string;
    onDelete: (id: string) => void;
    onShare?: (id: string) => void;
    isPublic?: boolean;
    isOwner?: boolean;
    onEdit?: (id: string) => void;
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
    onDelete,
    onShare,
    isPublic: initialIsPublic = false,
    isOwner = true,
    onEdit
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

    const handleCopyLink = () => {
        if (link) {
            navigator.clipboard.writeText(link);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const cardContent = (
        <div
            onClick={() => setIsExpanded(true)}
            className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group backdrop-blur-md glow-purple-sm h-full flex flex-col cursor-pointer select-none ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/50 relative overflow-hidden"
        >
            {/* Beautiful Background Image */}
            <div
                className="absolute inset-0 opacity-[0.15] group-hover:opacity-[0.25] transition-opacity duration-500 pointer-events-none"
                style={{
                    backgroundImage: 'url(/assets/card-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Icon className={cn("w-5 h-5 shrink-0", iconColor)} />
                    <h3 className="font-semibold text-slate-100 line-clamp-1">{title}</h3>
                </div>

                {/* Actions (Consolidated into Three Dots) */}
                <div className="flex items-center shrink-0">
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-lg transition-all"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Portal>
                            <DropdownMenu.Content
                                className="min-w-[180px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 shadow-2xl z-[150] animate-in fade-in zoom-in duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DropdownMenu.Item
                                    onClick={() => setIsExpanded(true)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white outline-none cursor-pointer"
                                >
                                    <Expand className="w-4 h-4" />
                                    Expand Details
                                </DropdownMenu.Item>

                                {isOwner && (
                                    <>
                                        <DropdownMenu.Item
                                            onClick={() => onEdit?.(id)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white outline-none cursor-pointer"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Edit Content
                                        </DropdownMenu.Item>

                                        <DropdownMenu.Item
                                            onClick={(e: any) => togglePublic(e)}
                                            className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white outline-none cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                Visibility
                                            </div>
                                            <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded", isPublic ? "bg-purple-500/20 text-purple-400" : "bg-slate-800 text-slate-500")}>
                                                {isPublic ? 'Public' : 'Private'}
                                            </span>
                                        </DropdownMenu.Item>
                                    </>
                                )}

                                <DropdownMenu.Item
                                    onClick={handleCopyLink}
                                    disabled={!link}
                                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white outline-none cursor-pointer data-[disabled]:opacity-30"
                                >
                                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                                    {isCopied ? 'Copied Link!' : 'Copy Link'}
                                </DropdownMenu.Item>

                                <DropdownMenu.Item
                                    onClick={() => onShare?.(id)}
                                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white outline-none cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Brain
                                </DropdownMenu.Item>

                                {isOwner && (
                                    <>
                                        <DropdownMenu.Separator className="h-px bg-white/5 my-1 mx-1" />
                                        <DropdownMenu.Item
                                            onClick={() => onDelete(id)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 outline-none cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Item
                                        </DropdownMenu.Item>
                                    </>
                                )}
                            </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Root>
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

                        {isOwner && (
                            <ContextMenu.Item
                                onClick={() => onEdit?.(id)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white outline-none cursor-pointer"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Item
                            </ContextMenu.Item>
                        )}

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

        </>
    );
}
