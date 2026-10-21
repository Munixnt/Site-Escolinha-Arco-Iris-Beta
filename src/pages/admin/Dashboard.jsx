import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Users, DollarSign, AlertTriangle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MESES, categoriaColors } from '@/utils/athleteUtils';

export default function AdminDashboard() {
  const [athletes, setAthletes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const anoAtual = now.getFullYear();

  useEffect(() => {
    Promise.all([
      api.entities.Athlete.list(),
      api.entities.Payment.filter({ mes: mesAtual, ano: anoAtual }),
    ]).then(([a, p]) => {
      setAthletes(a);
      setPayments(p);
      setLoading(false);
    });
  }, []);

  const pendentes = athletes.filter(a => a.status === 'pendente');
  const ativos = athletes.filter(a => a.status === 'ativo');
  const pagos = payments.filter(p => p.status === 'pago').length;
  const inadimplentes = payments.filter(p => p.status === 'inadimplente').length;

  const categoriaCount = ativos.reduce((acc, a) => {
    acc[a.categoria] = (acc[a.categoria] || 0) + 1;
    return acc;
  }, {});

  const cards = [
    { icon: Clock, label: 'Aguardando Aprovação', value: pendentes.length, color: 'bg-yellow-500', link: '/admin/atletas' },
    { icon: Users, label: 'Atletas Ativos', value: ativos.length, color: 'bg-green-600', link: '/admin/atletas' },
    { icon: CheckCircle, label: `Pagamentos ${MESES[mesAtual - 1]}`, value: `${pagos} pagos`, color: 'bg-blue-600', link: '/admin/financeiro' },
    { icon: AlertTriangle, label: 'Inadimplentes', value: inadimplentes, color: 'bg-burgundy', link: '/admin/financeiro' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl">Dashboard</h1>
        <p className="text-gray-500 mt-1 font-roboto">{MESES[mesAtual - 1]} de {anoAtual} — Escolinha de Futebol Arco Iris</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map(({ icon: Icon, label, value, color, link }) => (
              <Link key={label} to={link} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all card-gold-border group">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className="font-montserrat font-black text-gray-800 text-2xl">{value}</p>
                <p className="text-gray-500 text-xs mt-1">{label}</p>
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Atletas por Categoria */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-montserrat font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-burgundy" /> Atletas por Categoria
              </h3>
              {Object.entries(categoriaCount).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum atleta ativo ainda</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(categoriaCount).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-montserrat font-bold ${categoriaColors[cat] || 'bg-gray-100 text-gray-700'}`}>{cat}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-burgundy rounded-full" style={{ width: `${(count / ativos.length) * 100}%` }} />
                        </div>
                        <span className="font-montserrat font-bold text-gray-700 text-sm w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pendentes de aprovação */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-montserrat font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Clock size={18} className="text-yellow-500" /> Novos Cadastros Pendentes
              </h3>
              {pendentes.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum cadastro pendente</p>
              ) : (
                <div className="space-y-3">
                  {pendentes.slice(0, 5).map(a => (
                    <Link key={a.id} to={`/admin/atletas/${a.id}`} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all">
                      <div className="w-9 h-9 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-700 font-bold text-sm">
                        {a.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-montserrat font-semibold text-gray-800 text-sm">{a.nome}</p>
                        <p className="text-gray-500 text-xs">{a.categoria}</p>
                      </div>
                    </Link>
                  ))}
                  {pendentes.length > 5 && (
                    <Link to="/admin/atletas" className="block text-center text-burgundy text-sm font-semibold hover:underline">
                      Ver todos os {pendentes.length} pendentes →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}