import { pollingSignal } from '../../polling-signal.js';
import { CreatePoolingSignalOptions } from '../../types/create-pooling-signal-options.type.js';
import { PollingSignal } from '../../types/polling-signal.type.js';
import { areCSSStyleDeclarationEntriesEquivalent } from './types/css-style-declaration-entry/are-css-style-declaration-entries-equivalent.js';
import { ICSSStyleDeclarationEntry } from './types/css-style-declaration-entry/css-style-declaration-entry.type.js';
import { ICSSStyleDeclarationPropertyKeys } from './types/css-style-declaration-property-keys.type.js';

export interface ICreateStyleDeclarationPollingSignalOptions
  extends Omit<CreatePoolingSignalOptions<ICSSStyleDeclarationEntry>, 'read' | 'write' | 'equal'> {}

export interface IStyleDeclarationPollingSignal extends PollingSignal<ICSSStyleDeclarationEntry> {}

export function styleDeclarationPollingSignal(
  style: CSSStyleDeclaration,
  propertyKey: ICSSStyleDeclarationPropertyKeys | string,
  options?: ICreateStyleDeclarationPollingSignalOptions,
): IStyleDeclarationPollingSignal {
  type GValue = ICSSStyleDeclarationEntry;

  return pollingSignal<GValue>({
    ...options,
    read: (): GValue => {
      return [style.getPropertyValue(propertyKey), style.getPropertyPriority(propertyKey)];
    },
    write: ([value, priority]: GValue): boolean => {
      style.setProperty(propertyKey, value, priority);
      return true;
    },
    equal: areCSSStyleDeclarationEntriesEquivalent,
  });
}
