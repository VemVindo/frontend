// Mesmos limites do TrocarSenhaDto do backend (72 é o limite do bcrypt).
export const TAMANHO_MINIMO = 8;
export const TAMANHO_MAXIMO = 72;

export function validarNovaSenha(senhaAtual: string, novaSenha: string, confirmacao: string): string | null {
  if (novaSenha.length < TAMANHO_MINIMO) return `A nova senha precisa ter pelo menos ${TAMANHO_MINIMO} caracteres`;
  if (novaSenha.length > TAMANHO_MAXIMO) return `A nova senha pode ter no máximo ${TAMANHO_MAXIMO} caracteres`;
  if (novaSenha === senhaAtual) return 'A nova senha precisa ser diferente da temporária';
  if (novaSenha !== confirmacao) return 'As senhas não conferem';
  return null;
}
