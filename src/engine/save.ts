import type { GameData } from '../state/store';

const SAVE_KEY = 'db_save_v1';
const ENDINGS_KEY = 'db_endings_v1';

export function saveCheckpoint(data: GameData): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadCheckpoint(): GameData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as GameData;
    return data.v === 1 && data.phase === 'playing' ? data : null;
  } catch {
    return null;
  }
}

export function clearCheckpoint() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function endingsFound(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function recordEnding(id: string) {
  try {
    const found = new Set(endingsFound());
    found.add(id);
    localStorage.setItem(ENDINGS_KEY, JSON.stringify([...found]));
  } catch {
    /* ignore */
  }
}
