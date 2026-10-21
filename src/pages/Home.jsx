import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar, Star, ArrowRight, Shield, Heart } from 'lucide-react';

const LOGO_URL = "/logo.jpeg";

const STATS = [
{ icon: Calendar, value: '2017', label: 'Fundada em' },
{ icon: Users, value: '50+', label: 'Atletas no Projeto' },
{ icon: Trophy, value: 'Sub-8 ao Sub-15', label: 'Categorias' },
{ icon: Star, value: 'Nilo Peçanha-BA', label: 'Baixo Sul da Bahia' }];

const FEATURES = [
{ icon: Shield, title: 'Inclusão Social', desc: 'Contribuímos na formação de cidadãos, buscando a inclusão social através de iniciativas técnico-didático-pedagógicas voltadas ao futebol.' },
{ icon: Trophy, title: 'Metodologia Estruturada', desc: 'Treinos tematizados com fundamentos básicos (8-11 anos), derivados e específicos (12-15 anos), desenvolvendo o atleta completo.' },
{ icon: Heart, title: 'Comunidade e Família', desc: 'Atendemos crianças e adolescentes das comunidades de Nilo Peçanha e Jatimane, fortalecendo o convívio social e familiar.' }];


export default function Home() {
  return (
    <div className="font-roboto">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          


          
          
          <div className="absolute inset-0 hero-overlay" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <img
            src={LOGO_URL}
            alt="Escudo Arco Iris"
            className="w-36 h-36 md:w-48 md:h-48 mx-auto rounded-full object-cover border-4 border-gold shadow-2xl mb-6" />
          
          <p className="font-montserrat font-semibold text-gold text-sm uppercase tracking-widest mb-2">
            Escolinha de Futebol
          </p>
          <h1 className="font-montserrat font-black text-white text-5xl md:text-7xl leading-none mb-3">ARCO íRIS

          </h1>
          <div className="w-24 h-1 bg-gold mx-auto mb-6" />
          <p className="font-montserrat font-bold text-gold text-xl md:text-2xl mb-2 italic">"Projeto: Fazendo Hoje Para Refletir no Amanhã - Parte III"

          </p>
          <p className="text-white/80 text-base md:text-lg mb-10 font-roboto">
            OSC fundada em 13 de agosto de 2017 em Nilo Peçanha-BA. Transformando vidas através do futebol nas comunidades do Baixo Sul da Bahia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/matricula"
              className="px-8 py-4 bg-gold text-burgundy font-montserrat font-black text-lg rounded-lg hover:bg-yellow-400 transition-all shadow-lg flex items-center gap-2 justify-center">
              
              Faça sua Matrícula <ArrowRight size={20} />
            </Link>
            <Link
              to="/historia"
              className="px-8 py-4 border-2 border-white text-white font-montserrat font-bold text-lg rounded-lg hover:bg-white hover:text-burgundy transition-all">
              
              Nossa História
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="animate-bounce w-6 h-6 border-2 border-gold border-t-0 border-l-0 rotate-45 -translate-y-1" />
        </div>
      </section>

      {/* STATS */}
      <section className="bg-burgundy py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, value, label }) =>
          <div key={label} className="text-center">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon size={24} className="text-gold" />
              </div>
              <p className="font-montserrat font-black text-white text-2xl">{value}</p>
              <p className="text-white/70 text-sm">{label}</p>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block w-12 h-1 bg-gold mb-4" />
            <h2 className="font-montserrat font-black text-burgundy text-4xl mb-4">QUEM SOMOS</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">A Arco-Iris é uma Organização da Sociedade Civil (OSC) que usa o futebol como instrumento de inclusão social, combate à evasão escolar e formação cidadã de crianças e adolescentes de 8 a 15 anos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc }) =>
            <div key={title} className="bg-gray-50 rounded-xl p-8 card-gold-border hover:shadow-lg transition-all group">
                <div className="w-14 h-14 bg-burgundy/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-burgundy transition-all">
                  <Icon size={28} className="text-burgundy group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-montserrat font-bold text-burgundy text-xl mb-3">{title}</h3>
                <p className="text-gray-600 font-roboto">{desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TIMELINE PREVIEW */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block w-12 h-1 bg-gold mb-4" />
            <h2 className="font-montserrat font-black text-burgundy text-3xl">NOSSA JORNADA</h2>
          </div>
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 relative">
            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-gold z-0" />
            {[
            { ano: '2017', desc: 'Fundação da OSC com 23 garotos, 40 matrículas no 1° ano' },
            { ano: '2018', desc: '1° amistoso com Cairú e 2° Torneio de Quadra' },
            { ano: '2019', desc: 'Registro oficial como entidade no cartório de Nilo Peçanha' },
            { ano: '2026', desc: 'Parte 3 do Projeto Social — expansão para Jatimane' }].
            map(({ ano, desc }) =>
            <div key={ano} className="flex flex-col items-center text-center z-10 flex-1">
                <div className="w-12 h-12 rounded-full bg-burgundy border-4 border-gold flex items-center justify-center mb-3">
                  <span className="text-white font-montserrat font-black text-xs">{ano.slice(2)}</span>
                </div>
                <p className="font-montserrat font-bold text-burgundy text-xl">{ano}</p>
                <p className="text-gray-600 text-sm mt-1">{desc}</p>
              </div>
            )}
          </div>
          <div className="text-center mt-10">
            <Link to="/historia" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-burgundy text-burgundy font-montserrat font-bold rounded-lg hover:bg-burgundy hover:text-white transition-all">
              Ver história completa <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA MATRÍCULA */}
      <section className="py-20 px-4 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-gold rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-burgundy rounded-full" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-black text-white text-4xl mb-4">
            FAÇA PARTE DO PROJETO
          </h2>
          <div className="w-16 h-1 bg-gold mx-auto mb-6" />
          <p className="text-white/80 text-lg mb-8">
            Crianças e adolescentes de 8 a 15 anos das comunidades de Nilo Peçanha e Jatimane. Requisito: estar matriculado na escola com média mínima de 5,0.
          </p>
          <Link
            to="/matricula"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gold text-burgundy font-montserrat font-black text-xl rounded-lg hover:bg-yellow-400 transition-all shadow-xl">
            
            Fazer Matrícula Agora <ArrowRight size={24} />
          </Link>
        </div>
      </section>
    </div>);

}