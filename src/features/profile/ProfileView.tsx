import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Pencil, Check, X, AlertCircle, CheckCircle, MapPin, Package, Star } from 'lucide-react';

interface ProfileData {
  displayName: string;
  email: string;
  phone: string;
  secondaryMail: string;
  photoURL: string;
  roles: string[];
  deliveryRating?: number; // HU #564
}

export default function ProfileView() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    email: '',
    phone: 'No registrado',
    secondaryMail: 'No registrado',
    photoURL: '',
    roles: [],
  });

  // Estado del Toast flotante minimalista estilo Sansistore
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados para el modo edición inline
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingMail, setIsEditingMail] = useState(false);

  // Estados temporales del formulario
  const [tempPhone, setTempPhone] = useState('');
  const [tempMail, setTempMail] = useState('');

  // Errores locales de validación
  const [errors, setErrors] = useState<{ phone?: string; secondaryMail?: string }>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      setUid(user.uid);

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        let phone = 'No registrado';
        let secondaryMail = 'No registrado';
        let userRoles: string[] = [];
        let deliveryRating = undefined;

        if (userDoc.exists()) {
          const data = userDoc.data();
          phone = data.phone || 'No registrado';
          secondaryMail = data.secondaryMail || 'No registrado';
          userRoles = Array.isArray(data.roles) ? data.roles : [];
          deliveryRating = data.deliveryRating ?? undefined;
        }

        setProfile({
          displayName: user.displayName || 'Sin nombre',
          email: user.email || 'No disponible',
          phone,
          secondaryMail,
          photoURL: user.photoURL || '',
          roles: userRoles,
          deliveryRating,
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

  // Lanzador del Toast (Auto-ocultable a los 4 segundos)
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Validaciones locales obligatorias
  const validatePhone = (value: string): boolean => {
    setErrors((prev) => ({ ...prev, phone: undefined }));
    const phoneRegex = /^[67]\d{7}$/;

    if (!value || value.trim() === '' || value === 'No registrado') {
      setErrors((prev) => ({ ...prev, phone: 'El teléfono celular es obligatorio.' }));
      return false;
    }
    if (!phoneRegex.test(value)) {
      setErrors((prev) => ({ ...prev, phone: 'Debe tener 8 dígitos e iniciar con 6 o 7.' }));
      return false;
    }
    return true;
  };

  const validateMail = (value: string): boolean => {
    setErrors((prev) => ({ ...prev, secondaryMail: undefined }));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value || value.trim() === '' || value === 'No registrado') {
      return true;
    }
    if (value.length > 100) {
      setErrors((prev) => ({ ...prev, secondaryMail: 'El correo no puede exceder los 100 caracteres.' }));
      return false;
    }
    if (!emailRegex.test(value)) {
      setErrors((prev) => ({ ...prev, secondaryMail: 'Formato de correo electrónico inválido.' }));
      return false;
    }
    return true;
  };

  const handleStartEditPhone = () => {
    setTempPhone(profile.phone === 'No registrado' ? '' : profile.phone);
    setErrors((prev) => ({ ...prev, phone: undefined }));
    setIsEditingPhone(true);
  };

  const handleStartEditMail = () => {
    setTempMail(profile.secondaryMail === 'No registrado' ? '' : profile.secondaryMail);
    setErrors((prev) => ({ ...prev, secondaryMail: undefined }));
    setIsEditingMail(true);
  };

  const handleSavePhone = async () => {
    if (!validatePhone(tempPhone) || !uid) return;

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { phone: tempPhone }, { merge: true });

      setProfile((prev) => ({ ...prev, phone: tempPhone }));
      setIsEditingPhone(false);
      showToast('success', 'Teléfono celular actualizado correctamente');
    } catch (error) {
      console.error(error);
      showToast('error', 'Ocurrió un error al guardar el teléfono');
    }
  };

  const handleSaveMail = async () => {
    if (!validateMail(tempMail) || !uid) return;

    const finalMail = tempMail.trim() === '' ? 'No registrado' : tempMail;

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { secondaryMail: finalMail }, { merge: true });

      setProfile((prev) => ({ ...prev, secondaryMail: finalMail }));
      setIsEditingMail(false);
      showToast('success', 'Correo de respaldo actualizado correctamente');
    } catch (error) {
      console.error(error);
      showToast('error', 'Ocurrió un error al guardar el correo');
    }
  };

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
          className="rounded-full bg-primary text-white px-6 py-3 text-xs uppercase font-bold tracking-wider hover:opacity-90 transition-all"
        >
          Iniciar sesión
        </a>
      </div>
    );
  }

  // Lógica de condiciones de negocio del Navbar de la plataforma
  const showMisDirecciones = profile.roles.length === 0 || profile.roles.includes('comprador');
  const showMisPedidos = profile.roles.length > 0 && profile.roles.some(r => ['comprador', 'admin'].includes(r));
  const showCalificacionMensajero = profile.roles.length > 0 && profile.roles.some(r => ['mensajero', 'admin'].includes(r));

  return (
    <>
      {/* Toast Flotante Unificado */}
      {toast && (
        <div 
          className={`fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 shadow-lg transition-all animate-fade-in ${
            toast.type === 'success' ? 'bg-[#88B04B]' : 'bg-red-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={15} className="text-white" />
          ) : (
            <AlertCircle size={15} className="text-white" />
          )}
          <span className="font-outfit text-sm font-bold text-white">
            {toast.message}
          </span>
        </div>
      )}

      {/* Contenedor Principal */}
      <section className="bg-card-bg-light border border-border-light rounded-[1.25rem] p-6 shadow-sm max-w-xl mx-auto flex flex-col gap-6">
        
        {/* Cabecera del Perfil */}
        <header className="flex flex-col items-center text-center pb-6 border-b border-border-light pt-4 relative">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="size-24 rounded-full object-cover shadow-sm ring-4 ring-primary/10 border border-border-light mb-4"
            />
          ) : (
            <div className="size-24 rounded-full bg-border-light/40 flex items-center justify-center text-text-light/40 font-bold text-2xl shadow-sm mb-4">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h1 className="text-xl font-black tracking-tight text-text-light mb-1">
            {profile.displayName}
          </h1>
          <p className="text-[13px] font-medium text-text-light opacity-60 mb-2">
            {profile.email}
          </p>

          {/* HU #564: Calificación promedio para el Mensajero */}
          {showCalificacionMensajero && profile.deliveryRating !== undefined && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold mt-1">
              <Star size={13} fill="currentColor" />
              <span>Calificación: {profile.deliveryRating.toFixed(1)} / 5.0</span>
            </div>
          )}
        </header>

        {/* Datos de Contacto Inline */}
        <div className="flex flex-col gap-5 pb-2">
          
          {/* Campo: Teléfono Celular */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1.5">
              Teléfono celular
            </label>
            
            {isEditingPhone ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePhone();
                      if (e.key === 'Escape') setIsEditingPhone(false);
                    }}
                    autoFocus
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md border bg-transparent text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.phone ? 'border-error focus:border-error' : 'border-border-light focus:border-primary'
                    }`}
                    placeholder="Ej. 71234567"
                  />
                  <button
                    type="button"
                    onClick={handleSavePhone}
                    aria-label="Confirmar teléfono"
                    className="p-1.5 rounded-md text-text-light/60 hover:text-primary hover:bg-border-light/40 transition-all"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    aria-label="Cancelar edición de teléfono"
                    className="p-1.5 rounded-md text-text-light/40 hover:text-error hover:bg-border-light/40 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
                {errors.phone && <span className="text-[11px] font-medium text-error mt-0.5">{errors.phone}</span>}
              </div>
            ) : (
              <div className="flex items-center justify-between group pb-3 border-b border-dotted border-border-light">
                <span className="text-sm font-bold text-text-light">{profile.phone}</span>
                <button
                  type="button"
                  onClick={handleStartEditPhone}
                  aria-label="Editar teléfono"
                  className="p-1.5 text-text-light/40 hover:text-primary rounded-md hover:bg-border-light/20 transition-all"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Campo: Correo Electrónico de Respaldo */}
          <div className="flex flex-col">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1.5">
              Correo de respaldo
            </label>
            
            {isEditingMail ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={tempMail}
                    onChange={(e) => setTempMail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveMail();
                      if (e.key === 'Escape') setIsEditingMail(false);
                    }}
                    autoFocus
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md border bg-transparent text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.secondaryMail ? 'border-error focus:border-error' : 'border-border-light focus:border-primary'
                    }`}
                    placeholder="ejemplo@correo.com"
                  />
                  <button
                    type="button"
                    onClick={handleSaveMail}
                    aria-label="Confirmar correo"
                    className="p-1.5 rounded-md text-text-light/60 hover:text-primary hover:bg-border-light/40 transition-all"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingMail(false)}
                    aria-label="Cancelar edición de correo"
                    className="p-1.5 rounded-md text-text-light/40 hover:text-error hover:bg-border-light/40 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
                {errors.secondaryMail && (
                  <span className="text-[11px] font-medium text-error mt-0.5">{errors.secondaryMail}</span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between group pb-3 border-b border-dotted border-border-light">
                <span className="text-sm font-bold text-text-light">{profile.secondaryMail}</span>
                <button
                  type="button"
                  onClick={handleStartEditMail}
                  aria-label="Editar correo de respaldo"
                  className="p-1.5 text-text-light/40 hover:text-primary rounded-md hover:bg-border-light/20 transition-all"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Accesos Directos Unificados (Condicionados por Rol) */}
        <footer className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-light">
          {showMisDirecciones && (
            <a
              href="/location"
              className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-text-light/80 rounded-xl border border-border-light bg-border-light/10 hover:bg-border-light/30 hover:text-primary hover:border-primary/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-bg-light border border-border-light text-text-light/50 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                <MapPin size={16} />
              </div>
              <div className="flex flex-col text-left">
                <span>Mis direcciones</span>
                <span className="text-[11px] font-medium text-text-light/40 group-hover:text-primary/60 transition-colors">Gestionar entrega</span>
              </div>
            </a>
          )}

          {showMisPedidos && (
            <a
              href="/mis-pedidos"
              className="flex items-center gap-3 px-4 py-3 text-[13px] font-bold text-text-light/80 rounded-xl border border-border-light bg-border-light/10 hover:bg-border-light/30 hover:text-primary hover:border-primary/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-bg-light border border-border-light text-text-light/50 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                <Package size={16} />
              </div>
              <div className="flex flex-col text-left">
                <span>Mis pedidos</span>
                <span className="text-[11px] font-medium text-text-light/40 group-hover:text-primary/60 transition-colors">Ver mis compras</span>
              </div>
            </a>
          )}
        </footer>
      </section>
    </>
  );
}