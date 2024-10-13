import { EqualFunction, UndoFunction } from '@lirx/utils';
import {
  initSignalNode,
  SIGNAL_NODE_WITH_READONLY,
  signalGet,
  SignalNodeWithReadonly,
  signalSet,
  signalThrow,
  signalUpdate,
} from '../../../internal/reactive-context.protected.js';
import { SignalError } from '../../../internal/signal-error.js';
import { ReadonlySignal } from '../../../signal/types/readonly-signal.js';
import { SignalUpdateFunctionCallback } from '../../../signal/types/signal-update-function-callback.js';
import { UnsubscribeOfWatch } from '../../../watch/types/unsubscribe-of-watch.js';
import { watch } from '../../../watch/watch.js';
import { SignalLockedError } from '../errors/signal-locked-error.js';

/* TYPES */

export interface LockableSignalNode<GValue> extends SignalNodeWithReadonly<GValue> {
  lockedWith: ReadonlySignal<GValue> | undefined;
  lockedMessage: string | undefined;
}

/* INIT */

export const LOCKABLE_SIGNAL_NODE: LockableSignalNode<unknown> = {
  ...SIGNAL_NODE_WITH_READONLY,
  lockedWith: undefined as any,
  lockedMessage: undefined as any,
};

export function initLockableSignalNode<GValue>(
  lockableSignalNode: LockableSignalNode<GValue>,
  value: GValue | SignalError,
  equal: EqualFunction<GValue> | undefined,
): void {
  initSignalNode<GValue>(lockableSignalNode, value, equal);
}

/* FUNCTIONS */

/* METHODS */

// GET

export function lockableSignalGet<GValue>(lockableSignalNode: LockableSignalNode<GValue>): GValue {
  return signalGet<GValue>(lockableSignalNode);
}

// SET

export function lockableSignalSet<GValue>(
  lockableSignalNode: LockableSignalNode<GValue>,
  value: GValue | SignalError,
): void {
  if (lockableSignalNode.lockedWith === undefined) {
    signalSet<GValue>(lockableSignalNode, value);
  } else {
    throw new SignalLockedError(lockableSignalNode.lockedMessage);
  }
}

export function lockableSignalThrow<GValue>(
  lockableSignalNode: LockableSignalNode<GValue>,
  error: unknown,
): void {
  if (lockableSignalNode.lockedWith === undefined) {
    signalThrow<GValue>(lockableSignalNode, error);
  } else {
    throw new SignalLockedError(lockableSignalNode.lockedMessage);
  }
}

export function lockableSignalUpdate<GValue>(
  lockableSignalNode: LockableSignalNode<GValue>,
  updateFunction: SignalUpdateFunctionCallback<GValue>,
): void {
  if (lockableSignalNode.lockedWith === undefined) {
    signalUpdate<GValue>(lockableSignalNode, updateFunction);
  } else {
    throw new SignalLockedError(lockableSignalNode.lockedMessage);
  }
}

export function lockableSignalLocked(lockableSignalNode: LockableSignalNode<any>): boolean {
  return lockableSignalNode.lockedWith !== undefined;
}

export function lockableSignalLockWith<GValue>(
  lockableSignalNode: LockableSignalNode<GValue>,
  signal: ReadonlySignal<GValue>,
  message?: string,
): UndoFunction {
  if (lockableSignalNode.lockedWith === undefined) {
    lockableSignalNode.lockedWith = signal;
    lockableSignalNode.lockedMessage = message;

    let locked: boolean = true;

    const unsubscribeOfWatch: UnsubscribeOfWatch = watch<GValue>(
      signal,
      (value: GValue | SignalError): void => {
        signalSet<GValue>(lockableSignalNode, value);
      },
    );

    return () => {
      if (locked) {
        locked = false;
        unsubscribeOfWatch();
        lockableSignalNode.lockedWith = undefined;
        lockableSignalNode.lockedMessage = undefined;
      }
    };
  } else {
    throw new SignalLockedError();
  }
}
