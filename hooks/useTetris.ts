import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createEmptyGrid,
  getRandomTetromino,
  checkCollision,
  rotateMatrix,
  getGhostPosition,
} from '../utils/gameUtils';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  GAME_SPEED_START,
  TETROMINOES,
} from '../constants';
import {
  Grid,
  TetrominoType,
  GameStatus,
  KeyControls,
  PlayerStats,
} from '../types';
import { soundManager } from '../utils/sound';

interface UseTetrisProps {
  controls?: KeyControls; // Undefined for bots
  isBot?: boolean;
  onGameOver?: (score: number) => void;
  onAttack?: (lines: number) => void;
  gameStatus: GameStatus;
}

export const useTetris = ({
  controls,
  isBot = false,
  onGameOver,
  onAttack,
  gameStatus,
}: UseTetrisProps) => {
  // --- Refs for mutable state (needed for game loop efficiency) ---
  const gridRef = useRef<Grid>(createEmptyGrid());
  const activePieceRef = useRef<{
    type: TetrominoType;
    x: number;
    y: number;
    rotation: number;
    shape: number[][];
  } | null>(null);
  
  const nextQueueRef = useRef<TetrominoType[]>([
    getRandomTetromino(),
    getRandomTetromino(),
    getRandomTetromino(),
  ]);
  const holdPieceRef = useRef<TetrominoType | null>(null);
  const canHoldRef = useRef<boolean>(true);
  const statsRef = useRef<PlayerStats>({ score: 0, lines: 0, level: 1 });
  const speedRef = useRef<number>(GAME_SPEED_START);
  const lastTimeRef = useRef<number>(0);
  const dropAccumulatorRef = useRef<number>(0);
  const isGameOverRef = useRef<boolean>(false);

  // --- React State for Rendering ---
  const [displayGrid, setDisplayGrid] = useState<Grid>(createEmptyGrid());
  const [nextPiece, setNextPiece] = useState<TetrominoType[]>([]);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    lines: 0,
    level: 1,
  });

  // --- Helpers ---
  const spawnPiece = useCallback(() => {
    const type = nextQueueRef.current.shift()!;
    nextQueueRef.current.push(getRandomTetromino());
    setNextPiece([...nextQueueRef.current]);

    const shape = TETROMINOES[type].shape;
    // Center the piece
    const startX = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
    
    activePieceRef.current = {
      type,
      x: startX,
      y: 0,
      rotation: 0,
      shape,
    };
    canHoldRef.current = true;

    // Immediate collision check (Game Over)
    if (checkCollision(gridRef.current, shape, { x: startX, y: 0 })) {
      isGameOverRef.current = true;
      if (!isBot) soundManager.playSFX('gameover');
      if (onGameOver) onGameOver(statsRef.current.score);
    }
  }, [onGameOver, isBot]);

  const lockPiece = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece) return;
    
    if (!isBot) soundManager.playSFX('drop');

    // 1. Lock piece into grid
    const newGrid = gridRef.current.map((row) => [...row]);
    piece.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newGrid[boardY][boardX] = {
              type: piece.type,
              locked: true,
            };
          }
        }
      });
    });

    // 2. Check for cleared lines
    let linesCleared = 0;
    const cleanGrid = newGrid.filter((row) => {
      const isFull = row.every((cell) => cell.locked && cell.type !== 'GARBAGE');
      if (isFull) linesCleared++;
      return !isFull;
    });
    
    // Simpler check:
    const survivingRows: typeof newGrid = [];
    let clearedCount = 0;
    
    newGrid.forEach(row => {
        const isFull = row.every(cell => cell.locked);
        if (isFull) {
            clearedCount++;
        } else {
            survivingRows.push(row);
        }
    });

    // Add new empty rows at top
    while (survivingRows.length < BOARD_HEIGHT) {
      survivingRows.unshift(
        Array.from({ length: BOARD_WIDTH }, () => ({ type: null, locked: false }))
      );
    }
    
    gridRef.current = survivingRows;

    // 3. Update stats
    if (clearedCount > 0) {
      if (!isBot) soundManager.playSFX('clear');
      
      const points = [0, 100, 300, 500, 800][clearedCount] || 0;
      statsRef.current.score += points * statsRef.current.level;
      statsRef.current.lines += clearedCount;
      statsRef.current.level = Math.floor(statsRef.current.lines / 10) + 1;
      speedRef.current = Math.max(100, GAME_SPEED_START - (statsRef.current.level - 1) * 50);
      
      setStats({ ...statsRef.current });

      // Attack opponent
      // User requested rule: Every line eliminated adds a line to the opponent
      if (onAttack && clearedCount > 0) {
          onAttack(clearedCount);
      }
    }

    activePieceRef.current = null;
    spawnPiece();
  }, [onAttack, spawnPiece, isBot]);

  // --- Movement Logic ---
  const move = useCallback((dx: number, dy: number) => {
    const piece = activePieceRef.current;
    if (!piece || isGameOverRef.current) return false;

    if (!checkCollision(gridRef.current, piece.shape, { x: piece.x + dx, y: piece.y + dy })) {
      piece.x += dx;
      piece.y += dy;
      if (dx !== 0 && !isBot) soundManager.playSFX('move');
      return true;
    }
    
    // If moving down failed, lock logic happens in loop
    if (dy > 0) {
        // Just return false, the loop handles locking
        return false;
    }
    return false;
  }, [isBot]);

  const rotate = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece || isGameOverRef.current) return;

    const newShape = rotateMatrix(piece.shape);
    // Wall kicks (basic: try center, then left, then right)
    const kicks = [0, -1, 1, -2, 2];
    
    for (const kick of kicks) {
        if (!checkCollision(gridRef.current, newShape, { x: piece.x + kick, y: piece.y })) {
            piece.x += kick;
            piece.shape = newShape;
            if (!isBot) soundManager.playSFX('rotate');
            return;
        }
    }
  }, [isBot]);

  const hardDrop = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece || isGameOverRef.current) return;
    
    while (!checkCollision(gridRef.current, piece.shape, { x: piece.x, y: piece.y + 1 })) {
        piece.y += 1;
        statsRef.current.score += 2; // Hard drop bonus
    }
    setStats({...statsRef.current});
    lockPiece();
    updateDisplay(); // Force update immediately
  }, [lockPiece]);

  const hold = useCallback(() => {
      if (!canHoldRef.current || isGameOverRef.current || !activePieceRef.current) return;
      
      const currentType = activePieceRef.current.type;
      if (holdPieceRef.current === null) {
          holdPieceRef.current = currentType;
          spawnPiece(); // gets next from queue
      } else {
          const temp = holdPieceRef.current;
          holdPieceRef.current = currentType;
          
          // Swap active piece
          activePieceRef.current = {
              type: temp,
              x: Math.floor((BOARD_WIDTH - TETROMINOES[temp].shape[0].length) / 2),
              y: 0,
              rotation: 0,
              shape: TETROMINOES[temp].shape
          };
      }
      canHoldRef.current = false;
      setHoldPiece(holdPieceRef.current);
      if (!isBot) soundManager.playSFX('move');
  }, [spawnPiece, isBot]);

  const receiveGarbage = useCallback((lines: number) => {
      if (isGameOverRef.current) return;
      if (!isBot) soundManager.playSFX('garbage');
      
      const newGrid = [...gridRef.current];
      
      // Remove top lines (push everything up)
      newGrid.splice(0, lines);
      
      // Add garbage lines at bottom
      const garbageHole = Math.floor(Math.random() * BOARD_WIDTH);
      for(let i=0; i<lines; i++) {
          const row = Array.from({length: BOARD_WIDTH}, (_, idx) => ({
              type: idx === garbageHole ? null : 'GARBAGE' as const,
              locked: idx !== garbageHole
          }));
          newGrid.push(row);
      }
      
      gridRef.current = newGrid;
      // Note: This might push the active piece into collision.
      // Advanced implementations nudge the piece up, here we just let collision handle next frame
  }, [isBot]);

  // --- Rendering Sync ---
  const updateDisplay = useCallback(() => {
    const piece = activePieceRef.current;
    const renderGrid = gridRef.current.map(row => row.map(cell => ({...cell, ghost: false})));

    if (piece) {
        // Draw Ghost
        const ghostY = getGhostPosition(gridRef.current, piece.shape, {x: piece.x, y: piece.y});
        piece.shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                   const bgY = ghostY + y;
                   const bgX = piece.x + x;
                   if (bgY >= 0 && bgY < BOARD_HEIGHT && bgX >= 0 && bgX < BOARD_WIDTH) {
                       renderGrid[bgY][bgX].ghost = true;
                   }
                }
            });
        });

        // Draw Active
        piece.shape.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val) {
                   const bgY = piece.y + y;
                   const bgX = piece.x + x;
                   if (bgY >= 0 && bgY < BOARD_HEIGHT && bgX >= 0 && bgX < BOARD_WIDTH) {
                       renderGrid[bgY][bgX] = { type: piece.type, locked: false };
                   }
                }
            });
        });
    }
    
    setDisplayGrid(renderGrid);
  }, []);

  // --- Game Loop ---
  useEffect(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    // Initialize if needed
    if (!activePieceRef.current && !isGameOverRef.current) {
        spawnPiece();
    }

    let animationId: number;
    
    const loop = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        if (!isGameOverRef.current) {
            dropAccumulatorRef.current += deltaTime;
            if (dropAccumulatorRef.current > speedRef.current) {
                dropAccumulatorRef.current = 0;
                if (!move(0, 1)) {
                    lockPiece();
                }
            }
            updateDisplay();
        }
        
        animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(animationId);
  }, [gameStatus, move, lockPiece, spawnPiece, updateDisplay]);

  // --- Input Handling ---
  useEffect(() => {
    if (gameStatus !== GameStatus.PLAYING || isBot || !controls) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (isGameOverRef.current) return;
        
        // Check if key matches controls
        const isControlKey = Object.values(controls).includes(e.key);
        
        if (isControlKey) {
            // IMPORTANT: Prevent scrolling for arrow keys, etc.
            e.preventDefault();
            
            switch (e.key) {
                case controls.left:
                    move(-1, 0);
                    break;
                case controls.right:
                    move(1, 0);
                    break;
                case controls.down:
                    move(0, 1);
                    statsRef.current.score += 1; // Soft drop score
                    break;
                case controls.rotate:
                    rotate();
                    break;
                case controls.drop:
                    hardDrop();
                    break;
                case controls.hold:
                    hold();
                    break;
            }
            updateDisplay();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, isBot, controls, move, rotate, hardDrop, hold, updateDisplay]);

  // --- Bot Logic ---
  useEffect(() => {
      if (gameStatus !== GameStatus.PLAYING || !isBot) return;

      const interval = setInterval(() => {
          if (isGameOverRef.current) {
              clearInterval(interval);
              return;
          }
          
          // Very dumb bot: Move random, rotate random, drop
          const r = Math.random();
          if (r < 0.2) move(-1, 0);
          else if (r < 0.4) move(1, 0);
          else if (r < 0.6) rotate();
          else if (r > 0.9) hardDrop();
          else move(0, 1);
          
      }, 300); // Fast bot

      return () => clearInterval(interval);
  }, [gameStatus, isBot, move, rotate, hardDrop]);

  // Reset
  const reset = useCallback(() => {
     gridRef.current = createEmptyGrid();
     activePieceRef.current = null;
     nextQueueRef.current = [getRandomTetromino(), getRandomTetromino(), getRandomTetromino()];
     holdPieceRef.current = null;
     statsRef.current = { score: 0, lines: 0, level: 1 };
     isGameOverRef.current = false;
     setStats({ score: 0, lines: 0, level: 1 });
     setNextPiece([...nextQueueRef.current]);
     setHoldPiece(null);
     setDisplayGrid(createEmptyGrid());
  }, []);

  return {
    displayGrid,
    nextPiece,
    holdPiece,
    stats,
    receiveGarbage,
    reset
  };
};