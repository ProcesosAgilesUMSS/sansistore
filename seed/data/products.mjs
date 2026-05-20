import { Categories } from './categories.mjs';

export const Products = {
  LECHE_PIL: {
    slug: 'leche-pil-natural-900-ml',
    category: Categories.BEBIDAS,
    name: 'Leche PIL Natural 900 ml',
    description:
      'Leche semidescremada UHT, rica en calcio y pensada para el consumo diario.',
    price: 9.7,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=fb2d89f_c5dd_4212_905e_e69b8d28427e.webp&co=5&size=900x900',
    badge: 'Bolivia',
    hasOffer: false,
    stockTotal: 36,
    stockAvailable: 24,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-el-poeta/producto/786024/leche-pil-natural-900-ml',
    reviews: [
      {
        authorName: 'Carla',
        rating: 5,
        comment: 'Buen sabor y practica para tener en casa.',
      },
      {
        authorName: 'Miguel',
        rating: 4,
        comment: 'La uso para desayuno y cafe.',
      },
    ],
    soldCount: 120,
  },
  QUESO_CREMA: {
    slug: 'queso-crema-bonle-pil-andina-200-gr',
    category: Categories.LACTEOS,
    name: 'Queso Crema Bonle PIL Andina 200 gr',
    description: 'Queso crema suave y facil de untar.',
    price: 32,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=8f9ced6_36f7_4e4a_a190_77532c32c9ad.webp&co=5&size=900x900',
    badge: 'Oferta',
    hasOffer: true,
    offerPrice: 28,
    stockTotal: 18,
    stockAvailable: 10,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-el-poeta/producto/783359/queso-crema-bonle-pil-andina-200-gr',
    reviews: [
      {
        authorName: 'Daniela',
        rating: 5,
        comment: 'Textura cremosa y muy bueno.',
      },
      {
        authorName: 'Jorge',
        rating: 4,
        comment: 'Buen producto para sandwiches.',
      },
    ],
    soldCount: 85,
  },
  ACEITE_FINO: {
    slug: 'aceite-fino-vegetal-900-ml',
    category: Categories.ABARROTES,
    name: 'Aceite Fino Vegetal 900 ml',
    description: 'Aceite vegetal de uso cotidiano.',
    price: 18,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=294b7aa_1b79_4bbc_aabe_4a15c769d068.webp&co=5&size=900x900',
    badge: 'Popular',
    stockTotal: 42,
    stockAvailable: 17,
    sourceUrl:
      'https://www.hipermaxi.com/cochabamba/hipermaxi-blanco-galindo/producto/058424/aceite-fino-vegetal-900-ml',
    reviews: [],
    soldCount: 0,
  },
  ARROZ_CAISY: {
    slug: 'arroz-grano-de-oro-caisy-1-kg',
    category: Categories.ABARROTES,
    name: 'Arroz Grano de Oro Caisy 1 kg',
    description: 'Arroz de primera calidad.',
    price: 13.5,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=a7aad26_2e85_4057_b8b4_dd06128d71f2.webp&co=5&size=900x900',
    stockTotal: 55,
    stockAvailable: 8,
    sourceUrl:
      'https://www.hipermaxi.com/santa-cruz/hipermaxi-blacutt/producto/540900/arroz-grano-de-oro-caisy-1-kg',
    reviews: [
      {
        authorName: 'Natalia',
        rating: 4,
        comment: 'Cocina parejo y queda bien.',
      },
      {
        authorName: 'Luis',
        rating: 5,
        comment: 'Es uno de los arroces que mas compramos.',
      },
    ],
    soldCount: 200,
  },
  FIDEO_LAZZARONI: {
    slug: 'fideo-lazzaroni-spaguetto-52-400-gr',
    category: Categories.ABARROTES,
    name: 'Fideo Lazzaroni Spaguetto 52 400 gr',
    description: 'Pasta seca tipo spaguetto.',
    price: 6.5,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=9366ed1_1927_4112_9833_407bf0b2f34f.webp&co=5&size=900x900',
    stockTotal: 27,
    stockAvailable: 0,
    sourceUrl:
      'https://www.hipermaxi.com/santa-cruz/hipermaxi-canoto/producto/008210/fideo-lazzaroni-spaguetto-52-400-gr',
    reviews: [
      {
        authorName: 'Paola',
        rating: 5,
        comment: 'Se cocina bien y no se rompe facil.',
      },
      {
        authorName: 'Raul',
        rating: 4,
        comment: 'Buena opcion para comidas de todos los dias.',
      },
    ],
    soldCount: 150,
  },
  MOCOCHINCHI: {
    slug: 'mocochinchi-soproma-100-gr',
    category: Categories.BEBIDAS,
    name: 'Mocochinchi Soproma 100 gr',
    description: 'Mocochinchi deshidratado listo para preparar.',
    price: 10,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=demo-image-missing.webp&co=5&size=900x900',
    badge: 'Tradicional',
    stockTotal: 30,
    stockAvailable: 12,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-calacoto/producto/658208/mocochinchi-soproma-100-gr',
    reviews: [
      {
        authorName: 'Veronica',
        rating: 5,
        comment: 'Muy buena opcion tradicional.',
      },
      {
        authorName: 'Hugo',
        rating: 4,
        comment: 'Buen sabor cuando se cocina.',
      },
    ],
    soldCount: 75,
  },
  YOGURT_TEST_SIN_RESENAS: {
    slug: 'yogurt-test-sin-resenas',
    category: Categories.LACTEOS,
    name: 'Yogurt Test Sin Resenas',
    description: 'Producto de prueba sin inventario ni comentarios.',
    price: 21.5,
    imageUrl:
      'https://placehold.co/600x400/f5f5f5/555555?text=Yogurt+Test&font=roboto',
    hasOffer: false,
    offerPrice: null,
    stockTotal: 10,
    stockAvailable: 0,
    sourceUrl: 'https://example.com/yogurt-test-sin-resenas',
    reviews: [],
    soldCount: 0,
  },
  DETERGENTE_OLA: {
    slug: 'detergente-liquido-ola-futuro-limpieza-completa-5-l',
    category: Categories.HOGAR,
    name: 'Detergente Liquido Ola Futuro Limpieza Completa 5 L',
    description: 'Detergente liquido para lavado de ropa.',
    price: 123,
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
        authorName: 'Silvia',
        rating: 4,
        comment: 'Rinde bastante y deja buen aroma.',
      },
      {
        authorName: 'Fernando',
        rating: 4,
        comment: 'Conviene para presentacion grande.',
      },
    ],
    soldCount: 20,
  },
  GALLETAS_VICTORIA: {
    slug: 'galletas-agua-victoria-120-gr',
    category: Categories.ABARROTES,
    name: 'Galletas Agua Victoria 120 gr',
    description: 'Galletas ligeras y crocantes.',
    price: 8,
    imageUrl:
      'https://hipermaxi.com/tienda-api/marketfile/ImageEcommerce?hashfile=4f68019_a70a_438f_9131_f066da396bce.webp&co=5&size=900x900',
    badge: 'Oferta',
    hasOffer: true,
    offerPrice: 8,
    stockTotal: 40,
    stockAvailable: 25,
    sourceUrl:
      'https://www.hipermaxi.com/la-paz/hipermaxi-el-poeta/producto/779005/galletas-agua-victoria-120-gr',
    reviews: [
      {
        authorName: 'Andrea',
        rating: 4,
        comment: 'Son practicas para la despensa.',
      },
      {
        authorName: 'Ruben',
        rating: 4,
        comment: 'Buena textura y vienen bien.',
      },
    ],
    soldCount: 60,
  },
};

export const productList = Object.values(Products);
