import { BOARD_HEIGHT, BOARD_WIDTH, TETROMINOES } from '../constants';
import { Grid, TetrominoType, GridCell } from '../types';

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ type: null, locked: false }))
  );
};

export const getRandomTetromino = (): TetrominoType => {
  const keys = Object.keys(TETROMINOES) as TetrominoType[];
  return keys[Math.floor(Math.random() * keys.length)];
};

export const rotateMatrix = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  const rotated = matrix.map((row, i) =>
    row.map((val, j) => matrix[n - 1 - j][i])
  );
  return rotated;
};

export const checkCollision = (
  grid: Grid,
  shape: number[][],
  pos: { x: number; y: number }
): boolean => {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardX = pos.x + x;
        const boardY = pos.y + y;

        // Check bounds
        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT
        ) {
          return true;
        }

        // Check locked cells (ignore if above board, though usually we start y at 0 or -2)
        if (boardY >= 0 && grid[boardY][boardX].locked) {
          return true;
        }
      }
    }
  }
  return false;
};

export const getGhostPosition = (
    grid: Grid,
    shape: number[][],
    pos: { x: number; y: number }
): number => {
    let ghostY = pos.y;
    while (!checkCollision(grid, shape, { x: pos.x, y: ghostY + 1 })) {
        ghostY++;
    }
    return ghostY;
}
