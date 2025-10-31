import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, CreditCard, Calculator, Download, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Header } from '@/components/layout/Header';
import { Invoice, STORAGE_KEYS } from '@/types';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { useInvoiceEmission } from '@/hooks/useInvoiceEmission';
import { PDFTemplateSelector } from '@/components/PDFTemplateSelector';
import { PDFPreviewDialog } from '@/components/PDFPreviewDialog';
import { defaultTemplates } from '@/data/mockData';

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { generatePDF, downloadPDF, isGenerating } = usePDFGenerator();
  const { emitInvoice, isEmitting, validationErrors, validationWarnings } = useInvoiceEmission();
  const [selectedTemplate, setSelectedTemplate] = useState(
    defaultTemplates.find(t => t.segment === 'retail') || defaultTemplates[0]
  );
  const [showEmissionDialog, setShowEmissionDialog] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (savedInvoices) {
      try {
        const invoices: Invoice[] = JSON.parse(savedInvoices);
        const foundInvoice = invoices.find(inv => inv.id === id);
        setInvoice(foundInvoice || null);
        
        // Seleccionar plantilla según el segmento del cliente
        if (foundInvoice?.clientSegment) {
          const template = defaultTemplates.find(t => t.segment === foundInvoice.clientSegment);
          if (template) {
            setSelectedTemplate(template);
          }
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      }
    }
  }, [id]);

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      'Borrador': 'secondary',
      'Emitida': 'default',
      'Pagada': 'success',
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const handleGeneratePDF = async () => {
    if (!invoice || !selectedTemplate) return;
    const blob = await generatePDF(invoice, selectedTemplate, false);
    
    if (blob) {
      setPdfBlob(blob);
      setShowPDFPreview(true);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!pdfBlob || !invoice) return;
    downloadPDF(pdfBlob, invoice.id);
  };

  const handleEmitInvoice = async () => {
    if (!invoice) return;
    
    const result = await emitInvoice(invoice.id);
    
    if (result.success && result.invoice) {
      setShowEmissionDialog(false);
      // Recargar la factura con el nuevo folio
      navigate(`/facturas/${result.invoice.id}/ver`);
      window.location.reload();
    }
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Factura no encontrada</h1>
            <p className="text-muted-foreground mb-4">La factura que buscas no existe o ha sido eliminada.</p>
            <Button onClick={() => navigate('/panel')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/panel')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">Factura {invoice.id}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">Estado:</span>
              {getStatusBadge(invoice.status)}
            </div>
          </div>

          {invoice.status === 'Borrador' && (
            <Dialog open={showEmissionDialog} onOpenChange={setShowEmissionDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Send className="h-4 w-4" />
                  Emitir Factura
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Emitir Factura</DialogTitle>
                  <DialogDescription>
                    Se ejecutarán validaciones fiscales y se generará un folio único. Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errores de Validación</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1 mt-2">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationWarnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Advertencias</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 space-y-1 mt-2">
                        {validationWarnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3 py-4">
                  <p className="text-sm text-muted-foreground">
                    Al emitir la factura se realizarán las siguientes acciones:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Validación completa de datos fiscales</li>
                    <li>Generación de folio fiscal único (formato F-YYYY-MM-XXXXXX)</li>
                    <li>Cambio de estado a "Emitida" (no se podrá editar)</li>
                    <li>Actualización de envíos asociados a "Facturado"</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEmissionDialog(false)}
                    disabled={isEmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEmitInvoice}
                    disabled={isEmitting}
                    className="gap-2"
                  >
                    {isEmitting ? (
                      <>Emitiendo...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Confirmar Emisión
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {invoice.status === 'Emitida' && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Vista Previa PDF
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Generar Vista Previa</DialogTitle>
                    <DialogDescription>
                      Selecciona la plantilla para previsualizar el PDF
                    </DialogDescription>
                  </DialogHeader>
                  
                  <PDFTemplateSelector
                    templates={defaultTemplates}
                    selectedSegment={invoice.clientSegment}
                    onSelectTemplate={setSelectedTemplate}
                  />
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      onClick={handleGeneratePDF}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? 'Generando...' : 'Ver Previsualización'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <PDFPreviewDialog
                open={showPDFPreview}
                onOpenChange={setShowPDFPreview}
                pdfBlob={pdfBlob}
                invoiceId={invoice.id}
                onDownload={handleDownloadFromPreview}
              />
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="text-sm">{invoice.clientName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">NIT</label>
                <p className="text-sm">{invoice.clientNit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                <p className="text-sm">{invoice.clientAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{invoice.clientEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Factura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Emisión</label>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</label>
                <p className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Método de Pago</label>
                <p className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {invoice.paymentMethod}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                <p className="text-sm">{invoice.currency}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conceptos/Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Conceptos Facturados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell className="text-center">{item.cantidad}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.precioUnitario)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.cantidad * item.precioUnitario)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (19%):</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        {invoice.observations && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{invoice.observations}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}