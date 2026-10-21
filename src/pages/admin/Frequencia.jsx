import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Check, X, Loader2, ClipboardCheck, Save, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Adulto'];

export default function Frequencia() {
  const [categoria, setCategoria] = useState('Sub-11');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [athletes, setAthletes] = useState([]);
  const [presencas, setPresencas] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => { carregar(); }, [categoria, data]);

  const carregar = async () => {
    setLoading(true);
    setSalvo(false);
    const [ats, regs] = await Promise.all([
      api.entities.Athlete.filter({ categoria, status: 'ativo' }, 'nome'),
      api.entities.Attendance.filter({ categoria, data }),
    ]);
    setAthletes(Array.isArray(ats) ? ats : []);
    const map = {};
    (Array.isArray(regs) ? regs : []).forEach((r) => { map[r.athleteId] = r.presente; });
    setPresencas(map);
    setLoading(false);
  };

  const setPresente = (id, val) => {
    setSalvo(false);
    setPresencas((p) => ({ ...p, [id]: val }));
  };

  const salvar = async () => {
    setSaving(true);
    const records = athletes.map((a) => ({
      athleteId: a.id,
      athleteNome: a.nome,
      categoria,
      data,
      presente: presencas[a.id] !== false,
    }));
    await api.entities.Attendance.upsert(records, { key: ['athleteId', 'data'] });
    setSaving(false);
    setSalvo(true);
  };

  const presentes = athletes.filter((a) => presencas[a.id] !== false).length;
  const ausentes = athletes.length - presentes;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl flex items-center gap-2">
          <ClipboardCheck size={28} className="text-burgundy" /> Frequência
        </h1>
        <p className="text-gray-500 mt-1">Marque a presença dos atletas por turma e data</p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 grid sm:grid-cols-3 gap-4">
        <div>
          <Label className="font-montserrat font-semibold text-sm">Turma / Categoria</Label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label className="font-montserrat font-semibold text-sm">Data do treino</Label>
          <Input type="date" className="mt-1" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="flex items-end gap-6">
          <div className="text-center">
            <p className="font-montserrat font-black text-green-600 text-2xl">{presentes}</p>
            <p className="text-gray-400 text-xs">Presentes</p>
          </div>
          <div className="text-center">
            <p className="font-montserrat font-black text-red-500 text-2xl">{ausentes}</p>
            <p className="text-gray-400 text-xs">Ausentes</p>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={30} className="animate-spin text-burgundy" /></div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <UserX size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Nenhum atleta ativo nesta turma</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {athletes.map((a) => {
                const presente = presencas[a.id] !== false;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-montserrat font-semibold text-gray-700">{a.nome}</p>
                      <p className="text-gray-400 text-xs font-mono">{a.numeroMatricula}</p>
                    </div>
                    <button
                      onClick={() => setPresente(a.id, true)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-montserrat font-bold flex items-center gap-1 transition-all ${presente ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-50'}`}
                    >
                      <Check size={15} /> Presente
                    </button>
                    <button
                      onClick={() => setPresente(a.id, false)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-montserrat font-bold flex items-center gap-1 transition-all ${!presente ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-50'}`}
                    >
                      <X size={15} /> Ausente
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-400 text-sm">{salvo ? '✓ Frequência salva' : 'Marque a presença e salve'}</p>
              <Button onClick={salvar} disabled={saving} className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar Frequência
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}