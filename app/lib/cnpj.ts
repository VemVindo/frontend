const PESOS_PRIMEIRO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_SEGUNDO = [6, ...PESOS_PRIMEIRO];
const DOZE_ALFANUMERICOS_E_DOIS_DIGITOS = /^[A-Z0-9]{12}\d{2}$/;
const MESMO_CARACTERE_REPETIDO = /^(.)\1{13}$/;
const CODIGO_DO_ZERO = 48;

// Mesmo cálculo do backend (src/common/validators/is-cnpj.validator.ts),
// inclusive o CNPJ alfanumérico.
export function cnpjValido(cnpj: string): boolean {
  if (!DOZE_ALFANUMERICOS_E_DOIS_DIGITOS.test(cnpj)) return false;
  if (MESMO_CARACTERE_REPETIDO.test(cnpj)) return false;

  const valores = cnpj.split('').map((c) => c.charCodeAt(0) - CODIGO_DO_ZERO);
  const verificador = (pesos: number[]) => {
    const resto = pesos.reduce((soma, peso, i) => soma + valores[i] * peso, 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return verificador(PESOS_PRIMEIRO) === valores[12] && verificador(PESOS_SEGUNDO) === valores[13];
}

export function normalizarCnpj(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 14);
}
