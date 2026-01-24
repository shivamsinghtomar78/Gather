import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/button';
import { MediaEmbed } from './MediaEmbed';
import { X, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ContentType } from '@/types';

interface CardDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    type: ContentType;
    link?: string;
    imageUrl?: string;
    title: string;
    description?: string;
    Icon: any;
    iconColor: string;
}

export function CardDialog({
    isOpen,
    onOpenChange,
    type,
    link,
    imageUrl,
    title,
    description,
    Icon,
    iconColor
}: CardDialogProps) {
    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
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
    );
}
