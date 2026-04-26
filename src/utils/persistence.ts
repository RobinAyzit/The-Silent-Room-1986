export const saveGameState = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('theSilentRoomSave', serializedState);
  } catch (e) {
    console.warn('Could not save game state', e);
  }
};

export const loadGameState = () => {
  try {
    const serializedState = localStorage.getItem('theSilentRoomSave');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn('Could not load game state', e);
    return undefined;
  }
};

export const clearGameState = () => {
  try {
    localStorage.removeItem('theSilentRoomSave');
  } catch (e) {
    console.warn('Could not clear game state', e);
  }
};

// Default game state
export const defaultGameState = {
  revolutionPoints: 0,
  upgrades: {
    oiledKeys: 0,
    magicRibbon: 0,
    soundProofing: 0
  },
  chapterIndex: 0,
  settings: {
    audio: {
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.7
    },
    graphics: {
      particleIntensity: 1.0,
      screenEffects: true,
      colorBlindMode: false
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false
    }
  }
};