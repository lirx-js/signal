import { SignalError } from '../../internal/signal-error.js';
import { WatchCleanUpFunction } from './watch-clean-up-function.js';

export interface IWatchFunction<GValue> {
  (value: GValue | SignalError): WatchCleanUpFunction | void;
}
