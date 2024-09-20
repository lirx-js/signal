import { WatchErrorFunction } from './watch-error-function.js';

export const WATCH_ERROR_REPORT: WatchErrorFunction = (error: unknown): void => {
  console.error(error);
};
