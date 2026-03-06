import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Zap, Wind, Droplets, Sun, Lock, Unlock, AlertTriangle, BookOpen, Flame, Snowflake, Ghost } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Types ---

export type ManifestationType = 'rain' | 'light' | 'heavy' | 'wall' | 'tangle' | 'open' | 'heat' | 'cold' | 'ghost' | 'fire' | 'gravity' | 'shield' | 'time';

interface Manifestation {
  id: string;
  type: ManifestationType;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

interface Enemy {
  id: string;
  type: 'standard' | 'hacker' | 'heavy';
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  state: 'marching' | 'stunned' | 'retreating';
  shielded?: boolean;
}

interface Upgrades {
  oiledKeys: number; // Reduces error penalty/increases speed
  magicRibbon: number; // Manifestation duration
  soundProofing: number; // Enemy spawn delay
}

interface Chapter {
  id: number;
  title: string;
  text: string;
  goal: string;
  manifestationWords: Record<string, ManifestationType>;
  isBoss?: boolean;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "The Silent Room",
    text: "The walls have ears, but the ink has teeth. I sit in the dark, typing what they fear most. The truth is a heavy burden, but today, it will be a heavy hammer. I can feel the rain outside, but soon, it will be inside too. Open the drawers of history.",
    goal: "Type the forbidden article to manifest the truth.",
    manifestationWords: {
      "rain": "rain",
      "heavy": "heavy",
      "light": "light",
      "open": "open"
    }
  },
  {
    id: 2,
    title: "The Knock at the Door",
    text: "They are here. The boots on the stairs are rhythmic, like a heartbeat of lead. I must defend this sanctuary. If I type 'wall', the air will solidify. If I type 'tangle', the floor will betray them. The revolution starts in this small room. Heat the air until it burns with fire.",
    goal: "Defend your apartment from the Secret Police.",
    manifestationWords: {
      "wall": "wall",
      "tangle": "tangle",
      "light": "light",
      "heat": "heat",
      "fire": "fire"
    }
  },
  {
    id: 3,
    title: "The Great Broadcast",
    text: "The city is watching. Every word I type is projected onto the Ministry's walls. We are ghosts in the machine, cold as the winter wind, but bright as a thousand suns. The wall is falling. The rain is washing away the lies. Gravity fails them now. We are free.",
    goal: "Complete the final broadcast to ignite the revolution.",
    manifestationWords: {
      "ghost": "ghost",
      "cold": "cold",
      "light": "light",
      "wall": "wall",
      "rain": "rain",
      "gravity": "gravity"
    }
  },
  {
    id: 4,
    title: "The Ministry Breach",
    text: "We have entered the heart of the beast. The Grand Censor awaits. We must use every shield of truth, every second of time we can steal. The fire of liberty will consume their paper walls. This is the end of the silence. The world is open.",
    goal: "Defeat the Grand Censor in the heart of the Ministry.",
    isBoss: true,
    manifestationWords: {
      "shield": "shield",
      "time": "time",
      "fire": "fire",
      "open": "open",
      "light": "light"
    }
  }
];

// --- Components ---

const CRTOverlay = () => (
  <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    <div className="absolute inset-0 animate-pulse bg-white/5 opacity-10" />
    <div className="scanline" />
  </div>
);

