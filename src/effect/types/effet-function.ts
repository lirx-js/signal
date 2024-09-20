import { EffectCleanUpFunction } from './effect-clean-up-function.js';

export interface EffetFunction {
  (): EffectCleanUpFunction | void;
}
