import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api/client';
import { Check, X, Loader2, ClipboardCheck, Save, UserX, Plus, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { generateAttendanceReport } from '@/utils/attendanceReport';

const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Adulto'];

function localDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function localMonth() {
  return localDate().slice(0, 7);
}

function dateLabel(value) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`));
}

export default function Frequencia() {
  const [categoria, setCategoria] = useState('Sub-11');
  const [month, setMonth] = useState(localMonth());
  const [aulas, setAulas] = useState([]);
  const [aulaId, setAulaId] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [presencas, setPresencas] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [lessonDate, setLessonDate] = useState(localDate());
  const [lessonTitle, setLessonTitle] = useState('Treino');
  const [salvo, setSalvo] = useState(false);
  const [error, setError] = useState('');

  const aulaSelecionada = aulas.find((aula) => aula.id === aulaId);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      api.entities.TrainingSession.filter({ categoria }, 'data'),
      api.entities.Athlete.filter({ categoria, status: 'ativo' }, 'nome'),
      api.entities.Attendance.filter({ categoria }),
    ]).then(([sessionRows, athleteRows, attendanceRows]) => {
      if (!active) return;
      const monthSessions = sessionRows.filter((session) => session.data?.startsWith(month));
      setAulas(monthSessions);
      setAulaId((current) => (
        monthSessions.some((session) => session.id === current)
          ? current
          : monthSessions[monthSessions.length - 1]?.id || ''
      ));
      setAthletes(athleteRows);
      setAttendanceRecords(attendanceRows);
    }).catch((loadError) => {
      if (active) setError(loadError.message || 'Não foi possível carregar as aulas e frequências.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [categoria, month]);

  useEffect(() => {
    setSalvo(false);
    if (!aulaSelecionada) {
      setPresencas({});
      return;
    }
    const records = attendanceRecords.filter((record) => (
      record.sessionId
        ? record.sessionId === aulaSelecionada.id
        : record.data === aulaSelecionada.data
    ));
    setPresencas(Object.fromEntries(records.map((record) => [record.athleteId, record.presente])));
  }, [aulaSelecionada, attendanceRecords]);

  const reportRows = useMemo(() => athletes.map((athlete) => {
    const recordsBySession = new Map();
    attendanceRecords
      .filter((record) => record.data?.startsWith(month) && record.athleteId === athlete.id)
      .forEach((record) => {
        const key = record.sessionId || record.data;
        recordsBySession.set(key, record);
      });
    const records = [...recordsBySession.values()];
    const presentes = records.filter((record) => record.presente !== false).length;
    const faltas = records.length - presentes;
    return {
      id: athlete.id,
      nome: athlete.nome,
      presentes,
      faltas,
      total: records.length,
      percentage: records.length ? Math.round((presentes / records.length) * 100) : 0,
    };
  }).sort((first, second) => first.nome.localeCompare(second.nome, 'pt-BR')), [athletes, attendanceRecords, month]);

  const presentes = athletes.filter((athlete) => presencas[athlete.id] !== false).length;
  const ausentes = athletes.length - presentes;

  const setPresente = (id, value) => {
    setSalvo(false);
    setPresencas((current) => ({ ...current, [id]: value }));
  };

  const criarAula = async (event) => {
    event.preventDefault();
    if (aulas.some((session) => session.data === lessonDate)) {
      setError('Já há uma aula cadastrada para esta turma nessa data. Selecione a aula existente.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await api.entities.TrainingSession.create({
        categoria,
        data: lessonDate,
        titulo: lessonTitle.trim() || 'Treino',
      });
      setMonth(lessonDate.slice(0, 7));
      setAulas((current) => [...current.filter((session) => session.id !== created.id), created]
        .sort((first, second) => first.data.localeCompare(second.data)));
      setAulaId(created.id);
      setAttendanceRecords((current) => current.filter((record) => record.data?.startsWith(lessonDate.slice(0, 7))));
      setPresencas({});
      setSalvo(false);
      setShowNewLesson(false);
      setLessonTitle('Treino');
    } catch (createError) {
      setError(createError.message || 'Não foi possível cadastrar a aula.');
    } finally {
      setCreating(false);
    }
  };

  const salvar = async () => {
    if (!aulaSelecionada) return;
    setSaving(true);
    setError('');
    const records = athletes.map((athlete) => ({
      athleteId: athlete.id,
      athleteNome: athlete.nome,
      categoria,
      data: aulaSelecionada.data,
      sessionId: aulaSelecionada.id,
      presente: presencas[athlete.id] !== false,
    }));
    try {
      const legacyRecords = attendanceRecords
        .filter((record) => record.data === aulaSelecionada.data && !record.sessionId)
        .map((record) => ({ ...record, sessionId: aulaSelecionada.id }));
      if (legacyRecords.length) {
        await api.entities.Attendance.upsert(legacyRecords, { key: ['athleteId', 'data'] });
      }
      const savedRecords = await api.entities.Attendance.upsert(records, { key: ['athleteId', 'sessionId'] });
      setAttendanceRecords((current) => [
        ...current.filter((record) => (
          record.sessionId !== aulaSelecionada.id
          && !(record.data === aulaSelecionada.data && !record.sessionId)
        )),
        ...savedRecords,
      ]);
      setSaving(false);
      setSalvo(true);
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar a frequência.');
      setSaving(false);
    }
  };

  const frequent = reportRows.filter((student) => student.total > 0 && student.percentage >= 75).length;
  const faltantes = reportRows.filter((student) => student.total > 0 && student.percentage < 75).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-black text-gray-800 text-3xl flex items-center gap-2">
          <ClipboardCheck size={28} className="text-burgundy" /> Frequência
        </h1>
        <p className="text-gray-500 mt-1">Cadastre cada aula e registre a chamada dos atletas</p>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="frequency-category" className="font-montserrat font-semibold text-sm">Turma / Categoria</Label>
          <select
            id="frequency-category"
            value={categoria}
            onChange={(event) => { setCategoria(event.target.value); setAulaId(''); }}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {CATEGORIAS.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div>
          <Label htmlFor="frequency-month" className="font-montserrat font-semibold text-sm">Mês das aulas e do relatório</Label>
          <Input id="frequency-month" type="month" className="mt-1" value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => setShowNewLesson((current) => !current)} className="w-full bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
            <Plus size={16} /> Cadastrar aula
          </Button>
        </div>
      </div>

      {showNewLesson && (
        <form onSubmit={criarAula} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 grid sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="lesson-date" className="font-montserrat font-semibold text-sm">Data da aula</Label>
            <Input id="lesson-date" type="date" required className="mt-1" value={lessonDate} onChange={(event) => setLessonDate(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="lesson-title" className="font-montserrat font-semibold text-sm">Identificação da aula</Label>
            <Input id="lesson-title" className="mt-1" value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} placeholder="Ex.: Treino técnico" />
          </div>
          <Button type="submit" disabled={creating} className="bg-green-700 hover:bg-green-800 text-white font-montserrat font-bold gap-2">
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Salvar aula
          </Button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 grid sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <div>
          <Label htmlFor="frequency-session" className="font-montserrat font-semibold text-sm">Aula cadastrada neste mês</Label>
          <select
            id="frequency-session"
            value={aulaId}
            onChange={(event) => setAulaId(event.target.value)}
            disabled={loading || aulas.length === 0}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="">Selecione uma aula</option>
            {aulas.map((session) => (
              <option key={session.id} value={session.id}>
                {dateLabel(session.data)} — {session.titulo}
              </option>
            ))}
          </select>
        </div>
        <div className="text-center">
          <p className="font-montserrat font-black text-green-600 text-2xl">{frequent}</p>
          <p className="text-gray-400 text-xs">Frequentes (≥75%)</p>
        </div>
        <div className="text-center">
          <p className="font-montserrat font-black text-red-500 text-2xl">{faltantes}</p>
          <p className="text-gray-400 text-xs">Faltantes (&lt;75%)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="font-montserrat font-bold text-gray-800 text-lg mb-4">
          Chamada {aulaSelecionada ? `— ${dateLabel(aulaSelecionada.data)} · ${aulaSelecionada.titulo}` : ''}
        </h2>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={30} className="animate-spin text-burgundy" /></div>
        ) : !aulaSelecionada ? (
          <div className="text-center py-12 text-gray-400">
            <UserX size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Cadastre ou selecione uma aula para abrir a chamada.</p>
          </div>
        ) : athletes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserX size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Nenhum atleta ativo nesta turma.</p>
          </div>
        ) : (
          <>
            <div className="flex gap-6 mb-4">
              <p className="text-sm text-green-700"><strong>{presentes}</strong> presentes</p>
              <p className="text-sm text-red-600"><strong>{ausentes}</strong> ausentes</p>
            </div>
            <div className="space-y-2">
              {athletes.map((athlete) => {
                const presente = presencas[athlete.id] !== false;
                return (
                  <div key={athlete.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-montserrat font-semibold text-gray-700">{athlete.nome}</p>
                      <p className="text-gray-400 text-xs font-mono">{athlete.numeroMatricula}</p>
                    </div>
                    <button type="button" onClick={() => setPresente(athlete.id, true)} className={`px-3 py-1.5 rounded-lg text-sm font-montserrat font-bold flex items-center gap-1 transition-all ${presente ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-50'}`}>
                      <Check size={15} /> Presente
                    </button>
                    <button type="button" onClick={() => setPresente(athlete.id, false)} className={`px-3 py-1.5 rounded-lg text-sm font-montserrat font-bold flex items-center gap-1 transition-all ${!presente ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-red-50'}`}>
                      <X size={15} /> Ausente
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-400 text-sm">{salvo ? 'Frequência salva' : 'Marque a presença e salve'}</p>
              <Button onClick={salvar} disabled={saving} className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar chamada
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-montserrat font-bold text-gray-800 text-lg">Relatório mensal</h2>
            <p className="text-gray-500 text-sm">Frequente: 75% ou mais das chamadas registradas no mês.</p>
          </div>
          <Button onClick={() => generateAttendanceReport({ category: categoria, month, students: reportRows })} disabled={loading || reportRows.length === 0} variant="outline" className="gap-2">
            <FileDown size={16} /> Baixar relatório PDF
          </Button>
        </div>
        {reportRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Não há atletas ativos nesta turma para o relatório.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">Atleta</th>
                  <th className="py-2 px-3">Presenças</th>
                  <th className="py-2 px-3">Faltas</th>
                  <th className="py-2 px-3">Frequência</th>
                  <th className="py-2 pl-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((student) => {
                  const status = student.total === 0 ? 'Sem chamada' : student.percentage >= 75 ? 'Frequente' : 'Faltante';
                  return (
                    <tr key={student.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium text-gray-700">{student.nome}</td>
                      <td className="py-3 px-3">{student.presentes}</td>
                      <td className="py-3 px-3">{student.faltas}</td>
                      <td className="py-3 px-3">{student.total ? `${student.percentage}%` : '—'}</td>
                      <td className={`py-3 pl-3 font-semibold ${status === 'Frequente' ? 'text-green-700' : status === 'Faltante' ? 'text-red-600' : 'text-gray-400'}`}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
