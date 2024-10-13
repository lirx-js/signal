import { describe, expect, it } from '@jest/globals';
import { signal } from '../../../signal/signal.js';
import { lockableSignal } from '../lockable-signal.js';
import { isLockableSignal } from './is-lockable-signal.js';

describe('is-lockable-signal', () => {
  it('is a lockable signal', () => {
    const a = lockableSignal(1);
    expect(isLockableSignal(a)).toBe(true);
  });

  it('is not a lockable signal', () => {
    expect(isLockableSignal(1)).toBe(false);
    expect(isLockableSignal({})).toBe(false);
    expect(isLockableSignal(signal(1))).toBe(false);
  });
});
