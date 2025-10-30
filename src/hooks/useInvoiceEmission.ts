import { useState } from 'react';
import { Invoice, STORAGE_KEYS, Shipment } from '@/types';
import { validateInvoiceForEmission } from '@/lib/invoiceValidator';
import { generateFiscalFolio } from '@/lib/fiscalFolioGenerator';
import { toast } from 'sonner';
import { logPDFAction } from '@/lib/pdfLogger';

interface EmissionResult {
  success: boolean;
  invoice?: Invoice;
  errors?: string[];
  warnings?: string[];
}

export const useInvoiceEmission = () => {
  const [isEmitting, setIsEmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const emitInvoice = async (invoiceId: string): Promise<EmissionResult> => {
    setIsEmitting(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // 1. Cargar factura actual
      const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (!savedInvoices) {
        throw new Error('No se encontraron facturas');
      }

      const invoices: Invoice[] = JSON.parse(savedInvoices);
      const invoice = invoices.find(inv => inv.id === invoiceId);

      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      if (invoice.status !== 'Borrador') {
        throw new Error('Solo se pueden emitir facturas en estado "Borrador"');
      }

      // 2. Ejecutar validaciones fiscales
      const validation = validateInvoiceForEmission(invoice);

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setValidationWarnings(validation.warnings);

        toast.error('Validación fallida', {
          description: `Se encontraron ${validation.errors.length} errores que impiden la emisión.`
        });

        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // 3. Generar folio fiscal único
      const fiscalFolio = generateFiscalFolio(invoices);

      logPDFAction({
        invoiceId: invoice.id,
        action: 'generation_started',
        templateId: `fiscal_folio_${fiscalFolio.id}`
      });

      // 4. Actualizar la factura
      const updatedInvoice: Invoice = {
        ...invoice,
        id: fiscalFolio.id,
        status: 'Emitida',
        pdfGeneratedAt: undefined, // Resetear para regenerar PDF con nuevo folio
      };

      // 5. Guardar en localStorage
      const updatedInvoices = invoices.map(inv => 
        inv.id === invoiceId ? updatedInvoice : inv
      );

      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));

      // 6. Actualizar estado de envíos asociados (si existen)
      const savedShipments = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
      if (savedShipments) {
        const shipments: Shipment[] = JSON.parse(savedShipments);
        // Marcar envíos relacionados como facturados basándose en descripciones
        const shipmentIds = invoice.items
          .map(item => {
            const match = item.descripcion.match(/ENV-\d+/);
            return match ? match[0] : null;
          })
          .filter(Boolean);

        const updatedShipments = shipments.map(shipment => 
          shipmentIds.includes(shipment.id)
            ? { ...shipment, estado: 'Facturado' as const }
            : shipment
        );
        localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(updatedShipments));
      }

      // 7. Mostrar warnings si existen
      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
        validation.warnings.forEach(warning => {
          toast.warning('Advertencia', { description: warning });
        });
      }

      // 8. Toast de éxito
      toast.success('Factura emitida exitosamente', {
        description: `Folio fiscal: ${fiscalFolio.id}`
      });

      logPDFAction({
        invoiceId: fiscalFolio.id,
        action: 'generation_success',
        templateId: `fiscal_folio_${fiscalFolio.id}`
      });

      return {
        success: true,
        invoice: updatedInvoice,
        warnings: validation.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast.error('Error al emitir factura', {
        description: errorMessage
      });

      logPDFAction({
        invoiceId: invoiceId,
        action: 'generation_error',
        error: errorMessage
      });

      return {
        success: false,
        errors: [errorMessage]
      };

    } finally {
      setIsEmitting(false);
    }
  };

  return {
    emitInvoice,
    isEmitting,
    validationErrors,
    validationWarnings
  };
};
