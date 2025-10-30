import { useState } from 'react';
import { Eye, ZoomIn, ZoomOut, RefreshCw, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { toast } from 'sonner';

export default function AccessibilityMenu() {
  const {
    fontSize,
    contrastMode,
    increaseFontSize,
    decreaseFontSize,
    toggleContrastMode,
    resetSettings
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const getFontSizeLabel = () => {
    if (fontSize === 'normal') return 'Normal';
    if (fontSize === 'large') return 'Grande';
    return 'Extra Grande';
  };

  const handleIncrease = () => {
    if (fontSize === 'extra-large') {
      toast.info('Tamaño máximo', {
        description: 'Ya has alcanzado el tamaño de fuente máximo'
      });
      return;
    }
    increaseFontSize();
    toast.success('Texto aumentado', {
      description: 'El tamaño de fuente ha aumentado'
    });
  };

  const handleDecrease = () => {
    if (fontSize === 'normal') {
      toast.info('Tamaño mínimo', {
        description: 'Ya estás en el tamaño de fuente normal'
      });
      return;
    }
    decreaseFontSize();
    toast.success('Texto reducido', {
      description: 'El tamaño de fuente ha disminuido'
    });
  };

  const handleToggleContrast = () => {
    toggleContrastMode();
    toast.success(
      contrastMode === 'normal' ? 'Modo alto contraste activado' : 'Modo normal activado',
      {
        description: contrastMode === 'normal' 
          ? 'Los colores ahora tienen mayor contraste' 
          : 'Los colores han vuelto a la normalidad'
      }
    );
  };

  const handleReset = () => {
    resetSettings();
    toast.success('Configuración restablecida', {
      description: 'Se han restaurado los valores por defecto'
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-background border-2"
          title="Menú de Accesibilidad"
        >
          <Eye className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-background border-2 shadow-xl"
        sideOffset={10}
      >
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Accesibilidad
            </CardTitle>
            <CardDescription>
              Ajusta la visualización según tus necesidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tamaño de Fuente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Tamaño de Texto</label>
                <Badge variant="secondary">{getFontSizeLabel()}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrease}
                  disabled={fontSize === 'normal'}
                  className="flex-1 gap-2"
                >
                  <ZoomOut className="h-4 w-4" />
                  Disminuir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleIncrease}
                  disabled={fontSize === 'extra-large'}
                  className="flex-1 gap-2"
                >
                  <ZoomIn className="h-4 w-4" />
                  Aumentar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Modo de Contraste */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Contraste</label>
                <Badge variant={contrastMode === 'high' ? 'default' : 'secondary'}>
                  {contrastMode === 'high' ? 'Alto' : 'Normal'}
                </Badge>
              </div>
              <Button
                variant={contrastMode === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleContrast}
                className="w-full gap-2"
              >
                <Contrast className="h-4 w-4" />
                {contrastMode === 'high' ? 'Desactivar Alto Contraste' : 'Activar Alto Contraste'}
              </Button>
            </div>

            <Separator />

            {/* Restablecer */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full gap-2"
              disabled={fontSize === 'normal' && contrastMode === 'normal'}
            >
              <RefreshCw className="h-4 w-4" />
              Restablecer Valores
            </Button>

            <div className="text-xs text-muted-foreground text-center pt-2">
              Tus preferencias se guardan automáticamente
            </div>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
