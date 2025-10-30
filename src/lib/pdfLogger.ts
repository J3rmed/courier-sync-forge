interface PDFLog {
  timestamp: string;
  invoiceId: string;
  action: 'generation_started' | 'generation_success' | 'generation_error';
  templateId?: string;
  error?: string;
}

export const logPDFAction = (log: Omit<PDFLog, 'timestamp'>) => {
  const fullLog: PDFLog = {
    ...log,
    timestamp: new Date().toISOString()
  };
  
  // Guardar en localStorage para debugging
  const logs = JSON.parse(localStorage.getItem('pdf_logs') || '[]');
  logs.push(fullLog);
  
  // Mantener solo los últimos 100 logs
  if (logs.length > 100) {
    logs.shift();
  }
  
  localStorage.setItem('pdf_logs', JSON.stringify(logs));
  
  // También log en consola
  console.log('[PDF Action]', fullLog);
};
