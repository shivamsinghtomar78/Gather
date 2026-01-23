'use client';

export function GatherWatermark() {
    return (
        <div className="absolute bottom-4 right-4 opacity-20 hover:opacity-30 transition-opacity pointer-events-none z-10">
            <div className="flex items-center gap-2">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white"
                >
                    {/* Simplified brain network icon */}
                    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="10" cy="16" r="1.5" fill="currentColor" />
                    <circle cx="14" cy="16" r="1.5" fill="currentColor" />
                    <line x1="12" y1="8" x2="8" y2="12" stroke="currentColor" strokeWidth="1" />
                    <line x1="12" y1="8" x2="16" y2="12" stroke="currentColor" strokeWidth="1" />
                    <line x1="8" y1="12" x2="10" y2="16" stroke="currentColor" strokeWidth="1" />
                    <line x1="16" y1="12" x2="14" y2="16" stroke="currentColor" strokeWidth="1" />
                    <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1" />
                </svg>
                <span className="text-white text-sm font-semibold tracking-wider">GATHER</span>
            </div>
        </div>
    );
}
