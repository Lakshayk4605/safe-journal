export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const MOOD_SCORES: Record<string, number> = {
  EXCELLENT: 5,
  GREAT: 4.5,
  GOOD: 4,
  OKAY: 3,
  SAD: 2,
  ANXIOUS: 2.5,
};

export const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION_HOURS: 24,
  PASSWORD_RESET_MINUTES: 30,
} as const;

export const RESERVED_ROUTES_PREFIX = '/api/v1';

export const ALLOWED_AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg'];
export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
