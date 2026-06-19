import { expect, test, describe } from 'vitest';
import { formatBolivianos, roundMoney } from '@features/mensajero/utils/money';

describe('messenger money formatting', () => {
  test('rounds floating point precision noise before rendering bolivianos', () => {
    const floatingPointTotal = 302.59999999999997;

    expect(roundMoney(floatingPointTotal)).toBe(302.6);
    expect(formatBolivianos(floatingPointTotal)).toBe('Bs 302.6');
  });

  test('keeps useful cents without adding trailing zeroes', () => {
    expect(formatBolivianos(73.4)).toBe('Bs 73.4');
    expect(formatBolivianos(73.456)).toBe('Bs 73.46');
    expect(formatBolivianos(73)).toBe('Bs 73');
  });
});
