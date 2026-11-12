const LETRAS_DE_NOME = /[^A-Za-zÀ-ÖØ-öø-ÿ\s'.-]/g;

/** Mantém letras (com acento), espaços, apóstrofo, ponto e hífen: "Maria d'Ávila", "Embu-Guaçu". */
export function somenteLetras(texto: string): string {
  return texto.replace(LETRAS_DE_NOME, '');
}

const DIGITOS_DOS_REAIS = 5;

/** Aceita só dígitos e uma vírgula, com até 2 casas decimais. Ponto vira vírgula. */
export function somenteValorEmReais(texto: string): string {
  const [reais = '', ...resto] = texto
    .replace(/\./g, ',')
    .replace(/[^\d,]/g, '')
    .split(',');
  const inteiro = reais.slice(0, DIGITOS_DOS_REAIS);
  if (resto.length === 0) return inteiro;
  return `${inteiro},${resto.join('').slice(0, 2)}`;
}
