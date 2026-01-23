'use client';

import { Play, ExternalLink, Video } from 'lucide-react';
import { useState } from 'react';

interface MediaEmbedProps {
    type: 'tweet' | 'youtube' | 'document' | 'link';
    url?: string;
    imageUrl?: string;
    title: string;
}

export function MediaEmbed({ type, url, imageUrl, title }: MediaEmbedProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (type === 'youtube' && url) {
        const videoId = getYoutubeId(url);
        if (videoId && isPlaying) {
            return (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-purple-500/20">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }

        return (
            <div
                className="relative aspect-video w-full rounded-lg overflow-hidden border border-purple-500/20 group cursor-pointer"
                onClick={() => setIsPlaying(true)}
            >
                <img
                    src={imageUrl || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                </div>
            </div>
        );
    }

    if (imageUrl) {
        return (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-purple-500/20">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className="aspect-video w-full rounded-lg bg-slate-800/50 border border-purple-500/10 flex flex-col items-center justify-center gap-3">
            <Video className="w-12 h-12 text-slate-700" />
            <p className="text-xs text-slate-500">No preview available</p>
        </div>
    );
}
