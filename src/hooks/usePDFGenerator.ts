import { useState } from 'react';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import { Invoice, PDFTemplate } from '@/types';
import { toast } from 'sonner';
import { logPDFAction } from '@/lib/pdfLogger';

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (
    invoice: Invoice,
    template: PDFTemplate,
    autoDownload: boolean = false
  ): Promise<Blob | null> => {
    setIsGenerating(true);
    setError(null);

    logPDFAction({
      invoiceId: invoice.id,
      action: 'generation_started',
      templateId: template.id
    });

    try {
      const result = await generateInvoicePDF(invoice, template);

      if (!result.success) {
        throw new Error(result.error || 'Error al generar PDF');
      }

      if (result.pdfBlob && autoDownload) {
        // Descargar automáticamente
        const url = URL.createObjectURL(result.pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Factura-${invoice.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('PDF generado exitosamente', {
          description: `La factura ${invoice.id} se descargó correctamente.`
        });

        logPDFAction({
          invoiceId: invoice.id,
          action: 'generation_success',
          templateId: template.id
        });
      }

      return result.pdfBlob || null;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      logPDFAction({
        invoiceId: invoice.id,
        action: 'generation_error',
        templateId: template.id,
        error: errorMessage
      });

      toast.error('Error al generar PDF', {
        description: errorMessage,
        action: {
          label: 'Reintentar',
          onClick: () => generatePDF(invoice, template, autoDownload)
        }
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = (pdfBlob: Blob, invoiceId: string) => {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factura-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('PDF descargado', {
      description: `Factura ${invoiceId} guardada correctamente`
    });
  };

  return {
    generatePDF,
    downloadPDF,
    isGenerating,
    error
  };
};
