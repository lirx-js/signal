import { EQUAL_FUNCTION_STRICT_EQUAL, EqualFunction } from '@lirx/utils';
import { ComputationFunction } from '../computed/types/computation-function.js';
import { EffectCleanUpFunction } from '../effect/types/effect-clean-up-function.js';
import { EffetFunction } from '../effect/types/effet-function.js';
import { SIGNAL } from '../signal/signal.symbol.js';
import { ReadonlySignal } from '../signal/types/readonly-signal.js';
import { SignalUpdateFunctionCallback } from '../signal/types/signal-update-function-callback.js';
import { WatchCleanUpFunction } from '../watch/types/watch-clean-up-function.js';
import { IWatchFunction } from '../watch/types/watch-function.js';
import { SignalError } from './signal-error.js';

/* --------------------------------------- SIGNAL NODE --------------------------------------- */

/* TYPES */

export interface SignalNode<GValue> {
  equal: EqualFunction<GValue>;
  value: GValue | SignalError;
  watchers: WatcherNode[];
  update: ((self: SignalNode<GValue>) => void) | undefined;
}

/* INIT */

export const SIGNAL_NODE: SignalNode<unknown> = {
  equal: EQUAL_FUNCTION_STRICT_EQUAL,
  value: undefined,
  watchers: undefined as any,
  update: undefined as any,
};

export function initSignalNode<GValue>(
  signalNode: SignalNode<GValue>,
  value: GValue | SignalError,
  equal: EqualFunction<GValue> | undefined,
): void {
  if (equal !== undefined) {
    signalNode.equal = equal;
  }

  signalNode.value = value;
  signalNode.watchers = [];
}

/* FUNCTIONS */

export function isSignalNodeValueDifferentOfValue<GValue>(
  signalNode: SignalNode<GValue>,
  value: GValue | SignalError,
): boolean {
  return (
    signalNode.value instanceof SignalError ||
    value instanceof SignalError ||
    !signalNode.equal(value, signalNode.value)
  );
}

export function readSignalNode<GValue>(signalNode: SignalNode<GValue>): GValue {
  if (signalNode.value instanceof SignalError) {
    throw signalNode.value.error;
  }

  return signalNode.value;
}

export function writeSignalNode<GValue>(
  signalNode: SignalNode<GValue>,
  value: GValue | SignalError,
): boolean {
  if (isSignalNodeValueDifferentOfValue<GValue>(signalNode, value)) {
    signalNode.value = value;
    return true;
  } else {
    return false;
  }
}

export function watchSignalNode<GValue>(signalNode: SignalNode<GValue>): void {
  if (currentWatcher !== undefined && signalNode.watchers.at(-1) !== currentWatcher) {
    signalNode.watchers.push(currentWatcher);
  }
}

export function notifySignalNodeWatchers<GValue>(
  signalNode: SignalNode<GValue>,
  previousValue: GValue | SignalError,
): void {
  while (signalNode.watchers.length > 0) {
    const watcherNode: WatcherNode = signalNode.watchers.pop()!;
    watcherNode.onActivity<GValue>(watcherNode, signalNode, previousValue);
  }
}

/**
 * @warn `.splice(...)` cost a lost of performances, usually it's faster to perform the check inside `onActivity`
 */
export function removeSignalNodeWatcher<GValue>(
  signalNode: SignalNode<GValue>,
  watcherNode: WatcherNode,
): void {
  const index: number = signalNode.watchers.indexOf(watcherNode);
  if (index !== -1) {
    signalNode.watchers.splice(index, 1);
  }
}

export function writeAndNotifySignalNode<GValue>(
  signalNode: SignalNode<GValue>,
  value: GValue | SignalError,
): void {
  const currentValue: GValue | SignalError = signalNode.value;
  if (writeSignalNode<GValue>(signalNode, value)) {
    notifySignalNodeWatchers<GValue>(signalNode, currentValue);
  }
}

export function updateSignalNode<GValue>(signalNode: SignalNode<GValue>): void {
  signalNode.update?.(signalNode);
}

export function preventSignalWriteInWatcherContext(): void {
  if (currentWatcher !== undefined) {
    throw new Error('The signal cannot be written is this context.');
  }
}

/* METHODS */

// GET

export function signalGet<GValue>(signalNode: SignalNode<GValue>): GValue {
  watchSignalNode<GValue>(signalNode);
  return readSignalNode<GValue>(signalNode);
}

// SET

