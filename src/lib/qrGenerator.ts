import QRCode from 'qrcode';
import { Invoice, PDFTemplate } from '@/types';

/**
 * Genera un código QR con la información de la factura electrónica
 * Formato compatible con validadores DIAN Colombia
 */
export const generateInvoiceQR = async (
  invoice: Invoice,
  template: PDFTemplate
): Promise<string> => {
  // Validar que la factura tenga CUFE
  if (!invoice.cufe) {
    throw new Error('La factura debe tener un CUFE generado antes de crear el QR');
  }
  
  // Formato estándar DIAN para código QR
  const qrContent = [
    `NumFac: ${invoice.id}`,
    `FecFac: ${invoice.issueDate}`,
    `HorFac: ${invoice.emissionTimestamp ? new Date(invoice.emissionTimestamp).toLocaleTimeString('es-CO', { hour12: false }) : ''}`,
    `NitFac: ${template.companyInfo.nit}`,
    `DocAdq: ${invoice.clientNit}`,
    `ValFac: ${invoice.subtotal.toFixed(2)}`,
    `ValIva: ${invoice.taxAmount.toFixed(2)}`,
    `ValOtroIm: 0.00`,
    `ValTotalFac: ${invoice.total.toFixed(2)}`,
    `CUFE: ${invoice.cufe}`
  ].join('\n');
  
  try {
    // Generar QR como Data URL con nivel de corrección "M" (Medium)
    // Tamaño mínimo 300x300px para impresión clara
    const qrDataURL = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrDataURL;
  } catch (error) {
    console.error('Error generando código QR:', error);
    throw new Error('No se pudo generar el código QR de la factura');
  }
};

/**
 * Genera un código QR como buffer para otros usos (email, almacenamiento)
 */
export const generateInvoiceQRBuffer = async (
  invoice: Invoice,
  template: PDFTemplate
): Promise<Buffer> => {
  if (!invoice.cufe) {
    throw new Error('La factura debe tener un CUFE generado antes de crear el QR');
  }
  
  const qrContent = [
    `NumFac: ${invoice.id}`,
    `FecFac: ${invoice.issueDate}`,
    `HorFac: ${invoice.emissionTimestamp ? new Date(invoice.emissionTimestamp).toLocaleTimeString('es-CO', { hour12: false }) : ''}`,
    `NitFac: ${template.companyInfo.nit}`,
    `DocAdq: ${invoice.clientNit}`,
    `ValFac: ${invoice.subtotal.toFixed(2)}`,
    `ValIva: ${invoice.taxAmount.toFixed(2)}`,
    `ValOtroIm: 0.00`,
    `ValTotalFac: ${invoice.total.toFixed(2)}`,
    `CUFE: ${invoice.cufe}`
  ].join('\n');
  
  try {
    const buffer = await QRCode.toBuffer(qrContent, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 2
    });
    
    return buffer;
  } catch (error) {
    console.error('Error generando buffer QR:', error);
    throw new Error('No se pudo generar el código QR de la factura');
  }
};
