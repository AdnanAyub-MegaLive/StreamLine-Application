import React from 'react';
import { Theme } from './theme';

export const ThemeContext = React.createContext<Theme | null>(null);

export default ThemeContext;
