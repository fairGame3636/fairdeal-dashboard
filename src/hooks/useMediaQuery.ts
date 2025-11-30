// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that detects if the screen matches a media query
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns True if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define handler for changes
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    // Add listener for changes
    mediaQuery.addEventListener('change', handler);
    
    // Clean up
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Predefined hook to detect mobile devices (including tablets)
 * @param breakpoint - Optional breakpoint in pixels (default: 768)
 * @returns True if screen width is less than the breakpoint
 */
export function useMobile(breakpoint: number = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

/**
 * Predefined hook to detect desktop devices
 * @param breakpoint - Optional breakpoint in pixels (default: 768)
 * @returns True if screen width is greater than or equal to the breakpoint
 */
export function useDesktop(breakpoint: number = 768): boolean {
  return useMediaQuery(`(min-width: ${breakpoint}px)`);
}