import { UndoFunction } from '@lirx/utils';
import { signalAsReadonly } from '../../internal/reactive-context.protected.js';
import { SignalError } from '../../internal/signal-error.js';
import { SIGNAL } from '../../signal/signal.symbol.js';
import { ReadonlySignal } from '../../signal/types/readonly-signal.js';
import { SignalUpdateFunctionCallback } from '../../signal/types/signal-update-function-callback.js';
import {
  initLockableSignalNode,
  LOCKABLE_SIGNAL_NODE,
  lockableSignalGet,
  lockableSignalLocked,
  lockableSignalLockWith,
  LockableSignalNode,
  lockableSignalSet,
  lockableSignalThrow,
  lockableSignalUpdate,
} from './internal/lockable-signal.protected.js';

import { CreateLockableSignalOptions } from './types/create-lockable-signal-options.js';
import { LockableSignalConstructor } from './types/lockable-signal-constructor.js';
import { LockableSignal } from './types/lockable-signal.js';

export const lockableSignal: LockableSignalConstructor = (<GValue>(
  value: GValue | SignalError,
  options?: CreateLockableSignalOptions<GValue>,
): LockableSignal<GValue> => {
  const node: LockableSignalNode<GValue> = Object.create(LOCKABLE_SIGNAL_NODE);
  initLockableSignalNode<GValue>(node, value, options?.equal);

  const lockableSignal: LockableSignal<GValue> = ((): GValue =>
    lockableSignalGet<GValue>(node)) as LockableSignal<GValue>;
  lockableSignal[SIGNAL] = node;

  lockableSignal.set = (value: GValue): void => lockableSignalSet<GValue>(node, value);
  lockableSignal.throw = (error: unknown): void => lockableSignalThrow<GValue>(node, error);
  lockableSignal.update = (updateFunction: SignalUpdateFunctionCallback<GValue>): void =>
    lockableSignalUpdate<GValue>(node, updateFunction);
  lockableSignal.asReadonly = (): ReadonlySignal<GValue> =>
    signalAsReadonly<GValue>(node, lockableSignal);

  lockableSignal.locked = (): boolean => lockableSignalLocked(node);
  lockableSignal.lockWith = (signal: ReadonlySignal<GValue>, message?: string): UndoFunction =>
    lockableSignalLockWith<GValue>(node, signal, message);

  return lockableSignal;
}) as LockableSignalConstructor;

lockableSignal.unset = <GValue>(
  options?: CreateLockableSignalOptions<GValue>,
): LockableSignal<GValue> => {
  return lockableSignal<GValue>(SignalError.UNSET, options);
};

lockableSignal.thrown = <GValue>(
  error: unknown,
  options?: CreateLockableSignalOptions<GValue>,
): LockableSignal<GValue> => {
  return lockableSignal<GValue>(new SignalError(error), options);
};
