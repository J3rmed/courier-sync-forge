import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, CreditCard, Calculator, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Header } from '@/components/layout/Header';
import { Invoice, STORAGE_KEYS } from '@/types';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { PDFTemplateSelector } from '@/components/PDFTemplateSelector';
import { defaultTemplates } from '@/data/mockData';

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { generatePDF, isGenerating } = usePDFGenerator();
  const [selectedTemplate, setSelectedTemplate] = useState(
    defaultTemplates.find(t => t.segment === 'retail') || defaultTemplates[0]
  );

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
    await generatePDF(invoice, selectedTemplate);
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

          {invoice.status === 'Emitida' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Download className="h-4 w-4" />
                  Generar PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Generar PDF de Factura</DialogTitle>
                  <DialogDescription>
                    Selecciona la plantilla que deseas usar para el documento
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
                    {isGenerating ? (
                      <>Generando...</>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Descargar PDF
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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