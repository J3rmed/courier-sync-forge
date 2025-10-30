import { Invoice } from '@/types';

export interface FiscalFolio {
  id: string; // Formato: F-YYYY-MM-XXXXXX
  timestamp: string;
  prefix: string;
  year: number;
  month: number;
  sequence: number;
}

/**
 * Genera un folio fiscal único para facturas emitidas
 * Formato: F-2025-10-000123
 * - F: Prefijo de factura
 * - 2025: Año
 * - 10: Mes (con ceros)
 * - 000123: Número secuencial de 6 dígitos
 */
export const generateFiscalFolio = (existingInvoices: Invoice[]): FiscalFolio => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const monthStr = month.toString().padStart(2, '0');

  // Filtrar facturas emitidas del mismo mes y año
  const issuedInvoicesThisMonth = existingInvoices.filter(inv => {
    if (inv.status === 'Borrador' || !inv.id.startsWith('F-')) {
      return false;
    }

    // Extraer año y mes del ID
    const match = inv.id.match(/F-(\d{4})-(\d{2})-(\d{6})/);
    if (!match) return false;

    const invYear = parseInt(match[1]);
    const invMonth = parseInt(match[2]);

    return invYear === year && invMonth === month;
  });

  // Obtener el siguiente número secuencial
  let maxSequence = 0;
  issuedInvoicesThisMonth.forEach(inv => {
    const match = inv.id.match(/F-\d{4}-\d{2}-(\d{6})/);
    if (match) {
      const sequence = parseInt(match[1]);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });

  const nextSequence = maxSequence + 1;
  const sequenceStr = nextSequence.toString().padStart(6, '0');

  const folioId = `F-${year}-${monthStr}-${sequenceStr}`;

  return {
    id: folioId,
    timestamp: now.toISOString(),
    prefix: 'F',
    year,
    month,
    sequence: nextSequence
  };
};

/**
 * Valida que un folio fiscal sea único
 */
export const isFolioUnique = (folioId: string, existingInvoices: Invoice[]): boolean => {
  return !existingInvoices.some(inv => inv.id === folioId);
};
