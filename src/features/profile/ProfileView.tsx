import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getDeliveryStatsByCourier } from './courierServices.ts';
import { Pencil, Check, X, AlertCircle, CheckCircle, MapPin, Package, Star } from 'lucide-react';

interface ProfileData {
    displayName: string;
    ci: string;
    email: string;
    phone: string;
    secondaryMail: string;
    photoURL: string;
    roles: string[];
    deliveryRating?: number;
}

interface DeliveryStatsData {
    totalDelivered: number;
    totalNotDelivered: number;
    total: number;
    deliveryRate: number;
    isLoading: boolean;
}

export default function ProfileView() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [uid, setUid] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileData>({
        displayName: '',
        ci: 'No registrado',
        email: '',
        phone: 'No registrado',
        secondaryMail: 'No registrado',
        photoURL: '',
        roles: [],
    });
    const [roles, setRoles] = useState<string[]>([]);

    const [deliveryStats, setDeliveryStats] = useState<DeliveryStatsData>({
        totalDelivered: 0,
        totalNotDelivered: 0,
        total: 0,
        deliveryRate: 0,
        isLoading: true,
    });

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingMail, setIsEditingMail] = useState(false);
    const [isEditingCi, setIsEditingCi] = useState(false);

    const [tempPhone, setTempPhone] = useState('');
    const [tempMail, setTempMail] = useState('');
    const [tempCi, setTempCi] = useState('');

    const [errors, setErrors] = useState<{ phone?: string; secondaryMail?: string; ci?: string }>({});

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
                let ci = 'No registrado';
                let userRoles: string[] = [];
                let deliveryRating = undefined;

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    phone = data.phone || 'No registrado';
                    secondaryMail = data.secondaryMail || 'No registrado';
                    ci = data.ci ? String(data.ci) : 'No registrado';
                    setRoles(data.roles || []);
                    userRoles = Array.isArray(data.roles) ? data.roles : [];
                    deliveryRating = data.deliveryRating ?? undefined;
                }

                setProfile({
                    displayName: user.displayName || 'Sin nombre',
                    ci,
                    email: user.email || 'No disponible',
                    phone,
                    secondaryMail,
                    photoURL: user.photoURL || '',
                    roles: userRoles,
                    deliveryRating,
                });

                setAuthenticated(true);

                const isMensajero = userRoles.includes('mensajero') || userRoles.includes('admin');

                if (isMensajero) {
                    try {
                        const stats = await getDeliveryStatsByCourier(user.uid);
                        setDeliveryStats({
                            totalDelivered: stats.totalDelivered,
                            totalNotDelivered: stats.totalNotDelivered,
                            total: stats.total,
                            deliveryRate: stats.deliveryRate,
                            isLoading: false,
                        });
                    } catch (error) {
                        console.error('Error cargando estadísticas de delivery:', error);
                        setDeliveryStats((prev) => ({ ...prev, isLoading: false }));
                    }
                } else {
                    setDeliveryStats((prev) => ({ ...prev, isLoading: false }));
                }

            } catch (error) {
                console.error('Error cargando perfil:', error);
                setDeliveryStats((prev) => ({ ...prev, isLoading: false }));
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

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
        if (!value || value.trim() === '' || value === 'No registrado') return true;
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

    const validateCi = (value: string): boolean => {
        setErrors((prev) => ({ ...prev, ci: undefined }));
        if (!value || value.trim() === '' || value === 'No registrado') {
            setErrors((prev) => ({ ...prev, ci: 'El carnet de identidad es obligatorio.' }));
            return false;
        }
        if (!/^\d+$/.test(value)) {
            setErrors((prev) => ({ ...prev, ci: 'El CI solo debe contener números.' }));
            return false;
        }
        if (value.length < 5 || value.length > 10) {
            setErrors((prev) => ({ ...prev, ci: 'El CI debe tener entre 5 y 10 dígitos.' }));
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

    const handleStartEditCi = () => {
        setTempCi(profile.ci === 'No registrado' ? '' : profile.ci);
        setErrors((prev) => ({ ...prev, ci: undefined }));
        setIsEditingCi(true);
    };

    const handleSavePhone = async () => {
        if (!validatePhone(tempPhone) || !uid) return;
        try {
            await setDoc(doc(db, 'users', uid), { phone: tempPhone }, { merge: true });
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
            await setDoc(doc(db, 'users', uid), { secondaryMail: finalMail }, { merge: true });
            setProfile((prev) => ({ ...prev, secondaryMail: finalMail }));
            setIsEditingMail(false);
            showToast('success', 'Correo de respaldo actualizado correctamente');
        } catch (error) {
            console.error(error);
            showToast('error', 'Ocurrió un error al guardar el correo');
        }
    };

    const handleSaveCi = async () => {
        if (!validateCi(tempCi) || !uid) return;
        try {
            await setDoc(doc(db, 'users', uid), { ci: tempCi }, { merge: true });
            setProfile((prev) => ({ ...prev, ci: tempCi }));
            setIsEditingCi(false);
            showToast('success', 'Carnet de identidad actualizado correctamente');
        } catch (error) {
            console.error(error);
            showToast('error', 'Ocurrió un error al guardar el CI');
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

    // --- LÓGICA CORREGIDA DE ROLES ---
    const showMisDirecciones = true; // Todo usuario autenticado puede tener direcciones
    const showMisPedidos = profile.roles.length === 0 || profile.roles.some(r => ['comprador', 'admin'].includes(r));
    const showCalificacionMensajero = profile.roles.includes('mensajero') || profile.roles.includes('admin');
    const isMensajero = profile.roles.includes('mensajero') || profile.roles.includes('admin');

    return (
        <>
            {toast && (
                <div
                    className={`fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 shadow-lg transition-all animate-fade-in ${toast.type === 'success' ? 'bg-[#88B04B]' : 'bg-red-500'
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

            <section className="bg-card-bg-light border border-border-light rounded-[1.25rem] p-6 shadow-sm max-w-xl mx-auto flex flex-col gap-6">

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

                    <dd className="text-[13px] font-medium text-text-light opacity-60 mb-2">
                        {profile.email}
                    </dd>

                    {showCalificacionMensajero && profile.deliveryRating !== undefined && (
                        <div className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold mt-1">
                            <Star size={13} fill="currentColor" />
                            <span>Calificación: {profile.deliveryRating.toFixed(1)} / 5.0</span>
                        </div>
                    )}
                </header>

                <div className="flex flex-col gap-5 pb-2">
                    {/* Campo: CI */}
                    <div className="flex flex-col">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1.5">
                            Carnet de identidad
                        </label>
                        {isEditingCi ? (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={tempCi}
                                        onChange={(e) => setTempCi(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveCi();
                                            if (e.key === 'Escape') setIsEditingCi(false);
                                        }}
                                        autoFocus
                                        className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md border bg-transparent text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.ci ? 'border-error focus:border-error' : 'border-border-light focus:border-primary'}`}
                                        placeholder="Ej. 12345678"
                                    />
                                    <button type="button" onClick={handleSaveCi} aria-label="Confirmar CI"
                                        className="p-1.5 rounded-md text-text-light/60 hover:text-primary hover:bg-border-light/40 transition-all">
                                        <Check size={16} />
                                    </button>
                                    <button type="button" onClick={() => setIsEditingCi(false)} aria-label="Cancelar edición de CI"
                                        className="p-1.5 rounded-md text-text-light/40 hover:text-error hover:bg-border-light/40 transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                                {errors.ci && <span className="text-[11px] font-medium text-error mt-0.5">{errors.ci}</span>}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between group pb-3 border-b border-dotted border-border-light">
                                <span className="text-sm font-bold text-text-light">{profile.ci}</span>
                                <button type="button" onClick={handleStartEditCi} aria-label="Editar CI"
                                    className="p-1.5 text-text-light/40 hover:text-primary rounded-md hover:bg-border-light/20 transition-all">
                                    <Pencil size={13} />
                                </button>
                            </div>
                        )}
                    </div>

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
                                        className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md border bg-transparent text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.phone ? 'border-error focus:border-error' : 'border-border-light focus:border-primary'}`}
                                        placeholder="Ej. 71234567"
                                    />
                                    <button type="button" onClick={handleSavePhone} aria-label="Confirmar teléfono"
                                        className="p-1.5 rounded-md text-text-light/60 hover:text-primary hover:bg-border-light/40 transition-all">
                                        <Check size={16} />
                                    </button>
                                    <button type="button" onClick={() => setIsEditingPhone(false)} aria-label="Cancelar edición de teléfono"
                                        className="p-1.5 rounded-md text-text-light/40 hover:text-error hover:bg-border-light/40 transition-all">
                                        <X size={16} />
                                    </button>
                                </div>
                                {errors.phone && <span className="text-[11px] font-medium text-error mt-0.5">{errors.phone}</span>}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between group pb-3 border-b border-dotted border-border-light">
                                <span className="text-sm font-bold text-text-light">{profile.phone}</span>
                                <button type="button" onClick={handleStartEditPhone} aria-label="Editar teléfono"
                                    className="p-1.5 text-text-light/40 hover:text-primary rounded-md hover:bg-border-light/20 transition-all">
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
                                        className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md border bg-transparent text-text-light focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.secondaryMail ? 'border-error focus:border-error' : 'border-border-light focus:border-primary'}`}
                                        placeholder="ejemplo@correo.com"
                                    />
                                    <button type="button" onClick={handleSaveMail} aria-label="Confirmar correo"
                                        className="p-1.5 rounded-md text-text-light/60 hover:text-primary hover:bg-border-light/40 transition-all">
                                        <Check size={16} />
                                    </button>
                                    <button type="button" onClick={() => setIsEditingMail(false)} aria-label="Cancelar edición de correo"
                                        className="p-1.5 rounded-md text-text-light/40 hover:text-error hover:bg-border-light/40 transition-all">
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
                                <button type="button" onClick={handleStartEditMail} aria-label="Editar correo de respaldo"
                                    className="p-1.5 text-text-light/40 hover:text-primary rounded-md hover:bg-border-light/20 transition-all">
                                    <Pencil size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estadísticas de Delivery */}
                {isMensajero && (
                    <div className="rounded-2xl border border-border-light bg-bg-light p-4">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-light opacity-50">
                            Estadísticas de delivery
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {deliveryStats.isLoading ? (
                                <div className="col-span-4 text-center text-text-light/60 text-sm py-2">
                                    Cargando estadísticas...
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white/50 rounded-xl p-3 text-center border border-border-light/50">
                                        <p className="text-xs text-text-light/60 font-medium uppercase tracking-wider">Total</p>
                                        <p className="text-xl font-bold text-text-light mt-1">{deliveryStats.total}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200/50">
                                        <p className="text-xs text-green-700/60 font-medium uppercase tracking-wider">Entregados</p>
                                        <p className="text-xl font-bold text-green-700 mt-1">{deliveryStats.totalDelivered}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200/50">
                                        <p className="text-xs text-red-700/60 font-medium uppercase tracking-wider">No entregados</p>
                                        <p className="text-xl font-bold text-red-700 mt-1">{deliveryStats.totalNotDelivered}</p>
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200/50">
                                        <p className="text-xs text-blue-700/60 font-medium uppercase tracking-wider">Tasa de éxito</p>
                                        <p className="text-xl font-bold text-blue-700 mt-1">{deliveryStats.deliveryRate}%</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* CONSOLIDADO: Gestión de Cuenta */}
                {(showMisPedidos || showMisDirecciones) && (
                    <div className="mb-2 rounded-2xl border border-border-light bg-bg-light p-4 flex flex-col gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-light opacity-50 mb-1">
                            Gestión de Cuenta
                        </h3>
                        
                        {showMisDirecciones && (
                            <a
                                href="/location"
                                className="group flex items-center justify-between rounded-xl border border-border-light bg-card-bg-light p-3 transition-all hover:border-primary hover:shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-text-light text-sm">Mis direcciones</h4>
                                        <span className="text-[11px] text-text-light/50 font-medium">Gestionar mis lugares de entrega</span>
                                    </div>
                                </div>
                                <span className="text-primary font-bold opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100 pr-2">
                                    →
                                </span>
                            </a>
                        )}

                        {showMisPedidos && (
                            <a
                                href="/mis-pedidos"
                                className="group flex items-center justify-between rounded-xl border border-border-light bg-card-bg-light p-3 transition-all hover:border-primary hover:shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                        <Package size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-text-light text-sm">Mis pedidos y devoluciones</h4>
                                        <span className="text-[11px] text-text-light/50 font-medium">Ver el historial de mis compras</span>
                                    </div>
                                </div>
                                <span className="text-primary font-bold opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100 pr-2">
                                    →
                                </span>
                            </a>
                        )}
                    </div>
                )}
            </section>
        </>
    );
}