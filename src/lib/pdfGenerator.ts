import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, PDFTemplate } from '@/types';

export interface PDFGenerationResult {
  success: boolean;
  pdfBlob?: Blob;
  error?: string;
}

export const generateInvoicePDF = async (
  invoice: Invoice,
  template: PDFTemplate
): Promise<PDFGenerationResult> => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // 1. HEADER - Datos de la empresa con color corporativo
    doc.setFillColor(template.primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(template.companyInfo.name, 15, 15);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIT: ${template.companyInfo.nit}`, 15, 22);
    doc.text(template.companyInfo.address, 15, 27);
    doc.text(`Tel: ${template.companyInfo.phone}`, 15, 32);
    
    // 2. TÍTULO FACTURA
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`FACTURA ${invoice.id}`, pageWidth - 15, 20, { align: 'right' });
    
    // Estado badge
    const statusColors: Record<string, string> = {
      'Borrador': '#6b7280',
      'Emitida': '#3b82f6',
      'Pagada': '#10b981'
    };
    doc.setFillColor(statusColors[invoice.status] || '#6b7280');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.roundedRect(pageWidth - 45, 25, 30, 8, 2, 2, 'F');
    doc.text(invoice.status, pageWidth - 30, 30.5, { align: 'center' });
    
    // 3. INFORMACIÓN DEL CLIENTE
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 15, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${invoice.clientName}`, 15, 52);
    doc.text(`NIT: ${invoice.clientNit}`, 15, 58);
    doc.text(`Dirección: ${invoice.clientAddress}`, 15, 64);
    doc.text(`Email: ${invoice.clientEmail}`, 15, 70);
    
    // 4. INFORMACIÓN DE LA FACTURA
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DE FACTURACIÓN', pageWidth - 85, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha Emisión: ${new Date(invoice.issueDate).toLocaleDateString('es-CO')}`, pageWidth - 85, 52);
    doc.text(`Fecha Vencimiento: ${new Date(invoice.dueDate).toLocaleDateString('es-CO')}`, pageWidth - 85, 58);
    doc.text(`Método de Pago: ${invoice.paymentMethod}`, pageWidth - 85, 64);
    doc.text(`Moneda: ${invoice.currency}`, pageWidth - 85, 70);
    
    // 5. TABLA DE ITEMS
    const tableData = invoice.items.map(item => [
      item.descripcion,
      item.cantidad.toString(),
      formatCurrency(item.precioUnitario),
      formatCurrency(item.cantidad * item.precioUnitario)
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: template.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 }
      }
    });
    
    // 6. TOTALES
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsX = pageWidth - 75;
    
    doc.setFontSize(10);
    doc.text('Subtotal:', totalsX, finalY);
    doc.text(formatCurrency(invoice.subtotal), pageWidth - 15, finalY, { align: 'right' });
    
    doc.text('IVA (19%):', totalsX, finalY + 7);
    doc.text(formatCurrency(invoice.taxAmount), pageWidth - 15, finalY + 7, { align: 'right' });
    
    doc.setDrawColor(template.secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX, finalY + 10, pageWidth - 15, finalY + 10);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, finalY + 17);
    doc.text(formatCurrency(invoice.total), pageWidth - 15, finalY + 17, { align: 'right' });
    
    // 7. OBSERVACIONES
    if (invoice.observations) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Observaciones:', 15, finalY + 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitObservations = doc.splitTextToSize(invoice.observations, pageWidth - 30);
      doc.text(splitObservations, 15, finalY + 37);
    }
    
    // 8. FOOTER
    doc.setFillColor(template.secondaryColor);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(template.footerText, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Documento generado el ${new Date().toLocaleString('es-CO')}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
    
    // Generar blob
    const pdfBlob = doc.output('blob');
    
    return {
      success: true,
      pdfBlob
    };
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al generar PDF'
    };
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};
