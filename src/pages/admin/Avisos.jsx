import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Plus, Trash2, Loader2, Megaphone, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createWhatsAppLink } from '@/utils/whatsapp';

const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Adulto'];
const ASSINATURA = 'Associação Escolinha de Futebol Arco-Íris';

export default function Avisos() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ titulo: '', mensagem: '', categoria: 'Todas' });

  const [avisoSel, setAvisoSel] = useState('');
  const [turma, setTurma] = useState('Todas');
  const [responsaveis, setResponsaveis] = useState([]);
  const [loadingResp, setLoadingResp] = useState(false);

  useEffect(() => {
    api.entities.Aviso.list('-created_date').then((d) => setAvisos(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!avisoSel) { setResponsaveis([]); return; }
    carregarResponsaveis();
  }, [avisoSel, turma]);

  const carregarResponsaveis = async () => {
    setLoadingResp(true);
    const query = { status: 'ativo' };
    if (turma !== 'Todas') query.categoria = turma;
    const ats = await api.entities.Athlete.filter(query, 'nome');
    setResponsaveis(Array.isArray(ats) ? ats : []);
    setLoadingResp(false);
  };

  const criar = async () => {
    if (!form.titulo.trim() || !form.mensagem.trim()) return;
    setLoading(true);
    const novo = await api.entities.Aviso.create({ ...form, ativo: true });
    setAvisos((p) => [novo, ...p]);
    setAvisoSel(novo.id);
    setForm({ titulo: '', mensagem: '', categoria: 'Todas' });
    setLoading(false);
  };

  const apagar = async (a) => {
    await api.entities.Aviso.delete(a.id);
    setAvisos((p) => p.filter((x) => x.id !== a.id));
    if (avisoSel === a.id) setAvisoSel('');
  };

  const avisoAtual = avisos.find((a) => a.id === avisoSel);
  const mensagem = avisoAtual ? `*${avisoAtual.titulo}*\n\n${avisoAtual.mensagem}\n\n_${ASSINATURA}_` : '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl flex items-center gap-2">
          <Megaphone size={28} className="text-burgundy" /> Avisos
        </h1>
        <p className="text-gray-500 mt-1">Crie avisos e envie aos responsáveis pelo WhatsApp</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4">Novo Aviso</h2>
          <div className="space-y-4">
            <div>
              <Label className="font-montserrat font-semibold text-sm">Título *</Label>
              <Input className="mt-1" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex.: Treino cancelado" />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Mensagem *</Label>
              <textarea
                className="mt-1 w-full min-h-[110px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.mensagem}
                onChange={(e) => setForm((p) => ({ ...p, mensagem: e.target.value }))}
                placeholder="Escreva o aviso..."
              />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Turma destinatária</Label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Todas">Todas as turmas</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={criar} disabled={loading || !form.titulo || !form.mensagem} className="w-full bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Publicar Aviso
            </Button>
          </div>
        </div>

        {/* Avisos + WhatsApp */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4">Avisos Publicados</h2>
            {avisos.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Megaphone size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Nenhum aviso publicado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {avisos.map((a) => (
                  <div key={a.id} className={`p-4 rounded-xl border transition-all ${avisoSel === a.id ? 'border-gold bg-gold/5' : 'border-gray-100'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-montserrat font-bold text-gray-800">{a.titulo}</p>
                        <p className="text-gray-500 text-sm whitespace-pre-wrap">{a.mensagem}</p>
                        <p className="text-gray-400 text-xs mt-1">{a.categoria === 'Todas' ? 'Todas as turmas' : a.categoria}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAvisoSel(a.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-bold transition-all ${avisoSel === a.id ? 'bg-burgundy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          Enviar
                        </button>
                        <button onClick={() => apagar(a)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp */}
          {avisoSel && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
                <MessageCircle size={18} className="text-green-600" /> Enviar por WhatsApp
              </h2>
              <p className="text-gray-400 text-sm mb-4">Escolha a turma e clique em um responsável para abrir o WhatsApp com a mensagem já pronta.</p>
              <div className="mb-4 max-w-xs">
                <select
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Todas">Todas as turmas</option>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {loadingResp ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-burgundy" /></div>
              ) : (
                <div className="space-y-2">
                  {responsaveis.map((a) => {
                    const link = createWhatsAppLink(a.telefoneResponsavel, mensagem);
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-montserrat font-semibold text-gray-700 text-sm">{a.nome}</p>
                          <p className="text-gray-400 text-xs">{a.nomeResponsavel || 'Responsável'} · {a.telefoneResponsavel || 'sem telefone'}</p>
                        </div>
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-montserrat font-bold flex items-center gap-1 hover:bg-green-700 transition-all"
                          >
                            <MessageCircle size={14} /> Abrir WhatsApp
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">Sem telefone</span>
                        )}
                      </div>
                    );
                  })}
                  {responsaveis.length === 0 && <p className="text-gray-400 text-sm text-center py-6">Nenhum atleta ativo nesta turma</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}