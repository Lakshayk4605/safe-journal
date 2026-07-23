import type { Mood } from './mock-data';

export function toBackendMood(mood: Mood): string {
  return mood.toUpperCase();
}

export function fromBackendMood(mood: string): Mood {
  return mood.toLowerCase() as Mood;
}
