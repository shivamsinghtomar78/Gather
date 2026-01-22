'use client';

import { useState } from 'react';
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
import { FileText, Twitter, Video, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddContentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

type ContentType = 'document' | 'tweet' | 'youtube' | 'link';

const contentTypes: { id: ContentType; label: string; icon: React.ElementType }[] = [
    { id: 'document', label: 'Document', icon: FileText },
    { id: 'tweet', label: 'Tweet', icon: Twitter },
    { id: 'youtube', label: 'YouTube', icon: Video },
    { id: 'link', label: 'Link', icon: Link2 },
];

export function AddContentModal({ open, onOpenChange, onSuccess }: AddContentModalProps) {
    const [type, setType] = useState<ContentType>('link');
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const tags = tagsInput
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            await contentApi.add({ type, link, title, tags });

            // Reset form
            setType('link');
            setLink('');
            setTitle('');
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
