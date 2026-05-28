import { doc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { v7 as uuidv7 } from 'uuid';
import { db } from '../../../lib/firebase';
import type { Location } from '../../location/types';
import type { CartItemWithProduct } from '../types';
import type { User } from 'firebase/auth';

const nouns: string[] = [
  'perro', 'gato', 'leon', 'tigre', 'elefante', 'raton', 'oso', 'lobo', 'zorro', 'ciervo',
  'ballena', 'delfin', 'aguila', 'halcon', 'serpiente', 'rana', 'pez', 'hormiga', 'abeja', 'mariposa',
  'arbol', 'flor', 'rio', 'montana', 'cielo', 'sol', 'luna', 'estrella', 'nube', 'viento',
  'fuego', 'agua', 'tierra', 'roca', 'arena', 'casa', 'coche', 'barco', 'avion', 'tren',
  'libro', 'mesa', 'silla', 'puerta', 'ventana', 'reloj', 'telefono', 'ordenador', 'ninio', 'hombre',
  'mujer', 'amigo', 'enemigo', 'rey', 'reina', 'principe', 'princesa', 'dragon', 'fantasma', 'robot',
  'monstruo', 'heroe', 'villano', 'ciudad', 'pueblo', 'calle', 'parque', 'jardin', 'bosque', 'desierto',
  'isla', 'playa', 'oceano', 'lago', 'cascada', 'cueva', 'castillo', 'puente', 'torre', 'faro',
  'estadio', 'museo', 'escuela', 'hospital', 'tienda', 'restaurante', 'cocina', 'bano', 'dormitorio', 'salon',
  'balcon', 'tejado', 'chimenea', 'campana', 'guitarra', 'piano', 'tambor', 'violin', 'flauta', 'trompeta',
  'cuadro', 'foto', 'espejo', 'cuchillo', 'tenedor', 'cuchara', 'plato', 'vaso', 'taza', 'botella',
  'maleta', 'mochila', 'paraguas', 'gafas', 'sombrero', 'chaqueta', 'pantalon', 'camisa', 'zapato', 'calcetin',
  'guante', 'collar', 'anillo', 'pulsera', 'movil', 'tablet', 'televisor', 'radio', 'microondas', 'nevera',
  'lavadora', 'aspiradora', 'escoba', 'cubo', 'plomero', 'carpintero', 'maestro', 'medico', 'enfermero', 'policia',
  'bombero', 'chef', 'piloto', 'astronauta', 'granjero', 'pastor', 'pescador', 'cazador', 'soldado', 'marinero',
  'pirata', 'mago', 'hada', 'duende', 'gigante', 'enano', 'ciclista', 'corredor', 'nadador', 'boxeador',
  'luchador', 'bailarin', 'cantante', 'actor', 'artista', 'angel', 'demonio', 'zombi', 'vampiro',
];

const adjectives: string[] = [
  'feliz', 'triste', 'grande', 'pequeno', 'rapido', 'lento', 'fuerte', 'debil', 'alto', 'bajo',
  'gordo', 'flaco', 'bonito', 'feo', 'limpio', 'sucio', 'nuevo', 'viejo', 'joven', 'anciano',
  'caliente', 'frio', 'dulce', 'salado', 'amargo', 'agrio', 'suave', 'aspero', 'brillante', 'oscuro',
  'claro', 'colorido', 'gris', 'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco', 'morado',
  'rosa', 'marron', 'naranja', 'salvaje', 'domestico', 'manso', 'fiero', 'peligroso', 'seguro', 'amable',
  'cruel', 'inteligente', 'tonto', 'sabio', 'loco', 'cuerdo', 'tranquilo', 'nervioso', 'alegre', 'melancolico',
  'enfadado', 'asustado', 'sorprendido', 'aburrido', 'interesante', 'divertido', 'serio', 'gracioso', 'timido', 'extrovertido',
  'valiente', 'cobarde', 'generoso', 'egoista', 'humilde', 'orgulloso', 'paciente', 'impaciente', 'trabajador', 'vago',
  'ordenado', 'desordenado', 'puntual', 'tardio', 'rico', 'pobre', 'famoso', 'desconocido', 'real', 'falso',
  'magico', 'normal', 'raro', 'comun', 'especial', 'simple', 'complejo', 'duro', 'blando', 'ligero',
  'pesado', 'fragil', 'resistente', 'transparente', 'opaco', 'liquido', 'solido', 'gaseoso', 'vivo', 'muerto',
  'humano', 'animal', 'vegetal', 'mineral', 'natural', 'artificial', 'electrico', 'mecanico', 'digital', 'analogico',
  'moderno', 'antiguo', 'futurista', 'clasico', 'rural', 'urbano', 'marino', 'montanoso', 'llano', 'seco',
  'humedo', 'calido', 'helado', 'tormentoso', 'soleado', 'nublado', 'ventoso', 'lluvioso', 'nevado', 'silencioso',
  'ruidoso', 'tierno', 'violento', 'pacifista', 'noble', 'vil', 'sabio', 'necio', 'honesto', 'mentiroso',
];

const verbs: string[] = [
  'corriendo', 'saltando', 'nadando', 'volando', 'caminando', 'trotando', 'escalando', 'gateando', 'rodando', 'girando',
  'flotando', 'hundiendose', 'cayendo', 'levantandose', 'sentandose', 'parandose', 'acostandose', 'durmiendo', 'despertando', 'comiendo',
  'bebiendo', 'mordiendo', 'masticando', 'tragando', 'cocinando', 'friendo', 'hirviendo', 'asando', 'horneando', 'lavando',
  'secando', 'planchando', 'barriendo', 'fregando', 'limpiando', 'ordenando', 'desordenando', 'rompiendo', 'reparando', 'construyendo',
  'destruyendo', 'pintando', 'dibujando', 'escribiendo', 'leyendo', 'estudiando', 'aprendiendo', 'ensenando', 'explicando', 'escuchando',
  'oyendo', 'mirando', 'viendo', 'observando', 'vigilando', 'espiando', 'buscando', 'encontrando', 'perdiendo', 'ganando',
  'comprando', 'vendiendo', 'regalando', 'tomando', 'dando', 'recibiendo', 'abriendo', 'cerrando', 'entrando', 'saliendo',
  'subiendo', 'bajando', 'brincando', 'buceando', 'surfeando', 'esquiando', 'patinando', 'manejando', 'conduciendo', 'pilotando',
  'navegando', 'remando', 'pescando', 'cazando', 'atrapando', 'soltando', 'lanzando', 'tirando', 'empujando', 'jalando',
  'cargando', 'levantando', 'moviendose', 'parando', 'arrancando', 'frenando', 'acelerando', 'doblando', 'cruzando', 'pasando',
  'llegando', 'partiendo', 'yendo', 'viniendo', 'regresando', 'quedandose', 'sonando', 'riendo', 'llorando', 'gritando',
  'susurrando', 'hablando', 'conversando', 'discutiendo', 'peleando', 'luchando', 'combatiendo', 'atacando', 'defendiendo', 'protegiendo',
  'ayudando', 'salvando', 'matando', 'hiriendo', 'curando', 'sanando', 'alimentando', 'respirando', 'suspirando', 'tosiendo',
  'estornudando', 'bostezando', 'sonriendo', 'frunciendo', 'pensando', 'reflexionando', 'decidiendo', 'eligiendo', 'rechazando', 'aceptando',
  'perdonando', 'olvidando', 'recordando', 'imaginando', 'creando', 'inventando', 'descubriendo', 'explorando', 'viajando', 'paseando',
  'descansando', 'trabajando', 'ejercitando', 'entrenando', 'compitiendo', 'empatando', 'celebrando', 'festejando', 'lamentando', 'sufriendo',
  'disfrutando', 'amando', 'odiando', 'queriendo', 'despreciando', 'respetando', 'honrando', 'insultando', 'golpeando', 'acariciando',
  'besando', 'abrazando', 'agarrando', 'soltando', 'rascando', 'pellizcando', 'mordisqueando', 'lamiendo', 'chupando', 'soplando',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFriendlyId(): string {
  return `${pick(nouns)}-${pick(adjectives)}-${pick(verbs)}`;
}

function generateOrderSecret(): string {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4).join('');
}

export function parseOrderId(orderId: string): { uuid: string; friendlyName: string } {
  const idx = orderId.indexOf('_');
  if (idx === -1) return { uuid: orderId, friendlyName: orderId };
  return {
    uuid: orderId.slice(0, idx),
    friendlyName: orderId.slice(idx + 1),
  };
}

export interface CreateOrderParams {
  user: User;
  selectedLocation: Location;
  total: number;
  includedItems: CartItemWithProduct[];
}

export interface CreateOrderResult {
  orderId: string;
  orderSecret: string;
  paymentCode: string;
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { user, selectedLocation, total, includedItems } = params;

  const uuid = uuidv7();
  const friendlyId = generateFriendlyId();
  const orderId = `${uuid}_${friendlyId}`;
  const paymentCode = orderId;
  const orderSecret = generateOrderSecret();

  const orderItems = includedItems.map((item) => {
    const unitPrice = item.unitPrice;
    const lineSubtotal = Number((unitPrice * item.quantity).toFixed(2));
    return {
      itemId: uuidv7(),
      productId: item.productId,
      productName: item.product?.name ?? item.productId,
      unitPrice,
      quantity: item.quantity,
      subtotal: lineSubtotal,
    };
  });

  const batch = writeBatch(db);

  const ordersRef = doc(db, 'orders', orderId);
  batch.set(ordersRef, {
    orderId,
    secret: orderSecret,
    buyerId: user.uid,
    sellerId: null,
    status: 'CREADO',
    incidentReason: null,
    total,
    locationId: selectedLocation.id,
    paymentStatus: 'PENDIENTE',
    deliveryStatus: null,
    deliveryId: null,
    paymentId: paymentCode,
    confirmedAt: null,
    cancelledAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (const orderItem of orderItems) {
    const orderItemRef = doc(db, `orders/${orderId}/orderItems`, orderItem.itemId);
    batch.set(orderItemRef, orderItem);
  }

  for (const orderItem of orderItems) {
    const inventoryRef = doc(db, 'inventory', orderItem.productId);
    batch.update(inventoryRef, {
      stockReserved: increment(orderItem.quantity),
      updatedAt: serverTimestamp(),
    });
  }

  const paymentsRef = doc(db, 'payments', paymentCode);
  batch.set(paymentsRef, {
    paymentId: paymentCode,
    orderId,
    amount: total,
    method: 'cash_on_delivery',
    status: 'PENDIENTE',
    registeredBy: user.uid,
    verifiedBy: null,
    registeredAt: serverTimestamp(),
    verifiedAt: null,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return { orderId, orderSecret, paymentCode };
}
