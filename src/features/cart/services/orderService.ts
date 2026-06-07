import { doc, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import { v4 as uuidv7 } from 'uuid';
import { db } from '../../../lib/firebase';
import type { Location } from '../../location/types';
import type { CartItemWithProduct } from '../types';
import type { User } from 'firebase/auth';

export const nouns: string[] = [
  'perro', 'gato', 'leon', 'tigre', 'elefante', 'raton', 'oso', 'lobo', 'zorro', 'ciervo',
  'ballena', 'delfin', 'aguila', 'halcon', 'serpiente', 'rana', 'pez', 'hormiga', 'abeja', 'mariposa',
  'jirafa', 'cebra', 'rinoceronte', 'hipopotamo', 'cocodrilo', 'caiman', 'iguana', 'camaleon', 'tortuga', 'pulpo',
  'calamar', 'medusa', 'cangrejo', 'langosta', 'camaron', 'ostra', 'caracol', 'babosa', 'escorpion', 'arana',
  'saltamontes', 'grillo', 'libelula', 'mariquita', 'escarabajo', 'mosca', 'mosquito', 'polilla', 'gusano', 'oruga',
  'pajaro', 'gorrion', 'paloma', 'cuervo', 'urraca', 'loro', 'perico', 'buho', 'lechuza', 'condor',
  'flamenco', 'pinguino', 'cisne', 'pato', 'ganso', 'gallina', 'pollo', 'pavo', 'faisan', 'avestruz',
  'canguro', 'koala', 'perezoso', 'mono', 'gorila', 'chimpance', 'orangutan', 'babuino', 'lemur', 'murcielago',
  'ardilla', 'conejo', 'liebre', 'erizo', 'huron', 'comadreja', 'tejon', 'mofeta', 'mapache', 'castor',
  'nutria', 'foca', 'morsa', 'orca', 'tiburon', 'raya', 'anguila', 'salmon', 'trucha', 'sapo',
  'salamandra', 'triton', 'lagarto', 'geco', 'boa', 'anaconda', 'vibora', 'cobra', 'piton', 'kiwi',
  'cacatua', 'guacamayo', 'pinzon', 'canario', 'ruisenor', 'cuco', 'albatros', 'pelicano', 'buitre', 'cernicalo',
  'colibri', 'abejaruco', 'carbonero', 'dromedario', 'llama', 'alpaca', 'vicuna', 'bisonte', 'bufalo', 'yak',
  'cabra', 'oveja', 'cerdo', 'vaca', 'toro', 'caballo', 'poni', 'asno', 'mula', 'reno',
  'alce', 'antilope', 'gacela', 'impala', 'gnu', 'kudu', 'eland', 'jabali', 'mastodonte', 'mamut',
  'puma', 'pantera', 'guepardo', 'lince', 'caracal', 'serval', 'ocelote', 'jaguar', 'leopardo', 'narval',
  'beluga', 'marsopa', 'calamar', 'payaso', 'espada', 'marlin', 'atun', 'bacalao', 'merluza', 'lombriz',
  'sanguijuela', 'pulga', 'garrapata', 'acaro', 'escolopendra', 'milpies', 'ciempies', 'avispa', 'termita', 'cucaracha',
  'chinche', 'pulgon', 'efimera', 'mantis', 'taban', 'tijereta', 'piojo', 'anaconda', 'boa', 'cobra',
  'coralillo', 'cascabel', 'equidna', 'ornitorrinco', 'armadillo', 'pangolin', 'perezoso', 'capibara', 'caracol'
];

export const adjectives: string[] = [
  'grande', 'pequeno', 'rapido', 'lento', 'fuerte', 'debil', 'alto', 'bajo',
  'gordo', 'flaco', 'bonito', 'feo', 'limpio', 'sucio', 'nuevo', 'viejo',
  'joven', 'anciano', 'caliente', 'frio', 'dulce', 'salado', 'amargo', 'suave',
  'aspero', 'brillante', 'oscuro', 'claro', 'colorido', 'gris', 'rojo', 'azul',
  'verde', 'amarillo', 'negro', 'blanco', 'morado', 'rosa', 'marron', 'naranja',
  'salvaje', 'domestico', 'manso', 'fiero', 'peligroso', 'amable', 'cruel',
  'inteligente', 'tonto', 'sabio', 'loco', 'tranquilo', 'nervioso', 'alegre',
  'triste', 'enfadado', 'asustado', 'sorprendido', 'aburrido', 'interesante',
  'divertido', 'serio', 'gracioso', 'timido', 'extrovertido', 'valiente', 'cobarde',
  'generoso', 'egoista', 'humilde', 'orgulloso', 'paciente', 'impaciente',
  'trabajador', 'vago', 'ordenado', 'desordenado', 'puntual', 'tardio', 'rico',
  'pobre', 'famoso', 'desconocido', 'real', 'falso', 'magico', 'normal', 'raro',
  'comun', 'especial', 'simple', 'complejo', 'duro', 'blando', 'ligero', 'pesado',
  'fragil', 'resistente', 'transparente', 'opaco', 'vivo', 'muerto', 'humano',
  'animal', 'vegetal', 'metalico', 'peludo', 'calvo', 'manchado', 'rayado',
  'punteado', 'liso', 'rizado', 'erizado', 'seco', 'humedo', 'calido', 'helado',
  'silencioso', 'ruidoso', 'tierno', 'violento', 'noble', 'vil', 'honesto',
  'mentiroso', 'feroz', 'dormilon', 'jugueton', 'agil', 'torpe', 'elegante',
  'grosero', 'educado', 'sociable', 'solitario', 'protector', 'celoso', 'curioso',
  'desconfiado', 'confiado', 'obediente', 'desobediente', 'leal', 'traidor',
  'cazador', 'venenoso', 'inofensivo', 'mordedor', 'ronron', 'ladrador', 'maullador',
  'saltarin', 'nadador', 'volador', 'corredor', 'trepador', 'excavador', 'nocturno',
  'diurno', 'migratorio', 'hibernante', 'camuflado', 'escamoso', 'plumoso', 'lanudo'
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

export function generateFriendlyId(): string {
  return `${pick(nouns)}-${pick(adjectives)}-${pick(verbs)}`;
}

const zBase32Alphabet = 'ybndrfg8ejkmcpqxot1uwisza345h769'.split('');

function generateZBase32Label(): string {
  const chars = Array.from({ length: 6 }, () => pick(zBase32Alphabet));
  return `${chars.slice(0, 3).join('')}-${chars.slice(3).join('')}`;
}

function generateOrderSecret(): string {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4).join('');
}

export function generateOrderId(): string {
  return `${uuidv7()}_${generateZBase32Label()}`;
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
  const orderLabel = generateZBase32Label();
  const orderId = `${uuid}_${orderLabel}`;
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
    customerName: user.displayName || 'Cliente no registrado',
    customerPhone: user.phoneNumber || '',
    address: selectedLocation.label,
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
