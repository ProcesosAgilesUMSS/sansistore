import { Home, Briefcase, FlaskConical, Mic2, BookOpen, Users, UtensilsCrossed, MapPin } from 'lucide-react';
import type { LocationType } from '../types';

export const TYPE_ICONS: Record<LocationType, React.ReactNode> = {
    AULA: <Home size={16} />,
    OFICINA: <Briefcase size={16} />,
    LABORATORIO: <FlaskConical size={16} />,
    AUDITORIO: <Mic2 size={16} />,
    BIBLIOTECA: <BookOpen size={16} />,
    CENTRO_ESTUDIANTES: <Users size={16} />,
    CAFETERIA: <UtensilsCrossed size={16} />,
    OTRO: <MapPin size={16} />,
};
