import type { Order } from "./types";

export const PLACEHOLDER_ORDERS: Order[] = [
  {
    id: "ORD-001",
    status: "in_transit",
    delivery: { destination: "Facultad de Ciencias y Tecnología - Edificio Nuevo" },
  },
  {
    id: "ORD-002",
    status: "delivered",
    delivery: { destination: "Biblioteca Central UMSS - Planta Baja" },
  },
  {
    id: "ORD-003",
    status: "in_transit",
    delivery: { destination: "Facultad de Ciencias Económicas - Auditorio" },
  },
  {
    id: "ORD-004",
    status: "delivered",
    delivery: { destination: "Comedor Universitario - Puerta Principal" },
  },
  {
    id: "ORD-005",
    status: "in_transit",
    delivery: { destination: "Facultad de Humanidades - Aula 102" },
  },
  {
    id: "ORD-006",
    status: "delivered",
    delivery: { destination: "Laboratorios de Computación - MEMI" },
  },
  {
    id: "ORD-007",
    status: "in_transit",
    delivery: { destination: "Facultad de Medicina - Entrada Principal" },
  },
  {
    id: "ORD-008",
    status: "in_transit",
    delivery: { destination: "Parqueo de Tecnología - Caseta de Seguridad" },
  },
  {
    id: "ORD-009",
    status: "delivered",
    delivery: { destination: "Facultad de Arquitectura - Talleres" },
  },
  {
    id: "ORD-010",
    status: "in_transit",
    delivery: { destination: "Paseo Autonómico - Kiosko Central" },
  },
  {
    id: "ORD-011",
    status: "delivered",
    delivery: { destination: "Facultad de Ciencias Jurídicas - Decanato" },
  },
  {
    id: "ORD-012",
    status: "in_transit",
    delivery: { destination: "Instituto de Investigaciones Metalúrgicas" },
  },
];
