import { Invoice } from '@/types';

interface FiscalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateInvoiceForEmission = (invoice: Invoice): FiscalValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validar datos del cliente
  if (!invoice.clientName || invoice.clientName.trim().length < 2) {
    errors.push('El nombre del cliente es requerido (mínimo 2 caracteres)');
  }

  // 2. Validar NIT con formato colombiano
  const nitRegex = /^\d{9,10}-\d{1}$/;
  if (!invoice.clientNit || !nitRegex.test(invoice.clientNit)) {
    errors.push('El NIT debe tener formato válido (ej: 900123456-7)');
  }

  if (!invoice.clientAddress || invoice.clientAddress.trim().length < 5) {
    errors.push('La dirección del cliente es requerida (mínimo 5 caracteres)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!invoice.clientEmail || !emailRegex.test(invoice.clientEmail)) {
    errors.push('El email del cliente debe ser válido');
  }

  // 3. Validar items/conceptos
  if (!invoice.items || invoice.items.length === 0) {
    errors.push('La factura debe tener al menos un concepto/ítem');
  }

  invoice.items.forEach((item, index) => {
    if (!item.descripcion || item.descripcion.trim().length === 0) {
      errors.push(`El ítem ${index + 1} requiere una descripción`);
    }
    if (item.cantidad <= 0) {
      errors.push(`El ítem ${index + 1} debe tener cantidad mayor a 0`);
    }
    if (item.precioUnitario < 0) {
      errors.push(`El ítem ${index + 1} no puede tener precio negativo`);
    }
  });

  // 4. Validar totales y tasas
  if (invoice.subtotal <= 0) {
    errors.push('El subtotal debe ser mayor a 0');
  }

  // Verificar que el IVA sea exactamente 19%
  const expectedTax = invoice.subtotal * 0.19;
  const taxDifference = Math.abs(invoice.taxAmount - expectedTax);
  if (taxDifference > 0.01) {
    errors.push(`El IVA debe ser exactamente 19% del subtotal (esperado: ${expectedTax.toFixed(2)})`);
  }

  const expectedTotal = invoice.subtotal + invoice.taxAmount;
  const totalDifference = Math.abs(invoice.total - expectedTotal);
  if (totalDifference > 0.01) {
    errors.push('El total no coincide con subtotal + IVA');
  }

  // 5. Validar fechas
  if (!invoice.issueDate) {
    errors.push('La fecha de emisión es requerida');
  }

  if (!invoice.dueDate) {
    errors.push('La fecha de vencimiento es requerida');
  }

  if (invoice.issueDate && invoice.dueDate) {
    const issueDate = new Date(invoice.issueDate);
    const dueDate = new Date(invoice.dueDate);
    if (dueDate < issueDate) {
      errors.push('La fecha de vencimiento no puede ser anterior a la fecha de emisión');
    }
  }

  // 6. Validar método de pago
  const validPaymentMethods = ['Transferencia Bancaria', 'Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito'];
  if (!invoice.paymentMethod || !validPaymentMethods.includes(invoice.paymentMethod)) {
    errors.push('Debe seleccionar un método de pago válido');
  }

  // 7. Warnings (no bloquean emisión pero informan)
  if (!invoice.clientSegment) {
    warnings.push('No se ha definido un segmento de cliente. Se usará plantilla por defecto para el PDF.');
  }

  if (invoice.total > 1000000000) { // 1 billón COP
    warnings.push('El monto total es muy alto. Verifique los valores ingresados.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
