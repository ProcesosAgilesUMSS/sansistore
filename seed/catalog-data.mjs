export const categories = [
  { id: 'bebidas', name: 'Bebidas', active: true },
  { id: 'abarrotes', name: 'Abarrotes', active: true },
  { id: 'lacteos', name: 'Lacteos', active: true },
  { id: 'hogar', name: 'Hogar', active: true },
];

const mocochinchiReviews = [
  {
    id: 'mocochinchi-review-01',
    authorName: 'Veronica',
    rating: 5,
    comment: 'Muy buena opcion para preparar algo tradicional en casa.',
    createdAt: '2026-04-21T10:00:00.000Z',
  },
  {
    id: 'mocochinchi-review-02',
    authorName: 'Hugo',
    rating: 4,
    comment: 'Buen sabor cuando se cocina con canela y clavo.',
    createdAt: '2026-04-20T16:10:00.000Z',
  },
  {
    id: 'mocochinchi-review-03',
    authorName: 'Pamela',
    rating: 5,
    comment: 'Lo prepare frio y quedo excelente para la tarde.',
    createdAt: '2026-04-19T12:40:00.000Z',
  },
  {
    id: 'mocochinchi-review-04',
    authorName: 'Eduardo',
    rating: 3,
    comment: 'Necesita buen tiempo de coccion, pero el resultado es bueno.',
    createdAt: '2026-04-18T09:25:00.000Z',
  },
  {
    id: 'mocochinchi-review-05',
    authorName: 'Lucia',
    rating: 4,
    comment: 'Me gusto con un toque extra de canela.',
    createdAt: '2026-04-17T14:05:00.000Z',
  },
  {
    id: 'mocochinchi-review-06',
    authorName: 'Mario',
    rating: 5,
    comment: 'Rinde bastante y tiene muy buen aroma.',
    createdAt: '2026-04-16T18:45:00.000Z',
  },
  {
    id: 'mocochinchi-review-07',
    authorName: 'Rocio',
    rating: 4,
    comment: 'Lo usamos para reuniones familiares y gusto bastante.',
    createdAt: '2026-04-15T11:12:00.000Z',
  },
  {
    id: 'mocochinchi-review-08',
    authorName: 'Juan',
    rating: 2,
    comment: 'Esperaba un sabor mas intenso, aunque no esta mal.',
    createdAt: '2026-04-14T08:33:00.000Z',
  },
  {
    id: 'mocochinchi-review-09',
    authorName: 'Elena',
    rating: 5,
    comment: 'Excelente para tener una opcion tradicional en casa.',
    createdAt: '2026-04-13T20:50:00.000Z',
  },
  {
    id: 'mocochinchi-review-10',
    authorName: 'Saul',
    rating: 4,
    comment: 'El empaque es practico y el producto rinde bien.',
    createdAt: '2026-04-12T07:20:00.000Z',
  },
  {
    id: 'mocochinchi-review-11',
    authorName: 'Nataly',
    rating: 5,
    comment: 'Uno de mis favoritos para preparar bebidas tradicionales.',
    createdAt: '2026-04-11T13:18:00.000Z',
  },
  {
    id: 'mocochinchi-review-12',
    authorName: 'Fabian',
    rating: 3,
    comment: 'Cumple, aunque yo lo prefiero mas dulce.',
    createdAt: '2026-04-10T17:58:00.000Z',
  },
];

