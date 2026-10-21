import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { motion } from 'framer-motion';
import { EditableImage, EditableText } from '@/components/layout/SiteEditor';

const LOGO_URL = "/logo.jpeg";

const DEFAULT_EVENTS = [
  { ano: '2017', titulo: 'O Início', descricao: 'A partir de um convite de Jessé e Matheus, filhos do presidente Erisvaldo Marques, 23 garotos se reuniram, escolheram o nome "Arco Iris" e formaram a diretoria. Em agosto, a associação foi fundada e fecharam 40 matrículas no 1° ano.' },
  { ano: '2017', titulo: '1° Torneio', descricao: 'Em novembro de 2017, no 2° domingo, realizamos um grande torneio que chamou a atenção dos pais de muitos garotos da cidade, consolidando a escolinha na comunidade.' },
  { ano: '2018', titulo: '1° Amistoso', descricao: 'Primeiro amistoso com a cidade de Cairú em dois momentos — no campo de Nilo Peçanha e no campo de Cairu. A disputa incentivou ainda mais as crianças e adolescentes. Também participaram da campanha Quebrando o Silêncio e realizaram o 2° Torneio de Quadra.' },
  { ano: '2019', titulo: 'Registro Oficial', descricao: 'Em 07 de outubro de 2019, a associação foi registrada oficialmente como entidade no cartório de registro geral da cidade, com sede na 1ª Travessa Dona Laura.' },
  { ano: '2026', titulo: 'Parte 3 do Projeto', descricao: 'Lançamento da 3ª etapa do Projeto "Fazendo Hoje para Refletir no Amanhã", com execução prevista de Setembro/2026 a Março/2027, expandindo para a comunidade de Jatimane e visando alcançar 50 atletas.' },
];

export default function Historia() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.TimelineEvent.list('ordem').then(data => {
      setEvents(data.length > 0 ? data : DEFAULT_EVENTS);
      setLoading(false);
    }).catch(() => {
      setEvents(DEFAULT_EVENTS);
      setLoading(false);
    });
  }, []);

  return (
    <div className="font-roboto">
      {/* Hero */}
      <section className="relative py-32 bg-burgundy overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1920&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-montserrat font-semibold text-gold uppercase tracking-widest text-sm mb-4"><EditableText field="hero.eyebrow">Conheça nossa trajetória</EditableText></p>
          <h1 className="font-montserrat font-black text-white text-5xl mb-4"><EditableText field="hero.title">NOSSA HISTÓRIA</EditableText></h1>
          <div className="w-16 h-1 bg-gold mx-auto" />
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <span className="inline-block w-12 h-1 bg-gold mb-4" />
              <h2 className="font-montserrat font-black text-burgundy text-3xl mb-4"><EditableText field="story.title">UMA OSC A SERVIÇO DA COMUNIDADE</EditableText></h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                <EditableText field="story.paragraph1">A Arco-Iris é uma Organização da Sociedade Civil (OSC) fundada em 2017 por Erisvaldo Marques Barbosa e seus filhos Jessé e Matheus, a partir do sonho de oferecer esporte e inclusão social às crianças de Nilo Peçanha — BA. Hoje atende crianças e adolescentes de 7 a 17 anos nas comunidades da sede e de Jatimane.</EditableText>
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                <EditableText field="story.paragraph2">Com o slogan "Fazendo Hoje Para Refletir no Amanhã", a associação usa o futebol para combater a evasão escolar, estimular atividades físicas e promover o convívio comunitário. Os atletas devem estar matriculados na escola com média mínima de 5,0.</EditableText>
              </p>
              <p className="text-gray-600 text-sm">
                <EditableText field="story.contact">CNPJ: 35.308.686/0001-67 · Presidente: Erisvaldo Marques Barbosa · Contato: (73) 9 9851-8813</EditableText>
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 border-2 border-gold rounded-2xl opacity-30" />
              <EditableImage
                field="story.logo"
                src={LOGO_URL}
                alt="Escudo Arco Iris"
                className="relative w-64 h-64 mx-auto rounded-full object-cover border-4 border-gold shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block w-12 h-1 bg-gold mb-4" />
            <h2 className="font-montserrat font-black text-burgundy text-3xl"><EditableText field="timeline.title">LINHA DO TEMPO</EditableText></h2>
          </div>

          {loading ? (
            <div className="space-y-8">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gold transform md:-translate-x-0.5" />
              <div className="space-y-12">
                {events.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`relative flex ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start`}
                  >
                    {/* dot */}
                    <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-burgundy border-4 border-gold z-10" />
                    <div className={`pl-16 md:pl-0 md:w-1/2 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                      <div className="bg-white rounded-xl p-6 card-gold-border shadow-sm hover:shadow-md transition-all">
                        <span className="font-montserrat font-black text-gold text-3xl">{event.ano}</span>
                        <h3 className="font-montserrat font-bold text-burgundy text-xl mt-1 mb-2">{event.titulo}</h3>
                        <p className="text-gray-600">{event.descricao}</p>
                      </div>
                    </div>
                    <div className="hidden md:block md:w-1/2" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-navy">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          {[
            { title: 'MISSÃO', text: 'Contribuir na formação de cidadãos, buscando a inclusão social através de iniciativas técnico-didático-pedagógicas voltadas ao equilíbrio dos processos de interação social cooperativa e competitiva.' },
            { title: 'VISÃO', text: 'Ser referência no desenvolvimento de crianças e jovens do Baixo Sul da Bahia, usando o futebol como instrumento de transformação social e prevenção às drogas e ociosidade.' },
            { title: 'VALORES', text: 'Respeito aos semelhantes e à natureza, disciplina, vida saudável, trabalho em equipe, fair play e honrar a camisa. Dê o máximo de si na escola — estude sempre.' },
          ].map(({ title, text }, index) => (
            <div key={title} className="bg-white/10 rounded-xl p-6 border border-gold/30">
              <div className="w-1 h-8 bg-gold mx-auto mb-4 rounded-full" />
              <h3 className="font-montserrat font-black text-gold text-xl mb-3"><EditableText field={`values.${index}.title`}>{title}</EditableText></h3>
              <p className="text-white/80 text-sm leading-relaxed"><EditableText field={`values.${index}.text`}>{text}</EditableText></p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}