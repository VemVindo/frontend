export type Cargo = 'ESTABELECIMENTO' | 'ENTREGADOR';

export interface Empresa {
  id: number;
  nomeFantasia: string;
  email: string;
  cargo: 'ESTABELECIMENTO';
}

export interface Entregador {
  cpf: string;
  nome: string;
  cargo: 'ENTREGADOR';
  senhaTemporaria: boolean;
}

export interface RespostaLogin<Usuario> {
  usuario: Usuario;
}

// Exatamente o objeto que a empresa recebe na frota (GET /entregadores).
export interface DadosCompartilhados {
  nome: string;
  cpf: string;
  tipoVeiculo: string;
  placa: string | null;
  disponivel: boolean;
}

export type StatusVinculo = 'PENDENTE' | 'ATIVO';

export interface Vinculo {
  id: number;
  empresa: string;
  status: StatusVinculo;
  convidadoEm: string;
  aceitoEm: string | null;
}

export type StatusPedido = 'PENDENTE' | 'ATRIBUIDO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface PedidoDoEntregador {
  id: number;
  status: StatusPedido;
  empresa: string;
  recebedor: string;
  endereco: string;
  criadoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
}

export interface PedidoAtivo {
  id: number;
  recebedor: string;
  entregador: string | null;
  status: StatusPedido;
  criadoEm: string;
}
