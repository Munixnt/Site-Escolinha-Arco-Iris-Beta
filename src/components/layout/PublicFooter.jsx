import { useEffect, useState } from 'react';
import { api } from '@/api/client';

const LOGO_URL = "/logo.jpeg";

export default function PublicFooter() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    api.entities.Sponsor.filter({ ativo: true }, 'ordem').then(setSponsors).catch(() => {});
  }, []);

  return (
    <footer className="bg-burgundy text-white">
      {sponsors.length > 0 && (
        <div className="border-t border-gold/30 py-6 overflow-hidden">
          <p className="text-center text-gold font-montserrat font-semibold text-xs uppercase tracking-widest mb-4">
            Nossos Patrocinadores
          </p>
          <div className="relative overflow-hidden">
            <div className="sponsor-track flex gap-12 items-center" style={{ width: 'max-content' }}>
              {[...sponsors, ...sponsors].map((s, i) => (
                <a key={i} href={s.siteUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 h-12 flex items-center opacity-80 hover:opacity-100 transition-opacity">
                  {s.logoUrl
                    ? <img src={s.logoUrl} alt={s.nome} className="h-10 object-contain filter brightness-0 invert" />
                    : <span className="text-white font-montserrat font-bold text-sm px-4 py-2 border border-gold/40 rounded">{s.nome}</span>
                  }
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gold/20 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Arco Iris" className="h-16 w-16 rounded-full object-cover border-2 border-gold" />
            <div>
              <p className="font-montserrat font-black text-white text-sm">ESCOLINHA DE FUTEBOL</p>
              <p className="font-montserrat font-black text-gold text-lg">ARCO IRIS</p>
              <p className="text-white/60 text-xs mt-1">Fundada em 13/08/2017</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gold font-montserrat font-semibold text-sm mb-1">Nilo Peçanha — BA | Baixo Sul da Bahia</p>
            <p className="text-white/70 text-xs italic">"Fazendo Hoje Para Refletir no Amanhã"</p>
            <p className="text-white/50 text-xs mt-2">1ª Travessa Dona Laura, Baixa Fria</p>
            <p className="text-white/50 text-xs">(73) 9 9851-8813 · assarcoiris@gmail.com</p>
            <p className="text-white/40 text-xs mt-1">CNPJ: 35.308.686/0001-67</p>
          </div>

          <div className="text-right">
            <p className="text-white/50 text-xs">Plataforma desenvolvida por</p>
            <a href="http://www.mztecsolucoes.com.br" target="_blank" rel="noopener noreferrer"
              className="text-gold font-montserrat font-bold text-sm hover:underline">
              MzTecSoluções
            </a>
            <p className="text-white/40 text-xs mt-1">contato@mztecsolucoes.com.br</p>
          </div>
        </div>
        <div className="text-center mt-6 pt-4 border-t border-white/10">
          <p className="text-white/40 text-xs">© {new Date().getFullYear()} Escolinha de Futebol Arco Iris. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}