export interface IPollingSignalWriteFunction<GValue> {
  (value: GValue): boolean | void;
}
