import { useState } from 'react';
import { api } from '@/api/client';
import { calcularCategoria, calcularIdade, gerarNumeroMatricula, isIdadeDeMatriculaValida } from '@/utils/athleteUtils';
import { Upload, CheckCircle, AlertCircle, Loader2, User, FileText, Shield } from 'lucide-react';
import { EditableText } from '@/components/layout/SiteEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const TIPO_SANGUINEO = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function UploadField({ label, id, accept, file, onChange, required }) {
  return (
    <div>
      <Label htmlFor={id} className="font-montserrat font-semibold text-gray-700 text-sm">
        {label} {required && <span className="text-burgundy">*</span>}
      </Label>
      <label
        htmlFor={id}
        className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-gold/40 hover:border-gold rounded-xl p-6 cursor-pointer transition-all bg-gray-50 hover:bg-gold/5">
        
        {file ?
        <div className="text-center">
            <CheckCircle size={28} className="text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-semibold text-sm">{file.name}</p>
            <p className="text-gray-400 text-xs mt-1">Clique para trocar</p>
          </div> :

        <div className="text-center">
            <Upload size={28} className="text-gold mx-auto mb-2" />
            <p className="text-gray-600 text-sm font-medium">Clique para selecionar</p>
            <p className="text-gray-400 text-xs mt-1">{accept.replace(/\./g, '').toUpperCase()}</p>
          </div>
        }
        <input id={id} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files[0])} />
      </label>
    </div>);

}

