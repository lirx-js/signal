import {
  initSignalNode,
  SIGNAL_NODE_WITH_READONLY,
  signalAsReadonly,
  signalGet,
  SignalNodeWithReadonly,
  signalSet,
  signalThrow,
  signalUpdate,
} from '../internal/reactive-context.protected.js';
import { SignalError } from '../internal/signal-error.js';

import { SIGNAL } from './signal.symbol.js';
import { CreateSignalOptions } from './types/create-signal-options.js';
import { ReadonlySignal } from './types/readonly-signal.js';
import { SignalConstructor } from './types/signal-constructor.js';
import { SignalUpdateFunctionCallback } from './types/signal-update-function-callback.js';
import { Signal } from './types/signal.js';

export const signal: SignalConstructor = (<GValue>(
  initialValue: GValue | SignalError,
  options?: CreateSignalOptions<GValue>,
): Signal<GValue> => {
  // preventCreationIfInSignalContext();

  const node: SignalNodeWithReadonly<GValue> = Object.create(SIGNAL_NODE_WITH_READONLY);
  initSignalNode<GValue>(node, initialValue, options?.equal);

  const signal: Signal<GValue> = ((): GValue => signalGet<GValue>(node)) as Signal<GValue>;
  signal[SIGNAL] = node;

  signal.set = (value: GValue): void => signalSet<GValue>(node, value);
  signal.throw = (error: unknown): void => signalThrow<GValue>(node, error);
  signal.update = (updateFunction: SignalUpdateFunctionCallback<GValue>): void =>
    signalUpdate<GValue>(node, updateFunction);
  signal.asReadonly = (): ReadonlySignal<GValue> => signalAsReadonly<GValue>(node, signal);

  return signal;
}) as SignalConstructor;

signal.unset = <GValue>(options?: CreateSignalOptions<GValue>): Signal<GValue> => {
  return signal<GValue>(SignalError.UNSET, options);
};