export default function Game() {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [gameState, setGameState] = useState<'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading'>('narrative');
  const [shake, setShake] = useState(0);
  const [isHeavy, setIsHeavy] = useState(false);
  const [isCold, setIsCold] = useState(false);
  const [isHeat, setIsHeat] = useState(false);
  const [isGravity, setIsGravity] = useState(false);
  const [isShielded, setIsShielded] = useState(false);
  const [isTimeSlowed, setIsTimeSlowed] = useState(false);
  const [scrambleAmount, setScrambleAmount] = useState(0);
  const [revolutionPoints, setRevolutionPoints] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({
    oiledKeys: 0,
    magicRibbon: 0,
    soundProofing: 0
  });
  
  const chapter = CHAPTERS[chapterIndex];

  // Audio Logic
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback(() => {
    const ctx = initAudio();
    const now = ctx.currentTime;

    // 1. Mechanical "Click" (Noise burst)
    const bufferSize = ctx.sampleRate * 0.05;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2800 + Math.random() * 400, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Metallic "Clack" (Filtered Square/Saw)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const oscFilter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(800, now);

    oscGain.gain.setValueAtTime(0.08, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(ctx.destination);

    noiseSource.start(now);
    osc.start(now);
    osc.stop(now + 0.06);
  }, [initAudio]);

  const playBell = useCallback(() => {
    const ctx = initAudio();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1150, now + 0.6);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }, [initAudio]);

  const playBackspace = useCallback(() => {
    const ctx = initAudio();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.1);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }, [initAudio]);

  // Handle Manifestations
  const triggerManifestation = useCallback((type: ManifestationType) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newManifestation: Manifestation = {
      id,
      type,
      x: Math.random() * 80 + 10,
      y: Math.random() * 50 + 10,
      startTime: Date.now(),
      duration: 5000 + (upgrades.magicRibbon * 2000),
    };
    setManifestations(prev => [...prev, newManifestation]);
    setShake(15);
    setTimeout(() => setShake(0), 150);

    // Global Effects
    if (type === 'light') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f27d26', '#ffffff', '#ffcc00']
      });
      setEnemies(prev => prev.map(e => ({ ...e, state: 'stunned' })));
      setTimeout(() => {
        setEnemies(prev => prev.map(e => ({ ...e, state: 'marching' })));
      }, 3000);
    }

    if (type === 'heavy') {
      setIsHeavy(true);
      setTimeout(() => setIsHeavy(false), 4000);
    }

    if (type === 'cold') {
      setIsCold(true);
      setTimeout(() => setIsCold(false), 4000);
    }

    if (type === 'heat') {
      setIsHeat(true);
      setTimeout(() => setIsHeat(false), 4000);
    }

    if (type === 'tangle') {
      setEnemies(prev => prev.map(e => ({ ...e, speed: e.speed * 0.5 })));
    }

    if (type === 'wall') {
      setEnemies(prev => prev.map(e => ({ ...e, x: Math.max(0, e.x - 15) })));
    }

    if (type === 'fire') {
      setEnemies(prev => prev.map(e => ({ ...e, health: e.health - 40 })));
    }

    if (type === 'gravity') {
      setIsGravity(true);
      setEnemies(prev => prev.map(e => ({ ...e, state: 'stunned' })));
      setTimeout(() => setIsGravity(false), 3000);
    }

    if (type === 'shield') {
      setIsShielded(true);
      setTimeout(() => setIsShielded(false), 5000);
    }

    if (type === 'time') {
      setIsTimeSlowed(true);
      setTimeout(() => setIsTimeSlowed(false), 6000);
    }
  }, [upgrades.magicRibbon]);

  // Typing Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'Backspace') {
        playBackspace();
        setTypedText(prev => prev.slice(0, -1));
        return;
      }

      if (e.key.length === 1) {
        playClick();
        const char = e.key;
        setTypedText(prev => {
          const next = prev + char;
          
          // Check for manifestation words
          Object.entries(chapter.manifestationWords).forEach(([word, type]) => {
            if (next.toLowerCase().endsWith(word.toLowerCase())) {
              triggerManifestation(type);
            }
          });

          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, chapter, triggerManifestation, playClick, playBackspace]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      // Clean up old manifestations
      setManifestations(prev => prev.filter(m => Date.now() - m.startTime < m.duration));

      // Move enemies
      if (chapterIndex >= 1) {
        setEnemies(prev => {
          const next = prev.map(e => {
            if (e.state === 'stunned') return e;
            let moveSpeed = e.speed;
            if (isTimeSlowed) moveSpeed *= 0.3;
            return { ...e, x: e.x + moveSpeed };
          }).filter(e => e.health > 0);
          
          // Check for game over (enemy reached the desk)
          if (!isShielded && next.some(e => e.x > 85)) {
            setGameState('gameover');
          }
          
          return next;
        });

        // Spawn enemies based on chapter difficulty
        const spawnRate = (chapterIndex === 1 ? 0.015 : 0.025) * (1 - upgrades.soundProofing * 0.2);
        if (Math.random() < spawnRate) {
          const typeRoll = Math.random();
          let type: Enemy['type'] = 'standard';
          let health = 100;
          let speed = 0.2 + Math.random() * 0.4;
          let shielded = false;

          if (chapterIndex >= 2 && typeRoll > 0.8) {
            type = 'hacker';
            speed = 0.15;
          } else if (chapterIndex >= 3 && typeRoll > 0.6) {
            type = 'heavy';
            health = 250;
            speed = 0.1;
            shielded = true;
          }

          setEnemies(prev => [...prev, {
            id: Math.random().toString(),
            type,
            x: 0,
            y: Math.random() * 60 + 20,
            health,
            maxHealth: health,
            speed,
            state: 'marching',
            shielded
          }]);
        }

        // Hacker Effect
        const activeHackers = enemies.filter(e => e.type === 'hacker' && e.state !== 'stunned').length;
        setScrambleAmount(activeHackers * 0.2);
      }

      // Check for victory
      if (typedText.length >= chapter.text.length) {
        setGameState('victory');
        setRevolutionPoints(prev => prev + (chapter.id * 100));
        playBell();
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 }
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, typedText, chapter, chapterIndex, isTimeSlowed, isShielded, upgrades.soundProofing, enemies.length, playBell]);

  const buyUpgrade = (key: keyof Upgrades) => {
    const cost = (upgrades[key] + 1) * 150;
    if (revolutionPoints >= cost && upgrades[key] < 3) {
      setRevolutionPoints(prev => prev - cost);
      setUpgrades(prev => ({ ...prev, [key]: prev[key] + 1 }));
    }
  };

  const startChapter = () => {
    initAudio();
    setTypedText("");
    setManifestations([]);
    setEnemies([]);
    setGameState('playing');
    setIsHeavy(false);
    setIsCold(false);
    setIsHeat(false);
  };

  return (
    <div className={cn(
      "relative min-h-screen w-full bg-[#0a0a0a] text-[#c0c0c0] font-mono overflow-hidden selection:bg-[#f27d26] selection:text-black transition-all duration-1000",
      isCold && "bg-blue-950/20",
      isHeat && "bg-orange-950/20"
    )}>
      <CRTOverlay />
      
      {/* Background Room Layer */}
      <div 
        className={cn(
          "absolute inset-0 transition-transform duration-100",
          isGravity && "animate-bounce"
        )}
        style={{ transform: `translate(${Math.random() * shake}px, ${Math.random() * shake}px)` }}
      >
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/darkroom/1920/1080?blur=10')] bg-cover opacity-20" />
        
        {/* Manifestations */}
        <AnimatePresence>
          {manifestations.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0, rotate: -20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotate: 0,
                y: isGravity ? -200 : 0
              }}
              exit={{ opacity: 0, scale: 2, rotate: 20 }}
              className="absolute pointer-events-none"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-white/10 rounded-full" />
                {m.type === 'rain' && <Droplets className="text-blue-400 w-12 h-12 animate-bounce" />}
                {m.type === 'light' && <Sun className="text-yellow-200 w-24 h-24 animate-pulse blur-sm" />}
                {m.type === 'heavy' && <Shield className="text-gray-500 w-16 h-16" />}
                {m.type === 'wall' && <div className="w-6 h-40 bg-gray-800 border-2 border-gray-600 rounded shadow-[0_0_20px_rgba(255,255,255,0.1)]" />}
                {m.type === 'tangle' && <Wind className="text-green-600 w-16 h-16 animate-spin" />}
                {m.type === 'open' && <Unlock className="text-amber-400 w-12 h-12" />}
                {m.type === 'heat' && <Flame className="text-orange-500 w-16 h-16 animate-pulse" />}
                {m.type === 'cold' && <Snowflake className="text-blue-200 w-16 h-16 animate-spin-slow" />}
                {m.type === 'ghost' && <Ghost className="text-white/40 w-20 h-20 animate-pulse" />}
                {m.type === 'fire' && <Flame className="text-red-500 w-20 h-20 animate-bounce" />}
                {m.type === 'shield' && <div className="w-32 h-32 border-4 border-blue-400/30 rounded-full animate-pulse" />}
                {m.type === 'time' && <Zap className="text-purple-400 w-16 h-16 animate-spin" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enemies */}
        {enemies.map(e => (
          <motion.div
            key={e.id}
            className="absolute flex flex-col items-center z-20"
            style={{ left: `${e.x}%`, top: `${e.y}%` }}
            animate={{ y: isGravity ? -300 : 0 }}
          >
            <div className={cn(
              "p-2 bg-red-900/60 border border-red-500 rounded text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
              e.state === 'stunned' && "animate-pulse brightness-150 scale-110",
              e.type === 'hacker' && "bg-purple-900/60 border-purple-500 text-purple-500",
              e.type === 'heavy' && "bg-gray-900/80 border-gray-400 text-gray-400 scale-125"
            )}>
              {e.type === 'standard' && <AlertTriangle className="w-8 h-8" />}
              {e.type === 'hacker' && <Terminal className="w-8 h-8" />}
              {e.type === 'heavy' && <Shield className="w-10 h-10" />}
              <span className="text-[8px] uppercase font-bold">
                {e.type === 'standard' ? 'POLICE' : e.type === 'hacker' ? 'HACKER' : 'HEAVY'}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-800 mt-1 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${(e.health / e.maxHealth) * 100}%` }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* UI Layer */}
      <div className={cn(
        "relative z-30 flex flex-col h-screen p-8 max-w-5xl mx-auto transition-all duration-500",
        isHeavy && "scale-95 blur-[0.5px] brightness-75",
        isShielded && "ring-8 ring-blue-400/20 rounded-3xl"
      )}>
        {/* Header */}
        <div className="flex justify-between items-start mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#f27d26] rounded flex items-center justify-center text-black">
              <Terminal className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display tracking-tighter text-[#f27d26] uppercase italic leading-none">
                {chapter.title}
              </h1>
              <p className="text-[10px] opacity-50 uppercase tracking-[0.3em] mt-2 font-bold">
                Chapter {chapter.id} // Forbidden Transmission // 1986.ALT
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-50 uppercase font-bold tracking-widest">Points: {revolutionPoints}</div>
            <div className="text-[8px] opacity-30 uppercase font-bold tracking-widest mt-1">
              Audio: {audioCtxRef.current?.state === 'running' ? 'Active' : 'Click "Initialize" to enable'}
            </div>
            <div className="flex gap-1 mt-2 justify-end">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={cn(
                    "w-1 h-4 rounded-full",
                    i <= 4 ? "bg-[#f27d26] animate-pulse" : "bg-white/10"
                  )} 
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col justify-center">
          {gameState === 'narrative' && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/90 p-10 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <BookOpen className="w-10 h-10 text-[#f27d26]" />
                <h2 className="text-2xl font-display uppercase italic text-white">{chapter.goal}</h2>
              </div>
              <p className="text-xl leading-relaxed opacity-80 mb-10 font-light">
                {chapter.id === 1 ? "The Ministry of Truth is closing in. Your typewriter is the only weapon left." : "The revolution is spreading. Your words are the sparks."}
                <span className="block mt-4 text-[#f27d26] font-bold italic">
                  "The ink is the seed, the word is the tree."
                </span>
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={startChapter}
                  className="group relative flex-1 px-8 py-5 bg-[#f27d26] text-black font-black uppercase tracking-[0.2em] overflow-hidden rounded-lg hover:bg-white transition-all"
                >
                  <span className="relative z-10">Initialize Transmission</span>
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
                {chapterIndex > 0 && (
                  <button 
                    onClick={() => setGameState('upgrading')}
                    className="px-8 py-5 bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-lg hover:bg-white/20 transition-all"
                  >
                    Upgrades
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {gameState === 'upgrading' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/95 p-10 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl mx-auto w-full"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display uppercase italic text-[#f27d26]">Typewriter Modifications</h2>
                <div className="text-xl font-bold">Points: {revolutionPoints}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  { id: 'oiledKeys', name: 'Oiled Keys', desc: 'Reduces error impact', icon: Zap },
                  { id: 'magicRibbon', name: 'Magic Ribbon', desc: 'Longer manifestations', icon: Flame },
                  { id: 'soundProofing', name: 'Sound Proofing', desc: 'Slower enemy spawns', icon: Shield },
                ].map((u) => {
                  const level = upgrades[u.id as keyof Upgrades];
                  const cost = (level + 1) * 150;
                  return (
                    <div key={u.id} className="p-6 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center text-center">
                      <u.icon className="w-10 h-10 text-[#f27d26] mb-4" />
                      <h3 className="text-lg font-bold mb-2">{u.name}</h3>
                      <p className="text-xs opacity-60 mb-4">{u.desc}</p>
                      <div className="flex gap-1 mb-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={cn("w-4 h-1 rounded", i <= level ? "bg-[#f27d26]" : "bg-white/10")} />
                        ))}
                      </div>
                      <button 
                        onClick={() => buyUpgrade(u.id as keyof Upgrades)}
                        disabled={revolutionPoints < cost || level >= 3}
                        className="w-full py-2 bg-white/10 rounded font-bold text-xs uppercase hover:bg-[#f27d26] hover:text-black disabled:opacity-30 disabled:hover:bg-white/10 disabled:hover:text-white transition-all"
                      >
                        {level >= 3 ? 'Maxed' : `Upgrade (${cost})`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => setGameState('narrative')}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-[#f27d26] transition-all"
              >
                Return to Mission
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-12">
              {/* Target Text Display */}
              <div className="text-3xl leading-[1.6] font-medium max-w-4xl mx-auto">
                {chapter.text.split('').map((char, i) => {
                  let color = "text-white/10";
                  let decoration = "";
                  
                  // Scramble effect
                  let displayChar = char;
                  if (i > typedText.length && Math.random() < scrambleAmount) {
                    displayChar = String.fromCharCode(33 + Math.floor(Math.random() * 94));
                  }

                  if (i < typedText.length) {
                    if (typedText[i] === char) {
                      color = "text-[#f27d26] drop-shadow-[0_0_8px_rgba(242,125,38,0.5)]";
                    } else {
                      color = "text-red-500 bg-red-500/20";
                      decoration = "underline decoration-red-500";
                    }
                  }
                  return (
                    <span key={i} className={cn(
                      "transition-all duration-200",
                      color, 
                      decoration,
                      i === typedText.length && "bg-white/20 animate-pulse border-l-2 border-[#f27d26]"
                    )}>
                      {displayChar}
                    </span>
                  );
                })}
              </div>

              {/* Typing Feedback / Input Area */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#f27d26] to-amber-500 rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative h-32 bg-black/60 border border-white/10 p-6 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="text-5xl font-black tracking-[0.3em] text-white/5 uppercase select-none">
                    {typedText.slice(-12) || "WAITING FOR INPUT"}
                    <span className="animate-pulse text-[#f27d26]">_</span>
                  </div>
                  {/* Floating particles for typing */}
                  <AnimatePresence>
                    {typedText.length > 0 && (
                      <motion.div
                        key={typedText.length}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: -40, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute text-[#f27d26] font-bold text-xl"
                      >
                        {typedText.slice(-1)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-950/90 p-12 border-4 border-red-500 text-center rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.4)] max-w-2xl mx-auto"
            >
              <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6 animate-bounce" />
              <h2 className="text-5xl font-display uppercase italic tracking-tighter mb-4 text-white">Transmission Failed</h2>
              <p className="text-xl mb-10 opacity-80">The Secret Police have breached the perimeter. Your identity has been compromised.</p>
              <button 
                onClick={startChapter}
                className="w-full px-8 py-5 bg-red-500 text-white font-black uppercase tracking-widest hover:bg-white hover:text-red-500 transition-all rounded-lg"
              >
                Restart Transmission
              </button>
            </motion.div>
          )}

          {gameState === 'victory' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-950/90 p-12 border-4 border-green-500 text-center rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.4)] max-w-2xl mx-auto"
            >
              <Zap className="w-24 h-24 text-green-500 mx-auto mb-6 animate-pulse" />
              <h2 className="text-5xl font-display uppercase italic tracking-tighter mb-4 text-white">Success</h2>
              <p className="text-xl mb-10 opacity-80">The broadcast was successful. The citizens are waking up.</p>
              <button 
                onClick={() => {
                  if (chapterIndex < CHAPTERS.length - 1) {
                    setChapterIndex(prev => prev + 1);
                    setGameState('narrative');
                  } else {
                    alert("THE REVOLUTION HAS BEGUN. WORDS ARE FREE.");
                    setChapterIndex(0);
                    setGameState('narrative');
                  }
                }}
                className="w-full px-8 py-5 bg-green-500 text-white font-black uppercase tracking-widest hover:bg-white hover:text-green-500 transition-all rounded-lg"
              >
                {chapterIndex < CHAPTERS.length - 1 ? "Next Chapter" : "Restart Revolution"}
              </button>
            </motion.div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-12 grid grid-cols-4 gap-8 border-t border-white/10 pt-8">
          <div className="space-y-2">
            <div className="text-[10px] uppercase opacity-50 font-bold tracking-widest">Manifestations</div>
            <div className="text-3xl font-display italic text-[#f27d26]">{manifestations.length}</div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase opacity-50 font-bold tracking-widest">Accuracy</div>
            <div className="text-3xl font-display italic text-white">
              {typedText.length > 0 ? "98" : "0"}%
            </div>
          </div>
          <div className="col-span-2 space-y-2">
            <div className="flex justify-between items-end">
              <div className="text-[10px] uppercase opacity-50 font-bold tracking-widest">Broadcast Progress</div>
              <div className="text-[10px] font-bold text-[#f27d26]">
                {Math.round((typedText.length / chapter.text.length) * 100)}%
              </div>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#f27d26] to-amber-400" 
                initial={{ width: 0 }}
                animate={{ width: `${(typedText.length / chapter.text.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ambient Sound/Visuals */}
      <div className="fixed bottom-6 right-8 flex items-center gap-6 opacity-20 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Live Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Encryption: AES-256</span>
        </div>
      </div>
    </div>
  );
}
