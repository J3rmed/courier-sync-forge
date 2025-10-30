import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Send, User, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Invoice, STORAGE_KEYS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { validateInvoiceForEmission } from '@/lib/invoiceValidator';
import { generateFiscalFolio } from '@/lib/fiscalFolioGenerator';

const invoiceSchema = z.object({
  clientName: z.string().min(2, 'El nombre del cliente es requerido'),
  clientNit: z.string().min(1, 'El NIT es requerido'),
  clientAddress: z.string().min(5, 'La dirección es requerida'),
  clientEmail: z.string().email('Email inválido'),
  clientSegment: z.enum(['retail', 'mayorista', 'corporativo']).optional(),
  issueDate: z.string().min(1, 'La fecha de emisión es requerida'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  observations: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientNit: '',
      clientAddress: '',
      clientEmail: '',
      clientSegment: 'retail',
      issueDate: '',
      dueDate: '',
      paymentMethod: '',
      observations: '',
    },
  });

  useEffect(() => {
    const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (savedInvoices) {
      try {
        const invoices: Invoice[] = JSON.parse(savedInvoices);
        const foundInvoice = invoices.find(inv => inv.id === id);
        
        if (foundInvoice) {
          setInvoice(foundInvoice);
          
          // Poblar el formulario con los datos existentes
          form.reset({
            clientName: foundInvoice.clientName,
            clientNit: foundInvoice.clientNit,
            clientAddress: foundInvoice.clientAddress,
            clientEmail: foundInvoice.clientEmail,
            clientSegment: foundInvoice.clientSegment || 'retail',
            issueDate: foundInvoice.issueDate,
            dueDate: foundInvoice.dueDate,
            paymentMethod: foundInvoice.paymentMethod,
            observations: foundInvoice.observations || '',
          });
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
      }
    }
  }, [id, form]);

  const onSubmit = (data: InvoiceFormData) => {
    updateInvoice(data, 'Borrador');
  };

  const onSubmitAsIssued = (data: InvoiceFormData) => {
    updateInvoice(data, 'Emitida');
  };

  const updateInvoice = (data: InvoiceFormData, status: 'Borrador' | 'Emitida') => {
    if (!invoice) return;

    setLoading(true);

    try {
      // Obtener todas las facturas del localStorage
      const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      const allInvoices: Invoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];

      // Si se va a emitir, validar y generar folio fiscal
      if (status === 'Emitida') {
        // Crear factura temporal con los nuevos datos
        const tempInvoice: Invoice = {
          ...invoice,
          ...data
        };

        // Validar antes de emitir
        const validation = validateInvoiceForEmission(tempInvoice);
        
        if (!validation.isValid) {
          toast({
            title: 'Validación fallida',
            description: validation.errors[0],
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Generar folio fiscal
        const fiscalFolio = generateFiscalFolio(allInvoices);

        // Actualizar factura con folio fiscal
        const updatedInvoices = allInvoices.map(inv => {
          if (inv.id === id) {
            return {
              ...inv,
              ...data,
              id: fiscalFolio.id,
              status: 'Emitida',
            };
          }
          return inv;
        });

        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));

        // Mostrar warnings
        validation.warnings.forEach(warning => {
          toast({
            title: 'Advertencia',
            description: warning,
          });
        });

        toast({
          title: 'Factura emitida',
          description: `Folio fiscal: ${fiscalFolio.id}`,
        });
      } else {
        // Solo actualizar borrador sin validación
        const updatedInvoices = allInvoices.map(inv => {
          if (inv.id === id) {
            return {
              ...inv,
              ...data,
              status: 'Borrador',
            };
          }
          return inv;
        });

        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));

        toast({
          title: 'Factura actualizada',
          description: 'Los cambios han sido guardados exitosamente.',
        });
      }

      navigate('/panel');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al actualizar la factura.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
            <p className="text-muted-foreground mb-4">La factura que intentas editar no existe o no es editable.</p>
            <Button onClick={() => navigate('/panel')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (invoice.status !== 'Borrador') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Factura no editable</h1>
            <p className="text-muted-foreground mb-4">
              Solo las facturas en estado "Borrador" pueden ser editadas.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/panel')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Button>
              <Button variant="outline" onClick={() => navigate(`/facturas/${id}/ver`)}>
                Ver Factura
              </Button>
            </div>
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
          
          <div>
            <h1 className="text-3xl font-bold text-primary">Editar Factura {invoice.id}</h1>
            <p className="text-muted-foreground mt-1">Modifica los datos de la factura en borrador</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre completo o razón social" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientNit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIT</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789-0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección completa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="cliente@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clientSegment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segmento del Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un segmento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="mayorista">Mayorista</SelectItem>
                            <SelectItem value="corporativo">Corporativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Emisión</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona método de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                            <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                            <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Moneda</FormLabel>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <span className="text-sm text-muted-foreground">Peso Colombiano (COP)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Observaciones (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Notas adicionales para la factura..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/panel')}
              >
                Cancelar
              </Button>
              
              <Button 
                type="submit" 
                variant="secondary"
                className="gap-2"
                disabled={loading}
              >
                <Save className="h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar como Borrador'}
              </Button>

              <Button 
                type="button"
                onClick={form.handleSubmit(onSubmitAsIssued)}
                className="gap-2"
                disabled={loading}
              >
                <Send className="h-4 w-4" />
                {loading ? 'Emitiendo...' : 'Emitir Factura'}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}