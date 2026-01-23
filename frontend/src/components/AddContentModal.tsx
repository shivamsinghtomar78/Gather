'use client';

import { useState, useRef } from 'react';
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
}

type ContentType = 'document' | 'tweet' | 'youtube' | 'link';

const contentTypes: { id: ContentType; label: string; icon: LucideIcon }[] = [
    { id: 'document', label: 'Document', icon: FileText },
    { id: 'tweet', label: 'Tweet', icon: Twitter },
    { id: 'youtube', label: 'YouTube', icon: Video },
    { id: 'link', label: 'Link', icon: Link2 },
];

export function AddContentModal({ open, onOpenChange, onSuccess }: AddContentModalProps) {
    const [type, setType] = useState<ContentType>('link');
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOCR = async (file: File) => {
        setIsProcessing(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                const response = await contentApi.ocr(base64);
                const { title, description, tags } = response.data;

                setTitle(title);
                setDescription(description);
                setTagsInput(tags.join(', '));
                setType('document');
            };
        } catch (error) {
            console.error('OCR failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleOCR(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const tags = tagsInput
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            await contentApi.add({ type, link: link || undefined, title, description, tags, imageUrl });

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

            // Reset form
            setType('link');
            setLink('');
            setTitle('');
            setDescription('');
            setImageUrl('');
            setTagsInput('');

            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Content</DialogTitle>
                    <DialogDescription>
                        Save a new piece of content to your second brain.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* OCR Upload Area */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full h-24 rounded-2xl border-2 border-dashed border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                <span className="text-xs text-purple-400 font-medium animate-pulse">Analyzing Image...</span>
                            </>
                        ) : (
                            <>
                                <Camera className="w-6 h-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
                                <div className="text-center">
                                    <span className="text-xs text-slate-300 font-bold block">Upload Image for AI OCR</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Extract text, title & tags</span>
                                </div>
                                <Sparkles className="absolute top-2 right-2 w-4 h-4 text-purple-400/20 group-hover:text-purple-400 transition-colors" />
                            </>
                        )}
                    </button>
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
                            required
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

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-1.5">
                            Tags (comma separated)
                        </label>
                        <Input
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="productivity, tech, learning..."
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
                            {loading ? 'Adding...' : 'Add Content'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
