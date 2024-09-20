import { EqualFunction, UndoFunction } from '@lirx/utils';
import {
  initSignalNode,
  isInWatcherContext,
  notifySignalNodeWatchers,
  readSignalNode,
  runInWatcherContext,
  SIGNAL_NODE_WITH_READONLY,
  signalGet,
  SignalNodeWithReadonly,
  watchSignalNode,
  writeSignalNode,
} from '../../../internal/reactive-context.protected.js';
import { SignalError } from '../../../internal/signal-error.js';
import { SignalUpdateFunctionCallback } from '../../../signal/types/signal-update-function-callback.js';
import { IPollingSignalReadFunction } from '../types/polling-signal-read-function.type.js';
import { IPollingSignalScheduleFunction } from '../types/polling-signal-schedule-function.type.js';
import { IPollingSignalWriteFunction } from '../types/polling-signal-write-function.type.js';

/* TYPES */

export interface PollingSignalNode<GValue> extends SignalNodeWithReadonly<GValue> {
  read: IPollingSignalReadFunction<GValue>;
  write: IPollingSignalWriteFunction<GValue>;
  schedule: IPollingSignalScheduleFunction;
  unsubscribe: UndoFunction | undefined;
}

/* INIT */

export const POLLING_SIGNAL_NODE: PollingSignalNode<unknown> = {
  ...SIGNAL_NODE_WITH_READONLY,
  read: undefined as any,
  write: undefined as any,
  schedule: undefined as any,
  unsubscribe: undefined as any,
  update: updatePollingSignal as any,
};

export function initPollingSignalNode<GValue>(
  pollingSignalNode: PollingSignalNode<GValue>,
  equal: EqualFunction<GValue> | undefined,
  read: IPollingSignalReadFunction<GValue>,
  write: IPollingSignalWriteFunction<GValue>,
  schedule: IPollingSignalScheduleFunction,
): void {
  initSignalNode<GValue>(pollingSignalNode, runInWatcherContext<GValue>(undefined, read), equal);
  pollingSignalNode.read = read;
  pollingSignalNode.write = write;
  pollingSignalNode.schedule = schedule;
}

/* FUNCTIONS */

export function readPollingSignal<GValue>(pollingSignalNode: PollingSignalNode<GValue>): boolean {
  const currentValue: GValue | SignalError = pollingSignalNode.value;
  let newValue: GValue | SignalError;
  try {
    newValue = runInWatcherContext<GValue>(undefined, pollingSignalNode.read);
  } catch (error: unknown) {
    newValue = new SignalError(error);
  }

  if (writeSignalNode<GValue>(pollingSignalNode, newValue)) {
    notifySignalNodeWatchers<GValue>(pollingSignalNode, currentValue);
    return true;
  } else {
    return false;
  }
}

export function watchPollingSignalUntilChangedOrUnobserved<GValue>(
  pollingSignalNode: PollingSignalNode<GValue>,
): void {
  if (pollingSignalNode.unsubscribe === undefined) {
    pollingSignalNode.unsubscribe = pollingSignalNode.schedule((): void => {
      pollingSignalNode.unsubscribe = undefined;
      if (pollingSignalNode.watchers.length > 0 && !readPollingSignal<GValue>(pollingSignalNode)) {
        watchPollingSignalUntilChangedOrUnobserved(pollingSignalNode);
      }
    });
  }
}

export function updatePollingSignal<GValue>(pollingSignalNode: PollingSignalNode<GValue>): void {
  readPollingSignal<GValue>(pollingSignalNode);
  watchPollingSignalUntilChangedOrUnobserved<GValue>(pollingSignalNode);
}

export function clearPollingSignalScheduledUpdate<GValue>(
  pollingSignalNode: PollingSignalNode<GValue>,
): void {
  if (pollingSignalNode.unsubscribe !== undefined) {
    pollingSignalNode.unsubscribe();
    pollingSignalNode.unsubscribe = undefined;
  }
}

/* METHODS */

// GET

export function pollingSignalGet<GValue>(pollingSignalNode: PollingSignalNode<GValue>): GValue {
  readPollingSignal<GValue>(pollingSignalNode);
  if (isInWatcherContext()) {
    watchPollingSignalUntilChangedOrUnobserved<GValue>(pollingSignalNode);
  }
  watchSignalNode<GValue>(pollingSignalNode);
  return readSignalNode<GValue>(pollingSignalNode);
}

// SET

export function pollingSignalSet<GValue>(
  pollingSignalNode: PollingSignalNode<GValue>,
  value: GValue | SignalError,
): void {
  if (value instanceof SignalError) {
    throw new Error('Cannot throw this signal.');
  } else {
    if (pollingSignalNode.write(value) !== false) {
      clearPollingSignalScheduledUpdate<GValue>(pollingSignalNode);
      readPollingSignal<GValue>(pollingSignalNode);
    }
  }
}

export function pollingSignalThrow<GValue>(
  pollingSignalNode: PollingSignalNode<GValue>,
  error: unknown,
): void {
  pollingSignalSet<GValue>(pollingSignalNode, new SignalError(error));
}

export function pollingSignalUpdate<GValue>(
  pollingSignalNode: PollingSignalNode<GValue>,
  updateFunction: SignalUpdateFunctionCallback<GValue>,
): void {
  const currentValue: GValue = signalGet<GValue>(pollingSignalNode);
  let value: GValue | SignalError;

  try {
    value = updateFunction(currentValue);
  } catch (error: unknown) {
    value = new SignalError(error);
  }

  pollingSignalSet<GValue>(pollingSignalNode, value);
}
