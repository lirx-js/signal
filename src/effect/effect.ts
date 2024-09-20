import {
  EFFECT_NODE,
  EffectNode,
  initEffectNode,
  preventEffectCreationInWatcherContext,
  runEffectNode,
  stopEffectNode,
} from '../internal/reactive-context.protected.js';
import { CreateEffectOptions } from './types/create-effect-options.js';

import { EffetFunction } from './types/effet-function.js';
import { UnsubscribeOfEffect } from './types/unsubscribe-of-effect.js';

export function effect(
  effectFunction: EffetFunction,
  options?: CreateEffectOptions,
): UnsubscribeOfEffect {
  preventEffectCreationInWatcherContext();

  const node: EffectNode = Object.create(EFFECT_NODE);
  initEffectNode(node, effectFunction, options?.cleanSignalsWatchers);

  runEffectNode(node);

  return (): void => {
    stopEffectNode(node);
  };
}
