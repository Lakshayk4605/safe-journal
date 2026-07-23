export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface JwtAccessPayload {
  sub: string; // user id
  email: string;
  role: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  jti: string; // refresh token id, used to look up / revoke in DB
  type: 'refresh';
}

export interface AiReflectionRequest {
  entryContent: string;
  mood: string;
  emotions: string[];
}

export interface AiReflectionResponse {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface AiChatRequest {
  history: { role: 'user' | 'assistant' | 'system'; content: string }[];
  message: string;
}

export interface AiChatResponse {
  content: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}
