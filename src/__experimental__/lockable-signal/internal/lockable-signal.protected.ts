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

export interface LockableSignalNode<GValue> extends SignalNodeWithReadonly<GValue> {
  read: ILockableSignalReadFunction<GValue>;
  write: ILockableSignalWriteFunction<GValue>;
  schedule: ILockableSignalScheduleFunction;
  unsubscribe: UndoFunction | undefined;
}

/* INIT */

export const POLLING_SIGNAL_NODE: LockableSignalNode<unknown> = {
  ...SIGNAL_NODE_WITH_READONLY,
  read: undefined as any,
  write: undefined as any,
  schedule: undefined as any,
  unsubscribe: undefined as any,
  update: updateLockableSignal as any,
};

export function initLockableSignalNode<GValue>(
  pollingSignalNode: LockableSignalNode<GValue>,
  equal: EqualFunction<GValue> | undefined,
  read: ILockableSignalReadFunction<GValue>,
  write: ILockableSignalWriteFunction<GValue>,
  schedule: ILockableSignalScheduleFunction,
): void {
  initSignalNode<GValue>(pollingSignalNode, runInWatcherContext<GValue>(undefined, read), equal);
  pollingSignalNode.read = read;
  pollingSignalNode.write = write;
  pollingSignalNode.schedule = schedule;
}

/* FUNCTIONS */

export function readLockableSignal<GValue>(pollingSignalNode: LockableSignalNode<GValue>): boolean {
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

export function watchLockableSignalUntilChangedOrUnobserved<GValue>(
  pollingSignalNode: LockableSignalNode<GValue>,
): void {
  if (pollingSignalNode.unsubscribe === undefined) {
    pollingSignalNode.unsubscribe = pollingSignalNode.schedule((): void => {
      pollingSignalNode.unsubscribe = undefined;
      if (pollingSignalNode.watchers.length > 0 && !readLockableSignal<GValue>(pollingSignalNode)) {
        watchLockableSignalUntilChangedOrUnobserved(pollingSignalNode);
      }
    });
  }
}

export function updateLockableSignal<GValue>(pollingSignalNode: LockableSignalNode<GValue>): void {
  readLockableSignal<GValue>(pollingSignalNode);
  watchLockableSignalUntilChangedOrUnobserved<GValue>(pollingSignalNode);
}

export function clearLockableSignalScheduledUpdate<GValue>(
  pollingSignalNode: LockableSignalNode<GValue>,
): void {
  if (pollingSignalNode.unsubscribe !== undefined) {
    pollingSignalNode.unsubscribe();
    pollingSignalNode.unsubscribe = undefined;
  }
}

/* METHODS */

// GET

export function pollingSignalGet<GValue>(pollingSignalNode: LockableSignalNode<GValue>): GValue {
  readLockableSignal<GValue>(pollingSignalNode);
  if (isInWatcherContext()) {
    watchLockableSignalUntilChangedOrUnobserved<GValue>(pollingSignalNode);
  }
  watchSignalNode<GValue>(pollingSignalNode);
  return readSignalNode<GValue>(pollingSignalNode);
}

// SET

export function pollingSignalSet<GValue>(
  pollingSignalNode: LockableSignalNode<GValue>,
  value: GValue | SignalError,
): void {
  if (value instanceof SignalError) {
    throw new Error('Cannot throw this signal.');
  } else {
    if (pollingSignalNode.write(value) !== false) {
      clearLockableSignalScheduledUpdate<GValue>(pollingSignalNode);
      readLockableSignal<GValue>(pollingSignalNode);
    }
  }
}

export function pollingSignalThrow<GValue>(
  pollingSignalNode: LockableSignalNode<GValue>,
  error: unknown,
): void {
  pollingSignalSet<GValue>(pollingSignalNode, new SignalError(error));
}

export function pollingSignalUpdate<GValue>(
  pollingSignalNode: LockableSignalNode<GValue>,
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
