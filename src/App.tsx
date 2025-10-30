import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import Login from "./pages/Login";
import Panel from "./pages/Panel";
import SelectShipments from "./pages/SelectShipments";
import CreateInvoice from "./pages/CreateInvoice";
import ViewInvoice from "./pages/ViewInvoice";
import EditInvoice from "./pages/EditInvoice";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AccessibilityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessibilityMenu />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/panel" element={
                <ProtectedRoute>
                  <Panel />
                </ProtectedRoute>
              } />
              <Route path="/facturas/nueva/seleccionar-envios" element={
                <ProtectedRoute>
                  <SelectShipments />
                </ProtectedRoute>
              } />
              <Route path="/facturas/nueva" element={
                <ProtectedRoute>
                  <CreateInvoice />
                </ProtectedRoute>
              } />
              <Route path="/facturas/:id/ver" element={
                <ProtectedRoute>
                  <ViewInvoice />
                </ProtectedRoute>
              } />
              <Route path="/facturas/:id/editar" element={
                <ProtectedRoute>
                  <EditInvoice />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AccessibilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
