import { EqualFunction } from '@lirx/utils';

export interface CreateSignalOptions<GValue> {
  readonly equal?: EqualFunction<GValue>;
}
