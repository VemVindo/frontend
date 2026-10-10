export interface FormularioNovoPedido {
  nome_recebedor: string;
  telefone: string;
  endereco_entrega: string;
  itens: string;
  observacoes: string;
}

export type ErrosNovoPedido = Partial<Record<keyof FormularioNovoPedido, string>>;

export function validarNovoPedido(dados: FormularioNovoPedido): ErrosNovoPedido {
  const erros: ErrosNovoPedido = {};
  if (!dados.nome_recebedor.trim()) erros.nome_recebedor = 'Informe o nome do recebedor.';
  if (!dados.telefone.trim()) {
    erros.telefone = 'Informe o telefone de contato.';
  } else {
    const digitos = dados.telefone.replace(/[\s()+.-]/g, '');
    if (!/^[\d\s()+.-]+$/.test(dados.telefone) || !/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digitos)) {
      erros.telefone = 'Informe um telefone brasileiro com DDD, como (61) 99999-0000.';
    }
  }
  if (!dados.endereco_entrega.trim()) erros.endereco_entrega = 'Informe o endereço de entrega.';
  return erros;
}
