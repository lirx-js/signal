import { describe, expect, it } from '@jest/globals';
import { signal } from '../signal.js';
import { isReadonlySignal } from './is-readonly-signal.js';

describe('is-readonly-signal', () => {
  it('is a readonly signal', () => {
    const a = signal(1);
    expect(isReadonlySignal(a)).toBe(true);
  });

  it('is not a readonly signal', () => {
    expect(isReadonlySignal(1)).toBe(false);
    expect(isReadonlySignal({})).toBe(false);
  });
});
