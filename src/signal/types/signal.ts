import { ReadonlySignal } from './readonly-signal.js';
import { SignalUpdateFunctionCallback } from './signal-update-function-callback.js';

export interface Signal<GValue> extends ReadonlySignal<GValue> {
  set(value: GValue): void;

  throw(error: unknown): void;

  update(updateFunction: SignalUpdateFunctionCallback<GValue>): void;

  asReadonly(): ReadonlySignal<GValue>;
}
