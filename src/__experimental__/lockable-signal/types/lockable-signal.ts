import { UndoFunction } from '@lirx/utils';
import { ReadonlySignal } from '../../../signal/types/readonly-signal.js';
import { Signal } from '../../../signal/types/signal.js';

export interface LockableSignal<GValue> extends Signal<GValue> {
  locked(): boolean;

  lockWith(signal: ReadonlySignal<GValue>, message?: string): UndoFunction;
}
