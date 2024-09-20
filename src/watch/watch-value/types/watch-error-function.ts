import { WatchCleanUpFunction } from '../../types/watch-clean-up-function.js';

export interface WatchErrorFunction {
  (error: unknown): WatchCleanUpFunction | void;
}
