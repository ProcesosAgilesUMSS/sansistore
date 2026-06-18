import RouteGuard from '../../../components/RouteGuard';
import AdminLayout from './AdminLayout';

export default function AdminProtectedLayout() {
  return (
    <RouteGuard allowedRoles={['admin']} roleName="Administrador">
      <AdminLayout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '300px',
          color: '#88b04b',
          fontSize: '14px',
        }}>
          Panel Dashboard
        </div>
      </AdminLayout>
    </RouteGuard>
  );
}