export function signalSet<GValue>(
  signalNode: SignalNode<GValue>,
  value: GValue | SignalError,
): void {
  preventSignalWriteInWatcherContext();
  writeAndNotifySignalNode<GValue>(signalNode, value);
}

export function signalThrow<GValue>(signalNode: SignalNode<GValue>, error: unknown): void {
  signalSet<GValue>(signalNode, new SignalError(error));
}

export function signalUpdate<GValue>(
  signalNode: SignalNode<GValue>,
  updateFunction: SignalUpdateFunctionCallback<GValue>,
): void {
  const currentValue: GValue = signalGet<GValue>(signalNode);
  let value: GValue | SignalError;

  try {
    value = updateFunction(currentValue);
  } catch (error: unknown) {
    value = new SignalError(error);
  }

  signalSet<GValue>(signalNode, value);
}

/* ------ SIGNAL NODE WITH READONLY ------ */

/* TYPES */

export interface SignalNodeWithReadonly<GValue> extends SignalNode<GValue> {
  readonlySignal: ReadonlySignal<GValue> | undefined;
}

/* INIT */

export const SIGNAL_NODE_WITH_READONLY: SignalNodeWithReadonly<unknown> = {
  ...SIGNAL_NODE,
  readonlySignal: undefined,
};

/* METHODS */

export function signalAsReadonly<GValue>(
  node: SignalNodeWithReadonly<GValue>,
  get: () => GValue,
): ReadonlySignal<GValue> {
  if (node.readonlySignal === undefined) {
    const readonlySignal: ReadonlySignal<GValue> = (): GValue => get();
    readonlySignal[SIGNAL] = node;
    node.readonlySignal = readonlySignal;
  }
  return node.readonlySignal;
}

/* --------------------------------------- WATCHER NODE --------------------------------------- */

/* TYPES */

export interface WatcherNode {
  onActivity: <GValue>(
    self: WatcherNode,
    signalNode: SignalNode<GValue>,
    previousValue: GValue | SignalError,
  ) => void;
  signals: SignalNodeWithValue<any>[];
}

export type SignalNodeWithValue<GValue> = readonly [
  signalNode: SignalNode<GValue>,
  previousValue: GValue | SignalError,
];

/* INIT */

export const WATCHER_NODE: WatcherNode = {
  onActivity: undefined as any,
  signals: undefined as any,
};

export function initWatcherNode(watcherNode: WatcherNode): void {
  watcherNode.signals = [];
}

/* FUNCTIONS */

export type OptionalWatcherNode = WatcherNode | undefined;

let currentWatcher: OptionalWatcherNode = undefined;

export function runInWatcherContext<GReturn>(
  watcher: OptionalWatcherNode,
  cb: () => GReturn,
): GReturn {
  const previousWatcher: OptionalWatcherNode = currentWatcher;
  currentWatcher = watcher;
  try {
    return cb();
  } finally {
    currentWatcher = previousWatcher;
  }
}

export function isInWatcherContext(): boolean {
  return currentWatcher !== undefined;
}

/**
 * Returns `true` if the context should be updated or not.
 */
export function refreshWatcherNodeContext(watcherNode: WatcherNode): boolean {
  while (watcherNode.signals.length > 0) {
    const [signalNode, value] = watcherNode.signals.pop()!;

    updateSignalNode<any>(signalNode);

    if (isSignalNodeValueDifferentOfValue<any>(signalNode, value)) {
      return true;
    } else {
      signalNode.watchers.push(watcherNode);
    }
  }

  return false;
}

export function clearWatcherNode(watcherNode: WatcherNode): void {
  watcherNode.signals = [];
}

/* ------ WATCHER NODE WITH CLEAN SIGNALS WATCHERS ------ */

/* TYPES */

export interface WatcherNodeWithCleanSignalsWatchers extends WatcherNode {
  cleanSignalsWatchers: boolean;
}

/* INIT */

export const WATCHER_NODE_WITH_CLEAN_SIGNALS_WATCHERS: WatcherNodeWithCleanSignalsWatchers = {
  ...WATCHER_NODE,
  cleanSignalsWatchers: false,
};

export function initWatcherNodeWithCleanSignalsWatchers(
  watcherNode: WatcherNodeWithCleanSignalsWatchers,
  cleanSignalsWatchers: boolean | undefined,
): void {
  initWatcherNode(watcherNode);
  if (cleanSignalsWatchers !== undefined) {
    watcherNode.cleanSignalsWatchers = cleanSignalsWatchers;
  }
}

