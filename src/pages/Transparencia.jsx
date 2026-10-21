import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { FileText, Download, Loader2, ShieldCheck, FolderOpen } from 'lucide-react';
import { EditableText } from '@/components/layout/SiteEditor';

const CATEGORIAS = ['Estatuto', 'Eleições', 'Projetos', 'Prestação de Contas', 'Atas', 'Outros'];

export default function Transparencia() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.entities.TransparencyDocument.filter({ ativo: true }, '-data')
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grupos = CATEGORIAS
    .map((cat) => ({ cat, items: docs.filter((d) => d.categoria === cat) }))
    .filter((g) => g.items.length > 0);

  const formatarData = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '');

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
            <EditableText field="hero.eyebrow">Documentos e prestação de contas</EditableText>
          </p>
          <h1 className="font-montserrat font-black text-white text-5xl md:text-6xl mb-4">
            <EditableText field="hero.title">TRANSPARÊNCIA</EditableText>
          </h1>
          <div className="w-16 h-1 bg-gold mx-auto mb-6" />
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            <EditableText field="hero.description">Acesso público aos documentos institucionais da Associação Escolinha de Futebol Arco-Íris: estatuto, eleições, projetos e prestação de contas.</EditableText>
          </p>
        </div>
      </section>

      {/* DOCUMENTOS */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-burgundy" />
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FolderOpen size={48} className="mx-auto mb-4 text-gray-200" />
              <p>Nenhum documento publicado ainda.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {grupos.map(({ cat, items }) => (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-1.5 h-8 bg-gold rounded" />
                    <h2 className="font-montserrat font-black text-burgundy text-2xl">{cat}</h2>
                  </div>
                  <div className="grid gap-4">
                    {items.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl card-gold-border hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 bg-burgundy rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={22} className="text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-montserrat font-bold text-gray-800">{doc.titulo}</p>
                          {doc.descricao && <p className="text-gray-500 text-sm">{doc.descricao}</p>}
                          {doc.data && <p className="text-gray-400 text-xs mt-1">{formatarData(doc.data)}</p>}
                        </div>
                        <Download size={20} className="text-burgundy group-hover:text-gold transition-colors flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COMPROMISSO */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <ShieldCheck size={36} className="text-burgundy mx-auto mb-4" />
          <h2 className="font-montserrat font-black text-burgundy text-2xl mb-3"><EditableText field="commitment.title">COMPROMISSO COM A TRANSPARÊNCIA</EditableText></h2>
          <p className="text-gray-600">
            <EditableText field="commitment.description">A Escolinha Arco-Íris disponibiliza publicamente seus documentos institucionais, projetos e prestações de contas, reforçando o compromisso com a gestão transparente dos recursos.</EditableText>
          </p>
        </div>
      </section>
    </div>
  );
}