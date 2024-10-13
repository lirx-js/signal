import { createIdle } from '@lirx/utils';
import { signalAsReadonly } from '../../internal/reactive-context.protected.js';
import { SIGNAL } from '../../signal/signal.symbol.js';
import { ReadonlySignal } from '../../signal/types/readonly-signal.js';
import { SignalUpdateFunctionCallback } from '../../signal/types/signal-update-function-callback.js';
import { Signal } from '../../signal/types/signal.js';
import {
  initPollingSignalNode,
  POLLING_SIGNAL_NODE,
  pollingSignalGet,
  PollingSignalNode,
  pollingSignalSet,
  pollingSignalThrow,
  pollingSignalUpdate,
} from './internal/polling-signal.protected.js';
import { CreatePoolingSignalOptions } from './types/create-pooling-signal-options.type.js';
import { PollingSignal } from './types/polling-signal.js';

export function pollingSignal<GValue>({
  equal,
  read,
  write,
  schedule = createIdle,
}: CreatePoolingSignalOptions<GValue>): PollingSignal<GValue> {
  const node: PollingSignalNode<GValue> = Object.create(POLLING_SIGNAL_NODE);
  initPollingSignalNode<GValue>(node, equal, read, write, schedule);

  const pollingSignal: PollingSignal<GValue> = ((): GValue =>
    pollingSignalGet<GValue>(node)) as Signal<GValue>;
  pollingSignal[SIGNAL] = node;

  pollingSignal.set = (value: GValue): void => pollingSignalSet<GValue>(node, value);
  pollingSignal.throw = (error: unknown): void => pollingSignalThrow<GValue>(node, error);
  pollingSignal.update = (updateFunction: SignalUpdateFunctionCallback<GValue>): void =>
    pollingSignalUpdate<GValue>(node, updateFunction);
  pollingSignal.asReadonly = (): ReadonlySignal<GValue> =>
    signalAsReadonly<GValue>(node, pollingSignal);

  return pollingSignal;
}
