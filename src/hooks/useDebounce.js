import { useState, useEffect } from 'react';

/**
 * Menunda pembaruan nilai hingga pengguna berhenti mengetik selama `delayMs` (default 300ms)
 * agar tidak memicu request pencarian ke server pada setiap ketukan tombol.
 */
export function useDebounce(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

