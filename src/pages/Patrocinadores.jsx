import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Star, TrendingUp, Users, Heart, ArrowRight, Mail } from 'lucide-react';

const BENEFICIOS = [
  { icon: TrendingUp, title: 'Visibilidade Regional', desc: 'Sua marca exposta em todos os uniformes, materiais e redes sociais da escolinha, alcançando toda a comunidade de Nilo Peçanha e região.' },
  { icon: Users, title: 'Associação Positiva', desc: 'Vincule sua marca a valores nobres: educação, esporte, disciplina e transformação social de crianças e jovens.' },
  { icon: Star, title: 'Presença Digital', desc: 'Logo em destaque no nosso site profissional, acessado por pais, responsáveis e parceiros da região.' },
  { icon: Heart, title: 'Impacto Social', desc: 'Contribua diretamente com o desenvolvimento de crianças e jovens de Nilo Peçanha através do futebol.' },
];

export default function Patrocinadores() {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    api.entities.Sponsor.filter({ ativo: true }, 'ordem').then(setSponsors).catch(() => {});
  }, []);

  return (
    <div className="font-roboto">
      {/* Hero */}
      <section className="relative py-32 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-burgundy rounded-full transform -translate-x-16 translate-y-16" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-montserrat font-semibold text-gold uppercase tracking-widest text-sm mb-4">
            Parceiros que acreditam no esporte
          </p>
          <h1 className="font-montserrat font-black text-white text-5xl md:text-6xl mb-4">
            SEJA UM<br /><span className="text-gold">PATROCINADOR</span>
          </h1>
          <div className="w-16 h-1 bg-gold mx-auto mb-6" />
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Um espaço exclusivo para os parceiros da Arco Iris. Junte-se a nós e faça parte da transformação de vidas através do futebol.
          </p>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block w-12 h-1 bg-gold mb-4" />
            <h2 className="font-montserrat font-black text-burgundy text-3xl">POR QUE PATROCINAR?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {BENEFICIOS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-5 p-6 bg-gray-50 rounded-xl card-gold-border hover:shadow-md transition-all">
                <div className="flex-shrink-0 w-14 h-14 bg-burgundy rounded-xl flex items-center justify-center">
                  <Icon size={26} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-burgundy text-lg mb-2">{title}</h3>
                  <p className="text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parceiros Atuais */}
      {sponsors.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block w-12 h-1 bg-gold mb-4" />
              <h2 className="font-montserrat font-black text-burgundy text-3xl">NOSSOS PARCEIROS</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {sponsors.map((s, i) => (
                <a key={i} href={s.siteUrl || '#'} target="_blank" rel="noopener noreferrer"
                  className="bg-white rounded-xl p-6 flex items-center justify-center border-2 border-gold/20 hover:border-gold shadow-sm hover:shadow-md transition-all min-h-24">
                  {s.logoUrl
                    ? <img src={s.logoUrl} alt={s.nome} className="max-h-16 object-contain" />
                    : <span className="font-montserrat font-bold text-burgundy text-center">{s.nome}</span>
                  }
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Contato */}
      <section className="py-20 px-4 bg-burgundy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-black text-white text-4xl mb-4">VAMOS CONVERSAR?</h2>
          <div className="w-16 h-1 bg-gold mx-auto mb-6" />
          <p className="text-white/80 text-lg mb-8">
            Entre em contato conosco e descubra as opções de patrocínio disponíveis para a sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:assarcoiris@gmail.com"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gold text-burgundy font-montserrat font-black text-lg rounded-lg hover:bg-yellow-400 transition-all"
            >
              <Mail size={22} />
              assarcoiris@gmail.com
            </a>
            <a
              href="tel:+5573998518813"
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-gold text-gold font-montserrat font-black text-lg rounded-lg hover:bg-gold hover:text-burgundy transition-all"
            >
              (73) 9 9851-8813
            </a>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Associação Escolinha de Futebol Arco-Iris · CNPJ: 35.308.686/0001-67<br/>
            1ª Travessa Dona Laura, Baixa Fria — Nilo Peçanha-BA
          </p>
        </div>
      </section>
    </div>
  );
}