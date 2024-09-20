import { isFunction } from '@lirx/utils';
import { SIGNAL } from '../signal.symbol.js';
import { ReadonlySignal } from '../types/readonly-signal.js';

export function isReadonlySignal<GValue>(input: unknown): input is ReadonlySignal<GValue> {
  return isFunction(input) && SIGNAL in input;
}
