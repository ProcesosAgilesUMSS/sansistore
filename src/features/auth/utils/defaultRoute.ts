const SINGLE_ROLE_DEFAULT_ROUTES: Record<string, string> = {
  admin: '/admin',
  vendedor: '/seller/created-orders',
  mensajero: '/courier',
  operador_inv: '/inventory',
};

export function getDefaultRouteForRoles(roles: unknown) {
  if (!Array.isArray(roles) || roles.length !== 1) return '/';

  return SINGLE_ROLE_DEFAULT_ROUTES[roles[0]] ?? '/';
}
