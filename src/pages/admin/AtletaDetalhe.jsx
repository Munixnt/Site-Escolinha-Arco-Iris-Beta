import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/api/client';
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Loader2, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calcularIdade, categoriaColors, statusColors, MESES } from '@/utils/athleteUtils';
import { generateAthleteCard } from '@/utils/cardGenerator';

export default function AtletaDetalhe() {
  const { id } = useParams();
  const [athlete, setAthlete] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.entities.Athlete.filter({ id }),
      api.entities.Payment.filter({ athleteId: id }, '-ano'),
    ]).then(([ath, pay]) => {
      setAthlete(ath[0] || null);
      setPayments(pay);
      setLoading(false);
    });
  }, [id]);

  const aprovar = async () => {
    setSaving(true);
    const updated = await api.entities.Athlete.update(id, { status: 'ativo' });
    setAthlete(updated);
    setSaving(false);
  };

  const inativar = async () => {
    setSaving(true);
    const updated = await api.entities.Athlete.update(id, { status: 'inativo' });
    setAthlete(updated);
    setSaving(false);
  };

  const gerarCarteirinha = async () => {
    setGenerating(true);
    await generateAthleteCard(athlete);
    setGenerating(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-burgundy" />
    </div>
  );

  if (!athlete) return (
    <div className="text-center py-20">
      <p className="text-gray-400">Atleta não encontrado.</p>
      <Link to="/admin/atletas" className="text-burgundy font-semibold mt-4 inline-block">← Voltar</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/atletas" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-montserrat font-black text-gray-800 text-2xl">{athlete.nome}</h1>
          <p className="text-gray-500 text-sm font-mono">{athlete.numeroMatricula}</p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          {athlete.status === 'pendente' && (
            <Button onClick={aprovar} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-montserrat font-bold gap-2">
              <CheckCircle size={16} /> Aprovar
            </Button>
          )}
          {athlete.status === 'ativo' && (
            <Button onClick={inativar} disabled={saving} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 font-montserrat font-bold gap-2">
              <XCircle size={16} /> Inativar
            </Button>
          )}
          <Button onClick={gerarCarteirinha} disabled={generating} className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            Gerar Carteirinha
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Foto + Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          {athlete.fotoUrl
            ? <img src={athlete.fotoUrl} alt={athlete.nome} className="w-28 h-28 rounded-full object-cover border-4 border-gold mx-auto mb-4" />
            : <div className="w-28 h-28 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={44} className="text-burgundy/30" />
              </div>
          }
          <p className="font-montserrat font-black text-gray-800 text-lg">{athlete.nome}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-montserrat font-bold ${statusColors[athlete.status]}`}>
            {athlete.status}
          </span>
          <div className="mt-4 text-left space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Categoria</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${categoriaColors[athlete.categoria]}`}>{athlete.categoria}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Idade</span>
              <span className="font-semibold text-gray-700">{calcularIdade(athlete.dataNascimento)} anos</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Tipo Sanguíneo</span>
              <span className="font-bold text-burgundy">{athlete.tipoSanguineo || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nascimento</span>
              <span className="font-semibold">{athlete.dataNascimento ? new Date(athlete.dataNascimento).toLocaleDateString('pt-BR') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Dados do Responsável */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-montserrat font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <User size={16} className="text-burgundy" /> Responsável
          </h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Nome', value: athlete.nomeResponsavel },
              { label: 'Telefone', value: athlete.telefoneResponsavel },
              { label: 'Endereço', value: athlete.rua ? `${athlete.rua}, ${athlete.numero} — ${athlete.bairro}` : null },
              { label: 'Cidade/UF', value: athlete.cidade ? `${athlete.cidade}/${athlete.estado}` : null },
              { label: 'CEP', value: athlete.cep },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col border-b border-gray-50 pb-2">
                <span className="text-gray-400 text-xs">{label}</span>
                <span className="text-gray-700 font-medium">{value || '—'}</span>
              </div>
            ))}
          </div>

          <h3 className="font-montserrat font-bold text-gray-800 text-base mt-6 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-burgundy" /> Documentos
          </h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Foto do Atleta', url: athlete.fotoUrl },
              { label: 'RG / Certidão', url: athlete.rgUrl },
              { label: 'Atestado Médico', url: athlete.atestadoUrl },
            ].map(({ label, url }) => (
              <div key={label} className="flex items-center justify-between border border-gray-100 rounded-lg p-2">
                <span className="text-gray-600">{label}</span>
                {url
                  ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-burgundy text-xs font-semibold hover:underline">Ver</a>
                  : <span className="text-gray-300 text-xs">Não enviado</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Histórico de Pagamentos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-montserrat font-bold text-gray-800 text-base mb-4">Histórico de Pagamentos</h3>
          {payments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum registro de pagamento</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-montserrat font-semibold text-gray-700 text-sm">{MESES[p.mes - 1]} {p.ano}</p>
                    {p.valor && <p className="text-gray-400 text-xs">R$ {Number(p.valor).toFixed(2)}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    p.status === 'pago' ? 'bg-green-100 text-green-800' :
                    p.status === 'inadimplente' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}