'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { contentApi } from '@/lib/api';
import { FileText, Twitter, Video, Link2, LucideIcon, Camera, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddContentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: {
        id: string;
        type: ContentType;
        link?: string;
        title: string;
        description?: string;
        imageUrl?: string;
    };
    mode?: 'add' | 'edit';
}

type ContentType = 'document' | 'tweet' | 'youtube' | 'link';

const contentTypes: { id: ContentType; label: string; icon: LucideIcon }[] = [
    { id: 'document', label: 'Document', icon: FileText },
    { id: 'tweet', label: 'Tweet', icon: Twitter },
    { id: 'youtube', label: 'YouTube', icon: Video },
    { id: 'link', label: 'Link', icon: Link2 },
];

export function AddContentModal({ open, onOpenChange, onSuccess, initialData, mode = 'add' }: AddContentModalProps) {
    const [type, setType] = useState<ContentType>(initialData?.type || 'link');
    const [link, setLink] = useState(initialData?.link || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Update state when initialData changes (for editing)
    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setLink(initialData.link || '');
            setTitle(initialData.title);
            setDescription(initialData.description || '');
            setImageUrl(initialData.imageUrl || '');
        } else {
            // Reset for 'add' mode
            setType('link');
            setLink('');
            setTitle('');
            setDescription('');
            setImageUrl('');
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = { type, link: link || undefined, title, description, imageUrl };

            if (mode === 'edit' && initialData?.id) {
                await contentApi.update(initialData.id, payload);
            } else {
                await contentApi.add(payload);
            }

            // Micro-interactions
            if (window.navigator?.vibrate) {
                window.navigator.vibrate(50); // Short haptic pulse
            }

            // Generate a subtle success beep
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // A4

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);

            if (mode === 'add') {
                // Reset form only in add mode
                setType('link');
                setLink('');
                setTitle('');
                setDescription('');
                setImageUrl('');
            }

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'add'} content`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'edit' ? 'Edit Content' : 'Add Content'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'edit'
                            ? 'Update this item in your second brain.'
                            : 'Save a new piece of content to your second brain.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Content Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">
                            Content Type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {contentTypes.map((ct) => {
                                const Icon = ct.icon;
                                return (
                                    <button
                                        key={ct.id}
                                        type="button"
                                        onClick={() => setType(ct.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200",
                                            type === ct.id
                                                ? "border-purple-500 bg-purple-600/40 text-purple-100 glow-purple-sm"
                                                : "border-purple-500/20 hover:bg-slate-800 text-slate-400 hover:text-purple-300"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{ct.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-1.5">
                            Title
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title..."
                            required
                        />
                    </div>

                    {/* Link */}
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-1.5">
                            Link
                        </label>
                        <Input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://..."
                            required={type !== 'document'}
                        />
                    </div>

                    {/* Image URL (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-1.5">
                            Image URL (Optional)
                        </label>
                        <Input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                        />
                    </div>

                    {/* Description / Notes (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-1.5">
                            Notes / Content (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add some notes or long-form content here..."
                            className="w-full min-h-[100px] bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (mode === 'edit' ? 'Update Content' : 'Add Content')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