/* --------------------------------------- COMPUTED NODE --------------------------------------- */

export const enum COMPUTED_STATE {
  UNSET,
  OUTDATED,
  COMPUTING,
  UP_TO_DATE,
}

/* TYPES */

export interface ComputedNode<GValue> extends WatcherNode, SignalNode<GValue> {
  computation: ComputationFunction<GValue>;
  state: COMPUTED_STATE;
}

/* INIT */

export const COMPUTED_NODE: ComputedNode<unknown> = {
  ...WATCHER_NODE,
  ...SIGNAL_NODE,
  computation: undefined as any,
  state: COMPUTED_STATE.UNSET,
  onActivity: onComputedNodeActivity as any,
  update: updateComputedNode as any,
};

export function initComputedNode<GValue>(
  computedNode: ComputedNode<GValue>,
  computation: ComputationFunction<GValue>,
  equal: EqualFunction<GValue> | undefined,
): void {
  initWatcherNode(computedNode);
  initSignalNode<GValue>(computedNode, SignalError.UNSET, equal);
  computedNode.computation = computation;
}

/* FUNCTIONS */

export function onComputedNodeActivity<GValue>(
  computedNode: ComputedNode<any>,
  signalNode: SignalNode<GValue>,
  previousValue: GValue | SignalError,
): void {
  computedNode.state = COMPUTED_STATE.OUTDATED;
  computedNode.signals.push([signalNode, previousValue]);
  notifySignalNodeWatchers<GValue>(computedNode, computedNode.value);
}

export function isComputedNodeOutdated<GValue>(computedNode: ComputedNode<GValue>): boolean {
  return computedNode.state === COMPUTED_STATE.OUTDATED
    ? refreshWatcherNodeContext(computedNode)
    : computedNode.state === COMPUTED_STATE.UNSET;
}

/**
 * Returns `true` if the computation ran.
 */
export function updateComputedNode<GValue>(computedNode: ComputedNode<GValue>): boolean {
  if (computedNode.state === COMPUTED_STATE.COMPUTING) {
    throw new Error('Detected cycle in computations.');
  } else {
    if (isComputedNodeOutdated<GValue>(computedNode)) {
      computedNode.state = COMPUTED_STATE.COMPUTING;

      clearWatcherNode(computedNode);

      let newValue: GValue | SignalError;
      try {
        newValue = runInWatcherContext<GValue>(computedNode, computedNode.computation);
      } catch (error: unknown) {
        newValue = new SignalError(error);
      }

      // @ts-ignore
      // console.assert(computedNode.state !== COMPUTED_STATE.OUTDATED);
      computedNode.state = COMPUTED_STATE.UP_TO_DATE;

      writeAndNotifySignalNode<GValue>(computedNode, newValue);

      return true;
    } else {
      return false;
    }
  }
}

/* METHODS */

export function computedGet<GValue>(computedNode: ComputedNode<GValue>): GValue {
  updateComputedNode<GValue>(computedNode);
  watchSignalNode(computedNode);
  return readSignalNode<GValue>(computedNode);
}

/* --------------------------------------- WATCH NODE --------------------------------------- */

/** EXPERIMENTAL **/

/* TYPES */

export interface WatchNode<GValue> extends WatcherNodeWithCleanSignalsWatchers {
  signalNode: SignalNode<GValue>;
  watchFunction: IWatchFunction<GValue>;
  running: boolean;
  cleanUp: WatchCleanUpFunction | undefined | void;
}

/* INIT */

export const WATCH_NODE: WatchNode<unknown> = {
  ...WATCHER_NODE_WITH_CLEAN_SIGNALS_WATCHERS,
  signalNode: undefined as any,
  watchFunction: undefined as any,
  running: true,
  cleanUp: undefined,
  onActivity: onWatchNodeActivity as any,
};

export function initWatchNode<GValue>(
  watchNode: WatchNode<GValue>,
  signalNode: SignalNode<GValue>,
  watchFunction: IWatchFunction<GValue>,
  cleanSignalsWatchers: boolean | undefined,
): void {
  initWatcherNodeWithCleanSignalsWatchers(watchNode, cleanSignalsWatchers);
  watchNode.signalNode = signalNode;
  watchNode.watchFunction = watchFunction;
}

/* FUNCTIONS */

