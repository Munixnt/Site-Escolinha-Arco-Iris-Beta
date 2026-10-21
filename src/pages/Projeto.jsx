import { Link } from 'react-router-dom';
import {
  Target, Users, Calendar, Landmark, CheckCircle2, ArrowRight,
  Trophy, Heart, BookOpen, ShieldCheck, FileText,
} from 'lucide-react';
import { EditableText } from '@/components/layout/SiteEditor';

const FICHA = [
  { icon: ShieldCheck, label: 'Realização', value: 'Escolinha Arco-Íris (OSC)' },
  { icon: Landmark, label: 'Financiador', value: 'CMDCA de Nilo Peçanha-BA' },
  { icon: FileText, label: 'Edital', value: 'Chamamento Público 01/2026' },
  { icon: Calendar, label: 'Período', value: 'Set/2026 a Mar/2027' },
];

const METAS = [
  { icon: Users, titulo: 'Atender 50 atletas', desc: 'Crianças e adolescentes de 7 a 17 anos das comunidades de Nilo Peçanha e Jatimane.' },
  { icon: BookOpen, titulo: 'Combater a evasão escolar', desc: 'A permanência e o desempenho escolar (média mínima 5,0) são requisitos de participação.' },
  { icon: Trophy, titulo: 'Desenvolvimento esportivo', desc: 'Treinos tematizados com fundamentos básicos, derivados e específicos, formando o atleta completo.' },
  { icon: Heart, titulo: 'Convívio social e familiar', desc: 'Ações que fortalecem os vínculos sociais e familiares dos participantes.' },
];

const PUBLICO = [
  'Crianças e adolescentes de 7 a 17 anos',
  'Comunidades de Nilo Peçanha e Jatimane (Baixo Sul da Bahia)',
  'Matriculados na escola, com média mínima de 5,0',
];

