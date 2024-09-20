import { WatchErrorFunction } from './watch-error-function.js';

export const WATCH_ERROR_THROW: WatchErrorFunction = (error: unknown): void => {
  throw error;
};
