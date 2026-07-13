// ── Los 12 nichos de la cartera de Escalando ──
// Cada nicho trae: clientes que alimenta, términos de búsqueda por plataforma,
// idioma, y reglas especiales (compliance, mercado, etc.)
// Los términos están pensados para traer VIDEOS de tendencia adaptables al giro.

module.exports = [
  {
    id: 'dental',
    nombre: 'Dental',
    clientes: ['My Dent Nogales', 'My Dent Hermosillo', 'Bright Dental Care', 'Bright Dental Care Hmo', 'DentiKids (pediatría)', 'Dr. Sergio Tachiquin (prostodoncia/estética high-ticket)'],
    idioma: 'es',
    terminos: ['blanqueamiento dental', 'antes y despues dientes', 'carillas dentales', 'diseño de sonrisa', 'dentista tips'],
    reglas: 'Compliance sanitario: sin promesas de cura ni resultados garantizados. DentiKids es pediátrico (tono infantil/familiar). Dr. Tachiquin es high-ticket estético (sin precio/descuento).'
  },
  {
    id: 'estetica',
    nombre: 'Estética y medicina estética',
    clientes: ['Centro NeoDerma', 'Renew Medical', 'Angelica Peralta'],
    idioma: 'es',
    terminos: ['tratamiento facial', 'rejuvenecimiento piel', 'medicina estetica', 'antes y despues estetica', 'skincare rutina'],
    reglas: 'Compliance sanitario estricto: sin promesas de cura ni resultados garantizados. NeoDerma prohíbe lenguaje médico, requiere credenciales del doctor y aviso COFEPRIS.'
  },
  {
    id: 'rehabilitacion',
    nombre: 'Rehabilitación física / fisioterapia',
    clientes: ['Dr. Victor Gray'],
    idioma: 'es',
    terminos: ['fisioterapia ejercicios', 'rehabilitacion lesion', 'dolor de espalda alivio', 'terapia fisica', 'estiramientos dolor'],
    reglas: 'Compliance sanitario: sin promesas de cura garantizada. Enfoque educativo/preventivo.'
  },
  {
    id: 'clima',
    nombre: 'Clima / minisplits / HVAC',
    clientes: ['Climas Greco', 'Duventus'],
    idioma: 'es',
    terminos: ['instalacion minisplit', 'aire acondicionado tips', 'mantenimiento clima', 'ahorro energia aire', 'minisplit casa'],
    reglas: 'Producto de temporada (calor). Enfoque en confort, ahorro y servicio profesional.'
  },
  {
    id: 'food_mariscos',
    nombre: 'Food — mariscos y restaurante',
    clientes: ['El Pescadito', 'Mariscos de Kche', "Antonio's Gourmet"],
    idioma: 'es',
    terminos: ['mariscos antojo', 'tostadas de mariscos', 'aguachile', 'comida del mar', 'restaurante mariscos'],
    reglas: 'El Pescadito cierra en sucursal (SIN CTA de WhatsApp, 3 sucursales físicas). Antojo visual y frescura.'
  },
  {
    id: 'food_burger',
    nombre: 'Food — hamburguesas / antojo rápido',
    clientes: ["Chief's Burguer"],
    idioma: 'es',
    terminos: ['hamburguesa jugosa', 'burger antojo', 'comida rapida antojo', 'hamburguesa artesanal', 'food porn burger'],
    reglas: 'Antojo visual máximo (ASMR, close-ups, queso derretido). Tono joven/divertido.'
  },
  {
    id: 'saludable',
    nombre: 'Comida saludable / meal prep',
    clientes: ['NutriBox'],
    idioma: 'es',
    terminos: ['meal prep saludable', 'comida saludable semana', 'preparacion comidas fit', 'recetas saludables', 'tuppers saludables'],
    reglas: 'Enfoque en practicidad, salud y ahorro de tiempo. Sin promesas de pérdida de peso garantizada.'
  },
  {
    id: 'floreria',
    nombre: 'Florería / regalos y detalles',
    clientes: ['The Garden', 'Bella Rose'],
    idioma: 'es',
    terminos: ['arreglo floral', 'ramo de flores sorpresa', 'regalo detalle', 'flores para regalar', 'floreria diseño'],
    reglas: 'Emoción, sorpresa, momentos especiales. Contenido visual y sentimental.'
  },
  {
    id: 'terrenos',
    nombre: 'Terrenos campestres / bienes raíces',
    clientes: ['Las Vistas', 'Nueva Spora (Centenario y La Vinata)'],
    idioma: 'es',
    terminos: ['terreno campestre', 'inversion en terrenos', 'lote campestre', 'terreno de inversion', 'vivir en el campo'],
    reglas: 'Inversión/patrimonio. Tomas con dron, naturaleza, proyección de futuro.'
  },
  {
    id: 'auto_baterias',
    nombre: 'Automotriz — baterías y servicio',
    clientes: ['CBN Baterías'],
    idioma: 'es',
    terminos: ['bateria carro', 'como saber bateria mala', 'cambio de bateria auto', 'tips mecanico auto', 'mantenimiento carro'],
    reglas: 'Servicio, confianza, rapidez. Tips útiles de mantenimiento.'
  },
  {
    id: 'auto_offroad',
    nombre: 'Automotriz — taller camionetas / off-road (USA, INGLÉS)',
    clientes: ['602 Autosports (Arizona)'],
    idioma: 'en',
    terminos: ['truck build off road', 'lifted truck transformation', 'off road upgrade', 'truck mods before after', 'overland build'],
    reglas: 'MERCADO USA EN INGLÉS (Arizona). Términos y análisis en inglés. Cultura truck/off-road.'
  },
  {
    id: 'barberia_educacion',
    nombre: 'Barbería / grooming + Educación / idiomas',
    clientes: ['Barbería Express', 'Instituto Inglés'],
    idioma: 'es',
    terminos: ['corte de cabello hombre', 'barberia transformacion', 'grooming masculino', 'aprender ingles rapido', 'tips ingles'],
    reglas: 'Nicho combinado. Barbería: transformación/estilo. Instituto Inglés: educativo/aspiracional.'
  }
];
