import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { api } from '@/api/client';
import { Menu } from 'lucide-react';

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar userRole={user?.role} />
      </div>

      {/* Sidebar mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AdminSidebar userRole={user?.role} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-navy border-b border-gold/20">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={22} />
          </button>
          <p className="font-montserrat font-bold text-white text-sm">Painel Arco Iris</p>
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet context={{ user }} />
        </main>

        <div className="px-6 py-2 bg-white border-t border-gray-100 text-right">
          <p className="text-gray-400 text-xs">Plataforma desenvolvida por MzTecSoluções</p>
        </div>
      </div>
    </div>
  );
}