import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Plus, Trash2, Upload, Loader2, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const CATEGORIAS = ['Estatuto', 'Eleições', 'Projetos', 'Prestação de Contas', 'Atas', 'Outros'];

export default function AdminTransparencia() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ titulo: '', categoria: CATEGORIAS[0], descricao: '', data: '', file: null });

  useEffect(() => {
    api.entities.TransparencyDocument.list('-data').then(setDocs).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.titulo.trim() || !form.file) return;
    setLoading(true);
    const { file_url } = await api.integrations.Core.UploadPublicFile({ file: form.file });
    const novo = await api.entities.TransparencyDocument.create({
      titulo: form.titulo,
      categoria: form.categoria,
      descricao: form.descricao,
      data: form.data || undefined,
      arquivoUrl: file_url,
      ativo: true,
      ordem: docs.length,
    });
    setDocs((prev) => [novo, ...prev]);
    setForm({ titulo: '', categoria: CATEGORIAS[0], descricao: '', data: '', file: null });
    setLoading(false);
  };

  const toggleAtivo = async (doc) => {
    const updated = await api.entities.TransparencyDocument.update(doc.id, { ativo: !doc.ativo });
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
  };

  const deleteDoc = async (doc) => {
    await api.entities.TransparencyDocument.delete(doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl">Transparência</h1>
        <p className="text-gray-500 mt-1">Publique os documentos que ficam visíveis no site público</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <FileText size={18} className="text-gold" /> Publicar Documento
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="font-montserrat font-semibold text-sm">Título *</Label>
              <Input className="mt-1" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: Estatuto Social 2024" />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Categoria *</Label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Descrição</Label>
              <Input className="mt-1" value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Breve descrição (opcional)" />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Data do documento</Label>
              <Input type="date" className="mt-1" value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Arquivo *</Label>
              <label className="mt-2 flex flex-col items-center border-2 border-dashed border-gold/40 rounded-xl p-5 cursor-pointer hover:border-gold transition-all">
                {form.file
                  ? <p className="text-green-600 text-sm font-semibold">{form.file.name}</p>
                  : <><Upload size={24} className="text-gold mb-2" /><p className="text-gray-500 text-sm text-center">Clique para selecionar (PDF, imagem, Word)</p></>
                }
                <input type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files[0] }))} />
              </label>
            </div>
            <Button onClick={handleCreate} disabled={loading || !form.titulo || !form.file} className="w-full bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Publicar
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4">Documentos Publicados</h2>
          {docs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Nenhum documento publicado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div key={doc.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${doc.ativo ? 'border-gold/30 bg-gold/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                  <div className="w-12 h-12 bg-burgundy rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-montserrat font-bold text-gray-800">{doc.titulo}</p>
                    <p className="text-gray-400 text-xs">{doc.categoria}{doc.data ? ` · ${new Date(doc.data).toLocaleDateString('pt-BR')}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAtivo(doc)} className="text-gray-400 hover:text-burgundy transition-colors">
                      {doc.ativo ? <ToggleRight size={28} className="text-green-600" /> : <ToggleLeft size={28} />}
                    </button>
                    <span className={`text-xs font-montserrat font-semibold ${doc.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                      {doc.ativo ? 'Visível' : 'Oculto'}
                    </span>
                    <button onClick={() => deleteDoc(doc)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}