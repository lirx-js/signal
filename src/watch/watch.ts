import {
  initWatchNode,
  initWatchNodeWatching,
  preventWatchCreationInWatcherContext,
  SignalNode,
  stopWatchNode,
  WATCH_NODE,
  WatchNode,
} from '../internal/reactive-context.protected.js';
import { SIGNAL } from '../signal/signal.symbol.js';
import { ReadonlySignal } from '../signal/types/readonly-signal.js';
import { CreateWatcherOptions } from './types/create-watcher-options.js';

import { UnsubscribeOfWatch } from './types/unsubscribe-of-watch.js';
import { IWatchFunction } from './types/watch-function.js';

export function watch<GValue>(
  signal: ReadonlySignal<GValue>,
  watchFunction: IWatchFunction<GValue>,
  options?: CreateWatcherOptions,
): UnsubscribeOfWatch {
  preventWatchCreationInWatcherContext();

  const node: WatchNode<GValue> = Object.create(WATCH_NODE);
  initWatchNode<GValue>(
    node,
    signal[SIGNAL] as SignalNode<GValue>,
    watchFunction,
    options?.cleanSignalsWatchers,
  );
  initWatchNodeWatching<GValue>(node);

  return (): void => {
    stopWatchNode<GValue>(node);
  };
}