export function onWatchNodeActivity<GValue>(
  watchNode: WatchNode<GValue>,
  signalNode: SignalNode<GValue>,
  previousValue: GValue | SignalError,
): void {
  if (watchNode.running) {
    // console.assert(signalNode === watchNode.signalNode);

    queueMicrotask((): void => {
      if (watchNode.running) {
        updateSignalNode<GValue>(watchNode.signalNode);

        watchNode.signalNode.watchers.push(watchNode);

        const differ: boolean = isSignalNodeValueDifferentOfValue<GValue>(
          watchNode.signalNode,
          previousValue,
        );

        if (differ) {
          watchNode.cleanUp?.();
          watchNode.cleanUp = watchNode.watchFunction(watchNode.signalNode.value);
        }
      }
    });
  }
}

export function initWatchNodeWatching<GValue>(watchNode: WatchNode<GValue>): void {
  watchNode.signalNode.watchers.push(watchNode);
  updateSignalNode<GValue>(watchNode.signalNode);

  watchNode.cleanUp = runInWatcherContext(undefined, (): WatchCleanUpFunction | void => {
    return watchNode.watchFunction(watchNode.signalNode.value);
  });
}

export function stopWatchNode<GValue>(watchNode: WatchNode<GValue>): void {
  if (watchNode.running) {
    watchNode.running = false;
    if (watchNode.cleanSignalsWatchers) {
      removeSignalNodeWatcher(watchNode.signalNode, watchNode);
    }
    watchNode.cleanUp?.();
  }
}

export function preventWatchCreationInWatcherContext(): void {
  if (currentWatcher !== undefined) {
    throw new Error('Cannot create a watcher in this context.');
  }
}
/* --------------------------------------- EFFECT NODE --------------------------------------- */

/* CONSTANTS */

export const enum EFFECT_STATE {
  IDLE,
  UPDATING,
  STOPPED,
}

/* TYPES */

export interface EffectNode extends WatcherNodeWithCleanSignalsWatchers {
  effectFunction: EffetFunction;
  state: EFFECT_STATE;
  cleanUp: EffectCleanUpFunction | undefined | void;
}

/* INIT */

export const EFFECT_NODE: EffectNode = {
  ...WATCHER_NODE_WITH_CLEAN_SIGNALS_WATCHERS,
  effectFunction: undefined as any,
  state: EFFECT_STATE.IDLE,
  cleanUp: undefined as any,
  onActivity: onEffectNodeActivity as any,
};

export function initEffectNode(
  effectNode: EffectNode,
  effectFunction: EffetFunction,
  cleanSignalsWatchers: boolean | undefined,
): void {
  initWatcherNodeWithCleanSignalsWatchers(effectNode, cleanSignalsWatchers);
  effectNode.effectFunction = effectFunction;
}

/* FUNCTIONS */

export function onEffectNodeActivity<GValue>(
  effectNode: EffectNode,
  signalNode: SignalNode<GValue>,
  previousValue: GValue | SignalError,
): void {
  if (effectNode.state === EFFECT_STATE.IDLE) {
    effectNode.state = EFFECT_STATE.UPDATING;
    effectNode.signals.push([signalNode, previousValue]);
    queueMicrotask((): void => {
      if (effectNode.state !== EFFECT_STATE.STOPPED) {
        if (isEffectNodeOutdated(effectNode)) {
          effectNode.cleanUp?.();
          clearWatcherNode(effectNode);
          runEffectNode(effectNode);
        }
        effectNode.state = EFFECT_STATE.IDLE;
      }
    });
  }
}

export function isEffectNodeOutdated(effectNode: EffectNode): boolean {
  return refreshWatcherNodeContext(effectNode);
}

export function runEffectNode(effectNode: EffectNode): void {
  effectNode.cleanUp = runInWatcherContext(
    effectNode,
    (): EffectCleanUpFunction | undefined | void => {
      return effectNode.effectFunction();
    },
  );
}

export function stopEffectNode(effectNode: EffectNode): void {
  if (effectNode.state !== EFFECT_STATE.STOPPED) {
    effectNode.state = EFFECT_STATE.STOPPED;
    if (effectNode.cleanSignalsWatchers) {
      effectNode.signals.forEach(([signalNode]: SignalNodeWithValue<any>) => {
        removeSignalNodeWatcher(signalNode, effectNode);
      });
    }
    effectNode.cleanUp?.();
  }
}

export function preventEffectCreationInWatcherContext(): void {
  if (currentWatcher !== undefined) {
    throw new Error('Cannot create an effect in this context.');
  }
}
