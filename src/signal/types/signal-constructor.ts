import { SignalError } from '../../internal/signal-error.js';
import { CreateSignalOptions } from './create-signal-options.js';
import { Signal } from './signal.js';

export interface SignalConstructor {
  <GValue>(
    initialValue: GValue | SignalError,
    options?: CreateSignalOptions<GValue>,
  ): Signal<GValue>;

  unset<GValue>(options?: CreateSignalOptions<GValue>): Signal<GValue>;

  thrown<GValue>(error: unknown, options?: CreateSignalOptions<GValue>): Signal<GValue>;
}
