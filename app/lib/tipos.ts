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

// Espelha o enum StatusPedido do Prisma: PENDENTE e o unico status sem entregador.
export type StatusPedido = 'PENDENTE' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';

// GET /pedidos/minhas-entregas. Valor em centavos e distancia em metros.
export interface PedidoDoEntregador {
  id: number;
  status: StatusPedido;
  empresa: string;
  recebedor: string;
  endereco: string;
  valorEntrega: number;
  distancia: number;
  criadoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
}

// GET /pedidos e respostas de PATCH /pedidos/:id/entregador e /status.
export interface PedidoAtivo {
  id: number;
  recebedor: string;
  entregador: string | null;
  status: StatusPedido;
  criadoEm: string;
}

export interface TrocaDeEntregador {
  anterior: string | null;
  novo: string;
  data: string;
}

export interface StatusDisponiveis {
  statusAtual: StatusPedido;
  statusDisponiveis: StatusPedido[];
}
