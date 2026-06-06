import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

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