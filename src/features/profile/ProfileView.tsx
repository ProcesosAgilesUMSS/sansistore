import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Package } from 'lucide-react';

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  secondaryMail: string;
  photoURL: string;
}

export default function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    email: '',
    phone: 'No registrado',
    secondaryMail: 'No registrado',
    photoURL: '',
  });
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        let phone = 'No registrado';
        let secondaryMail = 'No registrado';

        if (userDoc.exists()) {
          const data = userDoc.data();

          phone = data.phone || 'No registrado';
          secondaryMail = data.secondaryMail || 'No registrado';
          setRoles(data.roles || []);
        }

        setProfile({
          displayName: user.displayName || 'Sin nombre',
          email: user.email || 'No disponible',
          phone,
          secondaryMail,
          photoURL: user.photoURL || '',
        });

        setAuthenticated(true);
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-text-light/60 font-medium">
        Cargando perfil...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="text-center flex flex-col items-center gap-6 py-6">
        <p className="text-error font-semibold">No autenticado</p>

        <a
          href="/login"
          className="rounded-full bg-primary text-white px-6 py-3 text-xs uppercase font-bold tracking-wider hover:opacity-90"
        >
          Iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <>
      {profile.photoURL && (
        <div className="flex justify-center mb-6">
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="size-24 rounded-full object-cover border-4 border-card-bg-light shadow-sm"
          />
        </div>
      )}

      <section className="bg-card-bg-light border border-border-light rounded-[1.25rem] p-6 shadow-sm">
        <dl className="flex flex-col">

          <dt className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1">
            Nombre
          </dt>
          <dd className="text-base font-bold text-text-light pb-4 mb-4 border-b border-dotted border-border-light">
            {profile.displayName}
          </dd>

          <dt className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1">
            Correo institucional
          </dt>
          <dd className="text-base font-bold text-text-light pb-4 mb-4 border-b border-dotted border-border-light">
            {profile.email}
          </dd>

          <dt className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1">
            Teléfono celular
          </dt>
          <dd className="text-base font-bold text-text-light pb-4 mb-4 border-b border-dotted border-border-light">
            {profile.phone}
          </dd>

          <dt className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1">
            Correo de respaldo
          </dt>
          <dd className="text-base font-bold text-text-light pb-6 mb-6 border-b border-dotted border-border-light">
            {profile.secondaryMail}
          </dd>

        </dl>

        {(() => {
          const isComprador = roles.length === 0 || roles.includes('comprador') || roles.includes('admin');
          if (!isComprador) return null;

          return (
            <div className="mb-6 rounded-2xl border border-border-light bg-bg-light p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-text-light opacity-50">
                Gestión de Compras
              </h3>
              <a
                href="/mis-pedidos"
                className="group flex items-center justify-between rounded-xl border border-border-light bg-card-bg-light p-3 transition-all hover:border-primary hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Package size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-light text-sm">Mis pedidos y devoluciones</h4>
                  </div>
                </div>
                <span className="text-primary font-bold opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100 pr-2">
                  →
                </span>
              </a>
            </div>
          );
        })()}

        <div className="flex justify-end mt-4">
          <a
            href="/edit-profile"
            className="inline-flex items-center justify-center rounded-full bg-primary text-white px-6 py-3 text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-all"
          >
            Editar perfil
          </a>
        </div>
      </section>
    </>
  );
}
