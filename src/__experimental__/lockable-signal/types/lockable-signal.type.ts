import { Signal } from '../../../signal/types/signal.js';
import { LockedSignal } from './locked-signal.js';

export interface LockableSignal<GValue> extends Signal<GValue> {
  locked(): boolean;
  requestLock(): LockedSignal<GValue>;
}
