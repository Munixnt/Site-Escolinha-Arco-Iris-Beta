export { calcularCategoria, calcularIdade, isIdadeDeMatriculaValida } from '../../shared/athlete.js';

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