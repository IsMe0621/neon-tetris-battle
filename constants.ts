import { TetrominoType, Tetromino, KeyControls, LevelConfig, ShopItem, IAPProduct } from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const GAME_SPEED_START = 800;
export const GAME_SPEED_MIN = 100;
export const MATCH_TIME = 180; // 3 minutes for VS modes

export const TETROMINOES: Record<TetrominoType, Tetromino> = {
  [TetrominoType.I]: {
    type: TetrominoType.I,
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]',
  },
  [TetrominoType.J]: {
    type: TetrominoType.J,
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]',
  },
  [TetrominoType.L]: {
    type: TetrominoType.L,
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]',
  },
  [TetrominoType.O]: {
    type: TetrominoType.O,
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]',
  },
  [TetrominoType.S]: {
    type: TetrominoType.S,
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]',
  },
  [TetrominoType.T]: {
    type: TetrominoType.T,
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]',
  },
  [TetrominoType.Z]: {
    type: TetrominoType.Z,
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
  },
};

export const GARBAGE_COLOR = 'bg-slate-500 border-slate-400';

export const CONTROLS_P1: KeyControls = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd',
  rotate: 'w',
  drop: ' ',
  hold: 'e',
};

export const CONTROLS_P2: KeyControls = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  rotate: 'ArrowUp',
  drop: 'Enter',
  hold: '/',
};

// 關卡配置
export const CAMPAIGN_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "初試啼聲",
    description: "獲得 1,000 分即可通關",
    targetScore: 1000,
    reward: 100
  },
  {
    id: 2,
    name: "速度考驗",
    description: "獲得 3,000 分即可通關",
    targetScore: 3000,
    reward: 200
  },
  {
    id: 3,
    name: "生存挑戰",
    description: "在 60 秒內不要輸掉遊戲",
    timeLimit: 60,
    reward: 300
  },
  {
    id: 4,
    name: "大師之路",
    description: "獲得 10,000 分",
    targetScore: 10000,
    reward: 500
  }
];

// 商店配置
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'default',
    name: '深空星雲',
    price: 0,
    bgClass: "bg-[url('https://picsum.photos/id/903/1920/1080?blur=10')] opacity-30",
    previewColor: 'bg-slate-900'
  },
  {
    id: 'cyber',
    name: '賽博城市',
    price: 300,
    bgClass: "bg-[url('https://images.unsplash.com/photo-1535242208474-9a2793260ca8?q=80&w=1920')] opacity-40",
    previewColor: 'bg-purple-900'
  },
  {
    id: 'retro',
    name: '復古波紋',
    price: 600,
    bgClass: "bg-[url('https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=1920')] opacity-40",
    previewColor: 'bg-pink-900'
  },
  {
    id: 'nature',
    name: '靜謐森林',
    price: 1000,
    bgClass: "bg-[url('https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1920')] opacity-30",
    previewColor: 'bg-green-900'
  }
];

// 內購商品
export const IAP_PRODUCTS: IAPProduct[] = [
    {
        id: 'gold_small',
        name: '一袋金幣',
        goldAmount: 500,
        priceTWD: 30,
        color: 'bg-slate-700'
    },
    {
        id: 'gold_medium',
        name: '金幣寶箱',
        goldAmount: 1200,
        priceTWD: 70,
        color: 'bg-blue-800'
    },
    {
        id: 'gold_large',
        name: '金山銀山',
        goldAmount: 3000,
        priceTWD: 170,
        color: 'bg-purple-800'
    }
];