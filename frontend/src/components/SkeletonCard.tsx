'use client';

export function SkeletonCard() {
    return (
        <div className="bg-slate-900/50 border border-purple-500/10 rounded-xl p-5 min-h-[300px] flex flex-col gap-4 animate-pulse shrink-0">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-800 rounded" />
                    <div className="w-32 h-4 bg-slate-800 rounded" />
                </div>
            </div>

            <div className="w-full h-44 bg-slate-800 rounded-lg" />

            <div className="space-y-2 flex-1">
                <div className="w-full h-3 bg-slate-800 rounded" />
                <div className="w-5/6 h-3 bg-slate-800 rounded" />
                <div className="w-4/6 h-3 bg-slate-800 rounded" />
            </div>

            <div className="flex gap-2">
                <div className="w-12 h-6 bg-slate-800 rounded-md" />
                <div className="w-16 h-6 bg-slate-800 rounded-md" />
            </div>

            <div className="pt-3 border-t border-purple-500/5 flex justify-between">
                <div className="w-24 h-2 bg-slate-800 rounded" />
                <div className="w-12 h-2 bg-slate-800 rounded" />
            </div>
        </div>
    );
}
