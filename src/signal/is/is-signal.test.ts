import { describe, expect, it } from '@jest/globals';
import { signal } from '../signal.js';
import { isSignal } from './is-signal.js';

describe('is-signal', () => {
  it('is a signal', () => {
    const a = signal(1);
    expect(isSignal(a)).toBe(true);
  });

  it('is not a signal', () => {
    expect(isSignal(1)).toBe(false);
    expect(isSignal({})).toBe(false);
  });
});
