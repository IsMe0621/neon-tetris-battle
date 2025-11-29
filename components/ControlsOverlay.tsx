import React, { useRef, useState, useEffect } from 'react';
import { Hand } from 'lucide-react';

interface ControlsOverlayProps {
    className?: string;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    onRotate?: () => void;
    onSoftDrop?: () => void;
    onHardDrop?: () => void;
    onHold?: () => void;
}

const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ 
    className,
    onMoveLeft,
    onMoveRight,
    onRotate,
    onSoftDrop,
    onHardDrop,
    onHold
}) => {
    const touchStartRef = useRef<{x: number, y: number, time: number} | null>(null);
    const [showGuide, setShowGuide] = useState(true);

    useEffect(() => {
        // Hide guide after 3 seconds of interaction possibility
        const timer = setTimeout(() => setShowGuide(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
        if (showGuide) setShowGuide(false);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        // e.preventDefault(); // Handled by CSS touch-action: none usually, but good to have if passive: false

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const diffX = currentX - touchStartRef.current.x;
        const diffY = currentY - touchStartRef.current.y;
        
        const threshold = 25; // Sensitivity

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (diffX > threshold) {
                if (onMoveRight) onMoveRight();
                touchStartRef.current.x = currentX; // Reset for continuous
            } else if (diffX < -threshold) {
                if (onMoveLeft) onMoveLeft();
                touchStartRef.current.x = currentX;
            }
        } else {
            // Vertical
            if (diffY > threshold) {
                // Down = Soft Drop
                if (onSoftDrop) onSoftDrop();
                touchStartRef.current.y = currentY; 
            } else if (diffY < -threshold) {
                // Up = Rotate
                if (onRotate) onRotate();
                touchStartRef.current.y = currentY; // Reset to avoid rapid fire
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        
        // Tap Detection for Hard Drop
        const endTime = Date.now();
        const duration = endTime - touchStartRef.current.time;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dist = Math.sqrt(Math.pow(endX - touchStartRef.current.x, 2) + Math.pow(endY - touchStartRef.current.y, 2));

        if (duration < 300 && dist < 10) {
            // It's a tap!
            if (onHardDrop) onHardDrop();
        }

        touchStartRef.current = null;
    };

    return (
        <div 
            className={`md:hidden touch-none select-none ${className || ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Guide Overlay */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000 ${showGuide ? 'opacity-100' : 'opacity-0'}`}>
                 <Hand size={48} className="text-white/30 animate-pulse mb-2" />
                 <div className="text-white/50 text-xs font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    滑動控制 / 點擊硬降
                 </div>
            </div>

            {/* Hold Button - Floating in top right */}
            <button 
                className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-white/20 bg-black/20 backdrop-blur-sm flex items-center justify-center active:bg-cyan-500/50 active:scale-95 transition-all z-50 pointer-events-auto"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering touch on board
                    if (onHold) onHold();
                }}
            >
                <span className="text-white/70 font-bold text-xs">HOLD</span>
            </button>
        </div>
    );
};

export default ControlsOverlay;