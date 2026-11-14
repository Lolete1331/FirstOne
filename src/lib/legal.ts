/**
 * Datos de las páginas legales.
 * El nombre del responsable y el email de contacto NO se guardan en el repositorio (es público):
 * se leen de variables de entorno de Vercel (LEGAL_OWNER_NAME y LEGAL_CONTACT_EMAIL).
 */
export const LEGAL = {
  ownerName: process.env.LEGAL_OWNER_NAME?.trim() || "Diego y Álex, creadores de FirstOne",
  contactEmail: process.env.LEGAL_CONTACT_EMAIL?.trim() || null,
  location: "Navarra (España)",
  updated: "14 de noviembre de 2026",
};
