import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { DollarSign, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MESES, paymentStatusColors } from '@/utils/athleteUtils';

const ANOS = [2024, 2025, 2026, 2027];

export default function Financeiro() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [athletes, setAthletes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    api.entities.Athlete.filter({ status: 'ativo' }, 'nome').then(setAthletes);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.entities.Payment.filter({ mes, ano }, 'athleteNome').then(data => {
      setPayments(data);
      setLoading(false);
    });
  }, [mes, ano]);

  const getPayment = (athleteId) => payments.find(p => p.athleteId === athleteId);

  const updateStatus = async (athlete, newStatus, valor) => {
    setSaving(prev => ({ ...prev, [athlete.id]: true }));
    const existing = getPayment(athlete.id);
    if (existing) {
      await api.entities.Payment.update(existing.id, {
        status: newStatus,
        valor: valor ? parseFloat(valor) : existing.valor,
        dataPagamento: newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null,
      });
    } else {
      await api.entities.Payment.create({
        athleteId: athlete.id,
        athleteNome: athlete.nome,
        mes, ano,
        status: newStatus,
        valor: valor ? parseFloat(valor) : 0,
        dataPagamento: newStatus === 'pago' ? new Date().toISOString().split('T')[0] : null,
      });
    }
    const updated = await api.entities.Payment.filter({ mes, ano });
    setPayments(updated);
    setSaving(prev => ({ ...prev, [athlete.id]: false }));
  };

  const pagos = payments.filter(p => p.status === 'pago').length;
  const pendentes = payments.filter(p => p.status === 'pendente').length;
  const inadimplentes = payments.filter(p => p.status === 'inadimplente').length;
  const totalArrecadado = payments.filter(p => p.status === 'pago').reduce((s, p) => s + (p.valor || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-montserrat font-black text-gray-800 text-3xl">Controle Financeiro</h1>
          <p className="text-gray-500 mt-1">{athletes.length} atletas ativos</p>
        </div>
        <div className="flex gap-3">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ANOS.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: CheckCircle, label: 'Pagos', value: pagos, color: 'text-green-600' },
          { icon: Clock, label: 'Pendentes', value: pendentes, color: 'text-yellow-600' },
          { icon: AlertTriangle, label: 'Inadimplentes', value: inadimplentes, color: 'text-red-600' },
          { icon: DollarSign, label: 'Total Arrecadado', value: `R$ ${totalArrecadado.toFixed(2)}`, color: 'text-navy' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 card-gold-border">
            <Icon size={20} className={`${color} mb-2`} />
            <p className={`font-montserrat font-black text-2xl ${color}`}>{value}</p>
            <p className="text-gray-500 text-xs mt-1">{label} em {MESES[mes - 1]}</p>
          </div>
        ))}
      </div>

      {/* Atletas Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Atleta</th>
                <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Categoria</th>
                <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Status</th>
                <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Valor (R$)</th>
                <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map(a => {
                const pay = getPayment(a.id);
                const isSaving = saving[a.id];
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-burgundy/10 rounded-full flex items-center justify-center font-bold text-burgundy text-sm">
                          {a.nome?.charAt(0)}
                        </div>
                        <span className="font-montserrat font-semibold text-gray-800 text-sm">{a.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500 font-montserrat">{a.categoria}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold font-montserrat ${paymentStatusColors[pay?.status || 'pendente']}`}>
                        {pay?.status || 'pendente'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Input
                        type="number"
                        className="w-24 h-8 text-sm"
                        defaultValue={pay?.valor || ''}
                        placeholder="0.00"
                        id={`valor-${a.id}`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {['pago', 'pendente', 'inadimplente'].map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              const el = document.getElementById(`valor-${a.id}`);
                              updateStatus(a, s, el?.value);
                            }}
                            disabled={isSaving}
                            className={`px-2 py-1 rounded text-xs font-montserrat font-bold transition-all ${
                              pay?.status === s
                                ? s === 'pago' ? 'bg-green-600 text-white' : s === 'inadimplente' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isSaving && pay?.status !== s ? <Loader2 size={10} className="animate-spin" /> : s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {athletes.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-400">
              <p>Nenhum atleta ativo. Aprove cadastros para aparecerem aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}