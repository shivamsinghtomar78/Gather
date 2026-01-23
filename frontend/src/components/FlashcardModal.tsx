'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { contentApi } from '@/lib/api';
import { Brain, Loader2, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Flashcard {
    question: string;
    answer: string;
}

interface FlashcardModalProps {
    contentId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FlashcardModal({ contentId, open, onOpenChange }: FlashcardModalProps) {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (contentId && open) {
            handleGenerate();
        }
    }, [contentId, open]);

    const handleGenerate = async () => {
        if (!contentId) return;
        setLoading(true);
        try {
            const response = await contentApi.generateFlashcards(contentId);
            setFlashcards(response.data.flashcards);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error('Failed to generate flashcards:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-slate-900 border-purple-500/20 text-slate-100 p-8">
                <DialogHeader className="mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
                            <Brain className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Study Flashcards</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="min-h-[300px] flex flex-col items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                            <p className="text-sm text-slate-400 animate-pulse">Generating your study set...</p>
                        </div>
                    ) : flashcards.length > 0 ? (
                        <div className="w-full space-y-8">
                            {/* Card with Flip Animation */}
                            <div
                                className="relative w-full h-64 cursor-pointer perspective-1000"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <motion.div
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                                    className="w-full h-full relative preserve-3d"
                                >
                                    {/* Front (Question) */}
                                    <div className="absolute inset-0 w-full h-full bg-slate-800 border border-purple-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl">
                                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] mb-4">Question</span>
                                        <p className="text-xl font-medium text-white">{flashcards[currentIndex].question}</p>
                                        <p className="absolute bottom-4 text-[10px] text-slate-500 italic">Click to reveal answer</p>
                                    </div>

                                    {/* Back (Answer) */}
                                    <div className="absolute inset-0 w-full h-full bg-purple-600 border border-purple-400/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-2xl">
                                        <span className="text-[10px] font-bold text-purple-200 uppercase tracking-[0.2em] mb-4">Answer</span>
                                        <p className="text-xl font-bold text-white">{flashcards[currentIndex].answer}</p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" onClick={prevCard} className="text-slate-400 hover:text-white">
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <div className="text-sm font-bold text-slate-500 tracking-widest">
                                    {currentIndex + 1} / {flashcards.length}
                                </div>
                                <Button variant="ghost" onClick={nextCard} className="text-slate-400 hover:text-white">
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full border-slate-800 text-slate-400 hover:text-white mt-4"
                                onClick={handleGenerate}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Regenerate
                            </Button>
                        </div>
                    ) : (
                        <p className="text-slate-500">Could not generate flashcards for this content.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
