import {
  initSignalNode,
  readSignalNode,
  SIGNAL_NODE,
  SignalNode,
} from '../internal/reactive-context.protected.js';
import { SignalError } from '../internal/signal-error.js';
import { SIGNAL } from '../signal/signal.symbol.js';
import { ReadonlySignal } from '../signal/types/readonly-signal.js';

/**
 * Generates a signal whose value is static.
 * @experimental
 */
export function invariable<GValue>(value: GValue | SignalError): ReadonlySignal<GValue> {
  const node: SignalNode<GValue> = Object.create(SIGNAL_NODE);
  initSignalNode<GValue>(node, value, undefined);

  const signal: ReadonlySignal<GValue> = ((): GValue =>
    readSignalNode<GValue>(node)) as ReadonlySignal<GValue>;
  signal[SIGNAL] = node;

  return signal;
}