export default function Projeto() {
  return (
    <div className="font-roboto">
      {/* HERO */}
      <section className="relative py-32 bg-navy overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-burgundy rounded-full transform -translate-x-16 translate-y-16" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-montserrat font-semibold text-gold uppercase tracking-widest text-sm mb-4">
            <EditableText field="hero.eyebrow">Projeto Social · CMDCA Nilo Peçanha-BA</EditableText>
          </p>
          <h1 className="font-montserrat font-black text-white text-4xl md:text-6xl mb-4 leading-tight">
            <EditableText field="hero.title">FAZENDO HOJE PARA REFLETIR NO AMANHÃ</EditableText>
          </h1>
          <div className="w-16 h-1 bg-gold mx-auto mb-5" />
          <p className="font-montserrat font-bold text-gold text-xl md:text-2xl mb-4 italic"><EditableText field="hero.part">Parte III</EditableText></p>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            <EditableText field="hero.description">Iniciativa da Associação Escolinha de Futebol Arco-Íris, financiada com recursos do Fundo da Infância e Adolescência (FIA) por meio do CMDCA de Nilo Peçanha-BA.</EditableText>
          </p>
        </div>
      </section>

      {/* FICHA DO PROJETO */}
      <section className="bg-burgundy py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {FICHA.map(({ icon: Icon, label, value }, index) => (
            <div key={label} className="text-center">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon size={24} className="text-gold" />
              </div>
              <p className="font-montserrat font-black text-white text-base"><EditableText field={`facts.${index}.value`}>{value}</EditableText></p>
              <p className="text-white/70 text-sm"><EditableText field={`facts.${index}.label`}>{label}</EditableText></p>
            </div>
          ))}
        </div>
      </section>

      {/* OBJETIVO */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block w-12 h-1 bg-gold mb-4" />
          <h2 className="font-montserrat font-black text-burgundy text-3xl md:text-4xl mb-6"><EditableText field="objective.title">OBJETIVO</EditableText></h2>
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-burgundy/10 rounded-xl flex items-center justify-center">
              <Target size={28} className="text-burgundy" />
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            <EditableText field="objective.description">Promover a inclusão social e a formação cidadã de crianças e adolescentes por meio do futebol, fortalecendo vínculos familiares e comunitários, incentivando a permanência na escola e ampliando o acesso ao esporte nas comunidades do Baixo Sul da Bahia.</EditableText>
          </p>
        </div>
      </section>

      {/* METAS */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block w-12 h-1 bg-gold mb-4" />
            <h2 className="font-montserrat font-black text-burgundy text-3xl md:text-4xl"><EditableText field="goals.title">METAS DO PROJETO</EditableText></h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {METAS.map(({ icon: Icon, titulo, desc }, index) => (
              <div key={titulo} className="flex gap-5 p-6 bg-white rounded-xl card-gold-border hover:shadow-md transition-all">
                <div className="flex-shrink-0 w-14 h-14 bg-burgundy rounded-xl flex items-center justify-center">
                  <Icon size={26} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-burgundy text-lg mb-2"><EditableText field={`goals.${index}.title`}>{titulo}</EditableText></h3>
                  <p className="text-gray-600"><EditableText field={`goals.${index}.description`}>{desc}</EditableText></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PÚBLICO E PERÍODO */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="bg-gray-50 rounded-2xl p-8 card-gold-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-burgundy rounded-xl flex items-center justify-center">
                <Users size={24} className="text-gold" />
              </div>
              <h3 className="font-montserrat font-black text-burgundy text-2xl"><EditableText field="audience.title">PÚBLICO-ALVO</EditableText></h3>
            </div>
            <ul className="space-y-4">
              {PUBLICO.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700"><EditableText field={`audience.item.${PUBLICO.indexOf(item)}`}>{item}</EditableText></span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 card-gold-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-burgundy rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-gold" />
              </div>
              <h3 className="font-montserrat font-black text-burgundy text-2xl"><EditableText field="period.title">PERÍODO</EditableText></h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              O projeto <strong className="text-burgundy">Parte III</strong> tem execução prevista de{' '}
              <strong className="text-burgundy">setembro de 2026 a março de 2027</strong>, com treinos, atividades
              socioeducativas e ações de convívio ao longo de todo o período.
            </p>
            <p className="text-gray-600 mt-4">
              <EditableText field="period.categories">As turmas são organizadas por categoria, do Sub-7 ao Sub-17, respeitando a faixa etária de cada atleta.</EditableText>
            </p>
          </div>
        </div>
      </section>

      {/* FINANCIAMENTO CMDCA */}
      <section className="py-20 px-4 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-gold rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-burgundy rounded-full" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gold/20 rounded-full flex items-center justify-center">
              <Landmark size={28} className="text-gold" />
            </div>
          </div>
          <span className="inline-block w-12 h-1 bg-gold mb-4" />
          <h2 className="font-montserrat font-black text-white text-3xl md:text-4xl mb-6">
            <EditableText field="funding.title">FINANCIAMENTO PELO CMDCA</EditableText>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed mb-4">
            <EditableText field="funding.paragraph1">O projeto foi selecionado por meio do Edital de Chamamento Público nº 01/2026 do Conselho Municipal dos Direitos da Criança e do Adolescente (CMDCA) de Nilo Peçanha-BA.</EditableText>
          </p>
          <p className="text-white/70 leading-relaxed">
            <EditableText field="funding.paragraph2">Parte dos recursos vem do Fundo da Infância e Adolescência (FIA), destinados a garantir o direito ao esporte, à cultura e à convivência familiar e comunitária de crianças e adolescentes do município.</EditableText>
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {[
              { icon: FileText, titulo: 'Edital 01/2026', desc: 'Chamamento público do CMDCA' },
              { icon: Landmark, titulo: 'Fundo FIA', desc: 'Recursos da infância e adolescência' },
              { icon: ShieldCheck, titulo: 'Transparência', desc: 'Aplicação acompanhada pelo Conselho' },
            ].map(({ icon: Icon, titulo, desc }, index) => (
              <div key={titulo} className="bg-white/10 rounded-xl p-6 border border-gold/30">
                <Icon size={24} className="text-gold mx-auto mb-3" />
                <p className="font-montserrat font-bold text-white"><EditableText field={`funding.${index}.title`}>{titulo}</EditableText></p>
                <p className="text-white/60 text-sm mt-1"><EditableText field={`funding.${index}.description`}>{desc}</EditableText></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-burgundy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-black text-white text-3xl md:text-4xl mb-4">
            <EditableText field="cta.title">FAÇA PARTE DO PROJETO</EditableText>
          </h2>
          <div className="w-16 h-1 bg-gold mx-auto mb-6" />
          <p className="text-white/80 text-lg mb-8">
            <EditableText field="cta.description">Inscrições abertas para crianças e adolescentes de 7 a 17 anos das comunidades de Nilo Peçanha e Jatimane.</EditableText>
          </p>
          <Link
            to="/matricula"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gold text-burgundy font-montserrat font-black text-lg rounded-lg hover:bg-yellow-400 transition-all shadow-xl"
          >
            <EditableText field="cta.button">Fazer Matrícula</EditableText> <ArrowRight size={22} />
          </Link>
        </div>
      </section>
    </div>
  );
}