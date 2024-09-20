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

/* TYPES */

export interface LockedSignalNode<GValue> extends SignalNodeWithReadonly<GValue> {
  read: ILockedSignalReadFunction<GValue>;
  write: ILockedSignalWriteFunction<GValue>;
  schedule: ILockedSignalScheduleFunction;
  unsubscribe: UndoFunction | undefined;
}

/* INIT */

export const POLLING_SIGNAL_NODE: LockedSignalNode<unknown> = {
  ...SIGNAL_NODE_WITH_READONLY,
  read: undefined as any,
  write: undefined as any,
  schedule: undefined as any,
  unsubscribe: undefined as any,
  update: updateLockedSignal as any,
};

export function initLockedSignalNode<GValue>(
  pollingSignalNode: LockedSignalNode<GValue>,
  equal: EqualFunction<GValue> | undefined,
  read: ILockedSignalReadFunction<GValue>,
  write: ILockedSignalWriteFunction<GValue>,
  schedule: ILockedSignalScheduleFunction,
): void {
  initSignalNode<GValue>(pollingSignalNode, runInWatcherContext<GValue>(undefined, read), equal);
  pollingSignalNode.read = read;
  pollingSignalNode.write = write;
  pollingSignalNode.schedule = schedule;
}

/* FUNCTIONS */

export function readLockedSignal<GValue>(pollingSignalNode: LockedSignalNode<GValue>): boolean {
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

export function watchLockedSignalUntilChangedOrUnobserved<GValue>(
  pollingSignalNode: LockedSignalNode<GValue>,
): void {
  if (pollingSignalNode.unsubscribe === undefined) {
    pollingSignalNode.unsubscribe = pollingSignalNode.schedule((): void => {
      pollingSignalNode.unsubscribe = undefined;
      if (pollingSignalNode.watchers.length > 0 && !readLockedSignal<GValue>(pollingSignalNode)) {
        watchLockedSignalUntilChangedOrUnobserved(pollingSignalNode);
      }
    });
  }
}

export function updateLockedSignal<GValue>(pollingSignalNode: LockedSignalNode<GValue>): void {
  readLockedSignal<GValue>(pollingSignalNode);
  watchLockedSignalUntilChangedOrUnobserved<GValue>(pollingSignalNode);
}

export function clearLockedSignalScheduledUpdate<GValue>(
  pollingSignalNode: LockedSignalNode<GValue>,
): void {
  if (pollingSignalNode.unsubscribe !== undefined) {
    pollingSignalNode.unsubscribe();
    pollingSignalNode.unsubscribe = undefined;
  }
}

/* METHODS */

// GET

export function pollingSignalGet<GValue>(pollingSignalNode: LockedSignalNode<GValue>): GValue {
  readLockedSignal<GValue>(pollingSignalNode);
  if (isInWatcherContext()) {
    watchLockedSignalUntilChangedOrUnobserved<GValue>(pollingSignalNode);
  }
  watchSignalNode<GValue>(pollingSignalNode);
  return readSignalNode<GValue>(pollingSignalNode);
}

// SET

export function pollingSignalSet<GValue>(
  pollingSignalNode: LockedSignalNode<GValue>,
  value: GValue | SignalError,
): void {
  if (value instanceof SignalError) {
    throw new Error('Cannot throw this signal.');
  } else {
    if (pollingSignalNode.write(value) !== false) {
      clearLockedSignalScheduledUpdate<GValue>(pollingSignalNode);
      readLockedSignal<GValue>(pollingSignalNode);
    }
  }
}

export function pollingSignalThrow<GValue>(
  pollingSignalNode: LockedSignalNode<GValue>,
  error: unknown,
): void {
  pollingSignalSet<GValue>(pollingSignalNode, new SignalError(error));
}

export function pollingSignalUpdate<GValue>(
  pollingSignalNode: LockedSignalNode<GValue>,
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
