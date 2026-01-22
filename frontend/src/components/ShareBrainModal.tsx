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
import { brainApi } from '@/lib/api';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareBrainModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contentCount: number;
}

export function ShareBrainModal({ open, onOpenChange, contentCount }: ShareBrainModalProps) {
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleShare = async () => {
        setError('');
        setLoading(true);

        try {
            const response = await brainApi.share(true);
            const link = response.data.link;
            // Make it a full URL
            const fullLink = `${window.location.origin}${link}`;
            setShareLink(fullLink);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to generate share link');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (shareLink) {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        try {
            await brainApi.share(false);
            setShareLink(null);
            onOpenChange(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disable sharing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Your Second Brain</DialogTitle>
                    <DialogDescription>
                        Share your entire collection of notes, documents, tweets, and videos with others.
                        They&apos;ll be able to view your content.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {!shareLink ? (
                        <>
                            <Button
                                onClick={handleShare}
                                className="w-full gap-2"
                                disabled={loading}
                            >
                                <Share2 className="w-4 h-4" />
                                {loading ? 'Generating...' : 'Share Brain'}
                            </Button>
                            <p className="text-sm text-center text-slate-400">
                                {contentCount} items will be shared
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareLink}
                                    readOnly
                                    className="flex-1 px-3 py-2 text-sm bg-slate-800/50 border border-purple-500/30 rounded-lg text-slate-100"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleDisable}
                                    disabled={loading}
                                >
                                    Disable Sharing
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
