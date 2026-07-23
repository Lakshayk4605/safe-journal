import { RedisOptions } from 'ioredis';
import { env } from './env';

/**
 * We deliberately do NOT create or export a live `IORedis` instance here.
 *
 * Why: BullMQ's `ConnectionOptions` type is a union of a plain `RedisOptions`
 * object OR a live client instance. Sharing one live instance (constructed from
 * *our* copy of `ioredis`) across multiple `Queue`/`Worker` constructors is
 * exactly what causes "Type 'Redis' is not assignable to type
 * 'ConnectionOptions'" — as soon as npm resolves a second, slightly different
 * copy of `ioredis` anywhere in the tree (which is common, since BullMQ pins
 * its own compatible range), TypeScript sees two structurally-similar but
 * nominally distinct `Redis` classes and refuses the assignment.
 *
 * Exporting plain options instead sidesteps the problem at the root: each
 * consumer builds its own client from these options using whichever `ioredis`
 * copy *it* resolved, so a live instance never crosses a package boundary.
 * (package.json also pins a single `ioredis` version tree-wide via
 * "overrides" as defense in depth.)
 *
 * This also means the main API process (server.ts) never has to open a Redis
 * connection at all — only the opt-in background-jobs process (src/worker.ts)
 * does — which is what makes Redis genuinely optional for local API
 * development: if it's down, the API is simply unaffected.
 */
export function getRedisConnectionOptions(): RedisOptions {
  const url = new URL(env.REDIS_URL);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    // Required by BullMQ: blocking commands must not have Redis cap retries.
    maxRetriesPerRequest: null,
    // Cap reconnect backoff (default ioredis backoff grows unbounded) and
    // never let a connection failure become an unhandled crash.
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
    // Don't open the socket until something actually issues a command —
    // keeps "Redis optional" true even for processes that do use this config.
    lazyConnect: true,
  };
}
