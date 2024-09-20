import { SignalError } from '../../internal/signal-error.js';
import { ReadonlySignal } from '../../signal/types/readonly-signal.js';
import { UnsubscribeOfWatch } from '../types/unsubscribe-of-watch.js';
import { WatchCleanUpFunction } from '../types/watch-clean-up-function.js';
import { watch } from '../watch.js';
import { WatchErrorFunction } from './types/watch-error-function.js';
import { WATCH_ERROR_THROW } from './types/watch-error-throw.js';
import { WatchValueFunction } from './types/watch-value-function.js';

export function watchValue<GValue>(
  signal: ReadonlySignal<GValue>,
  watchValueFunction: WatchValueFunction<GValue>,
  watchErrorFunction: WatchErrorFunction = WATCH_ERROR_THROW,
): UnsubscribeOfWatch {
  return watch(signal, (value: GValue | SignalError): WatchCleanUpFunction | void => {
    return value instanceof SignalError
      ? watchErrorFunction(value.error)
      : watchValueFunction(value);
  });
}
