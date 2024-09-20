import { describe, expect, it } from '@jest/globals';
import { testTools } from '../../../fabrique/test/tools.js';
import { watchValue } from '../../watch/watch-value/watch-value.js';
import { lockedSignal } from './locked-signal';

describe('polling-signal', () => {
  testTools.polyfillRequestIdleCallback();

  describe('base', () => {
    it('should return correct updated value', () => {
      return new Promise<void>(
        (resolve: (value: void) => void, reject: (reason?: any) => void): void => {
          let _a: number = 0;
          let readCount: number = 0;
          const a = lockedSignal<number>({
            read: () => {
              readCount++;
              return _a;
            },
            write: (a: number) => {
              _a = a;
            },
          });

          expect(readCount).toBe(1);
          expect(a()).toBe(0);
          expect(readCount).toBe(2);
          a.set(1);
          expect(_a).toBe(1);
          expect(a()).toBe(1);
          expect(readCount).toBe(4);
          _a = 2;
          expect(a()).toBe(2);
          expect(readCount).toBe(5);

          let count: number = -1;
          const stopWatch = watchValue(a, (a: number) => {
            count++;

            if (count === 0) {
              expect(a).toBe(2);
              expect(readCount).toBe(6);
              _a = 3;
            } else if (count === 1) {
              expect(a).toBe(3);
              expect(readCount).toBe(8);
              _a = 4;
            } else if (count === 2) {
              expect(a).toBe(4);
              expect(readCount).toBe(10);
              _a = 5;
              stopWatch();
              setTimeout(() => {
                expect(readCount).toBe(11);
                resolve();
              }, 20);
            } else {
              reject();
            }
          });
        },
      );
    });
  });
});
