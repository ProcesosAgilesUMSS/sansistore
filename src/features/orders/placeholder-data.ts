/*
import type { Order } from "./types";

export const PLACEHOLDER_ORDERS: Order[] = [
  {
    id: "ORD-001",
    status: "en camino",
    delivery: { destination: "Facultad de Ciencias y Tecnología - Edificio Nuevo" },
  },
  {
    id: "ORD-002",
    status: "entregado",
    delivery: { destination: "Biblioteca Central UMSS - Planta Baja" },
  },
  {
    id: "ORD-003",
    status: "en camino",
    delivery: { destination: "Facultad de Ciencias Económicas - Auditorio" },
  },
  {
    id: "ORD-004",
    status: "entregado",
    delivery: { destination: "Comedor Universitario - Puerta Principal" },
  },
  {
    id: "ORD-005",
    status: "en camino",
    delivery: { destination: "Facultad de Humanidades - Aula 102" },
  },
  {
    id: "ORD-006",
    status: "entregado",
    delivery: { destination: "Laboratorios de Computación - MEMI" },
  },
  {
    id: "ORD-007",
    status: "en camino",
    delivery: { destination: "Facultad de Medicina - Entrada Principal" },
  },
  {
    id: "ORD-008",
    status: "en camino",
    delivery: { destination: "Parqueo de Tecnología - Caseta de Seguridad" },
  },
  {
    id: "ORD-009",
    status: "entregado",
    delivery: { destination: "Facultad de Arquitectura - Talleres" },
  },
  {
    id: "ORD-010",
    status: "en camino",
    delivery: { destination: "Paseo Autonómico - Kiosko Central" },
  },
  {
    id: "ORD-011",
    status: "entregado",
    delivery: { destination: "Facultad de Ciencias Jurídicas - Decanato" },
  },
  {
    id: "ORD-012",
    status: "en camino",
    delivery: { destination: "Instituto de Investigaciones Metalúrgicas" },
  },
];
*/

import type { Order } from "./types";

export const PLACEHOLDER_ORDERS: Order[] = [
  {
    id: "ORD-001",
    status: "en camino",
    delivery: { destination: "Facultad de Ciencias y Tecnología - Edificio Nuevo" },
    total: 45,
    items: [
      {
        itemId: "ITEM-001",
        productId: "PROD-001",
        productName: "Cuaderno universitario",
        unitPrice: 15,
        quantity: 2,
        subtotal: 30,
        description: "Cuaderno de 100 hojas, tamaño carta",
      },
      {
        itemId: "ITEM-002",
        productId: "PROD-002",
        productName: "Bolígrafo azul",
        unitPrice: 5,
        quantity: 3,
        subtotal: 15,
        description: "Bolígrafo punta fina color azul",
      },
    ],
  },
  {
    id: "ORD-002",
    status: "entregado",
    delivery: { destination: "Biblioteca Central UMSS - Planta Baja" },
    total: 80,
    items: [
      {
        itemId: "ITEM-003",
        productId: "PROD-003",
        productName: "Audífonos",
        unitPrice: 40,
        quantity: 2,
        subtotal: 80,
        description: "Audífonos con cable, entrada 3.5 mm",
      },
    ],
  },
  {
    id: "ORD-003",
    status: "en camino",
    delivery: { destination: "Facultad de Ciencias Económicas - Auditorio" },
    total: 35,
    items: [
      {
        itemId: "ITEM-004",
        productId: "PROD-004",
        productName: "Resaltador amarillo",
        unitPrice: 7,
        quantity: 5,
        subtotal: 35,
        description: "Resaltador fluorescente para apuntes",
      },
    ],
  },
  {
    id: "ORD-004",
    status: "entregado",
    delivery: { destination: "Comedor Universitario - Puerta Principal" },
    total: 60,
    items: [
      {
        itemId: "ITEM-005",
        productId: "PROD-005",
        productName: "Botella de agua",
        unitPrice: 10,
        quantity: 6,
        subtotal: 60,
        description: "Botella personal de 600 ml",
      },
    ],
  },
  {
    id: "ORD-005",
    status: "en camino",
    delivery: { destination: "Facultad de Humanidades - Aula 102" },
    total: 0,
    items: [],
  },
  {
    id: "ORD-006",
    status: "entregado",
    delivery: { destination: "Laboratorios de Computación - MEMI" },
    total: 120,
    items: [
      {
        itemId: "ITEM-006",
        productId: "PROD-006",
        productName: "Mouse inalámbrico",
        unitPrice: 60,
        quantity: 2,
        subtotal: 120,
        description: "Mouse inalámbrico color negro",
      },
    ],
  },
  {
    id: "ORD-007",
    status: "en camino",
    delivery: { destination: "Facultad de Medicina - Entrada Principal" },
    total: 25,
    items: [
      {
        itemId: "ITEM-007",
        productId: "PROD-007",
        productName: "Barbijo quirúrgico",
        unitPrice: 5,
        quantity: 5,
        subtotal: 25,
        description: "Barbijo descartable de tres capas",
      },
    ],
  },
  {
    id: "ORD-008",
    status: "en camino",
    delivery: { destination: "Parqueo de Tecnología - Caseta de Seguridad" },
    total: 90,
    items: [
      {
        itemId: "ITEM-008",
        productId: "PROD-008",
        productName: "Cargador USB-C",
        unitPrice: 90,
        quantity: 1,
        subtotal: 90,
        description: "Cargador rápido para celular",
      },
    ],
  },
  {
    id: "ORD-009",
    status: "entregado",
    delivery: { destination: "Facultad de Arquitectura - Talleres" },
    total: 50,
    items: [
      {
        itemId: "ITEM-009",
        productId: "PROD-009",
        productName: "Regla metálica",
        unitPrice: 25,
        quantity: 2,
        subtotal: 50,
        description: "Regla metálica de 30 cm",
      },
    ],
  },
  {
    id: "ORD-010",
    status: "en camino",
    delivery: { destination: "Paseo Autonómico - Kiosko Central" },
    total: 18,
    items: [
      {
        itemId: "ITEM-010",
        productId: "PROD-010",
        productName: "Galletas integrales",
        unitPrice: 9,
        quantity: 2,
        subtotal: 18,
        description: "Paquete individual de galletas integrales",
      },
    ],
  },
  {
    id: "ORD-011",
    status: "entregado",
    delivery: { destination: "Facultad de Ciencias Jurídicas - Decanato" },
    total: 75,
    items: [
      {
        itemId: "ITEM-011",
        productId: "PROD-011",
        productName: "Agenda académica",
        unitPrice: 75,
        quantity: 1,
        subtotal: 75,
        description: "Agenda universitaria con calendario académico",
      },
    ],
  },
  {
    id: "ORD-012",
    status: "en camino",
    delivery: { destination: "Instituto de Investigaciones Metalúrgicas" },
    total: 100,
    items: [
      {
        itemId: "ITEM-012",
        productId: "PROD-012",
        productName: "Memoria USB",
        unitPrice: 50,
        quantity: 2,
        subtotal: 100,
        description: "Memoria USB de 32 GB",
      },
    ],
  },
];