import RouteGuard from '../../../components/RouteGuard';
import AdminLayout from './AdminLayout';

export default function AdminProtectedLayout() {
  return (
    <RouteGuard allowedRoles={['admin']} roleName="Administrador">
      <AdminLayout />
    </RouteGuard>
  );
}
