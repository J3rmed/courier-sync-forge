import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/layout/Header';
import { Shipment, STORAGE_KEYS } from '@/types';
import { initialShipments } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { resetLocalStorage } from '@/lib/resetData';

export default function SelectShipments() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);

  useEffect(() => {
    // Reiniciar datos automáticamente si no hay envíos
    const savedShipments = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
    if (!savedShipments || JSON.parse(savedShipments).length === 0) {
      resetLocalStorage();
    }
    
    // Cargar envíos del localStorage o usar datos iniciales
    if (savedShipments) {
      try {
        const parsed = JSON.parse(savedShipments);
        setShipments(parsed);
      } catch (error) {
        console.error('Error loading shipments:', error);
        setShipments(initialShipments);
        localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(initialShipments));
      }
    } else {
      setShipments(initialShipments);
      localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(initialShipments));
    }
  }, []);

  const availableShipments = shipments.filter(s => s.estado === 'No facturado');

  const handleShipmentToggle = (shipmentId: string) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId)
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShipments.length === availableShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(availableShipments.map(s => s.id));
    }
  };

  const handleContinue = () => {
    if (selectedShipments.length === 0) {
      toast({
        title: 'Selección requerida',
        description: 'Debes seleccionar al menos un envío para continuar',
        variant: 'destructive',
      });
      return;
    }

    // Guardar los envíos seleccionados en sessionStorage para la siguiente página
    const selectedShipmentData = shipments.filter(s => selectedShipments.includes(s.id));
    sessionStorage.setItem('selectedShipments', JSON.stringify(selectedShipmentData));
    
    navigate('/facturas/nueva');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalSelected = selectedShipments.reduce((sum, id) => {
    const shipment = shipments.find(s => s.id === id);
    return sum + (shipment?.tarifa || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/panel')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Seleccionar Envíos</h1>
            <p className="text-muted-foreground mt-1">Elige los envíos que deseas incluir en la factura</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Envíos Disponibles para Facturar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableShipments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay envíos disponibles</h3>
                  <p className="text-muted-foreground">
                    Todos los envíos ya han sido facturados
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedShipments.length === availableShipments.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Seleccionar todos ({availableShipments.length} envíos)
                      </label>
                    </div>
                    {selectedShipments.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedShipments.length} seleccionados • Total: {formatCurrency(totalSelected)}
                      </div>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>ID Envío</TableHead>
                        <TableHead>Dirección de Destino</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                        <TableHead>Tarifa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableShipments.map((shipment) => (
                        <TableRow key={shipment.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedShipments.includes(shipment.id)}
                              onCheckedChange={() => handleShipmentToggle(shipment.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{shipment.id}</TableCell>
                          <TableCell>{shipment.direccion}</TableCell>
                          <TableCell>{shipment.pesoKg} kg</TableCell>
                          <TableCell>{formatCurrency(shipment.tarifa)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

          {selectedShipments.length > 0 && (
            <Card className="bg-accent/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Resumen de Selección</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedShipments.length} envíos seleccionados • Subtotal: {formatCurrency(totalSelected)}
                    </p>
                  </div>
                  <Button
                    onClick={handleContinue}
                    className="gap-2"
                    size="lg"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}