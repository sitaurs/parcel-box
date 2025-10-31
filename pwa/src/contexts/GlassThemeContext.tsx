import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSetting, setSetting } from '../lib/db';

type GlassTheme = 'off' | 'subtle' | 'strong';

interface GlassThemeContextType {
  glassTheme: GlassTheme;
  setGlassTheme: (theme: GlassTheme) => void;
  isGlassEnabled: boolean;
}

const GlassThemeContext = createContext<GlassThemeContextType>({
  glassTheme: 'off',
  setGlassTheme: () => {},
  isGlassEnabled: false,
});

export function GlassThemeProvider({ children }: { children: React.ReactNode }) {
  const [glassTheme, setGlassThemeState] = useState<GlassTheme>('off');

  useEffect(() => {
    // Load glass theme from IndexedDB
    getSetting<GlassTheme>('glassTheme', 'off').then((savedTheme) => {
      setGlassThemeState(savedTheme);
      applyGlassTheme(savedTheme);
    });
  }, []);

  const setGlassTheme = (newTheme: GlassTheme) => {
    setGlassThemeState(newTheme);
    setSetting('glassTheme', newTheme);
    applyGlassTheme(newTheme);
  };

  const applyGlassTheme = (theme: GlassTheme) => {
    // Remove existing glass classes
    document.documentElement.classList.remove('glass-off', 'glass-subtle', 'glass-strong');
    
    // Apply new glass class
    document.documentElement.classList.add(`glass-${theme}`);
  };

  return (
    <GlassThemeContext.Provider 
      value={{ 
        glassTheme, 
        setGlassTheme, 
        isGlassEnabled: glassTheme !== 'off' 
      }}
    >
      {children}
    </GlassThemeContext.Provider>
  );
}

export function useGlassTheme() {
  return useContext(GlassThemeContext);
}
