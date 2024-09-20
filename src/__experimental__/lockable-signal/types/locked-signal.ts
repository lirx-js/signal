import { Signal } from '../../../signal/types/signal.js';

export interface LockedSignal<GValue> extends Signal<GValue> {
  released(): boolean;

  releaseLock(): void;
}
