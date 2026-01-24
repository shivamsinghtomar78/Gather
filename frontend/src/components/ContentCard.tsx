'use client';

import {
    Twitter,
    Video,
    FileText,
    Link2,
    Share2,
    Trash2,
    ExternalLink,
    Check,
    Expand,
    Pencil,
} from 'lucide-react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MediaEmbed } from './MediaEmbed';
import { contentApi } from '@/lib/api';
import { CardActions } from './CardActions';
import { CardDialog } from './CardDialog';
import { ContentType } from '@/types';

export interface ContentCardProps {
    id: string;
    type: ContentType;
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

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

    const handleCopyLink = () => {
        if (link) {
            navigator.clipboard.writeText(link);
        } else {
            const contentToCopy = `${title}\n\n${description || ''}`;
            navigator.clipboard.writeText(contentToCopy);
        }
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const Icon = typeIcons[type] || FileText;
    const iconColor = typeColors[type] || 'text-slate-400';

    const cardContent = (
        <div
            onClick={() => setIsExpanded(true)}
            className="premium-card border border-purple-500/20 rounded-2xl p-6 glow-purple-sm h-full flex flex-col cursor-pointer select-none ring-offset-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500/50 relative overflow-hidden"
        >
            {/* Beautiful Background Image */}
            <div
                className="absolute inset-0 opacity-[0.3] group-hover:opacity-[0.4] transition-opacity duration-500 pointer-events-none card-bg-overlay z-0 backdrop-blur-[2px]"
                style={{
                    backgroundImage: 'url(/assets/card-bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Icon className={cn("w-5 h-5 shrink-0", iconColor)} />
                        <h3 className="font-semibold text-slate-100 line-clamp-1">{title}</h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center shrink-0">
                        <CardActions
                            id={id}
                            link={link}
                            title={title}
                            description={description}
                            isPublic={isPublic}
                            isOwner={isOwner}
                            onTogglePublic={togglePublic}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onShare={onShare}
                            onExpand={() => setIsExpanded(true)}
                        />
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

                <p className="text-[10px] text-slate-500 mt-auto pt-3 border-t border-purple-500/10 flex items-center justify-between">
                    <span>Added on {new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <span className="capitalize opacity-60">{type}</span>
                </p>
            </div>
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

            <CardDialog
                isOpen={isExpanded}
                onOpenChange={setIsExpanded}
                type={type}
                link={link}
                imageUrl={imageUrl}
                title={title}
                description={description}
                Icon={Icon}
                iconColor={iconColor}
            />
        </>
    );
}
