import { UndoFunction } from '@lirx/utils';

export interface PollingSignalScheduleFunction {
  (trigger: () => void): UndoFunction;
}
