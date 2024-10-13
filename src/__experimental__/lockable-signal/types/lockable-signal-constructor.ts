import { SignalError } from '../../../internal/signal-error.js';
import { CreateLockableSignalOptions } from './create-lockable-signal-options.js';
import { LockableSignal } from './lockable-signal.js';

export interface LockableSignalConstructor {
  <GValue>(
    initialValue: GValue | SignalError,
    options?: CreateLockableSignalOptions<GValue>,
  ): LockableSignal<GValue>;

  unset<GValue>(options?: CreateLockableSignalOptions<GValue>): LockableSignal<GValue>;

  thrown<GValue>(
    error: unknown,
    options?: CreateLockableSignalOptions<GValue>,
  ): LockableSignal<GValue>;
}
