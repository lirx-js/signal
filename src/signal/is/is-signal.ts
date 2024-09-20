import { isFunction } from '@lirx/utils';
import { Signal } from '../types/signal.js';
import { isReadonlySignal } from './is-readonly-signal.js';

export function isSignal<GValue>(input: unknown): input is Signal<GValue> {
  return isReadonlySignal(input) && isFunction((input as any).set);
}
