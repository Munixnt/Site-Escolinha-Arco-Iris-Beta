const CATEGORIAS = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Adulto'];

export const entities = {
  SitePage: {
    required: ['slug'],
    defaults: { fields: {}, blocks: [] },
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
  },
  RegistrationSettings: {
    required: ['slug', 'accepting'],
    defaults: { accepting: true },
    enums: { accepting: [true, false] },
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
    publicReadFilter: { slug: 'matricula' },
  },
  Athlete: {
    required: ['nome', 'dataNascimento', 'nomeResponsavel', 'telefoneResponsavel'],
    enums: {
      categoria: CATEGORIAS,
      tipoSanguineo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      statusAtestado: ['anexado', 'entrega_posterior', 'nao_possui'],
      status: ['pendente', 'ativo', 'inativo'],
    },
    defaults: { status: 'pendente', consentimentoLGPD: false },
    perms: { read: 'admin', create: 'public', update: 'admin', delete: 'admin' },
    forcePublicCreate: { status: 'pendente' },
  },
  Attendance: {
    required: ['athleteId', 'data'],
    enums: { categoria: CATEGORIAS },
    defaults: { presente: true },
    perms: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
  },
  TrainingSession: {
    required: ['categoria', 'data', 'titulo'],
    enums: { categoria: CATEGORIAS },
    perms: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
  },
  Aviso: {
    required: ['titulo', 'mensagem'],
    defaults: { ativo: true },
    perms: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
  },
  GalleryAlbum: {
    required: ['nome'],
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
  },
  GalleryItem: {
    required: ['albumId', 'tipo', 'url'],
    enums: { tipo: ['foto', 'video'] },
    defaults: { ordem: 0 },
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
  },
  Lineup: {
    required: ['categoria', 'nomeJogo', 'dataJogo'],
    enums: { categoria: CATEGORIAS },
    defaults: { formacao: '4-3-3' },
    perms: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
  },
  Payment: {
    required: ['athleteId', 'mes', 'ano', 'status'],
    enums: { status: ['pago', 'pendente', 'inadimplente'] },
    defaults: { status: 'pendente' },
    perms: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
  },
  Sponsor: {
    required: ['nome'],
    defaults: { ativo: true, ordem: 0 },
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
    publicReadFilter: { ativo: true },
  },
  TimelineEvent: {
    required: ['ano', 'titulo', 'descricao'],
    defaults: { ordem: 0 },
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
  },
  TransparencyDocument: {
    required: ['titulo', 'categoria', 'arquivoUrl'],
    enums: {
      categoria: ['Estatuto', 'Eleições', 'Projetos', 'Prestação de Contas', 'Atas', 'Outros'],
    },
    defaults: { ordem: 0, ativo: true },
    perms: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
    publicReadFilter: { ativo: true },
  },
};
