import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { RiSunLine, RiMoonLine } from 'react-icons/ri';

export default function ThemeToggle({ style = {} }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={style}
      aria-label="Toggle theme"
    >
      <div className="theme-toggle-knob">
        {isDark
          ? <RiMoonLine  size={9} color="#111827" />
          : <RiSunLine   size={9} color="#111827" />
        }
      </div>
    </button>
  );
}
