import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileText, Trash2, Download, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import { Invoice, STORAGE_KEYS } from '@/types';
import { initialInvoices, defaultTemplates } from '@/data/mockData';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { useInvoiceEmission } from '@/hooks/useInvoiceEmission';
import { PDFPreviewDialog } from '@/components/PDFPreviewDialog';
import { resetLocalStorage } from '@/lib/resetData';

export default function Panel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>('');
  const { generatePDF, downloadPDF, isGenerating } = usePDFGenerator();
  const { emitInvoice, isEmitting } = useInvoiceEmission();

  useEffect(() => {
    // Reiniciar datos automáticamente si no hay envíos
    const savedShipments = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
    if (!savedShipments || JSON.parse(savedShipments).length === 0) {
      resetLocalStorage();
    }
    
    // Cargar facturas del localStorage o usar datos iniciales
    const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (error) {
        console.error('Error loading invoices:', error);
        setInvoices(initialInvoices);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
      }
    } else {
      setInvoices(initialInvoices);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
    }
  }, []);

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

  const handleDeleteInvoice = (invoiceId: string) => {
    const updatedInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
    setInvoices(updatedInvoices);
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));
    
    toast({
      title: "Factura eliminada",
      description: "El borrador de la factura ha sido eliminado correctamente.",
    });
  };

  const handleQuickPDFPreview = async (invoice: Invoice) => {
    const template = defaultTemplates.find(
      t => t.segment === invoice.clientSegment
    ) || defaultTemplates[0];
    
    const blob = await generatePDF(invoice, template, false);
    
    if (blob) {
      setPdfBlob(blob);
      setCurrentInvoiceId(invoice.id);
      setShowPDFPreview(true);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!pdfBlob || !currentInvoiceId) return;
    downloadPDF(pdfBlob, currentInvoiceId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Panel de Facturas</h1>
            <p className="text-muted-foreground mt-1">Gestiona todas las facturas de envíos</p>
          </div>
          
          <Button
            onClick={() => navigate('/facturas/nueva/seleccionar-envios')}
            className="gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Crear Nueva Factura
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturas Registradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay facturas registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza creando tu primera factura
                </p>
                <Button
                  onClick={() => navigate('/facturas/nueva/seleccionar-envios')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Primera Factura
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'Borrador' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const result = await emitInvoice(invoice.id);
                                if (result.success) {
                                  window.location.reload();
                                }
                              }}
                              disabled={isEmitting}
                              title="Emitir factura"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'Emitida' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickPDFPreview(invoice)}
                              disabled={isGenerating}
                              title="Vista previa PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === 'Borrador' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar borrador?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El borrador de la factura será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {invoice.status === 'Borrador' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/facturas/${invoice.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/facturas/${invoice.id}/ver`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <PDFPreviewDialog
          open={showPDFPreview}
          onOpenChange={setShowPDFPreview}
          pdfBlob={pdfBlob}
          invoiceId={currentInvoiceId}
          onDownload={handleDownloadFromPreview}
        />
      </main>
    </div>
  );
}