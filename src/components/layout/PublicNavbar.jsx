import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LOGO_URL = "/logo.jpeg";

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Início' },
    { to: '/historia', label: 'Nossa História' },
    { to: '/galeria', label: 'Galeria' },
    { to: '/patrocinadores', label: 'Patrocinadores' },
    { to: '/projeto', label: 'Projeto Social - CMDCA' },
    { to: '/transparencia', label: 'Transparência' },
    { to: '/matricula', label: 'Matrícula' },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-burgundy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Arco Iris" className="h-12 w-12 rounded-full object-cover border-2 border-gold" />
            <div className="hidden sm:block">
              <p className="font-montserrat font-black text-white text-sm leading-tight">ESCOLINHA DE FUTEBOL</p>
              <p className="font-montserrat font-black text-gold text-lg leading-tight">ARCO IRIS</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded font-montserrat font-600 text-sm transition-all ${
                  isActive(l.to)
                    ? 'bg-gold text-burgundy font-bold'
                    : 'text-white hover:text-gold'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/admin/dashboard"
              className="ml-4 px-4 py-2 bg-navy text-white font-montserrat font-bold text-sm rounded border border-gold hover:bg-gold hover:text-navy transition-all"
            >
              Painel Admin
            </Link>
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-burgundy border-t border-gold/30 px-4 py-3 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded font-montserrat font-semibold text-sm ${
                isActive(l.to) ? 'bg-gold text-burgundy' : 'text-white hover:text-gold'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/admin/dashboard"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 bg-navy text-white font-montserrat font-bold text-sm rounded border border-gold mt-2"
          >
            Painel Admin
          </Link>
        </div>
      )}
    </nav>
  );
}