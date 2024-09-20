import { SIGNAL } from '../signal.symbol.js';

export interface ReadonlySignal<GValue> {
  (): GValue;

  [SIGNAL]: unknown;
}
