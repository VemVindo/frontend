const PESOS_PRIMEIRO_DIGITO_CNPJ = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO_DIGITO_CNPJ = [6, ...PESOS_PRIMEIRO_DIGITO_CNPJ];

function digitosAleatorios(quantidade: number): number[] {
  return Array.from({ length: quantidade }, () => Math.floor(Math.random() * 10));
}

function digitoVerificadorDoCpf(digitos: number[]): number {
  const soma = digitos.reduce((total, digito, indice) => total + digito * (digitos.length + 1 - indice), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function digitoVerificadorDoCnpj(digitos: number[], pesos: number[]): number {
  const resto = pesos.reduce((soma, peso, indice) => soma + digitos[indice] * peso, 0) % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function gerarCpf(): string {
  const base = digitosAleatorios(9);
  const primeiro = digitoVerificadorDoCpf(base);
  const segundo = digitoVerificadorDoCpf([...base, primeiro]);
  return [...base, primeiro, segundo].join('');
}

export function gerarCnpj(): string {
  const base = [...digitosAleatorios(8), 0, 0, 0, 1];
  const primeiro = digitoVerificadorDoCnpj(base, PESOS_PRIMEIRO_DIGITO_CNPJ);
  const segundo = digitoVerificadorDoCnpj([...base, primeiro], PESOS_SEGUNDO_DIGITO_CNPJ);
  return [...base, primeiro, segundo].join('');
}

export function gerarSufixo(): string {
  return Date.now().toString(36);
}

const LETRA_DO_DIGITO = 'abcdefghij';

export function gerarSufixoDeLetras(): string {
  return gerarSufixo().replace(/\d/g, (digito) => LETRA_DO_DIGITO[Number(digito)]);
}

export function codigoDiferenteDe(codigoCerto: string): string {
  return codigoCerto === '000000' ? '111111' : '000000';
}
