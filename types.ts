export enum TetrominoType {
  I = 'I',
  J = 'J',
  L = 'L',
  O = 'O',
  S = 'S',
  T = 'T',
  Z = 'Z',
}

export type GridCell = {
  type: TetrominoType | 'GARBAGE' | null;
  locked: boolean;
  ghost?: boolean;
};

export type Grid = GridCell[][];

export interface Coordinate {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  shape: number[][]; // 2D array representing the shape
  color: string;
}

export enum GameMode {
  // Level 1 Menus
  MENU_MAIN = 'MENU_MAIN',
  
  // Level 2 Menus
  MENU_SINGLE_SELECT = 'MENU_SINGLE_SELECT',
  MENU_DOUBLE_SELECT = 'MENU_DOUBLE_SELECT',
  
  // Functional Screens
  CAMPAIGN_SELECT = 'CAMPAIGN_SELECT', // 關卡選擇
  SHOP = 'SHOP', // 商店
  LOBBY = 'LOBBY', // 連線大廳
  LOBBY_WAITING = 'LOBBY_WAITING', // 等待對手
  
  // Game Play
  SINGLE = 'SINGLE', // 單人無盡
  CAMPAIGN_GAME = 'CAMPAIGN_GAME', // 單人闖關進行中
  LOCAL_VS = 'LOCAL_VS',
  ONLINE_VS = 'ONLINE_VS', // 連線對戰
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export interface PlayerStats {
  score: number;
  lines: number;
  level: number;
}

export interface KeyControls {
  up: string;
  down: string;
  left: string;
  right: string;
  rotate: string;
  drop: string; // Hard drop
  hold: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  targetScore?: number;
  timeLimit?: number; // Seconds
  reward: number; // Gold reward
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  bgClass: string; // Tailwind class or URL
  previewColor: string;
}

export interface IAPProduct {
    id: string;
    name: string;
    goldAmount: number;
    priceTWD: number;
    color: string;
}