export default function Matricula() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [protocolo, setProtocolo] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nome: '', dataNascimento: '', tipoSanguineo: '',
    nomeResponsavel: '', telefoneResponsavel: '',
    cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '',
    consentimentoLGPD: false
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [rgFile, setRgFile] = useState(null);
  const [atestadoFile, setAtestadoFile] = useState(null);

  const categoria = form.dataNascimento ? calcularCategoria(form.dataNascimento) : '—';
  const idade = form.dataNascimento ? calcularIdade(form.dataNascimento) : '—';

  const updateForm = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!isIdadeDeMatriculaValida(form.dataNascimento)) {
      setError('A matrícula é destinada a atletas de 7 a 17 anos completos.');
      return;
    }
    if (!form.consentimentoLGPD) {
      setError('Você deve aceitar os Termos de Consentimento LGPD para prosseguir.');
      return;
    }
    if (!fotoFile || !rgFile || !atestadoFile) {
      setError('Todos os documentos são obrigatórios (Foto, RG/Certidão e Atestado Médico).');
      return;
    }

    setLoading(true);
    setError('');

    const uploadFile = async (file) => {
      const { file_url } = await api.integrations.Core.UploadFile({ file, visibility: 'private' });
      return file_url;
    };

    const [fotoUrl, rgUrl, atestadoUrl] = await Promise.all([
    uploadFile(fotoFile),
    uploadFile(rgFile),
    uploadFile(atestadoFile)]
    );

    const numeroMatricula = gerarNumeroMatricula();
    await api.entities.Athlete.create({
      ...form,
      categoria,
      numeroMatricula,
      fotoUrl,
      rgUrl,
      atestadoUrl,
      status: 'pendente'
    });

    setProtocolo(numeroMatricula);
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 text-center border-t-4 border-gold">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="font-montserrat font-black text-burgundy text-3xl mb-3">Cadastro Enviado!</h2>
          <p className="text-gray-600 mb-6">
            Seu cadastro foi recebido com sucesso e está aguardando análise da administração da escolinha.
          </p>
          <div className="bg-burgundy/5 border border-burgundy/20 rounded-xl p-4 mb-6">
            <p className="text-gray-500 text-sm">Número de Protocolo</p>
            <p className="font-montserrat font-black text-burgundy text-2xl">{protocolo}</p>
          </div>
          <p className="text-gray-500 text-sm">
            Guarde este número. A equipe da Arco Iris entrará em contato em breve.
          </p>
        </div>
      </div>);

  }

  return (
    <div className="font-roboto">
      {/* Hero */}
      <section className="relative py-20 bg-burgundy">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-montserrat font-semibold text-gold uppercase tracking-widest text-sm mb-4"><EditableText field="hero.eyebrow">Faça parte do projeto fazendo hoje para refletir no amanha - parte III</EditableText></p>
          <h1 className="font-montserrat font-black text-white text-5xl mb-4"><EditableText field="hero.title">MATRÍCULA ONLINE</EditableText></h1>
          <div className="w-16 h-1 bg-gold mx-auto" />
        </div>
      </section>

      {/* Steps indicator */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-16 z-30">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          {[
          { n: 1, label: 'Atleta', icon: User },
          { n: 2, label: 'Responsável', icon: User },
          { n: 3, label: 'Documentos', icon: FileText },
          { n: 4, label: 'LGPD & Confirmação', icon: Shield }].
          map(({ n, label, icon: Icon }, i) =>
          <div key={n} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-montserrat font-bold text-sm ${step >= n ? 'bg-burgundy text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step > n ? '✓' : n}
                </div>
                <span className={`text-xs mt-1 font-montserrat hidden sm:block ${step >= n ? 'text-burgundy font-semibold' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < 3 && <div className={`h-0.5 flex-1 ${step > n ? 'bg-burgundy' : 'bg-gray-200'}`} />}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {error &&
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        }

        {/* Step 1: Dados do Atleta */}
        {step === 1 &&
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="font-montserrat font-black text-burgundy text-2xl mb-6 flex items-center gap-3">
              <User size={24} className="text-gold" /> Dados do Atleta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Nome Completo *</Label>
                <Input className="mt-2" value={form.nome} onChange={(e) => updateForm('nome', e.target.value)} placeholder="Nome completo do atleta" />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Data de Nascimento *</Label>
                <Input className="mt-2" type="date" value={form.dataNascimento} onChange={(e) => updateForm('dataNascimento', e.target.value)} />
                <p className="text-gray-500 text-xs mt-1">Matrículas para atletas de 7 a 17 anos completos.</p>
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Tipo Sanguíneo</Label>
                <Select value={form.tipoSanguineo} onValueChange={(v) => updateForm('tipoSanguineo', v)}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPO_SANGUINEO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.dataNascimento &&
          <div className="mt-5 p-4 bg-burgundy/5 border border-gold/30 rounded-xl">
                <p className="text-sm text-gray-600">Calculado automaticamente:</p>
                <div className="flex gap-6 mt-1">
                  <div><span className="text-gray-500 text-xs">Idade:</span> <span className="font-montserrat font-bold text-burgundy">{idade} anos</span></div>
                  <div><span className="text-gray-500 text-xs">Categoria:</span> <span className="font-montserrat font-bold text-burgundy">{categoria}</span></div>
                </div>
              </div>
          }
            {form.dataNascimento && !isIdadeDeMatriculaValida(form.dataNascimento) &&
          <p className="mt-3 text-sm text-red-700" role="alert">A idade deve estar entre 7 e 17 anos completos para realizar a matrícula.</p>
          }
            <div className="flex justify-end mt-6">
              <Button
              onClick={() => {
                if (!form.nome || !form.dataNascimento) {
                  setError('Preencha nome e data de nascimento.');
                  return;
                }
                if (!isIdadeDeMatriculaValida(form.dataNascimento)) {
                  setError('A matrícula é destinada a atletas de 7 a 17 anos completos.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold px-8">
              
                Próximo
              </Button>
            </div>
          </div>
        }

        {/* Step 2: Responsável */}
        {step === 2 &&
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="font-montserrat font-black text-burgundy text-2xl mb-6 flex items-center gap-3">
              <User size={24} className="text-gold" /> Dados do Responsável
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Nome Completo do Responsável *</Label>
                <Input className="mt-2" value={form.nomeResponsavel} onChange={(e) => updateForm('nomeResponsavel', e.target.value)} placeholder="Nome do pai/mãe/responsável" />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Telefone / WhatsApp *</Label>
                <Input className="mt-2" value={form.telefoneResponsavel} onChange={(e) => updateForm('telefoneResponsavel', e.target.value)} placeholder="(75) 99999-9999" />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">CEP</Label>
                <Input className="mt-2" value={form.cep} onChange={(e) => updateForm('cep', e.target.value)} placeholder="00000-000" />
              </div>
              <div className="md:col-span-2">
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Rua / Logradouro</Label>
                <Input className="mt-2" value={form.rua} onChange={(e) => updateForm('rua', e.target.value)} />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Número</Label>
                <Input className="mt-2" value={form.numero} onChange={(e) => updateForm('numero', e.target.value)} />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Bairro</Label>
                <Input className="mt-2" value={form.bairro} onChange={(e) => updateForm('bairro', e.target.value)} />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Cidade</Label>
                <Input className="mt-2" value={form.cidade} onChange={(e) => updateForm('cidade', e.target.value)} />
              </div>
              <div>
                <Label className="font-montserrat font-semibold text-gray-700 text-sm">Estado</Label>
                <Input className="mt-2" value={form.estado} onChange={(e) => updateForm('estado', e.target.value)} placeholder="BA" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="font-montserrat font-semibold">Voltar</Button>
              <Button
              onClick={() => {if (!form.nomeResponsavel || !form.telefoneResponsavel) {setError('Preencha nome e telefone do responsável.');return;}setError('');setStep(3);}}
              className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold px-8">
              
                Próximo
              </Button>
            </div>
          </div>
        }

        {/* Step 3: Documentos */}
        {step === 3 &&
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="font-montserrat font-black text-burgundy text-2xl mb-2 flex items-center gap-3">
              <FileText size={24} className="text-gold" /> Documentos
            </h2>
            <p className="text-gray-500 text-sm mb-6">Todos os documentos são obrigatórios e armazenados com segurança.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <UploadField label="Foto do Atleta" id="foto" accept=".jpg,.jpeg,.png" file={fotoFile} onChange={setFotoFile} required />
              <UploadField label="RG ou Certidão de Nascimento" id="rg" accept=".jpg,.jpeg,.png,.pdf" file={rgFile} onChange={setRgFile} required />
              <UploadField label="Atestado Médico" id="atestado" accept=".jpg,.jpeg,.png,.pdf" file={atestadoFile} onChange={setAtestadoFile} required />
            </div>
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setStep(2)} className="font-montserrat font-semibold">Voltar</Button>
              <Button
              onClick={() => {if (!fotoFile || !rgFile || !atestadoFile) {setError('Selecione todos os documentos.');return;}setError('');setStep(4);}}
              className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-bold px-8">
              
                Próximo
              </Button>
            </div>
          </div>
        }

        {/* Step 4: LGPD + Confirm */}
        {step === 4 &&
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="font-montserrat font-black text-burgundy text-2xl mb-4 flex items-center gap-3">
              <Shield size={24} className="text-gold" /> Consentimento & Confirmação
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-sm text-gray-600 max-h-48 overflow-y-auto leading-relaxed">
              <p className="font-semibold text-gray-800 mb-2">Termos de Consentimento LGPD</p>
              <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018), declaro que:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Sou responsável legal pelo menor indicado neste formulário.</li>
                <li>Autorizo o uso dos dados pessoais do menor para fins de gestão esportiva e educacional.</li>
                <li>Consinto com o armazenamento dos documentos enviados (foto, RG/Certidão e Atestado Médico) em ambiente seguro e de uso exclusivo da Escolinha de Futebol Arco Iris.</li>
                <li>Compreendo que estes dados não serão compartilhados com terceiros sem meu consentimento expresso.</li>
                <li>Estou ciente que posso solicitar a exclusão ou correção dos dados a qualquer momento.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
              type="checkbox"
              checked={form.consentimentoLGPD}
              onChange={(e) => updateForm('consentimentoLGPD', e.target.checked)}
              className="mt-1 w-5 h-5 accent-burgundy" />
            
              <span className="text-gray-700 text-sm font-medium">
                Li e concordo com os Termos de Consentimento LGPD para uso de dados pessoais de meu filho(a) menor de idade. <span className="text-burgundy font-bold">*</span>
              </span>
            </label>

            {/* Resumo */}
            <div className="bg-burgundy/5 border border-gold/20 rounded-xl p-4 mb-6 text-sm">
              <p className="font-montserrat font-bold text-burgundy mb-2">Resumo do Cadastro</p>
              <p><span className="text-gray-500">Atleta:</span> <strong>{form.nome}</strong></p>
              <p><span className="text-gray-500">Categoria:</span> <strong>{categoria}</strong></p>
              <p><span className="text-gray-500">Responsável:</span> <strong>{form.nomeResponsavel}</strong></p>
              <p><span className="text-gray-500">Documentos:</span> <strong>3 arquivos selecionados</strong></p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="font-montserrat font-semibold">Voltar</Button>
              <Button
              onClick={handleSubmit}
              disabled={loading || !form.consentimentoLGPD}
              className="bg-burgundy hover:bg-red-900 text-white font-montserrat font-black px-10 py-3 text-lg disabled:opacity-50">
              
                {loading ? <><Loader2 size={18} className="animate-spin mr-2" />Enviando...</> : 'Enviar Matrícula'}
              </Button>
            </div>
          </div>
        }
      </div>
    </div>);

}