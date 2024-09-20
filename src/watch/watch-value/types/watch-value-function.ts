import { WatchCleanUpFunction } from '../../types/watch-clean-up-function.js';

export interface WatchValueFunction<GValue> {
  (value: GValue): WatchCleanUpFunction | void;
}
