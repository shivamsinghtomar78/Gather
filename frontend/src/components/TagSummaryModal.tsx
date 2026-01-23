'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { contentApi } from '@/lib/api';
import { Sparkles, Loader2, BookOpen, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagSummaryModalProps {
    tag: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TagSummaryModal({ tag, open, onOpenChange }: TagSummaryModalProps) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (tag && open) {
            handleSummarize();
        }
    }, [tag, open]);

    const handleSummarize = async () => {
        if (!tag) return;
        setLoading(true);
        setSummary('');
        try {
            const response = await contentApi.summarize(tag);
            setSummary(response.data.summary);
            setCount(response.data.count);
        } catch (error) {
            setSummary("Failed to generate summary. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-slate-900 border-purple-500/20 text-slate-100">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">
                            Brain Summary: <span className="text-purple-400">#{tag}</span>
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Gemini AI has analyzed {count} items under this tag to provide a cohesive overview.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-6 min-h-[200px] relative">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                            >
                                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                                <p className="text-sm text-slate-400 animate-pulse">Analyzing your second brain...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-slate-800/50 border border-purple-500/10 rounded-2xl p-6 leading-relaxed text-slate-200 whitespace-pre-wrap">
                                    {summary}
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Context Source</p>
                                            <p className="text-xs text-slate-300">{count} Documents & Links</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-indigo-400" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">AI Model</p>
                                            <p className="text-xs text-slate-300">Gemini 1.5 Flash</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={() => onOpenChange(false)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-8"
                    >
                        Got it
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
