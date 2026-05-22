import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // <-- Importamos esto
import { db, auth } from '../../lib/firebase'; // <-- Asegúrate de importar 'auth'
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function PerfilForm() { // <-- Quitamos la interfaz y las props
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
    return <div className="text-center py-20 font-sans text-text-light opacity-60">Cargando datos de contacto...</div>;
  }

  // Si no hay usuario y ya terminó de cargar, mostramos el aviso
  if (!userId && !loading) {
    return (
      <div className="text-center py-20 font-sans text-red-500 font-semibold">
        {error || "Por favor, inicia sesión para acceder a esta sección."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto font-sans mt-20 p-4">
      <div className="rounded-[1.25rem] bg-[#FFFFFF] dark:bg-[#141518] border border-[#88B04B]/15 dark:border-white/10 p-6 shadow-sm">
        
        <h2 className="font-display font-extrabold text-[22px] text-[#1E1E1E] dark:text-[#F5F3EF] mb-1 tracking-tight">
          Datos de Contacto
        </h2>
        <p className="text-[13px] text-[#1E1E1E]/60 dark:text-[#F5F3EF]/60 mb-6">
          Registra tus datos para coordinar las entregas correctamente en el campus.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-[#1E1E1E]/70 dark:text-[#F5F3EF]/70 mb-1.5">
              Teléfono Celular / Móvil *
            </label>
            <input
              type="tel"
              placeholder="Ej: 76543210"
              value={phone}
              onChange={(e) => setphone(e.target.value.replace(/\s/g, ''))}
              className="w-full px-4 py-2.5 rounded-[0.75rem] border border-border-light bg-[#FFFBF4] dark:bg-[#1A1B1E] text-[#1E1E1E] dark:text-[#F5F3EF] text-[14px] focus:outline-none focus:border-[#88B04B] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-[#1E1E1E]/70 dark:text-[#F5F3EF]/70 mb-1.5">
              Correo Electrónico de Respaldo (Opcional)
            </label>
            <input
              type="email"
              placeholder="ejemplo@gmail.com"
              value={secondaryMail}
              onChange={(e) => setsecondaryMail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[0.75rem] border border-border-light bg-[#FFFBF4] dark:bg-[#1A1B1E] text-[#1E1E1E] dark:text-[#F5F3EF] text-[14px] focus:outline-none focus:border-[#88B04B] transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-[0.75rem] bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-[0.75rem] bg-[#88B04B]/10 border border-[#88B04B]/20 text-[#88B04B] text-[13px] font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Datos de contacto actualizados correctamente</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full mt-2 py-3 rounded-full bg-[#1E1E1E] dark:bg-[#F5F3EF] text-[#FFFFFF] dark:text-[#1E1E1E] uppercase font-bold text-[12px] tracking-wider transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}