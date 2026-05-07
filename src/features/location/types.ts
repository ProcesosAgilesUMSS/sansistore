export type LocationType =
  | "AULA"
  | "OFICINA"
  | "LABORATORIO"
  | "AUDITORIO"
  | "BIBLIOTECA"
  | "CENTRO_ESTUDIANTES"
  | "CAFETERIA"
  | "OTRO";

export type Location = {
  id?: string;        //se autogenera en firebase
  userId: string;
  lat: number;
  lng: number;
  label: string;      //especificacion del usuario ej: Aula 692A
  type: LocationType;
  isDefault: boolean;
};