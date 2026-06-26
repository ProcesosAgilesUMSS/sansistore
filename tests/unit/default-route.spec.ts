import { describe, expect, test } from 'vitest';
import { getDefaultRouteForRoles } from '../../src/features/auth/utils/defaultRoute';

describe('getDefaultRouteForRoles', () => {
  test('keeps anonymous, buyer and multi-role users on home', () => {
    expect(getDefaultRouteForRoles([])).toBe('/');
    expect(getDefaultRouteForRoles(['comprador'])).toBe('/');
    expect(getDefaultRouteForRoles(['admin', 'vendedor'])).toBe('/');
    expect(getDefaultRouteForRoles(['vendedor', 'comprador'])).toBe('/');
  });

  test('routes single backoffice roles to their panels', () => {
    expect(getDefaultRouteForRoles(['admin'])).toBe('/admin');
    expect(getDefaultRouteForRoles(['vendedor'])).toBe('/seller/created-orders');
    expect(getDefaultRouteForRoles(['mensajero'])).toBe('/courier');
    expect(getDefaultRouteForRoles(['operador_inv'])).toBe('/inventory');
  });
});
