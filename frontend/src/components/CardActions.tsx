import {
    Link2,
    Share2,
    Trash2,
    MoreVertical,
    Expand,
    Check,
    Globe,
    Lock,
    Pencil,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CardActionsProps {
    id: string;
    link?: string;
    title: string;
    description?: string;
    isPublic: boolean;
    isOwner: boolean;
    onTogglePublic: (e: any) => void;
    onEdit?: (id: string) => void;
    onDelete: (id: string) => void;
    onShare?: (id: string) => void;
    onExpand: () => void;
}

export function CardActions({
    id,
    link,
    title,
    description,
    isPublic,
    isOwner,
    onTogglePublic,
    onEdit,
    onDelete,
    onShare,
    onExpand
}: CardActionsProps) {
    const [isCopied, setIsCopied] = useState(false);

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

    return (
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
                        onClick={onExpand}
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
                                onClick={onTogglePublic}
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
                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-slate-300 rounded-lg hover:bg-white/10 hover:text-white outline-none cursor-pointer"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                        {isCopied ? 'Copied Content!' : 'Copy Link / Note'}
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
    );
}
