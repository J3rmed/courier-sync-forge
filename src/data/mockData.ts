import { Shipment, Invoice, User, PDFTemplate } from '@/types';

// Usuario mock para el login
export const mockUser: User = {
  id: '1',
  email: 'admin@couriersync.com',
  name: 'Administrador CourierSync'
};

// Función para generar envíos de ejemplo
const generateShipments = (): Shipment[] => {
  const ciudades = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Cúcuta',
    'Manizales', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia'
  ];
  
  const calles = [
    'Carrera', 'Calle', 'Avenida', 'Diagonal', 'Transversal', 'Circular'
  ];
  
  const shipments: Shipment[] = [];
  
  for (let i = 1; i <= 100; i++) {
    const ciudad = ciudades[Math.floor(Math.random() * ciudades.length)];
    const tipoCalle = calles[Math.floor(Math.random() * calles.length)];
    const numero1 = Math.floor(Math.random() * 100) + 1;
    const numero2 = Math.floor(Math.random() * 50) + 1;
    const numero3 = Math.floor(Math.random() * 100) + 1;
    
    const peso = parseFloat((Math.random() * 9.5 + 0.5).toFixed(1)); // 0.5 a 10 kg
    const tarifaBase = ciudad === 'Bogotá' ? 12000 : 
                      ciudad === 'Medellín' || ciudad === 'Cali' ? 18000 : 25000;
    const tarifaPeso = Math.floor(peso * 2500);
    const tarifa = tarifaBase + tarifaPeso + Math.floor(Math.random() * 5000);
    
    shipments.push({
      id: `ENV-${String(i).padStart(3, '0')}`,
      direccion: `${tipoCalle} ${numero1} #${numero2}-${numero3}, ${ciudad}`,
      pesoKg: peso,
      tarifa: tarifa,
      estado: 'No facturado'
    });
  }
  
  return shipments;
};

// Datos iniciales de envíos
export const initialShipments: Shipment[] = generateShipments();

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

// Facturas de ejemplo (vacío para empezar desde cero)
export const initialInvoices: Invoice[] = [];