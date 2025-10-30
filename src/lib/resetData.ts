import { STORAGE_KEYS } from '@/types';
import { initialShipments, initialInvoices } from '@/data/mockData';

/**
 * Reinicia los datos del localStorage con los valores iniciales
 * Útil para desarrollo y testing
 */
export const resetLocalStorage = () => {
  // Limpiar datos existentes
  localStorage.removeItem(STORAGE_KEYS.SHIPMENTS);
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
  
  // Establecer datos iniciales
  localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(initialShipments));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
  
  console.log('✅ LocalStorage reiniciado exitosamente');
  console.log(`📦 ${initialShipments.length} envíos cargados`);
  console.log(`📄 ${initialInvoices.length} facturas cargadas`);
};

// Exponer globalmente para usar en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).resetData = resetLocalStorage;
}
