"use client";

import { useEffect, useState } from "react";

export const useDebouncedValue = <T>(value: T, delay = 200) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};
