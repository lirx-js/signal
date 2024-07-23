import { describe, expect, it } from '@jest/globals';
import { add } from './add';

describe('add', () => {
  it('should return correct result', () => {
    expect(add(1, 2)).toBe(3);
  });
});
