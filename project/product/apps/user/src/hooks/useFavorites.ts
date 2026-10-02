import { useState, useEffect } from 'react';
const KEY = 'product.user.favorites';
function load(): string[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
function save(v: string[]) { localStorage.setItem(KEY, JSON.stringify(v)); }
export function useFavorites() {
  const [list, setList] = useState<string[]>(load);
  useEffect(() => save(list), [list]);
  return { favorites: list, isFavorite: (id: string) => list.includes(id), toggle: (id: string) => setList((l) => l.includes(id) ? l.filter((x) => x !== id) : [...l, id]), clear: () => setList([]) };
}
