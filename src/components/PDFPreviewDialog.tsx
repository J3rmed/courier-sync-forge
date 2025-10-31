import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PDFPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob | null;
  invoiceId: string;
  onDownload: () => void;
}

export function PDFPreviewDialog({ 
  open, 
  onOpenChange, 
  pdfBlob, 
  invoiceId,
  onDownload 
}: PDFPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob && open) {
      const url = URL.createObjectURL(pdfBlob);
      setPreviewUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    }
  }, [pdfBlob, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa - Factura {invoiceId}</DialogTitle>
          <DialogDescription>
            Revisa el PDF antes de descargarlo
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-muted">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              title={`Vista previa de factura ${invoiceId}`}
              aria-label="Vista previa del PDF de la factura"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Cargando vista previa...</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cerrar
          </Button>
          <Button
            onClick={onDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
