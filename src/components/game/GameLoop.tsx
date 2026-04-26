import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

// Import types and constants from parent component
// These will be passed as props initially, later we might move them to a shared types file

interface GameLoopProps {
  lang: 'en' | 'sv' | 'tr';
  chapterIndex: number;
  typedText: string;
  setTypedText: React.Dispatch<React.SetStateAction<string>>;
  manifestations: any[];
  setManifestations: React.Dispatch<React.SetStateAction<any[]>>;
  enemies: any[];
  setEnemies: React.Dispatch<React.SetStateAction<any[]>>;
  gameState: 'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading';
  setGameState: React.Dispatch<React.SetStateAction<'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading'>>;
  shake: number;
  setShake: React.Dispatch<React.SetStateAction<number>>;
  isHeavy: boolean;
  setIsHeavy: React.Dispatch<React.SetStateAction<boolean>>;
  isCold: boolean;
  setIsCold: React.Dispatch<React.SetStateAction<boolean>>;
  isHeat: boolean;
  setIsHeat: React.Dispatch<React.SetStateAction<boolean>>;
  isGravity: boolean;
  setIsGravity: React.Dispatch<React.SetStateAction<boolean>>;
  isShielded: boolean;
  setIsShielded: React.Dispatch<React.SetStateAction<boolean>>;
  isTimeSlowed: boolean;
  setIsTimeSlowed: React.Dispatch<React.SetStateAction<boolean>>;
  isRaining: boolean;
  setIsRaining: React.Dispatch<React.SetStateAction<boolean>>;
  isWaterPulse: boolean;
  setIsWaterPulse: React.Dispatch<React.SetStateAction<boolean>>;
  isPoliceAlert: boolean;
  setIsPoliceAlert: React.Dispatch<React.SetStateAction<boolean>>;
  bloodFlash: boolean;
  setBloodFlash: React.Dispatch<React.SetStateAction<boolean>>;
  redFlash: boolean;
  setRedFlash: React.Dispatch<React.SetStateAction<boolean>>;
  stormFlash: boolean;
  setStormFlash: React.Dispatch<React.SetStateAction<boolean>>;
  darkFlash: boolean;
  setDarkFlash: React.Dispatch<React.SetStateAction<boolean>>;
  ghostFog: boolean;
  setGhostFog: React.Dispatch<React.SetStateAction<boolean>>;
  windRush: boolean;
  setWindRush: React.Dispatch<React.SetStateAction<boolean>>;
  revolutionPoints: number;
  setRevolutionPoints: React.Dispatch<React.SetStateAction<number>>;
  upgrades: any;
  setUpgrades: React.Dispatch<React.SetStateAction<any>>;
  chapter: any;
  level: number;
  rank: number;
  playSound: (type: 'click' | 'bell' | 'backspace' | 'glitch' | 'siren' | 'thunder') => void;
  triggerManifestation: (type: any) => void;
  triggerKeywordEffect: (effect: any) => void;
  startChapter: () => void;
  buyUpgrade: (key: keyof any) => void;
  t: any;
  normalizeForMatch: (value: string) => string;
  KEYWORD_EFFECTS: any;
  KEYWORD_COOLDOWN_MS: number;
  audioCtxRef: React.MutableRefObject<any>;
  bgAudioRef: React.MutableRefObject<any>;
  enemiesRef: React.MutableRefObject<any>;
  keywordCooldownRef: React.MutableRefObject<any>;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GameLoop = ({
  lang,
  chapterIndex,
  typedText,
  setTypedText,
  manifestations,
  setManifestations,
  enemies,
  setEnemies,
  gameState,
  setGameState,
  shake,
  setShake,
  isHeavy,
  setIsHeavy,
  isCold,
  setIsCold,
  isHeat,
  setIsHeat,
  isGravity,
  setIsGravity,
  isShielded,
  setIsShielded,
  isTimeSlowed,
  setIsTimeSlowed,
  isRaining,
  setIsRaining,
  isWaterPulse,
  setIsWaterPulse,
  isPoliceAlert,
  setIsPoliceAlert,
  bloodFlash,
  setBloodFlash,
  redFlash,
  setRedFlash,
  stormFlash,
  setStormFlash,
  darkFlash,
  setDarkFlash,
  ghostFog,
  setGhostFog,
  windRush,
  setWindRush,
  revolutionPoints,
  setRevolutionPoints,
  upgrades,
  setUpgrades,
  chapter,
  level,
  rank,
  playSound,
  triggerManifestation,
  triggerKeywordEffect,
  startChapter,
  buyUpgrade,
  t,
  normalizeForMatch,
  KEYWORD_EFFECTS,
  KEYWORD_COOLDOWN_MS,
  audioCtxRef,
  bgAudioRef,
  enemiesRef,
  keywordCooldownRef
}: GameLoopProps) => {
  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setManifestations(prev => prev.filter(m => Date.now() - m.startTime < m.duration));

      // Move enemies
      setEnemies(prev => {
        const next = prev.map(e => {
          if (e.state === 'stunned') return e;
          let moveSpeed = e.speed;
          if (isTimeSlowed) moveSpeed *= 0.3;
          if (isHeavy) moveSpeed *= 0.88;

          // Censor Effect: Deletes text if close
          if (e.type === 'censor' && e.x > 78 && Math.random() < 0.04) {
            setTypedText(t => t.slice(0, -1));
            playSound('glitch');
          }

          return { ...e, x: e.x + moveSpeed };
        }).filter(e => e.health > 0);
        
        if (!isShielded && next.some(e => e.x > 85)) {
          setGameState('gameover');
        }
        
        return next;
      });

      // Spawn enemies with progressive level/rank scaling
      const chapterFactor = 1 + (chapterIndex * 0.28);
      const rankFactor = 1 + ((rank - 1) * 0.1);
      const spawnRate = Math.min(0.085, 0.0025 * chapterFactor * rankFactor * (1 - upgrades.soundProofing * 0.12));
      const maxEnemies = 5 + chapterIndex * 2 + Math.floor(rank / 2);
      if (enemiesRef.current.length < maxEnemies && Math.random() < spawnRate) {
        const typeRoll = Math.random();
        let type: Enemy['type'] = 'standard';
        let health = 62 + chapterIndex * 16 + rank * 5;
        let speed = 0.06 + chapterIndex * 0.017 + rank * 0.006 + Math.random() * 0.05;

        // Introduce enemy types progressively
        const activeCensors = enemiesRef.current.filter(e => e.type === 'censor').length;
        if (level >= 5 && typeRoll > 0.84 && activeCensors < 2) {
          type = 'censor';
          speed = 0.07 + (chapterIndex * 0.01);
          health = 110 + chapterIndex * 12 + rank * 8;
        } else if (level >= 3 && typeRoll > 0.66) {
          type = 'infiltrator';
          speed = 0.1 + chapterIndex * 0.018 + rank * 0.004;
        } else if (level >= 4 && typeRoll > 0.52) {
          type = 'heavy';
          health = 170 + chapterIndex * 20 + rank * 14;
          speed = 0.05 + chapterIndex * 0.008;
        }

        setEnemies(prev => [...prev, {
          id: Math.random().toString(),
          type,
          x: 0,
          y: Math.random() * 60 + 20,
          health,
          maxHealth: health,
          speed,
          state: 'marching'
        }]);
      }

      // Check for victory – only when the player has typed every character and none are wrong
      if (typedText.length >= chapter.text.length) {
        const allCorrect = typedText.split('').every((ch, idx) => ch === chapter.text[idx]);
        if (allCorrect) {
          setGameState('victory');
          setRevolutionPoints(prev => prev + (chapter.id * 120) + (rank * 20));
          playSound('bell');
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, typedText, chapter, chapterIndex, level, rank, isHeavy, isTimeSlowed, isShielded, upgrades.soundProofing, playSound]);

  return null; // This component only handles logic, no UI
};

export default GameLoop;