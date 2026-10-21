import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Plus, Save, Loader2, Swords, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Adulto'];
const FORMACOES = {
  '4-3-3': { GK: [[50, 88]], DEF: [[15,68],[32,68],[68,68],[85,68]], MID: [[25,48],[50,48],[75,48]], FWD: [[20,25],[50,20],[80,25]] },
  '4-4-2': { GK: [[50, 88]], DEF: [[15,68],[32,68],[68,68],[85,68]], MID: [[15,48],[38,48],[62,48],[85,48]], FWD: [[35,25],[65,25]] },
  '3-5-2': { GK: [[50, 88]], DEF: [[25,68],[50,68],[75,68]], MID: [[12,50],[30,48],[50,44],[70,48],[88,50]], FWD: [[35,25],[65,25]] },
  '4-2-3-1': { GK: [[50, 88]], DEF: [[15,70],[32,70],[68,70],[85,70]], MID: [[35,58],[65,58]], ATT: [[20,40],[50,38],[80,40]], FWD: [[50,22]] },
};

const posNomes = { GK: 'Goleiro', DEF: 'Defensor', MID: 'Meio-Campo', FWD: 'Atacante', ATT: 'Meia-Atacante' };

export default function Escalacoes() {
  const [lineups, setLineups] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [categoria, setCategoria] = useState('Sub-11');
  const [formacao, setFormacao] = useState('4-3-3');
  const [nomeJogo, setNomeJogo] = useState('');
  const [dataJogo, setDataJogo] = useState(new Date().toISOString().split('T')[0]);
  const [adversario, setAdversario] = useState('');
  const [positions, setPositions] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedLineup, setSelectedLineup] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.entities.Lineup.list('-created_date').then(setLineups);
  }, []);

  useEffect(() => {
    api.entities.Athlete.filter({ categoria, status: 'ativo' }, 'nome').then(setAthletes);
  }, [categoria]);

  useEffect(() => {
    const form = FORMACOES[formacao];
    if (!form) return;
    const pos = [];
    Object.entries(form).forEach(([group, coords]) => {
      coords.forEach(([x, y]) => {
        pos.push({ posicaoNome: posNomes[group] || group, posicaoX: x, posicaoY: y, athleteId: '', athleteNome: '' });
      });
    });
    setPositions(pos);
    setReservas([]);
  }, [formacao]);

  const assignAthlete = (posIdx, athleteId) => {
    const athlete = athletes.find(a => a.id === athleteId);
    setPositions(prev => prev.map((p, i) => i === posIdx ? { ...p, athleteId, athleteNome: athlete?.nome || '' } : p));
  };

  const saveLineup = async () => {
    if (!nomeJogo || !dataJogo) return;
    setSaving(true);
    const data = await api.entities.Lineup.create({
      categoria,
      formacao,
      nomeJogo,
      dataJogo,
      adversario,
      titulares: positions,
      reservas,
    });
    setLineups(prev => [data, ...prev]);
    setShowForm(false);
    setSaving(false);
  };

  const assignedIds = positions.map(p => p.athleteId).filter(Boolean);
  const unassigned = athletes.filter(a => !assignedIds.includes(a.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-black text-gray-800 text-3xl">Módulo Tático</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie escalações por categoria</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
          <Plus size={16} /> Nova Escalação
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-montserrat font-bold text-gray-800 text-xl mb-5 flex items-center gap-2">
            <Swords size={20} className="text-burgundy" /> Nova Escalação
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label className="font-montserrat font-semibold text-sm">Nome do Jogo *</Label>
              <Input className="mt-1" value={nomeJogo} onChange={e => setNomeJogo(e.target.value)} placeholder="Ex: Final Estadual" />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Data *</Label>
              <Input className="mt-1" type="date" value={dataJogo} onChange={e => setDataJogo(e.target.value)} />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Adversário</Label>
              <Input className="mt-1" value={adversario} onChange={e => setAdversario(e.target.value)} placeholder="Time adversário" />
            </div>
            <div>
              <Label className="font-montserrat font-semibold text-sm">Formação</Label>
              <Select value={formacao} onValueChange={setFormacao}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(FORMACOES).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="font-montserrat font-semibold text-sm">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campo tático */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="font-montserrat font-semibold text-gray-700 text-sm mb-3">Campo — Formação {formacao}</p>
              <div className="relative w-full bg-green-700 rounded-xl overflow-hidden border-4 border-white shadow-lg" style={{ paddingBottom: '140%' }}>
                {/* Field markings */}
                <div className="absolute inset-0">
                  <div className="absolute inset-x-4 inset-y-4 border-2 border-white/40 rounded" />
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/40 rounded-full" />
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/40 rounded-full" />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/40" />
                  {/* Goal boxes */}
                  <div className="absolute left-1/4 right-1/4 top-4 h-10 border-2 border-white/40" />
                  <div className="absolute left-1/4 right-1/4 bottom-4 h-10 border-2 border-white/40" />
                </div>

                {positions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${pos.posicaoX}%`, top: `${pos.posicaoY}%` }}
                  >
                    <select
                      value={pos.athleteId}
                      onChange={e => assignAthlete(i, e.target.value)}
                      className="w-14 h-14 rounded-full bg-burgundy border-2 border-gold text-white text-center text-xs font-bold cursor-pointer appearance-none shadow-lg"
                      style={{ textAlignLast: 'center' }}
                    >
                      <option value="">{pos.posicaoNome.charAt(0)}</option>
                      {athletes.map(a => (
                        <option key={a.id} value={a.id}>{a.nome}</option>
                      ))}
                    </select>
                    <span className="text-white text-xs font-bold mt-1 bg-black/40 px-1 rounded max-w-16 truncate">
                      {pos.athleteNome ? pos.athleteNome.split(' ')[0] : pos.posicaoNome.charAt(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reservas */}
            <div>
              <p className="font-montserrat font-semibold text-gray-700 text-sm mb-3">Reservas / Banco</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {unassigned.map(a => (
                  <div
                    key={a.id}
                    onClick={() => setReservas(prev => prev.find(r => r.athleteId === a.id) ? prev.filter(r => r.athleteId !== a.id) : [...prev, { athleteId: a.id, athleteNome: a.nome }])}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                      reservas.find(r => r.athleteId === a.id)
                        ? 'bg-navy/10 border-navy/30 text-navy'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-7 h-7 bg-navy/20 rounded-full flex items-center justify-center font-bold text-navy text-xs">
                      {a.nome?.charAt(0)}
                    </div>
                    <span className="font-roboto text-sm">{a.nome}</span>
                    {reservas.find(r => r.athleteId === a.id) && (
                      <span className="ml-auto text-xs text-navy font-semibold">Banco</span>
                    )}
                  </div>
                ))}
                {unassigned.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">Todos os atletas estão escalados</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={saveLineup} disabled={saving || !nomeJogo} className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar Escalação
            </Button>
          </div>
        </div>
      )}

      {/* Lista de escalações */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-montserrat font-bold text-gray-800 text-lg">Escalações Salvas</h2>
        </div>
        {lineups.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Swords size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Nenhuma escalação criada ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lineups.map(l => (
              <div key={l.id}
                onClick={() => setSelectedLineup(selectedLineup?.id === l.id ? null : l)}
                className="p-5 hover:bg-gray-50 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-montserrat font-bold text-gray-800">{l.nomeJogo}</p>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      <span>{l.categoria}</span>
                      <span>·</span>
                      <span>{l.formacao}</span>
                      <span>·</span>
                      <span>{l.adversario || 'Adversário não informado'}</span>
                      <span>·</span>
                      <span>{l.dataJogo ? new Date(l.dataJogo).toLocaleDateString('pt-BR') : '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{l.titulares?.length || 0} titulares</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${selectedLineup?.id === l.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {selectedLineup?.id === l.id && l.titulares?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {l.titulares.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 bg-burgundy/5 rounded-lg p-2">
                        <div className="w-6 h-6 bg-burgundy rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {t.athleteNome?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-roboto text-xs font-semibold text-gray-700">{t.athleteNome || 'Vazio'}</p>
                          <p className="text-gray-400 text-xs">{t.posicaoNome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}