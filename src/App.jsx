import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import AdminRoute from '@/components/AdminRoute';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import Home from './pages/Home';
import Historia from './pages/Historia';
import Galeria from './pages/Galeria';
import Patrocinadores from './pages/Patrocinadores';
import Matricula from './pages/Matricula';
import Projeto from './pages/Projeto';
import Transparencia from './pages/Transparencia';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Atletas from './pages/admin/Atletas';
import AtletaDetalhe from './pages/admin/AtletaDetalhe';
import Financeiro from './pages/admin/Financeiro';
import Conteudo from './pages/admin/Conteudo';
import AdminPatrocinadores from './pages/admin/AdminPatrocinadores';
import Escalacoes from './pages/admin/Escalacoes';
import AdminTransparencia from './pages/admin/Transparencia';
import Frequencia from './pages/admin/Frequencia';
import Avisos from './pages/admin/Avisos';

const AuthenticatedApp = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/historia" element={<Historia />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/patrocinadores" element={<Patrocinadores />} />
        <Route path="/projeto" element={<Projeto />} />
        <Route path="/transparencia" element={<Transparencia />} />
        <Route path="/matricula" element={<Matricula />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="atletas" element={<Atletas />} />
        <Route path="atletas/:id" element={<AtletaDetalhe />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="conteudo" element={<Conteudo />} />
        <Route path="patrocinadores" element={<AdminPatrocinadores />} />
        <Route path="escalacoes" element={<Escalacoes />} />
        <Route path="transparencia" element={<AdminTransparencia />} />
        <Route path="frequencia" element={<Frequencia />} />
        <Route path="avisos" element={<Avisos />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;