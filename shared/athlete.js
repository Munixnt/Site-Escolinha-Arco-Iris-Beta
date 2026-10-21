function parseBirthDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value || '');
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function calcularIdade(dataNascimento) {
  const nascimento = parseBirthDate(dataNascimento);
  if (!nascimento) return 0;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

export function isIdadeDeMatriculaValida(dataNascimento) {
  const nascimento = parseBirthDate(dataNascimento);
  if (!nascimento) return false;
  const idade = calcularIdade(dataNascimento);
  return idade >= 7 && idade <= 17;
}

export function calcularCategoria(dataNascimento) {
  if (!parseBirthDate(dataNascimento)) return 'Adulto';
  const idade = calcularIdade(dataNascimento);

  if (idade <= 7) return 'Sub-7';
  if (idade <= 9) return 'Sub-9';
  if (idade <= 11) return 'Sub-11';
  if (idade <= 13) return 'Sub-13';
  if (idade <= 15) return 'Sub-15';
  if (idade <= 17) return 'Sub-17';
  return 'Adulto';
}
