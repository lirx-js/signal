import { CreateSignalOptions } from '../../../signal/types/create-signal-options.js';
import { IPollingSignalReadFunction } from './polling-signal-read-function.type.js';
import { IPollingSignalScheduleFunction } from './polling-signal-schedule-function.type.js';
import { IPollingSignalWriteFunction } from './polling-signal-write-function.type.js';

export interface CreatePoolingSignalOptions<GValue> extends CreateSignalOptions<GValue> {
  readonly read: IPollingSignalReadFunction<GValue>;
  readonly write: IPollingSignalWriteFunction<GValue>;
  readonly schedule?: IPollingSignalScheduleFunction;
}
