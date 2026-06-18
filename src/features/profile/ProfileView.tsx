import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getDeliveryStatsByCourier, getDeliveryStatsWithUserInfo } from './courierServices.ts';

interface ProfileData {
    displayName: string;
    email: string;
    phone: string;
    secondaryMail: string;
    photoURL: string;
    roles: string[];
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
    const [profile, setProfile] = useState<ProfileData>({
        displayName: '',
        email: '',
        phone: 'No registrado',
        secondaryMail: 'No registrado',
        photoURL: '',
        roles: [],
    });
    const [deliveryStats, setDeliveryStats] = useState<DeliveryStatsData>({
        totalDelivered: 0,
        totalNotDelivered: 0,
        total: 0,
        deliveryRate: 0,
        isLoading: true,
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
                let roles: string[] = [];

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    phone = data.phone || 'No registrado';
                    secondaryMail = data.secondaryMail || 'No registrado';
                    roles = data.roles || [];
                }

                setProfile({
                    displayName: user.displayName || 'Sin nombre',
                    email: user.email || 'No disponible',
                    phone,
                    secondaryMail,
                    photoURL: user.photoURL || '',
                    roles,
                });

                setAuthenticated(true);

                // Verificar si es delivery y obtener estadísticas
                const isDelivery = roles.some(role =>
                    role === 'repartidor' ||
                    role === 'courier' ||
                    role === 'delivery'
                );

                if (isDelivery && user.uid) {
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
                        setDeliveryStats(prev => ({ ...prev, isLoading: false }));
                    }
                } else {
                    setDeliveryStats(prev => ({ ...prev, isLoading: false }));
                }

            } catch (error) {
                console.error('Error cargando perfil:', error);
                setDeliveryStats(prev => ({ ...prev, isLoading: false }));
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    // Verificar si el usuario es delivery
    const isDelivery = profile.roles.some(role =>
        role === 'mensajero'
    );

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

                    {/* ESTADÍSTICAS DE DELIVERY - Solo visible para deliveries */}
                    {isDelivery && (
                        <>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-text-light/50 mb-1">
                                Estadísticas de Delivery
                            </dt>
                            <dd className="pb-4 mb-4 border-b border-dotted border-border-light">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                    {deliveryStats.isLoading ? (
                                        <div className="col-span-4 text-center text-text-light/60 text-sm py-2">
                                            Cargando estadísticas...
                                        </div>
                                    ) : (
                                        <>
                                            {/* Total Entregas */}
                                            <div className="bg-white/50 rounded-xl p-3 text-center border border-border-light/50">
                                                <p className="text-xs text-text-light/60 font-medium uppercase tracking-wider">
                                                    Total
                                                </p>
                                                <p className="text-xl font-bold text-text-light mt-1">
                                                    {deliveryStats.total}
                                                </p>
                                            </div>

                                            {/* Entregados */}
                                            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200/50">
                                                <p className="text-xs text-green-700/60 font-medium uppercase tracking-wider">
                                                    Entregados
                                                </p>
                                                <p className="text-xl font-bold text-green-700 mt-1">
                                                    {deliveryStats.totalDelivered}
                                                </p>
                                            </div>

                                            {/* No Entregados */}
                                            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200/50">
                                                <p className="text-xs text-red-700/60 font-medium uppercase tracking-wider">
                                                    No Entregados
                                                </p>
                                                <p className="text-xl font-bold text-red-700 mt-1">
                                                    {deliveryStats.totalNotDelivered}
                                                </p>
                                            </div>

                                            {/* Tasa de Éxito */}
                                            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200/50">
                                                <p className="text-xs text-blue-700/60 font-medium uppercase tracking-wider">
                                                    Tasa de éxito
                                                </p>
                                                <p className="text-xl font-bold text-blue-700 mt-1">
                                                    {deliveryStats.deliveryRate}%
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </dd>
                        </>
                    )}

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
