import { Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminRoute() {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const location = useLocation();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-gold border-t-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} className="text-burgundy" />
          </div>
          <h1 className="font-montserrat font-black text-burgundy text-2xl mb-3">Acesso Restrito</h1>
          <p className="text-gray-600 mb-8">
            Você não tem permissão para acessar o painel administrativo.
            Apenas administradores autorizados podem visualizar esta área.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-burgundy text-white font-montserrat font-bold rounded-lg hover:bg-burgundy/90 transition-all"
          >
            <ArrowLeft size={18} />
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}