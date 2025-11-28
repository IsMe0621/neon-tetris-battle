import React from 'react';
import { KeyControls } from '../types';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, CornerDownLeft } from 'lucide-react';

interface ControlsOverlayProps {
    controls: KeyControls;
    className?: string;
}

const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ controls, className }) => {
    // Helper to format key names
    const fmt = (k: string) => {
        if (k === ' ') return 'Space';
        if (k === 'ArrowUp') return <ArrowUp size={16} />;
        if (k === 'ArrowDown') return <ArrowDown size={16} />;
        if (k === 'ArrowLeft') return <ArrowLeft size={16} />;
        if (k === 'ArrowRight') return <ArrowRight size={16} />;
        return k.toUpperCase();
    };

    return (
        <div className={`text-slate-500 text-xs flex flex-col gap-1 p-2 bg-slate-900/50 rounded ${className}`}>
            <div className="flex justify-between items-center gap-2"><span>左移/右移</span> <span className="flex gap-1 bg-slate-800 px-1 rounded">{fmt(controls.left)} {fmt(controls.right)}</span></div>
            <div className="flex justify-between items-center gap-2"><span>加速下落</span> <span className="bg-slate-800 px-1 rounded flex items-center">{fmt(controls.down)}</span></div>
            <div className="flex justify-between items-center gap-2"><span>旋轉</span> <span className="bg-slate-800 px-1 rounded flex items-center">{fmt(controls.rotate)} <RotateCw size={12} className="ml-1"/></span></div>
            <div className="flex justify-between items-center gap-2"><span>硬降 (直接落地)</span> <span className="bg-slate-800 px-1 rounded flex items-center">{fmt(controls.drop)} <CornerDownLeft size={12} className="ml-1"/></span></div>
            <div className="flex justify-between items-center gap-2"><span>暫存方塊</span> <span className="bg-slate-800 px-1 rounded">{fmt(controls.hold)}</span></div>
        </div>
    );
};

export default ControlsOverlay;