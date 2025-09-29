import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';

const emailSchema = z.object({
  email: z.string().email('Ingresa un email válido')
});

const codeSchema = z.object({
  code: z.string().min(6, 'El código debe tener 6 dígitos').max(6, 'El código debe tener 6 dígitos')
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;

interface PasswordRecoveryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordRecovery({ open, onOpenChange }: PasswordRecoveryProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' }
  });

  const onSubmitEmail = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      // Simular envío de código
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmail(data.email);
      setStep('code');
      toast({
        title: 'Código enviado',
        description: `Se ha enviado un código de recuperación a ${data.email}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al enviar el código',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCode = async (data: CodeForm) => {
    setIsLoading(true);
    try {
      // Simular verificación de código
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (data.code === '123456') {
        toast({
          title: 'Código verificado',
          description: 'Tu contraseña ha sido restablecida. Puedes iniciar sesión con cualquier contraseña.'
        });
        handleClose();
      } else {
        toast({
          title: 'Código incorrecto',
          description: 'El código ingresado no es válido. Intenta nuevamente.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al verificar el código',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    emailForm.reset();
    codeForm.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Recuperar Contraseña
          </DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Ingresa tu email para recibir un código de recuperación'
              : `Ingresa el código de 6 dígitos enviado a ${email}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="tu@email.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Verificación</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="123456" 
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                        autoComplete="one-time-code"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground text-center">
                      Para esta demo, usa el código: <span className="font-mono font-semibold">123456</span>
                    </p>
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('email')} className="flex-1">
                  Atrás
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}