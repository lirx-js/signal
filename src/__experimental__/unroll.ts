import { computed } from '../computed/computed.js';
import { ComputationFunction } from '../computed/types/computation-function.js';
import { CreateComputedOptions } from '../computed/types/create-computed-options.js';
import { ReadonlySignal } from '../signal/types/readonly-signal.js';

/**
 * Generates a signal from a higher order signal.
 * @experimental
 */
export function unroll<GValue>(
  signal: ReadonlySignal<ReadonlySignal<GValue>>,
): ReadonlySignal<GValue> {
  return computed((): GValue => {
    return signal()();
  });
}

/**
 * Generates a higher order signal.
 * @experimental
 */
export function unrolled<GValue>(
  computation: ComputationFunction<ReadonlySignal<GValue>>,
  options?: CreateComputedOptions<ReadonlySignal<GValue>>,
): ReadonlySignal<GValue> {
  return unroll<GValue>(computed(computation, options));
}
