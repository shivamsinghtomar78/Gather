'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Maximize2, Hash, FileText, Twitter, Video, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface Node {
    id: string;
    type: 'tag' | 'content';
    label: string;
    contentType?: 'tweet' | 'youtube' | 'document' | 'link';
    x: number;
    y: number;
}

interface Edge {
    source: string;
    target: string;
}

interface MindMapViewProps {
    content: any[];
    isOpen: boolean;
    onClose: () => void;
}

const typeIcons = {
    tweet: Twitter,
    youtube: Video,
    document: FileText,
    link: Link2
};

export function MindMapView({ content, isOpen, onClose }: MindMapViewProps) {
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
            const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isOpen]);

    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const tags = new Set<string>();

        // 1. Collect all tags
        content.forEach(item => {
            item.tags.forEach((tag: string) => tags.add(tag));
        });

        // 2. Create Tag Nodes (Central nodes)
        const tagArray = Array.from(tags);
        const radius = 400;
        tagArray.forEach((tag, i) => {
            const angle = (i / tagArray.length) * Math.PI * 2;
            nodes.push({
                id: `tag-${tag}`,
                type: 'tag',
                label: tag,
                x: Math.cos(angle) * (radius * 0.4),
                y: Math.sin(angle) * (radius * 0.4)
            });
        });

        // 3. Create Content Nodes & Edges
        content.forEach((item, i) => {
            const angle = (i / content.length) * Math.PI * 2;
            const contentNodeId = `content-${item.id}`;
            nodes.push({
                id: contentNodeId,
                type: 'content',
                label: item.title,
                contentType: item.type,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });

            // Connect to its tags
            item.tags.forEach((tag: string) => {
                edges.push({
                    source: `tag-${tag}`,
                    target: contentNodeId
                });
            });
        });

        return { nodes, edges };
    }, [content]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between border-b border-purple-500/10 bg-slate-900/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
                                <Maximize2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Mind Map View</h2>
                                <p className="text-xs text-slate-400">Visualize connections between tags and content</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-800 rounded-lg p-1 mr-4 border border-slate-700">
                                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 text-slate-400 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
                                <div className="px-3 flex items-center text-xs font-bold text-slate-500 min-w-[60px] justify-center">{Math.round(zoom * 100)}%</div>
                                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 text-slate-400 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-red-500/20">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Canvas */}
                    <div
                        className="flex-1 overflow-hidden cursor-move relative"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <svg className="w-full h-full">
                            <g transform={`translate(${offset.x + dimensions.width / 2}, ${offset.y + dimensions.height / 2}) scale(${zoom})`}>
                                {/* Edges */}
                                {edges.map((edge, i) => {
                                    const source = nodes.find(n => n.id === edge.source);
                                    const target = nodes.find(n => n.id === edge.target);
                                    if (!source || !target) return null;
                                    return (
                                        <line
                                            key={i}
                                            x1={source.x}
                                            y1={source.y}
                                            x2={target.x}
                                            y2={target.y}
                                            stroke="rgba(147, 51, 234, 0.2)"
                                            strokeWidth="1"
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {nodes.map((node) => {
                                    const Icon = node.contentType ? typeIcons[node.contentType] : Hash;
                                    return (
                                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                                            <motion.circle
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                r={node.type === 'tag' ? 40 : 20}
                                                fill={node.type === 'tag' ? "rgba(147, 51, 234, 0.2)" : "rgba(30, 41, 59, 0.8)"}
                                                stroke={node.type === 'tag' ? "rgba(147, 51, 234, 0.6)" : "rgba(147, 51, 234, 0.3)"}
                                                strokeWidth="2"
                                                className="backdrop-blur-md"
                                            />
                                            <foreignObject
                                                x={node.type === 'tag' ? -50 : -60}
                                                y={node.type === 'tag' ? -50 : -60}
                                                width={node.type === 'tag' ? 100 : 120}
                                                height={node.type === 'tag' ? 100 : 120}
                                            >
                                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                                                    <Icon className={cn("w-4 h-4 mb-1", node.type === 'tag' ? "text-purple-400" : "text-slate-400")} />
                                                    <p className={cn(
                                                        "font-bold leading-tight line-clamp-2",
                                                        node.type === 'tag' ? "text-xs text-white uppercase tracking-tighter" : "text-[8px] text-slate-300"
                                                    )}>
                                                        {node.label}
                                                    </p>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>
                    </div>

                    {/* Footer Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border border-purple-500/20 px-6 py-3 rounded-2xl shadow-2xl">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-800 pr-4 mr-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" /> Tags
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-800 pr-4 mr-2">
                            <div className="w-2 h-2 rounded-full bg-slate-700" /> Content
                        </div>
                        <p className="text-[10px] text-slate-500 italic">Drag to pan • Scroll or use buttons to zoom</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
