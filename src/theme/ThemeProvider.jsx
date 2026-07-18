import React from 'react';
import ThemeContext from './ThemeContext';
import { theme } from './theme';
export function ThemeProvider({
  children
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
export default ThemeProvider;
