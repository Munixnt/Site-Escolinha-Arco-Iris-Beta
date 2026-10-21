export function calcularCategoria(dataNascimento) {
  if (!dataNascimento) return 'Adulto';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  const idade = hoje.getFullYear() - nasc.getFullYear();

  if (idade <= 7) return 'Sub-7';
  if (idade <= 9) return 'Sub-9';
  if (idade <= 11) return 'Sub-11';
  if (idade <= 13) return 'Sub-13';
  if (idade <= 15) return 'Sub-15';
  if (idade <= 17) return 'Sub-17';
  return 'Adulto';
}

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function gerarNumeroMatricula() {
  const ano = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `AI${ano}${rand}`;
}

export const categoriaColors = {
  'Sub-7': 'bg-pink-100 text-pink-800',
  'Sub-9': 'bg-purple-100 text-purple-800',
  'Sub-11': 'bg-blue-100 text-blue-800',
  'Sub-13': 'bg-cyan-100 text-cyan-800',
  'Sub-15': 'bg-green-100 text-green-800',
  'Sub-17': 'bg-yellow-100 text-yellow-800',
  'Adulto': 'bg-red-100 text-red-800',
};

export const statusColors = {
  pendente: 'bg-yellow-100 text-yellow-800',
  ativo: 'bg-green-100 text-green-800',
  inativo: 'bg-gray-100 text-gray-600',
};

export const paymentStatusColors = {
  pago: 'bg-green-100 text-green-800',
  pendente: 'bg-yellow-100 text-yellow-800',
  inadimplente: 'bg-red-100 text-red-800',
};

export const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];