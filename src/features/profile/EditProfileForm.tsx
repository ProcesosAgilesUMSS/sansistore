import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { db, auth } from '../../lib/firebase'; 
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PerfilForm() { 
  const [userId, setUserId] = useState<string | null>(null); // <-- Estado para el ID del usuario
  const [phone, setphone] = useState('');
  const [secondaryMail, setsecondaryMail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 1. Escuchar la sesión de Firebase para obtener el userId
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setLoading(false);
        setError("Debes iniciar sesión para editar tus datos.");
      }
    });
    return unsub;
  }, []);

  // 2. Cargar datos existentes cuando ya tengamos el userId confirmado
  useEffect(() => {
    if (!userId) return;

    async function loadUserData() {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId!));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setphone(data.phone || '');
          setsecondaryMail(data.secondaryMail || '');
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError("No se pudieron cargar los datos actuales.");
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return; // Protección extra
    
    setError(null);
    setSuccess(false);

    if (!phone.trim()) {
      setError('El teléfono celular es obligatorio.');
      return;
    }

    const phoneRegex = /^[67]\d{7}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError('El número de celular no es válido. Debe tener 8 dígitos y empezar con 6 o 7.');
      return;
    }

    setSaving(true);

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        phone: phone.trim(),
        secondaryMail: secondaryMail.trim(),
        updatedAt: new Date()
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error al guardar:", err);
      setError('Hubo un error al guardar los cambios en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 font-sans text-text-light/60 font-medium">Cargando datos de contacto...</div>;
  }

  // Si no hay usuario y ya terminó de cargar, mostramos el aviso
  if (!userId && !loading) {
    return (
      <div className="text-center py-20 font-sans text-error font-semibold">
        {error || "Por favor, inicia sesión para acceder a esta sección."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-4">
      <div className="rounded-[1.25rem] bg-card-bg-light border border-border-light p-6 shadow-sm">
        
        <h2 className="font-black text-[clamp(1.25rem,3vw,1.75rem)] text-text-light tracking-[-0.04em] leading-none mb-2">
          Datos de Contacto
        </h2>
        <p className="text-sm text-text-light/60 mb-6">
          Registra tus datos para coordinar las entregas correctamente en el campus.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-light/50 mb-1.5">
              Teléfono Celular / Móvil *
            </label>
            <input
              type="tel"
              placeholder="Ej: 76543210"
              value={phone}
              onChange={(e) => setphone(e.target.value.replace(/\s/g, ''))}
              className="w-full px-4 py-2.5 rounded-[0.75rem] border border-border-light bg-bg-light text-text-light text-sm focus:outline-none focus:border-primary transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-light/50 mb-1.5">
              Correo Electrónico de Respaldo (Opcional)
            </label>
            <input
              type="email"
              placeholder="ejemplo@gmail.com"
              value={secondaryMail}
              onChange={(e) => setsecondaryMail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[0.75rem] border border-border-light bg-bg-light text-text-light text-sm focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-[0.75rem] bg-error-bg border border-error-border text-error text-[13px] font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-[0.75rem] bg-success-bg border border-success-border text-success text-[13px] font-medium">
              <CheckCircle size={16} className="shrink-0" />
              <span>Datos actualizados correctamente</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-2 py-3 rounded-full bg-primary text-white uppercase font-bold text-[12px] tracking-wider transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}