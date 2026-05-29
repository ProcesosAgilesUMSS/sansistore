import { Users } from './users.mjs';

export const Locations = {
  LOC_ANA_AULA: {
    id: 'loc-ana-aula',
    user: Users.ANA,
    label: 'Aula 692A - Edificio Académico 2 FCyT',
    type: 'aula',
    lat: -17.394824565374297,
    lng: -66.14470174420256,
    isDefault: true,
  },
  LOC_ANA_LAB: {
    id: 'loc-ana-lab',
    user: Users.ANA,
    label: 'Laboratorio de Computación 4 - Piso 2',
    type: 'laboratorio',
    lat: -17.393237522145427,
    lng: -66.14701631489766,
    isDefault: false,
  },
  LOC_CARLOS: {
    id: 'loc-carlos',
    user: Users.CARLOS,
    label: 'Edificio sala de Docentes',
    type: 'oficina',
    lat: -17.392910007330638,
    lng: -66.14509428164476,
    isDefault: true,
  },
  LOC_MARIA: {
    id: 'loc-maria',
    user: Users.MARIA,
    label: 'Biblioteca Central UMSS',
    type: 'oficina',
    lat: -17.393988,
    lng: -66.146612,
    isDefault: true,
  },
  LOC_JUAN: {
    id: 'loc-juan',
    user: Users.JUAN,
    label: 'Cancha principal FCyT',
    type: 'punto_referencia',
    lat: -17.395102,
    lng: -66.145782,
    isDefault: true,
  },
};

export const locationList = Object.values(Locations);
