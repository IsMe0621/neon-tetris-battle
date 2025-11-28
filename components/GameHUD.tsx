import React from 'react';
import { TetrominoType, PlayerStats } from '../types';
import { TETROMINOES } from '../constants';

interface GameHUDProps {
  stats: PlayerStats;
  nextPiece: TetrominoType[];
  holdPiece: TetrominoType | null;
  label: string;
}

// Fix: Explicitly type MiniGrid as React.FC to allow passing 'key' prop in lists
const MiniGrid: React.FC<{ type: TetrominoType | null }> = ({ type }) => {
  if (!type) return <div className="w-16 h-12"></div>;
  const shape = TETROMINOES[type].shape;
  const color = TETROMINOES[type].color.split(' ')[0];

  return (
    <div className="flex flex-col items-center justify-center w-16 h-12 bg-slate-800 rounded border border-slate-700">
      {shape.map((row, y) => (
        <div key={y} className="flex">
          {row.map((val, x) => (
            <div
              key={x}
              className={`w-3 h-3 m-[1px] ${val ? color : 'bg-transparent'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const GameHUD: React.FC<GameHUDProps> = ({ stats, nextPiece, holdPiece, label }) => {
  return (
    <div className="flex flex-col gap-4 w-24">
      <h3 className="text-center font-bold text-cyan-400 border-b border-cyan-400/30 pb-1">{label}</h3>
      
      {/* HOLD */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-400 mb-1">暫存 (HOLD)</span>
        <MiniGrid type={holdPiece} />
      </div>

      {/* STATS */}
      <div className="bg-slate-800 p-2 rounded text-center border border-slate-700">
        <div className="mb-2">
            <span className="text-[10px] text-slate-400 block">分數 (SCORE)</span>
            <span className="text-sm font-bold text-white">{stats.score}</span>
        </div>
        <div className="mb-2">
            <span className="text-[10px] text-slate-400 block">行數 (LINES)</span>
            <span className="text-sm font-bold text-white">{stats.lines}</span>
        </div>
        <div>
            <span className="text-[10px] text-slate-400 block">等級 (LEVEL)</span>
            <span className="text-sm font-bold text-white">{stats.level}</span>
        </div>
      </div>

      {/* NEXT */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-400 mb-1">下一個 (NEXT)</span>
        <div className="flex flex-col gap-2">
            {nextPiece.slice(0, 3).map((type, i) => (
                <MiniGrid key={i} type={type} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default GameHUD;