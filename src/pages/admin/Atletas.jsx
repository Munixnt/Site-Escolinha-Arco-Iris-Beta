import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Link } from 'react-router-dom';
import { Search, Filter, UserPlus, Eye, PauseCircle, PlayCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoriaColors, statusColors } from '@/utils/athleteUtils';
import { Button } from '@/components/ui/button';

const CATEGORIAS = ['Todas', 'Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Adulto'];
const STATUS = ['Todos', 'pendente', 'ativo', 'inativo'];

export default function Atletas() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [registrationSetting, setRegistrationSetting] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  useEffect(() => {
    api.entities.Athlete.list('-created_date').then(data => {
      setAthletes(data);
      setLoading(false);
    });
    api.entities.RegistrationSettings.filter({ slug: 'matricula' }, null, 1)
      .then(([setting]) => setRegistrationSetting(setting || null))
      .catch(error => setRegistrationError(error.message || 'Não foi possível carregar as configurações de matrícula.'))
      .finally(() => setRegistrationLoading(false));
  }, []);

  const toggleRegistration = async () => {
    setRegistrationSaving(true);
    setRegistrationError('');
    const nextSetting = { slug: 'matricula', accepting: registrationSetting?.accepting === false };
    try {
      const [savedSetting] = await api.entities.RegistrationSettings.upsert([nextSetting], { key: ['slug'] });
      setRegistrationSetting(savedSetting);
    } catch (error) {
      setRegistrationError(error.message || 'Não foi possível atualizar a situação das matrículas.');
    } finally {
      setRegistrationSaving(false);
    }
  };

  const acceptingRegistrations = registrationSetting?.accepting !== false;

  const filtered = athletes.filter(a => {
    const matchSearch = a.nome?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'Todas' || a.categoria === catFilter;
    const matchStatus = statusFilter === 'Todos' || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-montserrat font-black text-gray-800 text-3xl">Atletas</h1>
          <p className="text-gray-500 mt-1">{athletes.length} atletas cadastrados</p>
        </div>
      </div>

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-montserrat font-bold text-gray-800">Matrículas online</h2>
            {registrationLoading ? (
              <p className="mt-1 text-sm text-gray-500">Carregando situação...</p>
            ) : (
              <p className={`mt-1 text-sm font-medium ${acceptingRegistrations ? 'text-green-700' : 'text-amber-700'}`}>
                {acceptingRegistrations ? 'Aceitando novas matrículas' : 'Matrículas suspensas'}
              </p>
            )}
          </div>
          <Button
            type="button"
            onClick={toggleRegistration}
            disabled={registrationLoading || registrationSaving || Boolean(registrationError)}
            variant={acceptingRegistrations ? 'destructive' : 'default'}
            className={!acceptingRegistrations ? 'bg-green-600 text-white hover:bg-green-700' : ''}
          >
            {registrationSaving || registrationLoading
              ? <Loader2 size={16} className="animate-spin" />
              : acceptingRegistrations ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
            {acceptingRegistrations ? 'Suspender matrículas' : 'Aceitar matrículas'}
          </Button>
        </div>
        {registrationError && (
          <p role="alert" className="mt-3 text-sm text-red-700">{registrationError}</p>
        )}
      </section>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input className="pl-9" placeholder="Buscar atleta..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full md:w-44">
            <Filter size={14} className="mr-2 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS.map(s => <SelectItem key={s} value={s}>{s === 'Todos' ? 'Todos Status' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <UserPlus size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-montserrat">Nenhum atleta encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Atleta</th>
                  <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Matrícula</th>
                  <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Categoria</th>
                  <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Status</th>
                  <th className="text-left px-5 py-3 font-montserrat font-bold text-gray-600 text-xs uppercase">Responsável</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {a.fotoUrl
                          ? <img src={a.fotoUrl} alt={a.nome} className="w-9 h-9 rounded-full object-cover border-2 border-gold/30" />
                          : <div className="w-9 h-9 bg-burgundy/10 rounded-full flex items-center justify-center font-bold text-burgundy">{a.nome?.charAt(0)}</div>
                        }
                        <div>
                          <p className="font-montserrat font-semibold text-gray-800 text-sm">{a.nome}</p>
                          <p className="text-gray-400 text-xs">{a.dataNascimento ? new Date(a.dataNascimento).toLocaleDateString('pt-BR') : '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-roboto text-sm text-gray-600 font-mono">{a.numeroMatricula || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-montserrat font-bold ${categoriaColors[a.categoria] || 'bg-gray-100 text-gray-600'}`}>
                        {a.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-montserrat font-bold ${statusColors[a.status] || 'bg-gray-100 text-gray-600'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{a.nomeResponsavel || '—'}</td>
                    <td className="px-5 py-3">
                      <Link to={`/admin/atletas/${a.id}`} className="p-2 rounded-lg text-gray-400 hover:text-burgundy hover:bg-burgundy/5 transition-all inline-flex">
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}