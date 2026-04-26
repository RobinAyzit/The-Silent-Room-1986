import React, { useEffect, useCallback } from 'react';
import { useState } from 'react';

interface TypingInputProps {
  gameState: 'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading';
  typedText: string;
  setTypedText: React.Dispatch<React.SetStateAction<string>>;
  chapter: any;
  triggerManifestation: (type: any) => void;
  triggerKeywordEffect: (effect: any) => void;
  playSound: (type: 'click' | 'bell' | 'backspace' | 'glitch' | 'siren' | 'thunder') => void;
  t: any;
  normalizeForMatch: (value: string) => string;
  KEYWORD_EFFECTS: any;
  KEYWORD_COOLDOWN_MS: number;
  keywordCooldownRef: React.MutableRefObject<any>;
}

const TypingInput = ({
  gameState,
  typedText,
  setTypedText,
  chapter,
  triggerManifestation,
  triggerKeywordEffect,
  playSound,
  t,
  normalizeForMatch,
  KEYWORD_EFFECTS,
  KEYWORD_COOLDOWN_MS,
  keywordCooldownRef
}: TypingInputProps) => {
  // Typing Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      if (e.key === 'Backspace') {
        playSound('backspace');
        setTypedText(prev => prev.slice(0, -1));
        return;
      }
      
      if (e.key.length === 1) {
        playSound('click');
        const char = e.key;
        setTypedText(prev => {
          const next = prev + char;
          
          const normalized = normalizeForMatch(next);
          
          // Chapter-specific manifestation words
          Object.entries(chapter.manifestationWords).forEach(([word, type]) => {
            if (normalized.endsWith(normalizeForMatch(word))) {
              triggerManifestation(type);
            }
          });
          
          // Global keyword effects (rain/water/blood/red/police etc.)
          (Object.keys(KEYWORD_EFFECTS) as any[]).forEach((effect) => {
            const match = KEYWORD_EFFECTS[effect].some(word => normalized.endsWith(normalizeForMatch(word)));
            const now = Date.now();
            if (match && now - keywordCooldownRef.current[effect] > KEYWORD_COOLDOWN_MS) {
              keywordCooldownRef.current[effect] = now;
              triggerKeywordEffect(effect);
            }
          });
          
          return next;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, chapter, triggerManifestation, triggerKeywordEffect, playSound, t, normalizeForMatch, KEYWORD_EFFECTS, KEYWORD_COOLDOWN_MS, keywordCooldownRef]);
  
  return null; // This component only handles logic, no UI
};

export default TypingInput;