import { runInWatcherContext } from '../internal/reactive-context.protected.js';

export function untracked<GReturn>(callback: () => GReturn): GReturn {
  return runInWatcherContext<GReturn>(undefined, callback);
}
