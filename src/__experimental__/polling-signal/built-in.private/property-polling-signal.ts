import { pollingSignal } from '../polling-signal.js';
import { CreatePoolingSignalOptions } from '../types/create-pooling-signal-options.type.js';
import { PollingSignal } from '../types/polling-signal.js';

export interface ICreatePropertyPollingSignalOptions<
  GObject extends object,
  GPropertyKey extends PropertyKey,
> extends Omit<
    CreatePoolingSignalOptions<GObject[Extract<GPropertyKey, keyof GObject>]>,
    'read' | 'write'
  > {}

export interface IPropertyPollingSignal<GObject extends object, GPropertyKey extends PropertyKey>
  extends PollingSignal<GObject[Extract<GPropertyKey, keyof GObject>]> {}

export function propertyPollingSignal<GObject extends object, GPropertyKey extends PropertyKey>(
  obj: GObject,
  propertyKey: GPropertyKey,
  options?: ICreatePropertyPollingSignalOptions<GObject, GPropertyKey>,
): IPropertyPollingSignal<GObject, GPropertyKey> {
  type GValue = GObject[Extract<GPropertyKey, keyof GObject>];

  return pollingSignal<GValue>({
    ...options,
    read: (): GValue => Reflect.get(obj, propertyKey) as GValue,
    write: (value: GValue): boolean => {
      if (Reflect.set(obj, propertyKey, value)) {
        return true;
      } else {
        throw new Error(`Failed to set property ${JSON.stringify(propertyKey)}.`);
      }
    },
  });
}
