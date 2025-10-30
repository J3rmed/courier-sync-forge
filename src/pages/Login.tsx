import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import PasswordRecovery from '@/components/PasswordRecovery';
const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida')
});
type LoginForm = z.infer<typeof loginSchema>;
export default function Login() {
  const {
    user,
    login
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Si ya está autenticado, redirigir al panel
  if (user) {
    return <Navigate to="/panel" replace />;
  }
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        toast({
          title: 'Bienvenido a CourierSync',
          description: 'Has iniciado sesión correctamente'
        });
      } else {
        toast({
          title: 'Error de autenticación',
          description: 'Email o contraseña incorrectos',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ocurrió un error al iniciar sesión',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-accent/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">CourierSync</CardTitle>
            <CardDescription>Sistema de Facturación para Logística</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="tu@email.com" className="pl-10" autoComplete="email" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <FormField control={form.control} name="password" render={({
              field
            }) => <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="password" placeholder="Tu contraseña" className="pl-10" autoComplete="current-password" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </Form>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="text-sm text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </CardContent>
        
        <PasswordRecovery 
          open={showRecovery} 
          onOpenChange={setShowRecovery} 
        />
      </Card>
    </div>;
}