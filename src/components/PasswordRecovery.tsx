import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, KeyRound, Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';

// Esquemas de validación
const emailSchema = z.object({
  email: z.string().trim().email('Ingresa un email válido').max(255, 'Email muy largo')
});

const codeSchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos')
});

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña es muy larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type EmailForm = z.infer<typeof emailSchema>;
type CodeForm = z.infer<typeof codeSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

type RecoveryStep = 'email' | 'code' | 'password' | 'success';

interface PasswordRecoveryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordRecovery({ open, onOpenChange }: PasswordRecoveryProps) {
  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' }
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { 
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Paso 1: Enviar código al email
  const onSubmitEmail = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      // Simular llamada a API para enviar código
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generar código de 6 dígitos (en producción esto se haría en el backend)
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(generatedCode);
      setEmail(data.email);
      
      // Log del código para propósitos de demo (NUNCA hacer esto en producción)
      console.log(`[DEMO] Código de recuperación para ${data.email}: ${generatedCode}`);
      
      toast({
        title: 'Código enviado',
        description: `Se ha enviado un código de 6 dígitos a ${data.email}`,
      });
      
      setStep('code');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el código de recuperación. Intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Paso 2: Verificar código
  const onSubmitCode = async (data: CodeForm) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar código (en producción esto se verificaría en el backend)
      if (data.code === verificationCode || data.code === '123456') {
        toast({
          title: 'Código verificado',
          description: 'Ahora puedes establecer tu nueva contraseña',
        });
        setStep('password');
      } else {
        toast({
          title: 'Código incorrecto',
          description: 'El código ingresado no es válido. Verifica e intenta nuevamente.',
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

  // Paso 3: Cambiar contraseña
  const onSubmitPassword = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En producción, aquí se haría la llamada al backend para cambiar la contraseña
      console.log(`[DEMO] Contraseña cambiada para ${email}`);
      
      toast({
        title: 'Contraseña restablecida',
        description: 'Tu contraseña ha sido actualizada exitosamente',
      });
      
      setStep('success');
      
      // Cerrar automáticamente después de 2 segundos
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la contraseña. Intenta nuevamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setVerificationCode('');
    emailForm.reset();
    codeForm.reset();
    passwordForm.reset();
    onOpenChange(false);
  };

  const handleBackToEmail = () => {
    setStep('email');
    codeForm.reset();
  };

  const handleBackToCode = () => {
    setStep('code');
    passwordForm.reset();
  };

  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => document.getElementById('otp-code')?.focus(), 100);
    }
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Recuperar Contraseña
          </DialogTitle>
          <DialogDescription>
            {step === 'email' && 'Ingresa tu email para recibir un código de recuperación'}
            {step === 'code' && `Ingresa el código de 6 dígitos enviado a ${email}`}
            {step === 'password' && 'Establece tu nueva contraseña'}
            {step === 'success' && 'Tu contraseña ha sido restablecida exitosamente'}
          </DialogDescription>
        </DialogHeader>

        {/* Paso 1: Ingresar Email */}
        {step === 'email' && (
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
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="tu@email.com" 
                          className="pl-10" 
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Paso 2: Verificar Código */}
        {step === 'code' && (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(onSubmitCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Verificación</FormLabel>
                    <FormControl>
                      <InputOTP
                        id="otp-code"
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        containerClassName="justify-center"
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot 
                              key={index} 
                              index={index} 
                              className="h-14 w-14 text-lg"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                    <FormDescription className="text-center">
                      Revisa tu correo. Para esta demo, usa el código <span className="font-mono font-semibold">123456</span>
                    </FormDescription>
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBackToEmail} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Atrás
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1"
                >
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Paso 3: Nueva Contraseña */}
        {step === 'password' && (
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="Mínimo 8 caracteres" 
                          className="pl-10"
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="Repite tu contraseña" 
                          className="pl-10"
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormDescription className="text-xs">
                La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número
              </FormDescription>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBackToCode} 
                  className="flex-1"
                  disabled={isLoading}
                >
                  Atrás
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="flex-1"
                >
                  {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Paso 4: Éxito */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">¡Contraseña Actualizada!</h3>
              <p className="text-sm text-muted-foreground">
                Ahora puedes iniciar sesión con tu nueva contraseña
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
