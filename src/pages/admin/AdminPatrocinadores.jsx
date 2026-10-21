import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Plus, Trash2, Upload, Loader2, Star, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function AdminPatrocinadores() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', siteUrl: '', logoFile: null });

  useEffect(() => {
    api.entities.Sponsor.list('ordem').then(setSponsors);
  }, []);

  const handleCreate = async () => {
    if (!form.nome.trim()) return;
    setLoading(true);
    let logoUrl = '';
    if (form.logoFile) {
      const { file_url } = await api.integrations.Core.UploadFile({ file: form.logoFile });
      logoUrl = file_url;
    }
    const newSponsor = await api.entities.Sponsor.create({
      nome: form.nome,
      siteUrl: form.siteUrl,
      logoUrl,
      ativo: true,
      ordem: sponsors.length,
    });
    setSponsors(prev => [...prev, newSponsor]);
    setForm({ nome: '', siteUrl: '', logoFile: null });
    setLoading(false);
  };

  const toggleAtivo = async (sp) => {
    const updated = await api.entities.Sponsor.update(sp.id, { ativo: !sp.ativo });
    setSponsors(prev => prev.map(s => s.id === sp.id ? updated : s));
  };

  const deleteSponsor = async (sp) => {
    await api.entities.Sponsor.delete(sp.id);
    setSponsors(prev => prev.filter(s => s.id !== sp.id));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl">Patrocinadores</h1>
        <p className="text-gray-500 mt-1">Gerencie os logos exibidos no carrossel do site</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <Star size={18} className="text-gold" /> Adicionar Patrocinador
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="font-montserrat font-semibold text-sm">Nome da Empresa *</Label>
              <Input className="mt-1" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome do patrocinador" />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Site (URL)</Label>
              <Input className="mt-1" value={form.siteUrl} onChange={e => setForm(p => ({ ...p, siteUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Logo</Label>
              <label className="mt-2 flex flex-col items-center border-2 border-dashed border-gold/40 rounded-xl p-5 cursor-pointer hover:border-gold transition-all">
                {form.logoFile
                  ? <p className="text-green-600 text-sm font-semibold">{form.logoFile.name}</p>
                  : <><Upload size={24} className="text-gold mb-2" /><p className="text-gray-500 text-sm">Clique para selecionar logo</p></>
                }
                <input type="file" accept="image/*" className="hidden" onChange={e => setForm(p => ({ ...p, logoFile: e.target.files[0] }))} />
              </label>
            </div>
            <Button onClick={handleCreate} disabled={loading || !form.nome} className="w-full bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Adicionar
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4">Patrocinadores Cadastrados</h2>
          {sponsors.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Star size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Nenhum patrocinador cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sponsors.map(sp => (
                <div key={sp.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${sp.ativo ? 'border-gold/30 bg-gold/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                  <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                    {sp.logoUrl
                      ? <img src={sp.logoUrl} alt={sp.nome} className="max-w-full max-h-full object-contain" />
                      : <Star size={20} className="text-gray-300" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-montserrat font-bold text-gray-800">{sp.nome}</p>
                    {sp.siteUrl && <a href={sp.siteUrl} target="_blank" rel="noopener noreferrer" className="text-burgundy text-xs hover:underline">{sp.siteUrl}</a>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAtivo(sp)} className="text-gray-400 hover:text-burgundy transition-colors">
                      {sp.ativo ? <ToggleRight size={28} className="text-green-600" /> : <ToggleLeft size={28} />}
                    </button>
                    <span className={`text-xs font-montserrat font-semibold ${sp.ativo ? 'text-green-600' : 'text-gray-400'}`}>
                      {sp.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <button onClick={() => deleteSponsor(sp)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
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