import React, { useState } from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Speaker, Sun, Circle } from 'lucide-react';

interface SettingsMenuProps {
  gameState: 'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading' | 'settings';
  setGameState: React.Dispatch<React.SetStateAction<'narrative' | 'playing' | 'gameover' | 'victory' | 'upgrading' | 'settings'>>;
  t: any;
  audioSettings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  };
  setAudioSettings: React.Dispatch<React.SetStateAction<{
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
  }>>;
  graphicsSettings: {
    particleIntensity: number;
    screenEffects: boolean;
    colorBlindMode: boolean;
  };
  setGraphicsSettings: React.Dispatch<React.SetStateAction<{
    particleIntensity: number;
    screenEffects: boolean;
    colorBlindMode: boolean;
  }>>;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SettingsMenu = ({
  gameState,
  setGameState,
  t,
  audioSettings,
  setAudioSettings,
  graphicsSettings,
  setGraphicsSettings
}: SettingsMenuProps) => {
  if (gameState !== 'settings') return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-black/95 p-10 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl mx-auto w-full"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display uppercase italic text-[#f27d26]">Inställningar</h2>
        <button 
          onClick={() => setGameState('narrative')}
          className="px-4 py-2 bg-white/10 rounded font-bold text-xs uppercase hover:bg-[#f27d26] hover:text-black transition-all"
        >
          {t.ui.return}
        </button>
      </div>
      
      <div className="space-y-8">
        {/* Audio Settings */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Speaker className="w-5 h-5 text-[#f27d26]" /> Ljud
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="flex justify-between mb-1 text-sm font-medium">
                Master Volym
                <span>{Math.round(audioSettings.masterVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.masterVolume}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, masterVolume: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="flex justify-between mb-1 text-sm font-medium">
                Musikvolym
                <span>{Math.round(audioSettings.musicVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.musicVolume}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, musicVolume: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col">
              <label className="flex justify-between mb-1 text-sm font-medium">
                Ljudeffekter
                <span>{Math.round(audioSettings.sfxVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioSettings.sfxVolume}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, sfxVolume: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Graphics Settings */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-[#f27d26]" /> Grafik
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="flex justify-between mb-1 text-sm font-medium">
                Partikelintensitet
                <span>{Math.round(graphicsSettings.particleIntensity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={graphicsSettings.particleIntensity}
                onChange={(e) => setGraphicsSettings(prev => ({ ...prev, particleIntensity: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="screen-effects"
                checked={graphicsSettings.screenEffects}
                onChange={(e) => setGraphicsSettings(prev => ({ ...prev, screenEffects: e.target.checked }))}
                className="h-4 w-4 text-[#f27d26] focus:ring-[#f27d26] border-gray-300 rounded"
              />
              <label htmlFor="screen-effects" className="text-sm font-medium text-white/80">
                Skärmshake & Effekter
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="color-blind"
                checked={graphicsSettings.colorBlindMode}
                onChange={(e) => setGraphicsSettings(prev => ({ ...prev, colorBlindMode: e.target.checked }))}
                className="h-4 w-4 text-[#f27d26] focus:ring-[#f27d26] border-gray-300 rounded"
              />
              <label htmlFor="color-blind" className="text-sm font-medium text-white/80">
                Färgblindläge
              </label>
            </div>
          </div>
        </div>
        
        {/* Accessibility Settings */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Circle className="w-5 h-5 text-[#f27d26]" /> Tillgänglighet
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="reduced-motion"
                className="h-4 w-4 text-[#f27d26] focus:ring-[#f27d26] border-gray-300 rounded"
              />
              <label htmlFor="reduced-motion" className="text-sm font-medium text-white/80">
                Minskad rörelse
              </label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="high-contrast"
                className="h-4 w-4 text-[#f27d26] focus:ring-[#f27d26] border-gray-300 rounded"
              />
              <label htmlFor="high-contrast" className="text-sm font-medium text-white/80">
                Hög kontrast
              </label>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsMenu;