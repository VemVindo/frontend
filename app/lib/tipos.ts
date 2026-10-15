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

// Contrato atual de POST /pedido/criar, separado dos tipos da listagem.
export interface CriarPedidoRequisicao {
  nome_recebedor: string;
  telefone_recebedor: string;
  cep: string;
  logradouro: string;
  numero: number;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  descricao: string;
  valor_entrega: number;
  distancia: number;
  idEmpresa: number;
  cpf_entregador?: string;
}

export interface CriarPedidoResposta extends Omit<CriarPedidoRequisicao, 'complemento' | 'cpf_entregador'> {
  id_pedido: number;
  complemento: string | null;
  cpf_entregador: string | null;
  status: 'Pendente' | 'Em andamento';
  data_criacao: string;
  data_inicio_entrega: null;
  data_finalizacao: null;
}
