import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, DollarSign, Image, Star, Swords, FolderOpen, ClipboardCheck, Megaphone, LogOut, ChevronRight } from 'lucide-react';
import { api } from '@/api/client';

const LOGO_URL = "/logo.jpeg";

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/atletas', label: 'Atletas', icon: Users },
  { to: '/admin/frequencia', label: 'Frequência', icon: ClipboardCheck },
  { to: '/admin/avisos', label: 'Avisos', icon: Megaphone },
  { to: '/admin/financeiro', label: 'Financeiro', icon: DollarSign },
  { to: '/admin/conteudo', label: 'Conteúdo CMS', icon: Image },
  { to: '/admin/patrocinadores', label: 'Patrocinadores', icon: Star },
  { to: '/admin/escalacoes', label: 'Módulo Tático', icon: Swords },
  { to: '/admin/transparencia', label: 'Transparência', icon: FolderOpen },
];

const trainerLinks = [
  { to: '/admin/atletas', label: 'Atletas', icon: Users },
  { to: '/admin/escalacoes', label: 'Módulo Tático', icon: Swords },
];

export default function AdminSidebar({ userRole }) {
  const location = useLocation();
  const links = userRole === 'admin' ? adminLinks : trainerLinks;

  return (
    <aside className="w-64 min-h-screen bg-navy flex flex-col border-r border-gold/20">
      <div className="p-4 border-b border-gold/20">
        <Link to="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Arco Iris" className="h-10 w-10 rounded-full object-cover border-2 border-gold" />
          <div>
            <p className="font-montserrat font-black text-white text-xs leading-tight">ESCOLINHA</p>
            <p className="font-montserrat font-black text-gold text-sm leading-tight">ARCO IRIS</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-montserrat font-semibold text-sm transition-all group ${
                active
                  ? 'bg-burgundy text-white border border-gold/40'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={18} className={active ? 'text-gold' : 'text-white/50 group-hover:text-gold'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-gold" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gold/20 space-y-3">
        <Link to="/" className="block text-center text-white/50 text-xs hover:text-gold transition-colors">
          ← Ver site público
        </Link>
        <button
          onClick={() => api.auth.logout('/')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg text-sm font-montserrat transition-all"
        >
          <LogOut size={16} />
          Sair
        </button>
        <p className="text-center text-white/30 text-xs">Plataforma por MzTecSoluções</p>
      </div>
    </aside>
  );
}