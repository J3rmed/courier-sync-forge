import { Shipment, Invoice, User, PDFTemplate } from '@/types';

// Usuario mock para el login
export const mockUser: User = {
  id: '1',
  email: 'admin@couriersync.com',
  name: 'Administrador CourierSync'
};

// Datos iniciales de envíos
export const initialShipments: Shipment[] = [
  {
    id: 'ENV-001',
    direccion: 'Carrera 7 #32-45, Bogotá',
    pesoKg: 2.5,
    tarifa: 15000,
    estado: 'No facturado'
  },
  {
    id: 'ENV-002',
    direccion: 'Calle 50 #25-30, Medellín',
    pesoKg: 1.8,
    tarifa: 25000,
    estado: 'No facturado'
  },
  {
    id: 'ENV-003',
    direccion: 'Av. El Dorado #68-15, Bogotá',
    pesoKg: 3.2,
    tarifa: 18000,
    estado: 'No facturado'
  },
  {
    id: 'ENV-004',
    direccion: 'Carrera 15 #85-40, Cali',
    pesoKg: 0.9,
    tarifa: 22000,
    estado: 'No facturado'
  },
  {
    id: 'ENV-005',
    direccion: 'Calle 72 #10-34, Barranquilla',
    pesoKg: 4.1,
    tarifa: 35000,
    estado: 'No facturado'
  },
  {
    id: 'ENV-006',
    direccion: 'Transversal 45 #26-18, Bucaramanga',
    pesoKg: 2.0,
    tarifa: 28000,
    estado: 'No facturado'
  }
];

// Plantillas PDF por defecto
export const defaultTemplates: PDFTemplate[] = [
  {
    id: 'template-retail',
    name: 'Plantilla Retail',
    segment: 'retail',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    footerText: 'Gracias por su compra. Cliente retail preferencial.',
    companyInfo: {
      name: 'CourierSync Colombia',
      nit: '900.000.000-1',
      address: 'Calle 100 #19-20, Bogotá',
      phone: '+57 (1) 600-0000',
      email: 'facturacion@couriersync.com'
    }
  },
  {
    id: 'template-mayorista',
    name: 'Plantilla Mayorista',
    segment: 'mayorista',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    footerText: 'Cliente mayorista. Condiciones especiales aplicadas.',
    companyInfo: {
      name: 'CourierSync Colombia',
      nit: '900.000.000-1',
      address: 'Calle 100 #19-20, Bogotá',
      phone: '+57 (1) 600-0000',
      email: 'mayoristas@couriersync.com'
    }
  },
  {
    id: 'template-corporativo',
    name: 'Plantilla Corporativo',
    segment: 'corporativo',
    primaryColor: '#8b5cf6',
    secondaryColor: '#6d28d9',
    footerText: 'Cliente corporativo premium. Servicio de atención 24/7.',
    companyInfo: {
      name: 'CourierSync Colombia',
      nit: '900.000.000-1',
      address: 'Calle 100 #19-20, Bogotá',
      phone: '+57 (1) 600-0000',
      email: 'corporativo@couriersync.com'
    }
  }
];

// Facturas de ejemplo
export const initialInvoices: Invoice[] = [
  {
    id: 'F-2025-001',
    status: 'Emitida',
    clientName: 'Comercializadora ABC S.A.S.',
    clientNit: '900.123.456-7',
    clientAddress: 'Calle 26 #13-25, Bogotá',
    clientEmail: 'contabilidad@abc.com',
    clientSegment: 'mayorista',
    issueDate: '2025-01-15',
    dueDate: '2025-02-15',
    paymentMethod: 'Transferencia Bancaria',
    currency: 'Peso Colombiano',
    items: [
      {
        descripcion: 'Transporte a Carrera 7 #32-45, Bogotá',
        cantidad: 1,
        precioUnitario: 15000
      },
      {
        descripcion: 'Transporte a Calle 50 #25-30, Medellín',
        cantidad: 1,
        precioUnitario: 25000
      }
    ],
    subtotal: 40000,
    taxAmount: 7600,
    total: 47600,
    observations: 'Entrega express solicitada'
  }
];