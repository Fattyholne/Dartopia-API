import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Define available theme options
export type ThemeType = 'light' | 'soft-light' | 'dark' | 'midnight' | 'neon-blue' | 'neon-purple' | 'high-contrast';

/**
 * A custom hook for managing the application theme
 */
export const useTheme = () => {
  // Store the theme preference in local storage
  const [theme, setThemeState] = useLocalStorage<ThemeType>(
    "ui-theme",
    "dark" // Default theme
  );

  // Sync with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Handler for system theme preference changes
    const handleChange = () => {
      if (!localStorage.getItem("ui-theme")) {
        setThemeState(mediaQuery.matches ? "dark" : "light");
      }
    };

    // Set up listener for preference changes
    mediaQuery.addEventListener("change", handleChange);
    
    // Cleanup
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [setThemeState]);

  // Wrapper around setThemeState that also updates CSS variables
  const setTheme = (value: ThemeType | ((val: ThemeType) => ThemeType)) => {
    setThemeState(value);
  };

  return { theme, setTheme };
};