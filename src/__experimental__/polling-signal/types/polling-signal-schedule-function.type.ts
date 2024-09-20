import { UndoFunction } from '@lirx/utils';

export interface IPollingSignalScheduleFunction {
  (trigger: () => void): UndoFunction;
}
