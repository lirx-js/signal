import {
  COMPUTED_NODE,
  computedGet,
  ComputedNode,
  initComputedNode,
} from '../internal/reactive-context.protected.js';
import { SIGNAL } from '../signal/signal.symbol.js';
import { ReadonlySignal } from '../signal/types/readonly-signal.js';
import { ComputationFunction } from './types/computation-function.js';
import { CreateComputedOptions } from './types/create-computed-options.js';

export function computed<GValue>(
  computation: ComputationFunction<GValue>,
  options?: CreateComputedOptions<GValue>,
): ReadonlySignal<GValue> {
  const context: ComputedNode<GValue> = Object.create(COMPUTED_NODE);
  initComputedNode<GValue>(context, computation, options?.equal);

  const computed: ReadonlySignal<GValue> = ((): GValue =>
    computedGet<GValue>(context)) as ReadonlySignal<GValue>;
  computed[SIGNAL] = context;

  return computed;
}
