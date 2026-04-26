import React, { useState } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Zap, Flame, Shield } from 'lucide-react';

interface UpgradeSystemProps {
  gameState: 'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading';
  setGameState: React.Dispatch<React.SetStateAction<'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading'>>;
  upgrades: any;
  setUpgrades: React.Dispatch<React.SetStateAction<any>>;
  revolutionPoints: number;
  setRevolutionPoints: React.Dispatch<React.SetStateAction<number>>;
  t: any;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UpgradeSystem = ({
  gameState,
  setGameState,
  upgrades,
  setUpgrades,
  revolutionPoints,
  setRevolutionPoints,
  t
}: UpgradeSystemProps) => {
  const buyUpgrade = (key: keyof any) => {
    const cost = (upgrades[key] + 1) * 150;
    if (revolutionPoints >= cost && upgrades[key] < 3) {
      setRevolutionPoints(prev => prev - cost);
      setUpgrades(prev => ({ ...prev, [key]: prev[key] + 1 }));
    }
  };

  if (gameState !== 'upgrading') return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/95 p-10 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl mx-auto w-full"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display uppercase italic text-[#f27d26]">{t.ui.typewriterMods}</h2>
        <div className="text-xl font-bold">{t.ui.points}: {revolutionPoints}</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[ 
          { id: 'oiledKeys', name: 'Oiled Keys', icon: Zap, description: 'Minskad effekt av infiltratorer' },
          { id: 'magicRibbon', name: 'Magic Ribbon', icon: Flame, description: 'Längre manifestationseffekter' },
          { id: 'soundProofing', name: 'Sound Proofing', icon: Shield, description: 'Minskad fiendespawning' }
        ].map((u) => {
          const level = upgrades[u.id as keyof any];
          const cost = (level + 1) * 150;
          return (
            <div key={u.id} className="p-6 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center text-center">
              <u.icon className="w-10 h-10 text-[#f27d26] mb-4" />
              <h3 className="text-lg font-bold mb-2">{u.name}</h3>
              <p className="text-sm text-white/60 mb-4">{u.description}</p>
              <div className="flex gap-1 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("w-4 h-1 rounded", i <= level ? "bg-[#f27d26]" : "bg-white/10")} />
                ))}
              </div>
              <button 
                onClick={() => buyUpgrade(u.id as keyof any)}
                disabled={revolutionPoints < cost || level >= 3}
                className="w-full py-2 bg-white/10 rounded font-bold text-xs uppercase hover:bg-[#f27d26] hover:text-black disabled:opacity-30 transition-all"
              >
                {level >= 3 ? t.ui.maxed : `${t.ui.upgrade} (${cost})`}
              </button>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => setGameState('narrative')}
        className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-[#f27d26] transition-all"
      >
        {t.ui.return}
      </button>
    </motion.div>
  );
};

export default UpgradeSystem;