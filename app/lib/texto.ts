export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// DDD e número, com 8 ou 9 dígitos: (61) 93000-0000.
export function formatarTelefone(telefone: string): string {
  return telefone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
}
