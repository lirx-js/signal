import { CreateSignalOptions } from '../../../signal/types/create-signal-options.js';
import { PollingSignalReadFunction } from './polling-signal-read-function.js';
import { PollingSignalScheduleFunction } from './polling-signal-schedule-function.js';
import { PollingSignalWriteFunction } from './polling-signal-write-function.js';

export interface CreatePoolingSignalOptions<GValue> extends CreateSignalOptions<GValue> {
  readonly read: PollingSignalReadFunction<GValue>;
  readonly write: PollingSignalWriteFunction<GValue>;
  readonly schedule?: PollingSignalScheduleFunction;
}
