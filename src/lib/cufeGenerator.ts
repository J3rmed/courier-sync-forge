import { Invoice, PDFTemplate } from '@/types';

export interface CUFEData {
  cufe: string;
  timestamp: string;
}

/**
 * Genera el CUFE (Código Único de Factura Electrónica) según estándares DIAN Colombia
 * Algoritmo: SHA-384 de datos concatenados específicos
 */
export const generateCUFE = async (
  invoice: Invoice,
  template: PDFTemplate,
  emissionTimestamp: Date
): Promise<CUFEData> => {
  // Formato de fecha y hora para CUFE: YYYYMMDDHHmmss
  const year = emissionTimestamp.getFullYear();
  const month = String(emissionTimestamp.getMonth() + 1).padStart(2, '0');
  const day = String(emissionTimestamp.getDate()).padStart(2, '0');
  const hours = String(emissionTimestamp.getHours()).padStart(2, '0');
  const minutes = String(emissionTimestamp.getMinutes()).padStart(2, '0');
  const seconds = String(emissionTimestamp.getSeconds()).padStart(2, '0');
  
  const fechaHora = `${year}${month}${day}${hours}${minutes}${seconds}`;
  
  // Formatear valores monetarios sin separadores ni decimales
  const valorTotal = Math.round(invoice.total).toString().padStart(15, '0');
  const valorImpuesto = Math.round(invoice.taxAmount).toString().padStart(15, '0');
  const valorSubtotal = Math.round(invoice.subtotal).toString().padStart(15, '0');
  
  // NIT sin dígito de verificación (quitar el último dígito si tiene guión)
  const nitEmisor = template.companyInfo.nit.replace(/[.-]/g, '').replace(/\d$/, '');
  const nitAdquirente = invoice.clientNit.replace(/[.-]/g, '').replace(/\d$/, '');
  
  // Clave técnica (debe ser proporcionada por DIAN o generada para la empresa)
  const claveTecnica = template.technicalKey || 'CourierSync2025ElectronicInvoicing';
  
  // Concatenar datos según especificación DIAN
  const datosParaCUFE = [
    invoice.id,                    // Número de factura
    fechaHora,                     // Fecha y hora de emisión
    valorTotal,                    // Valor total
    '01',                          // Código impuesto IVA
    valorImpuesto,                 // Valor IVA
    '04',                          // Código impuesto consumo (0 si no aplica)
    '000000000000000',             // Valor impuesto consumo
    '03',                          // Código impuesto ReteICA (0 si no aplica)
    '000000000000000',             // Valor impuesto ReteICA
    valorTotal,                    // Valor total con impuestos
    nitEmisor,                     // NIT emisor sin DV
    '31',                          // Tipo documento adquirente (31 = NIT)
    nitAdquirente,                 // NIT adquirente sin DV
    claveTecnica                   // Clave técnica
  ].join('');
  
  // Generar hash SHA-384 usando Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(datosParaCUFE);
  const hashBuffer = await crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  return {
    cufe: hash,
    timestamp: emissionTimestamp.toISOString()
  };
};

/**
 * Valida que un CUFE sea único en el sistema
 */
export const isCUFEUnique = (cufe: string, existingInvoices: Invoice[]): boolean => {
  return !existingInvoices.some(inv => inv.cufe === cufe);
};
