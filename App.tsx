import React, { useState, useEffect } from 'react';
import { useTetris } from './hooks/useTetris';
import TetrisBoard from './components/TetrisBoard';
import GameHUD from './components/GameHUD';
import ControlsOverlay from './components/ControlsOverlay';
import IAPModal from './components/IAPModal';
import { GameMode, GameStatus, LevelConfig } from './types';
import { CONTROLS_P1, CONTROLS_P2, MATCH_TIME, CAMPAIGN_LEVELS, SHOP_ITEMS } from './constants';
import { Play, Users, Clock, Pause, RotateCcw, Lock, Unlock, ShoppingCart, Globe, ArrowLeft, Trophy, Coins, Volume2, VolumeX, Plus, ArrowUp, ArrowDown, ArrowRight, Smartphone } from 'lucide-react';
import { soundManager } from './utils/sound';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MENU_MAIN);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(MATCH_TIME);
  const [winner, setWinner] = useState<string | null>(null);

  // Economy & Progression State
  const [gold, setGold] = useState<number>(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<string[]>(['default']);
  const [currentBgId, setCurrentBgId] = useState<string>('default');
  const [showIAP, setShowIAP] = useState(false);
  
  // Settings
  const [isMuted, setIsMuted] = useState(false);

  // Online State
  const [roomCode, setRoomCode] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineStatusMsg, setOnlineStatusMsg] = useState('');

  // Mobile Restriction State
  const [showDeviceRestriction, setShowDeviceRestriction] = useState(false);

  // Background Style
  const activeBg = SHOP_ITEMS.find(i => i.id === currentBgId)?.bgClass || SHOP_ITEMS[0].bgClass;

  // --- Player 1 Logic ---
  const p1 = useTetris({
    controls: CONTROLS_P1,
    gameStatus,
    onGameOver: () => checkGameOver('P2'), // In single player, checkGameOver handles null winner
    onAttack: (lines) => {
        // Attack Logic: 1 Line cleared = 1 Garbage line
        p2.receiveGarbage(lines);
    },
  });

  // --- Player 2 Logic (Used for Local VS, Bot, or Online) ---
  const p2 = useTetris({
    controls: gameMode === GameMode.LOCAL_VS ? CONTROLS_P2 : undefined,
    isBot: gameMode === GameMode.ONLINE_VS || gameMode === GameMode.SINGLE || gameMode === GameMode.CAMPAIGN_GAME ? true : false, 
    gameStatus: (gameMode === GameMode.SINGLE || gameMode === GameMode.CAMPAIGN_GAME) ? GameStatus.IDLE : gameStatus,
    onGameOver: () => checkGameOver('P1'),
    onAttack: (lines) => {
        p1.receiveGarbage(lines);
    },
  });

  // --- Game Management ---
  const startGame = (mode: GameMode, level?: LevelConfig) => {
    setGameMode(mode);
    setGameStatus(GameStatus.PLAYING);
    setWinner(null);
    p1.reset();
    p2.reset();
    
    soundManager.playBGM();

    // Attempt to lock orientation (Mobile: Portrait, Tablet/Desktop: Landscape)
    if (typeof screen !== 'undefined' && 'orientation' in screen && 'lock' in screen.orientation) {
        const isMobile = window.innerWidth < 768;
        try {
            // @ts-ignore
            const promise = isMobile ? screen.orientation.lock('portrait') : screen.orientation.lock('landscape');
            // @ts-ignore
            promise.catch((e) => console.log("Orientation lock not supported/allowed", e));
        } catch (e) {
            // Ignore errors
        }
    }

    if (mode === GameMode.CAMPAIGN_GAME && level) {
      setCurrentLevel(level);
      setTimeLeft(level.timeLimit ? level.timeLimit : 9999);
    } else {
      setCurrentLevel(null);
      setTimeLeft(MATCH_TIME);
    }
  };

  const createRoom = () => {
      const code = Math.random().toString(36).substring(2,6).toUpperCase();
      setRoomCode(code);
      setGameMode(GameMode.LOBBY_WAITING);
      setOnlineStatusMsg("等待玩家加入...");
      
      // Simulate waiting for opponent
      setTimeout(() => {
          setOnlineStatusMsg("玩家 P2 已加入！準備開始...");
          soundManager.playSFX('clear');
          setTimeout(() => {
            startGame(GameMode.ONLINE_VS);
          }, 2000);
      }, 4000);
  };

  const joinRoom = () => {
      if(!roomCode) return;
      setIsConnecting(true);
      setOnlineStatusMsg("連線中...");
      
      setTimeout(() => {
          setIsConnecting(false);
          // Simulate connection success
          startGame(GameMode.ONLINE_VS);
      }, 1500);
  };

  const checkGameOver = (winningPlayerId: string) => {
    if (gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) return;
    
    // Campaign Logic
    if (gameMode === GameMode.CAMPAIGN_GAME && currentLevel) {
       // P1 Died
       setGameStatus(GameStatus.GAME_OVER);
       setWinner(null);
       return;
    }

    setGameStatus(GameStatus.GAME_OVER);
    
    // If single player (Classic)
    if (gameMode === GameMode.SINGLE) {
       setWinner(null); 
    } else {
       setWinner(winningPlayerId);
    }
  };

  const checkCampaignWin = () => {
      if (gameMode !== GameMode.CAMPAIGN_GAME || !currentLevel || gameStatus !== GameStatus.PLAYING) return;

      let won = false;
      // Score Target
      if (currentLevel.targetScore && p1.stats.score >= currentLevel.targetScore) {
          won = true;
      }
      
      if (won) {
          setGameStatus(GameStatus.VICTORY);
          setWinner('P1');
          if (!unlockedLevels.includes(currentLevel.id + 1)) {
              setUnlockedLevels([...unlockedLevels, currentLevel.id + 1]);
          }
          setGold(prev => prev + currentLevel.reward);
      }
  };

  const togglePause = () => {
    if (gameStatus === GameStatus.PLAYING) setGameStatus(GameStatus.PAUSED);
    else if (gameStatus === GameStatus.PAUSED) setGameStatus(GameStatus.PLAYING);
  };

  const toggleMute = () => {
      const muted = soundManager.toggleMute();
      setIsMuted(muted);
  }

  const buyItem = (item: typeof SHOP_ITEMS[0]) => {
      if (ownedBackgrounds.includes(item.id)) {
          setCurrentBgId(item.id);
      } else if (gold >= item.price) {
          setGold(gold - item.price);
          setOwnedBackgrounds([...ownedBackgrounds, item.id]);
          setCurrentBgId(item.id);
          soundManager.playSFX('clear'); // Sale sound
      }
  };

  // --- Effects ---
  
  // Timer for VS Modes & Campaign Time Limit
  useEffect(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    // Check Campaign Goals constantly
    if (gameMode === GameMode.CAMPAIGN_GAME) {
        checkCampaignWin();
    }

    const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                // Time Up
                if (gameMode === GameMode.CAMPAIGN_GAME && currentLevel?.timeLimit) {
                    // Survived time limit -> Win
                    setGameStatus(GameStatus.VICTORY);
                    setWinner('P1');
                    if (!unlockedLevels.includes(currentLevel.id + 1)) {
                        setUnlockedLevels([...unlockedLevels, currentLevel.id + 1]);
                    }
                    setGold(g => g + currentLevel.reward);
                    return 0;
                }

                if (gameMode !== GameMode.SINGLE && gameMode !== GameMode.CAMPAIGN_GAME) {
                    setGameStatus(GameStatus.VICTORY);
                    if (p1.stats.score > p2.stats.score) setWinner('P1');
                    else if (p2.stats.score > p1.stats.score) setWinner('P2');
                    else setWinner('DRAW');
                }
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, gameMode, p1.stats.score, p2.stats.score, currentLevel]);


  const formatTime = (s: number) => {
      const min = Math.floor(s / 60);
      const sec = s % 60;
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const renderMainMenu = () => (
      <div className="z-10 flex flex-col md:flex-row gap-2 md:gap-4 w-full max-w-5xl justify-center items-stretch animate-fade-in-up px-4">
          {/* SINGLE PLAYER CARD */}
          <button 
             onClick={() => setGameMode(GameMode.MENU_SINGLE_SELECT)}
             className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-cyan-900/50 hover:border-cyan-400 hover:scale-105 transition-all shadow-xl group h-[22vh] md:h-auto md:min-h-[250px]"
          >
              <div className="bg-slate-900 p-3 md:p-4 rounded-full group-hover:bg-cyan-500 transition-colors">
                 <Trophy size={32} className="md:w-12 md:h-12 text-cyan-400 group-hover:text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">單人模式</h2>
              <p className="text-slate-400 text-xs md:text-sm text-center">自我挑戰、闖關冒險與無盡練習</p>
          </button>

          {/* MULTI PLAYER CARD */}
          <button 
             onClick={() => setGameMode(GameMode.MENU_DOUBLE_SELECT)}
             className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-purple-900/50 hover:border-purple-400 hover:scale-105 transition-all shadow-xl group h-[22vh] md:h-auto md:min-h-[250px]"
          >
              <div className="bg-slate-900 p-3 md:p-4 rounded-full group-hover:bg-purple-500 transition-colors">
                 <Users size={32} className="md:w-12 md:h-12 text-purple-400 group-hover:text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">雙人單機/連線</h2>
              <p className="text-slate-400 text-xs md:text-sm text-center">本機雙打或線上連線對決</p>
          </button>

          {/* SHOP CARD */}
          <button 
             onClick={() => setGameMode(GameMode.SHOP)}
             className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-emerald-900/50 hover:border-emerald-400 hover:scale-105 transition-all shadow-xl group h-[22vh] md:h-auto md:min-h-[250px]"
          >
              <div className="bg-slate-900 p-3 md:p-4 rounded-full group-hover:bg-emerald-500 transition-colors">
                 <ShoppingCart size={32} className="md:w-12 md:h-12 text-emerald-400 group-hover:text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">主題商店</h2>
              <p className="text-slate-400 text-xs md:text-sm text-center">使用金幣解鎖酷炫背景</p>
          </button>
      </div>
  );

  const renderSingleSelect = () => (
      <div className="z-10 flex flex-col items-center w-full max-w-4xl h-full justify-center pt-24 md:pt-32 pb-10">
          <h2 className="text-3xl font-black text-white mb-6 tracking-wider text-shadow-lg">單人模式選擇</h2>
          
          <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-stretch animate-fade-in-up px-4">
              <button 
                 onClick={() => setGameMode(GameMode.CAMPAIGN_SELECT)}
                 className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 md:p-4 flex flex-col items-center justify-center gap-4 hover:bg-cyan-900/50 hover:border-cyan-400 hover:scale-105 transition-all shadow-xl group h-[30vh] md:h-auto md:min-h-[120px] lg:min-h-[200px]"
              >
                  <div className="bg-slate-900 p-4 rounded-full group-hover:bg-cyan-500 transition-colors">
                     <Trophy size={48} className="text-cyan-400 group-hover:text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">闖關挑戰</h2>
                  <p className="text-slate-400 text-sm text-center">達成目標分數或限時生存賺取金幣</p>
              </button>

              <button 
                 onClick={() => startGame(GameMode.SINGLE)}
                 className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 md:p-4 flex flex-col items-center justify-center gap-4 hover:bg-blue-900/50 hover:border-blue-400 hover:scale-105 transition-all shadow-xl group h-[30vh] md:h-auto md:min-h-[120px] lg:min-h-[200px]"
              >
                  <div className="bg-slate-900 p-4 rounded-full group-hover:bg-blue-500 transition-colors">
                     <Play size={48} className="text-blue-400 group-hover:text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">無盡練習</h2>
                  <p className="text-slate-400 text-sm text-center">無時間限制，單純享受堆疊樂趣</p>
              </button>
          </div>
          
          <button onClick={() => setGameMode(GameMode.MENU_MAIN)} className="mt-8 text-slate-400 hover:text-white flex items-center gap-2 text-base font-bold bg-slate-900/50 px-6 py-2 rounded-full border border-slate-700 hover:border-white transition-all">
              <ArrowLeft size={18} /> 返回主選單
          </button>
      </div>
  );

  const renderDoubleSelect = () => (
      <div className="z-10 flex flex-col items-center w-full max-w-4xl h-full justify-center pt-24 md:pt-32 pb-10">
          <h2 className="text-3xl font-black text-white mb-6 tracking-wider text-shadow-lg">雙人對戰選擇</h2>
          
          <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-stretch animate-fade-in-up px-4">
              <button 
                 onClick={() => {
                     // Mobile Restriction for Local VS
                     if (window.innerWidth < 768) {
                         setShowDeviceRestriction(true);
                     } else {
                         startGame(GameMode.LOCAL_VS);
                     }
                 }}
                 className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 md:p-4 flex flex-col items-center justify-center gap-4 hover:bg-purple-900/50 hover:border-purple-400 hover:scale-105 transition-all shadow-xl group h-[30vh] md:h-auto md:min-h-[120px] lg:min-h-[200px]"
              >
                  <div className="bg-slate-900 p-4 rounded-full group-hover:bg-purple-500 transition-colors">
                     <Users size={48} className="text-purple-400 group-hover:text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">本機雙打</h2>
                  <p className="text-slate-400 text-sm text-center">同一台電腦，左右互搏 (WASD vs 方向鍵)</p>
              </button>

              <button 
                 onClick={() => setGameMode(GameMode.LOBBY)}
                 className="flex-1 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-2xl p-6 md:p-4 flex flex-col items-center justify-center gap-4 hover:bg-pink-900/50 hover:border-pink-400 hover:scale-105 transition-all shadow-xl group h-[30vh] md:h-auto md:min-h-[120px] lg:min-h-[200px]"
              >
                  <div className="bg-slate-900 p-4 rounded-full group-hover:bg-pink-500 transition-colors">
                     <Globe size={48} className="text-pink-400 group-hover:text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white">連線對戰</h2>
                  <p className="text-slate-400 text-sm text-center">建立房間或輸入代碼與遠端好友對戰</p>
              </button>
          </div>

          <button onClick={() => setGameMode(GameMode.MENU_MAIN)} className="mt-8 text-slate-400 hover:text-white flex items-center gap-2 text-base font-bold bg-slate-900/50 px-6 py-2 rounded-full border border-slate-700 hover:border-white transition-all">
              <ArrowLeft size={18} /> 返回主選單
          </button>
      </div>
  );

  // --- Views ---

  // IAP Overlay
  if (showIAP) {
      return (
          <div className="relative">
             {/* Render standard menu behind it roughly */}
             <div className="absolute inset-0 bg-black/50" />
             <IAPModal 
                onClose={() => setShowIAP(false)}
                onPurchase={(amount) => {
                    setGold(g => g + amount);
                    soundManager.playSFX('clear');
                }}
             />
          </div>
      );
  }

  // 1. MENU SYSTEM (Main, Single Select, Double Select)
  if (gameMode === GameMode.MENU_MAIN || gameMode === GameMode.MENU_SINGLE_SELECT || gameMode === GameMode.MENU_DOUBLE_SELECT) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden font-sans py-12">
        <div className={`fixed inset-0 bg-cover bg-center transition-all duration-1000 ${activeBg}`}></div>
        
        {/* Device Restriction Modal */}
        {showDeviceRestriction && (
             <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-slate-800 p-8 rounded-2xl max-w-sm text-center border border-slate-600 shadow-2xl relative">
                     <Smartphone className="mx-auto text-red-400 mb-4 drop-shadow-lg" size={48} />
                     <h3 className="text-2xl font-black text-white mb-2">不支援手機模式</h3>
                     <p className="text-slate-300 mb-6 text-sm">雙人單機模式需要較大的螢幕空間，僅支援平板或電腦遊玩。</p>
                     <button onClick={() => setShowDeviceRestriction(false)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/50">我知道了</button>
                </div>
             </div>
        )}

        {/* Header Title */}
        <div className="absolute top-10 text-center z-10 w-full">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                霓虹方塊對決
            </h1>
        </div>

        {/* Global Toolbar */}
        <div className="absolute top-4 right-4 z-20 flex gap-4">
            <button onClick={toggleMute} className="p-2 bg-slate-900/80 rounded-full border border-slate-600 text-white hover:text-cyan-400">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-full border border-yellow-500/30">
                <Coins className="text-yellow-400 ml-1" size={20} />
                <span className="text-yellow-400 font-bold font-digit mr-1">{gold}</span>
                <button onClick={() => setShowIAP(true)} className="bg-yellow-600 hover:bg-yellow-500 rounded-full p-0.5 text-white">
                    <Plus size={16} />
                </button>
            </div>
        </div>

        {gameMode === GameMode.MENU_MAIN && renderMainMenu()}
        {gameMode === GameMode.MENU_SINGLE_SELECT && renderSingleSelect()}
        {gameMode === GameMode.MENU_DOUBLE_SELECT && renderDoubleSelect()}
      </div>
    );
  }

  // 2. SHOP
  if (gameMode === GameMode.SHOP) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center p-8 relative h-screen overflow-y-auto">
             <div className={`absolute inset-0 bg-cover bg-center opacity-20 ${activeBg}`}></div>
             {showIAP && <IAPModal onClose={() => setShowIAP(false)} onPurchase={(a) => setGold(g => g + a)} />}
             
             <div className="z-10 w-full max-w-6xl">
                <div className="flex justify-between items-center mb-8 bg-slate-950/80 p-6 rounded-2xl border border-slate-700">
                    <button onClick={() => setGameMode(GameMode.MENU_MAIN)} className="text-white flex items-center gap-2 hover:text-cyan-400 font-bold"><ArrowLeft /> 返回選單</button>
                    <div className="text-3xl font-black text-white tracking-widest">主題商店</div>
                    <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-yellow-500/30">
                        <Coins className="text-yellow-400" /> 
                        <span className="text-yellow-400 text-xl font-bold font-digit">{gold}</span>
                        <button onClick={() => setShowIAP(true)} className="ml-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold">儲值</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {SHOP_ITEMS.map(item => {
                        const isOwned = ownedBackgrounds.includes(item.id);
                        const isEquipped = currentBgId === item.id;
                        
                        return (
                            <div key={item.id} className={`bg-slate-800 border-2 rounded-2xl overflow-hidden shadow-2xl transition-all hover:-translate-y-2 ${isEquipped ? 'border-cyan-400 ring-2 ring-cyan-400/50' : 'border-slate-700 hover:border-slate-500'}`}>
                                <div className={`h-40 w-full ${item.previewColor} relative overflow-hidden group`}>
                                     <div className="absolute inset-0 opacity-50 bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{backgroundImage: item.bgClass.match(/url\('([^']+)'\)/)?.[1] ? `url('${item.bgClass.match(/url\('([^']+)'\)/)?.[1]}')` : ''}}></div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-white font-bold text-xl mb-1">{item.name}</h3>
                                    <p className="text-slate-400 text-sm mb-6 font-digit">{item.price === 0 ? "免費" : `${item.price} G`}</p>
                                    
                                    {isOwned ? (
                                        <button 
                                            onClick={() => buyItem(item)}
                                            disabled={isEquipped}
                                            className={`w-full py-3 rounded-xl font-bold ${isEquipped ? 'bg-slate-600 text-slate-400 cursor-default' : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/30'}`}
                                        >
                                            {isEquipped ? "使用中" : "裝備"}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => buyItem(item)}
                                            disabled={gold < item.price}
                                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${gold < item.price ? 'bg-slate-700 text-slate-500' : 'bg-yellow-600 text-white hover:bg-yellow-500 shadow-lg shadow-yellow-500/30'}`}
                                        >
                                            購買
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      )
  }

  // 3. CAMPAIGN SELECT
  if (gameMode === GameMode.CAMPAIGN_SELECT) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative h-screen overflow-y-auto">
              <div className={`absolute inset-0 bg-cover bg-center opacity-20 ${activeBg}`}></div>
              <div className="z-10 w-full max-w-4xl p-8 bg-slate-950/90 rounded-3xl border border-slate-700 shadow-2xl">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                     <button onClick={() => setGameMode(GameMode.MENU_SINGLE_SELECT)} className="text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft /> 返回</button>
                     <h2 className="text-3xl font-bold text-white">闖關地圖</h2>
                     <div className="w-16 text-right font-bold text-yellow-500 flex justify-end items-center gap-1"><Coins size={16}/> {gold}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {CAMPAIGN_LEVELS.map(level => {
                          const isLocked = !unlockedLevels.includes(level.id);
                          return (
                              <button 
                                key={level.id}
                                disabled={isLocked}
                                onClick={() => startGame(GameMode.CAMPAIGN_GAME, level)}
                                className={`relative p-6 rounded-2xl border-2 text-left transition-all group overflow-hidden ${isLocked ? 'bg-slate-900 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-600 hover:border-cyan-400 hover:bg-slate-750'}`}
                              >
                                  <div className="flex justify-between items-start mb-3 relative z-10">
                                      <span className={`text-2xl font-black font-digit ${isLocked ? 'text-slate-600' : 'text-cyan-400'}`}>0{level.id}</span>
                                      {isLocked ? <Lock className="text-slate-600" size={24}/> : <Unlock className="text-emerald-500" size={24}/>}
                                  </div>
                                  <h3 className="text-xl font-bold text-white mb-2 relative z-10">{level.name}</h3>
                                  <p className="text-slate-400 text-sm mb-4 relative z-10">{level.description}</p>
                                  <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold bg-slate-900/50 w-fit px-2 py-1 rounded relative z-10">
                                      <Coins size={14} /> 獎勵: {level.reward} G
                                  </div>
                                  
                                  {/* Decor */}
                                  {!isLocked && <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>}
                              </button>
                          )
                      })}
                  </div>
              </div>
          </div>
      )
  }

  // 4. LOBBY & WAITING ROOM (Online)
  if (gameMode === GameMode.LOBBY || gameMode === GameMode.LOBBY_WAITING) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative">
            <div className={`absolute inset-0 bg-cover bg-center opacity-20 ${activeBg}`}></div>
            <div className="z-10 bg-slate-950/90 p-10 rounded-3xl border border-slate-700 w-full max-w-md text-center shadow-2xl">
                 <h2 className="text-3xl font-bold text-white mb-8">連線大廳</h2>
                 
                 {gameMode === GameMode.LOBBY_WAITING || isConnecting ? (
                     <div className="py-12 flex flex-col items-center gap-6">
                         <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Globe className="text-cyan-500 animate-pulse" size={24} />
                            </div>
                         </div>
                         <div>
                            <p className="text-xl font-bold text-white animate-pulse mb-2">{onlineStatusMsg}</p>
                            {gameMode === GameMode.LOBBY_WAITING && <p className="text-slate-400 font-mono bg-slate-900 px-4 py-2 rounded border border-slate-700 mt-2">房間代碼: <span className="text-yellow-400 text-xl tracking-widest">{roomCode}</span></p>}
                         </div>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div>
                             <label className="block text-left text-slate-400 text-sm mb-2 font-bold ml-1">輸入房間代碼加入</label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="AB12"
                                    className="flex-1 bg-slate-800 border-2 border-slate-600 rounded-xl p-3 text-white font-mono text-center text-xl tracking-widest focus:border-cyan-500 focus:outline-none focus:bg-slate-900 transition-colors"
                                />
                                <button 
                                    onClick={joinRoom}
                                    disabled={!roomCode}
                                    className={`px-6 rounded-xl font-bold transition-all ${!roomCode ? 'bg-slate-700 text-slate-500' : 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'}`}
                                >
                                    加入
                                </button>
                             </div>
                         </div>
                         
                         <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink mx-4 text-slate-500 text-sm">或者</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <button 
                            onClick={createRoom}
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> 建立新房間
                        </button>
                     </div>
                 )}
                 <button onClick={() => setGameMode(GameMode.MENU_DOUBLE_SELECT)} className="mt-8 text-slate-500 hover:text-white text-sm font-bold tracking-wider">取消</button>
            </div>
        </div>
      )
  }

  // 5. PLAYING GAME
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
       {/* Background */}
       <div className={`absolute inset-0 bg-cover bg-center opacity-40 transition-all duration-1000 ${activeBg}`}></div>
      
      {/* HEADER / TOP BAR */}
      <div className="z-10 w-full max-w-6xl flex justify-between items-center mb-6 bg-slate-950/80 p-4 rounded-xl border border-slate-700 backdrop-blur shadow-lg">
          <button onClick={() => setGameMode(GameMode.MENU_MAIN)} className="text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <ArrowLeft size={16} /> 離開
          </button>
          
          {/* Middle Info */}
          <div className="flex flex-col items-center">
              {gameMode === GameMode.CAMPAIGN_GAME ? (
                  <div className="text-center">
                      <span className="text-cyan-400 font-bold tracking-wider text-sm block">LEVEL {currentLevel?.id}</span>
                      <span className="text-white text-xs">{currentLevel?.description}</span>
                  </div>
              ) : (
                  (gameMode === GameMode.LOCAL_VS || gameMode === GameMode.ONLINE_VS) && (
                    <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400 font-digit bg-slate-900 px-4 py-1 rounded border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                        <Clock size={20} /> {formatTime(timeLeft)}
                    </div>
                  )
              )}
          </div>

          <div className="flex gap-4">
              <button onClick={toggleMute} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors border border-slate-600">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button onClick={togglePause} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors border border-slate-600">
                  {gameStatus === GameStatus.PAUSED ? <Play size={20} /> : <Pause size={20} />}
              </button>
              <button onClick={() => { startGame(gameMode, currentLevel || undefined); }} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-white transition-colors border border-slate-600">
                  <RotateCcw size={20} />
              </button>
          </div>
      </div>

      {/* GAME AREA */}
      <div className="z-10 flex flex-wrap items-start justify-center gap-8 md:gap-16 relative w-full h-full max-h-[85vh]">
          
          {/* PLAYER 1 */}
          <div className="flex gap-4 bg-slate-950/50 p-4 rounded-xl backdrop-blur-sm border border-slate-800 shadow-2xl relative">
             <div className="flex flex-col gap-4">
                <GameHUD stats={p1.stats} nextPiece={p1.nextPiece} holdPiece={p1.holdPiece} label={gameMode === GameMode.SINGLE || gameMode === GameMode.CAMPAIGN_GAME ? "玩家數據" : "玩家 1"} />
                
                {/* Desktop Legend (Restored Here) */}
                {(gameMode === GameMode.LOCAL_VS || gameMode === GameMode.SINGLE || gameMode === GameMode.CAMPAIGN_GAME) && (
                    <div className="hidden md:flex flex-col gap-1 p-2 bg-slate-900/50 rounded text-slate-500 text-xs mb-2 w-24">
                        <div className="flex justify-between items-center"><span>移動</span> <span className="flex gap-0.5 bg-slate-800 px-1 rounded text-[10px]"><ArrowLeft size={10}/><ArrowRight size={10}/></span></div>
                        <div className="flex justify-between items-center"><span>旋轉</span> <span className="bg-slate-800 px-1 rounded flex items-center text-[10px]">W / <ArrowUp size={10}/></span></div>
                        <div className="flex justify-between items-center"><span>加速</span> <span className="bg-slate-800 px-1 rounded flex items-center text-[10px]">S / <ArrowDown size={10}/></span></div>
                        <div className="flex justify-between items-center"><span>硬降</span> <span className="bg-slate-800 px-1 rounded flex items-center text-[10px]">Space</span></div>
                    </div>
                )}
             </div>
             <div className="relative w-full h-full">
                 <TetrisBoard grid={p1.displayGrid} playerId="p1" />
                 
                 {/* Mobile Touch Overlay - Directly on top of the board */}
                 {(gameMode === GameMode.LOCAL_VS || gameMode === GameMode.SINGLE || gameMode === GameMode.CAMPAIGN_GAME) && (
                    <ControlsOverlay 
                        className="absolute inset-0 z-30" 
                        onMoveLeft={p1.controls.moveLeft}
                        onMoveRight={p1.controls.moveRight}
                        onRotate={p1.controls.rotate}
                        onSoftDrop={p1.controls.softDrop}
                        onHardDrop={p1.controls.hardDrop}
                        onHold={p1.controls.hold}
                    />
                 )}

                 {winner === 'P1' && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm"><div className="text-4xl font-black text-yellow-400 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] border-4 border-yellow-400 p-4 rounded-xl rotate-[-10deg]">WINNER!</div></div>}
             </div>
          </div>

          {/* VS SEPARATOR */}
          {(gameMode === GameMode.LOCAL_VS || gameMode === GameMode.ONLINE_VS) && (
              <div className="hidden md:flex flex-col items-center justify-center h-[500px] text-slate-600">
                  <div className="h-full w-px bg-gradient-to-b from-transparent via-red-500 to-transparent"></div>
                  <div className="absolute top-1/2 -translate-y-1/2 bg-slate-900 p-3 rounded-full border border-red-500 z-10 font-black text-2xl text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] italic">VS</div>
              </div>
          )}

          {/* PLAYER 2 / CPU */}
          {(gameMode === GameMode.LOCAL_VS || gameMode === GameMode.ONLINE_VS) && (
            <div className="flex gap-4 flex-row-reverse md:flex-row bg-slate-950/50 p-4 rounded-xl backdrop-blur-sm border border-slate-800 shadow-2xl">
                <div className="relative w-full h-full">
                    <TetrisBoard grid={p2.displayGrid} playerId="p2" />
                    {winner === 'P2' && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm"><div className="text-4xl font-black text-yellow-400 animate-bounce drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] border-4 border-yellow-400 p-4 rounded-xl rotate-[10deg]">WINNER!</div></div>}
                    {gameMode === GameMode.ONLINE_VS && (
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                             <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow animate-pulse">LIVE</div>
                             <div className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-600">Room: {roomCode}</div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    <GameHUD stats={p2.stats} nextPiece={p2.nextPiece} holdPiece={p2.holdPiece} label={gameMode === GameMode.ONLINE_VS ? "對手" : "玩家 2"} />
                </div>
            </div>
          )}
      </div>

      {/* OVERLAY MODAL FOR PAUSE / GAMEOVER */}
      {(gameStatus === GameStatus.PAUSED || gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
              <div className="bg-slate-900 border border-slate-600 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>
                  
                  {gameStatus === GameStatus.PAUSED && (
                      <>
                        <h2 className="text-3xl font-bold text-white mb-6">遊戲暫停</h2>
                        <button onClick={togglePause} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded mb-4 shadow-[0_0_15px_rgba(8,145,178,0.4)]">繼續遊戲</button>
                      </>
                  )}
                  {(gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) && (
                      <>
                        <div className="text-6xl mb-4 animate-bounce">{gameStatus === GameStatus.VICTORY ? '🏆' : (winner === 'DRAW' ? '🤝' : '💀')}</div>
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
                            {gameStatus === GameStatus.VICTORY ? '勝利!' : (winner === 'DRAW' ? '平手!' : '遊戲結束')}
                        </h2>
                        
                        <div className="text-slate-300 mb-6 bg-slate-800 p-4 rounded-lg mt-4">
                            {gameMode === GameMode.SINGLE && <p className="text-xl">得分: <span className="text-cyan-400 font-bold font-digit">{p1.stats.score}</span></p>}
                            {gameMode === GameMode.CAMPAIGN_GAME && gameStatus === GameStatus.VICTORY && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-green-400 font-bold">關卡挑戰成功!</p>
                                    <p className="flex items-center justify-center gap-2 text-yellow-400"><Coins size={16}/> +{currentLevel?.reward} G</p>
                                </div>
                            )}
                            {(gameMode === GameMode.LOCAL_VS || gameMode === GameMode.ONLINE_VS) && (
                                <div className="flex justify-around items-center font-digit text-xl">
                                    <div className="text-cyan-400">P1: {p1.stats.score}</div>
                                    <div className="text-slate-600 text-sm">vs</div>
                                    <div className="text-pink-400">P2: {p2.stats.score}</div>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={() => { startGame(gameMode, currentLevel || undefined); }} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded mb-3 transition-transform active:scale-95 shadow-lg shadow-cyan-900/50">
                            再玩一次
                        </button>
                        
                         {gameMode === GameMode.CAMPAIGN_GAME && gameStatus === GameStatus.VICTORY && (
                             <button onClick={() => setGameMode(GameMode.CAMPAIGN_SELECT)} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded mb-3 shadow-lg shadow-green-900/50">
                                 下一關
                             </button>
                         )}
                      </>
                  )}
                  <button onClick={() => setGameMode(GameMode.MENU_MAIN)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded border border-slate-700">回到主選單</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;