export const catalogProducts = [
  {
    id: '5f1c7b56-1dc5-4d48-a3a6-7f0d9c7d1011',
    legacyId: 'leche-pil-natural-900-ml',
    slug: 'leche-pil-natural-900-ml',
    category: 'lacteos',
    name: 'Leche PIL Natural 900 ml',
    price: 9.7,
    description:
      'Leche semidescremada UHT, rica en calcio y pensada para el consumo diario en desayunos y preparaciones.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=fb2d89f_c5dd_4212_905e_e69b8d28427e.webp&co=5&size=900x900',
    badge: 'Bolivia',
    stockTotal: 36,
    stockAvailable: 24,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-el-poeta/producto/786024/leche-pil-natural-900-ml',
    reviews: [
      {
        id: '2f3ccf3f-3d9b-4eb3-8b67-8f2340e42011',
        authorName: 'Carla',
        rating: 5,
        comment: 'Buen sabor y practica para tener en casa varios dias.',
        createdAt: '2026-04-22T09:15:00.000Z',
      },
      {
        id: '0cbb3bc3-e1fd-4c85-a332-fba8350f6201',
        authorName: 'Miguel',
        rating: 4,
        comment: 'La uso para desayuno y cafe; cumple bien.',
        createdAt: '2026-04-18T08:30:00.000Z',
      },
    ],
  },
  {
    id: '7ac8e402-21d3-4d7d-bb70-6c59f8a53022',
    legacyId: 'queso-crema-bonle-pil-andina-200-gr',
    slug: 'queso-crema-bonle-pil-andina-200-gr',
    category: 'lacteos',
    name: 'Queso Crema Bonle PIL Andina 200 gr',
    price: 32,
    description:
      'Queso crema suave y facil de untar, ideal para desayunos, meriendas y recetas saladas o dulces.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=8f9ced6_36f7_4e4a_a190_77532c32c9ad.webp&co=5&size=900x900',
    badge: 'Oferta',
    hasOffer: true,
    offerPrice: 28,
    stockTotal: 18,
    stockAvailable: 0,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-el-poeta/producto/783359/queso-crema-bonle-pil-andina-200-gr',
    reviews: [
      {
        id: '1aab4f74-8d44-4c77-b8d7-d0d0f64ab221',
        authorName: 'Daniela',
        rating: 5,
        comment: 'Textura cremosa y muy bueno para untar en tostadas.',
        createdAt: '2026-04-24T10:00:00.000Z',
      },
      {
        id: '8a3f595f-7fc6-4f7b-a86c-4be1f5170222',
        authorName: 'Jorge',
        rating: 4,
        comment: 'Buen producto para sandwiches y meriendas.',
        createdAt: '2026-04-21T16:25:00.000Z',
      },
    ],
  },
  {
    id: 'fb4fef79-3a32-4720-9f27-1ac9d4b3b033',
    legacyId: 'aceite-fino-vegetal-900-ml',
    slug: 'aceite-fino-vegetal-900-ml',
    category: 'abarrotes',
    name: 'Aceite Fino Vegetal 900 ml',
    price: 18,
    description:
      'Aceite vegetal de uso cotidiano para frituras ligeras, salteados y preparaciones caseras.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=294b7aa_1b79_4bbc_aabe_4a15c769d068.webp&co=5&size=900x900',
    badge: 'Popular',
    stockTotal: 42,
    stockAvailable: 17,
    sourceUrl:
      'https://www.hipermaxi.com/cochabamba/hipermaxi-blanco-galindo/producto/058424/aceite-fino-vegetal-900-ml',
    reviews: [],
  },
  {
    id: '9950d7ec-1222-4268-a95b-d1818e6c4044',
    legacyId: 'arroz-grano-de-oro-caisy-1-kg',
    slug: 'arroz-grano-de-oro-caisy-1-kg',
    category: 'abarrotes',
    name: 'Arroz Grano de Oro Caisy 1 kg',
    price: 13.5,
    description: '   ',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=a7aad26_2e85_4057_b8b4_dd06128d71f2.webp&co=5&size=900x900',
    stockTotal: 55,
    stockAvailable: 8,
    sourceUrl:
      'https://www.hipermaxi.com/santa-cruz/hipermaxi-blacutt/producto/540900/arroz-grano-de-oro-caisy-1-kg',
    reviews: [
      {
        id: 'ef4379d4-fbc3-48f3-b95a-7b7d6426c441',
        authorName: 'Natalia',
        rating: 4,
        comment: 'Cocina parejo y queda bien para el almuerzo.',
        createdAt: '2026-04-15T09:40:00.000Z',
      },
      {
        id: '9ff6f795-7f60-492e-a7c7-d9baed837442',
        authorName: 'Luis',
        rating: 5,
        comment: 'Es uno de los arroces que mas compramos en casa.',
        createdAt: '2026-04-14T12:10:00.000Z',
      },
    ],
  },
  {
    id: '4ec27ef8-64d3-46cf-b48a-c8e76f0f5055',
    legacyId: 'fideo-lazzaroni-spaguetto-52-400-gr',
    slug: 'fideo-lazzaroni-spaguetto-52-400-gr',
    category: 'abarrotes',
    name: 'Fideo Lazzaroni Spaguetto 52 400 gr',
    price: 6.5,
    description:
      'Pasta seca tipo spaguetto para comidas rapidas y rendidoras, util para salsa roja o blanca.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=9366ed1_1927_4112_9833_407bf0b2f34f.webp&co=5&size=900x900',
    stockTotal: 27,
    stockAvailable: 0,
    sourceUrl:
      'https://www.hipermaxi.com/santa-cruz/hipermaxi-canoto/producto/008210/fideo-lazzaroni-spaguetto-52-400-gr',
    reviews: [
      {
        id: '4884c884-6106-4623-b75d-9a253b8ae551',
        authorName: 'Paola',
        rating: 5,
        comment: 'Se cocina bien y no se rompe facil.',
        createdAt: '2026-04-08T11:00:00.000Z',
      },
      {
        id: 'ffad0a65-31ae-4347-a0a8-27ac30b7b552',
        authorName: 'Raul',
        rating: 4,
        comment: 'Buena opcion para comidas de todos los dias.',
        createdAt: '2026-04-06T18:32:00.000Z',
      },
    ],
  },
  {
    id: 'aa2941bf-5f4f-4c8d-bb17-61977dcd6066',
    legacyId: 'mocochinchi-soproma-100-gr',
    slug: 'mocochinchi-soproma-100-gr',
    category: 'bebidas',
    name: 'Mocochinchi Soproma 100 gr',
    price: 10,
    description:
      'Mocochinchi deshidratado listo para preparar una bebida tradicional boliviana de sabor dulce.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=demo-image-missing.webp&co=5&size=900x900',
    badge: 'Tradicional',
    stockTotal: 30,
    stockAvailable: 12,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-calacoto/producto/658208/mocochinchi-soproma-100-gr',
    reviews: mocochinchiReviews,
  },
  {
    id: 'c3e77f4c-2cb5-4ce2-9134-a15466777077',
    legacyId: 'detergente-liquido-ola-futuro-limpieza-completa-5-l',
    slug: 'detergente-liquido-ola-futuro-limpieza-completa-5-l',
    category: 'hogar',
    name: 'Detergente Liquido Ola Futuro Limpieza Completa 5 L',
    price: 123,
    description:
      'Detergente liquido para lavado de ropa, pensado para cargas frecuentes y limpieza completa del hogar.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=ff61f40_66f6_4b37_a21a_2730f4fc6c1f.webp&co=5&size=900x900',
    badge: 'Oferta',
    hasOffer: true,
    offerPrice: 109,
    stockTotal: 15,
    stockAvailable: 3,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-achumani/producto/554466/detergente-liquido-ola-futuro-limpieza-completa-5-l',
    reviews: [
      {
        id: '1b7338f8-0630-49f3-b4a6-561b4620d771',
        authorName: 'Silvia',
        rating: 4,
        comment: 'Rinde bastante para una familia y deja buen aroma.',
        createdAt: '2026-04-23T07:55:00.000Z',
      },
      {
        id: 'ca658331-f9d2-4302-8f52-cf40db4a2772',
        authorName: 'Fernando',
        rating: 4,
        comment: 'Conviene cuando quieres comprar una presentacion grande.',
        createdAt: '2026-04-20T19:10:00.000Z',
      },
    ],
  },
  {
    id: 'b62fd8d5-1d66-4f39-a26f-6b7e9fda9088',
    legacyId: 'galletas-agua-victoria-120-gr',
    slug: 'galletas-agua-victoria-120-gr',
    category: 'abarrotes',
    name: 'Galletas Agua Victoria 120 gr',
    price: 8,
    description:
      'Galletas ligeras y crocantes para acompanar desayunos, meriendas o bebidas calientes.',
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=4f68019_a70a_438f_9131_f066da396bce.webp&co=5&size=900x900',
    badge: 'Oferta',
    hasOffer: true,
    offerPrice: 8,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-el-poeta/producto/779005/galletas-agua-victoria-120-gr',
    reviews: [
      {
        id: 'a7af31da-401e-4497-9f29-b28b5adbc1e1',
        authorName: 'Andrea',
        rating: 4,
        comment: 'Son practicas para tener en la despensa y acompanar el cafe.',
        createdAt: '2026-04-09T09:12:00.000Z',
      },
      {
        id: '12725be7-bafd-4848-a88d-e77545dffb9b',
        authorName: 'Ruben',
        rating: 4,
        comment: 'Buena textura y vienen bien para meriendas rapidas.',
        createdAt: '2026-04-07T17:26:00.000Z',
      },
    ],
  },
];
