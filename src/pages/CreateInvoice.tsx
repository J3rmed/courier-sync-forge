import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Send, User, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Shipment, Invoice, InvoiceItem, STORAGE_KEYS } from '@/types';
import { toast } from '@/hooks/use-toast';
import { validateInvoiceForEmission } from '@/lib/invoiceValidator';
import { generateFiscalFolio } from '@/lib/fiscalFolioGenerator';

const invoiceSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientNit: z.string().min(1, 'El NIT es requerido'),
  clientAddress: z.string().min(1, 'La dirección es requerida'),
  clientEmail: z.string().email('Email inválido'),
  clientSegment: z.enum(['retail', 'mayorista', 'corporativo']).optional(),
  issueDate: z.string().min(1, 'La fecha de emisión es requerida'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  observations: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [selectedShipments, setSelectedShipments] = useState<Shipment[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientNit: '',
      clientAddress: '',
      clientEmail: '',
      clientSegment: 'retail',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 días
      paymentMethod: 'Transferencia Bancaria',
      observations: '',
    },
  });

  useEffect(() => {
    // Cargar envíos seleccionados desde sessionStorage
    const savedShipments = sessionStorage.getItem('selectedShipments');
    if (savedShipments) {
      try {
        const shipments: Shipment[] = JSON.parse(savedShipments);
        setSelectedShipments(shipments);
        
        // Convertir envíos a items de factura
        const items: InvoiceItem[] = shipments.map(shipment => ({
          descripcion: `Transporte a ${shipment.direccion}`,
          cantidad: 1,
          precioUnitario: shipment.tarifa,
        }));
        
        setInvoiceItems(items);
      } catch (error) {
        console.error('Error loading selected shipments:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los envíos seleccionados',
          variant: 'destructive',
        });
        navigate('/facturas/nueva/seleccionar-envios');
      }
    } else {
      navigate('/facturas/nueva/seleccionar-envios');
    }
  }, [navigate]);

  // Cálculos automáticos
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  const taxAmount = subtotal * 0.19;
  const total = subtotal + taxAmount;

  const generateInvoiceId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `Draft-${year}-${random}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: InvoiceFormData, shouldEmit: boolean = false) => {
    setIsLoading(true);
    
    try {
      // Crear objeto de factura temporal
      const tempInvoice: Invoice = {
        id: 'TEMP',
        status: 'Borrador',
        clientName: data.clientName,
        clientNit: data.clientNit,
        clientAddress: data.clientAddress,
        clientEmail: data.clientEmail,
        clientSegment: data.clientSegment,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        currency: 'Peso Colombiano',
        items: invoiceItems,
        subtotal,
        taxAmount,
        total,
        observations: data.observations,
      };

      // Si se va a emitir, validar primero
      if (shouldEmit) {
        const validation = validateInvoiceForEmission(tempInvoice);
        
        if (!validation.isValid) {
          toast({
            title: 'Validación fallida',
            description: validation.errors[0],
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Generar folio fiscal
        const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
        const existingInvoices: Invoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
        const fiscalFolio = generateFiscalFolio(existingInvoices);
        
        tempInvoice.id = fiscalFolio.id;
        tempInvoice.status = 'Emitida';
        
        // Mostrar warnings
        validation.warnings.forEach(warning => {
          toast({
            title: 'Advertencia',
            description: warning,
          });
        });
      } else {
        // Generar ID de borrador
        tempInvoice.id = generateInvoiceId();
      }

      // Guardar factura
      const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
      const invoices: Invoice[] = savedInvoices ? JSON.parse(savedInvoices) : [];
      invoices.push(tempInvoice);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

      // Actualizar envíos si se emitió
      if (shouldEmit) {
        const savedShipments = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
        if (savedShipments) {
          const shipments: Shipment[] = JSON.parse(savedShipments);
          const updatedShipments = shipments.map(shipment => 
            selectedShipments.find(s => s.id === shipment.id)
              ? { ...shipment, estado: 'Facturado' as const }
              : shipment
          );
          localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(updatedShipments));
        }
      }

      sessionStorage.removeItem('selectedShipments');

      toast({
        title: shouldEmit ? 'Factura emitida' : 'Borrador guardado',
        description: shouldEmit 
          ? `Factura ${tempInvoice.id} emitida correctamente`
          : `Borrador ${tempInvoice.id} guardado correctamente`,
      });

      navigate('/panel');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar la factura',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/facturas/nueva/seleccionar-envios')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Selección
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Crear Nueva Factura</h1>
            <p className="text-muted-foreground mt-1">Completa los datos para generar la factura</p>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Datos del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Datos del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre o Razón Social</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Comercializadora ABC S.A.S." {...field} />
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
                          <Input placeholder="Ej: 900.123.456-7" {...field} />
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
                          <Input placeholder="Ej: Calle 26 #13-25, Bogotá" {...field} />
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
                          <Input type="email" placeholder="contabilidad@empresa.com" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Datos de la Factura */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Datos de la Factura
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el método de pago" />
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
                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas adicionales sobre la factura..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Conceptos de la Factura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conceptos de la Factura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.descripcion}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{formatCurrency(item.precioUnitario)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.cantidad * item.precioUnitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Resumen de Totales */}
            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen de Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((data) => onSubmit(data, false))}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Borrador
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                disabled={isLoading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Emitir Factura
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}