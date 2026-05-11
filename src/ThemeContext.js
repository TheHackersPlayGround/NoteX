import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { light, dark, radius, getShadow } from './theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Load saved preference on startup
  useEffect(() => {
    AsyncStorage.getItem('@notex_dark_mode').then(val => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('@notex_dark_mode', String(next));
  };

  const colors = isDark ? dark : light;
  const shadow = getShadow(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors, radius, shadow }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
