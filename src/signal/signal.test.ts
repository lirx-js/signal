import { describe, expect, it } from '@jest/globals';
import { signal } from './signal.js';

describe('signal', () => {
  describe('initial value', () => {
    it('should have correct initial value', () => {
      const a = signal(1);
      expect(a()).toBe(1);
    });

    it('should throw if no initial value', () => {
      const a = signal.unset();
      expect(() => a()).toThrow();
    });

    it('should throw if errored initial value', () => {
      const error = new Error();
      const a = signal.thrown(error);
      expect(() => a()).toThrow(error);
    });
  });

  describe('set', () => {
    it('should "set" properly a new value', () => {
      const a = signal(1);
      expect(a()).toBe(1);

      a.set(2);
      expect(a()).toBe(2);
    });

    it('should "throw" properly an error', () => {
      const a = signal(1);
      expect(a()).toBe(1);

      const error = new Error();
      a.throw(error);
      expect(() => a()).toThrow(error);

      a.set(2);
      expect(a()).toBe(2);
    });
  });

  describe('update', () => {
    it('should "update" properly a new value', () => {
      const a = signal(1);
      expect(a()).toBe(1);

      a.update((a) => a + 1);
      expect(a()).toBe(2);
    });

    it('should throw in a "update" properly', () => {
      const a = signal(1);
      expect(a()).toBe(1);

      const error = new Error();
      a.update(() => {
        throw error;
      });
      expect(() => a()).toThrow(error);
    });
  });
});
