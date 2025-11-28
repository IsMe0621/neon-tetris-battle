import React from 'react';
import { Grid, TetrominoType } from '../types';
import { TETROMINOES, GARBAGE_COLOR } from '../constants';

interface TetrisBoardProps {
  grid: Grid;
  playerId: string;
}

const TetrisBoard: React.FC<TetrisBoardProps> = ({ grid, playerId }) => {
  return (
    <div className="bg-slate-800 border-4 border-slate-700 p-1 rounded-md inline-block shadow-2xl">
      <div 
        className="grid grid-rows-[repeat(20,minmax(0,1fr))] grid-cols-[repeat(10,minmax(0,1fr))] gap-[1px] bg-slate-900"
        style={{ width: '250px', height: '500px' }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            let bgColor = 'bg-slate-900';
            let shadow = '';
            
            if (cell.type === 'GARBAGE') {
                bgColor = GARBAGE_COLOR;
            } else if (cell.type) {
                const tet = TETROMINOES[cell.type as TetrominoType];
                bgColor = tet.color.split(' ')[0];
                shadow = tet.color.split(' ')[1] || '';
            }

            // Ghost piece styling
            if (cell.ghost && !cell.locked) {
                return (
                     <div
                        key={`${playerId}-${x}-${y}`}
                        className="w-full h-full border border-white/20 bg-transparent"
                    />
                )
            }

            return (
              <div
                key={`${playerId}-${x}-${y}`}
                className={`w-full h-full ${bgColor} ${cell.locked ? 'border border-black/10' : ''}`}
                style={ shadow && cell.locked ? { boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)' } : {} } 
              >
                  {/* Inner bevel effect for locked blocks */}
                  {cell.locked && cell.type !== 'GARBAGE' && (
                      <div className="w-full h-full bg-white/10"></div>
                  )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TetrisBoard;
