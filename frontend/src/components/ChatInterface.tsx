'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { contentApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatInterface() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMessage = query.trim();
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await contentApi.chat(userMessage);
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting to your brain right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-purple-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 glow-purple group"
            >
                <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-24 right-8 w-[400px] h-[600px] bg-slate-900/95 backdrop-blur-xl border border-purple-500/20 rounded-3xl shadow-2xl z-[60] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-purple-500/10 flex items-center justify-between bg-purple-600/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-600 text-white">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Brain AI</h3>
                                    <p className="text-[10px] text-purple-300 font-medium uppercase tracking-wider">Ask anything about your notes</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                    <div className="p-4 rounded-full bg-purple-600/10 text-purple-400">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">How can I help you?</h4>
                                        <p className="text-xs text-slate-400 mt-2">Try asking: "What are some of my recent project ideas?" or "Summarize my notes on AI."</p>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-xl shrink-0",
                                        msg.role === 'user' ? "bg-purple-600 text-white" : "bg-slate-800 text-purple-400"
                                    )}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-purple-600 text-white rounded-tr-none"
                                            : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 max-w-[85%] animate-pulse">
                                    <div className="p-2 rounded-xl bg-slate-800 text-purple-400 shrink-0">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="bg-slate-800 h-10 w-32 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center px-4">
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
                                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form
                            onSubmit={handleChat}
                            className="p-4 bg-slate-900/50 border-t border-purple-500/10 flex gap-2"
                        >
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Type your question..."
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
