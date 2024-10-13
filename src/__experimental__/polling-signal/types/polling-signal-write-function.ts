export interface PollingSignalWriteFunction<GValue> {
  (value: GValue): boolean | void;
}
