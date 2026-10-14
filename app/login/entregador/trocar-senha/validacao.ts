// Mesmas regras do TrocarSenhaDto do backend.
export const TAMANHO_MINIMO = 8;
export const TAMANHO_MAXIMO = 72;
export const CARACTERES_PERMITIDOS = /^[\x21-\x7E]*$/;

export function validarNovaSenha(senhaAtual: string, novaSenha: string, confirmacao: string): string | null {
  if (novaSenha.length < TAMANHO_MINIMO) return `A nova senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres`;
  if (novaSenha.length > TAMANHO_MAXIMO) return `A nova senha pode ter no máximo ${TAMANHO_MAXIMO} caracteres`;
  if (!CARACTERES_PERMITIDOS.test(novaSenha)) return 'Use apenas letras sem acento, números e símbolos do teclado, sem espaços';
  if (novaSenha === senhaAtual) return 'A nova senha precisa ser diferente da temporária';
  if (novaSenha !== confirmacao) return 'As senhas não conferem';
  return null;
}
