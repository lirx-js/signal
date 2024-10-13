import { isFunction } from '@lirx/utils';
import { isReadonlySignal } from '../../../signal/is/is-readonly-signal.js';
import { LockableSignal } from '../types/lockable-signal.js';

export function isLockableSignal<GValue>(input: unknown): input is LockableSignal<GValue> {
  return isReadonlySignal(input) && isFunction((input as any).lockWith);
}
