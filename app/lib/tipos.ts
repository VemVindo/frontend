export type Cargo = 'ESTABELECIMENTO' | 'ENTREGADOR';

export interface Empresa {
  id: number;
  nomeFantasia: string;
  email: string;
  cargo: 'ESTABELECIMENTO';
}

export type TipoDocumento = 'CNPJ' | 'CPF';

// E-US03: o que a empresa pode editar. Documento e razão social não mudam.
export interface DadosCadastraisDaEmpresa {
  nomeFantasia: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: number;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// E-US01: CNPJ com razão social, ou CPF.
export interface NovaEmpresa extends DadosCadastraisDaEmpresa {
  cnpj?: string;
  cpf?: string;
  razaoSocial?: string;
  senha: string;
}

export interface CadastroDaEmpresa {
  nomeFantasia: string;
  razaoSocial: string | null;
  documento: { tipo: TipoDocumento; numero: string };
  email: string;
  telefone: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: number;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  criadaEm: string;
  atualizadaEm: string;
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
  telefone: string;
  tipoVeiculo: string;
  placa: string | null;
  disponivel: boolean;
}

export type TipoVeiculo = 'MOTO' | 'CARRO' | 'BICICLETA';

export interface NovoEntregador {
  nome: string;
  cpf: string;
  telefone: string;
  tipoVeiculo: TipoVeiculo;
  placa?: string;
}

export interface EntregadorCadastrado {
  entregador: { cpf: string; nome: string; tipoVeiculo: TipoVeiculo; placa: string | null };
  status: 'PENDENTE';
  senhaTemporaria: string;
  senhaTemporariaExpiraEm: string;
}

export interface ConviteEnviado {
  mensagem: string;
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
  valorEntrega: number;
  finalizadoEm: string | null;
  nota: number | null;
}

export interface PeriodoDeConclusao {
  de: string;
  ate: string;
}

// Centavos: valor base por entrega e adicional por quilômetro.
export interface ParametrosRemuneracao {
  taxaFixa: number;
  coeficienteKm: number;
}

// Sem nada salvo ainda, os valores e a vigência vêm nulos.
export interface RemuneracaoDaEmpresa {
  taxaFixa: number | null;
  coeficienteKm: number | null;
  vigenteDesde: string | null;
}

export interface TrocaDeEntregador {
  anterior: string | null;
  novo: string;
  data: string;
}

export interface StatusDisponiveis {
  statusAtual: StatusPedido;
  statusDisponiveis: StatusPedido[];
  podeFinalizarComCodigo: boolean;
}

export interface Coordenada {
  lat: number;
  lng: number;
}

// PUT /pedidos/:id/localizacao, GET /pedidos/:id/rota, GET /rastreio/:token/localizacao
// e o evento "localizacao" do socket. Distância em metros e duração em segundos;
// "estimado" quer dizer linha reta, sem o cálculo de rota do Google. Com o mapa
// desligado pela empresa, o recebedor recebe destino, entregador e rota nulos.
export interface VisaoDaEntrega {
  status: StatusPedido;
  exibirMapa: boolean;
  // Endereço da empresa: ponto de saída da entrega.
  origem: Coordenada | null;
  destino: Coordenada | null;
  entregador: (Coordenada & { precisaoM: number | null }) | null;
  rota: string | null;
  distanciaRestanteM: number | null;
  duracaoRestanteS: number | null;
  estimado: boolean;
  atualizadaEm: string | null;
  entregadorProximo: boolean;
}

export interface SituacaoDoAviso {
  status: StatusPedido;
  entregadorProximo: boolean;
}

// GET /rastreio/:token
// R-US02: etapas que o pedido já passou, com o horário de cada uma.
export type EtapaDoPedido = 'CRIADO' | StatusPedido;

export interface MarcoDoPedido {
  etapa: EtapaDoPedido;
  em: string;
}

export interface PaginaDoRecebedor {
  estabelecimento: string;
  exibirMapa: boolean;
  pedido: {
    numero: number;
    descricao: string;
    recebedor: string;
    status: StatusPedido;
    criadoEm: string;
    endereco: {
      logradouro: string;
      numero: number;
      complemento: string | null;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
  };
  // Só o primeiro nome; nulo enquanto o pedido não tem entregador.
  entregador: string | null;
  codigoRecebedor: string;
  // Link wa.me para o estabelecimento; nulo com a entrega encerrada.
  whatsappEstabelecimento: string | null;
  linhaDoTempo: MarcoDoPedido[];
}

// POST /pedidos/:id/link-rastreio. O backend só guarda o hash do token: o
// link aparece uma vez, e gerar outro invalida o anterior.
export interface LinkDeRastreio {
  link: string;
  codigoRecebedor: string;
}

export interface ConversaWhatsapp {
  link: string;
  contato: string;
}

// GET e PATCH /empresa/configuracoes
export interface ConfiguracoesDaEmpresa {
  exibirMapa: boolean;
}

// E-US13: detalhe de um pedido da empresa.
export interface DetalheDoPedido {
  id: number;
  status: StatusPedido;
  descricao: string;
  recebedor: { nome: string; telefone: string };
  endereco: {
    cep: string;
    logradouro: string;
    numero: number;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  entregador: string | null;
  valorEntrega: number;
  distancia: number;
  criadoEm: string;
  linhaDoTempo: MarcoDoPedido[];
}

export interface AvaliacaoDaEmpresa {
  idPedido: number;
  nota: number;
  comentario: string | null;
  data: string;
  entregador: string | null;
}

export interface FiltroDeAvaliacoes {
  notas: number[];
  de: string;
  ate: string;
}

export type SituacaoDaAvaliacao = 'aguardando' | 'disponivel' | 'avaliado' | 'expirada' | 'indisponivel';

export interface AvaliacaoEnviada {
  nota: number;
  comentario: string | null;
  data: string;
}

export interface AvaliacaoDoRecebedor {
  situacao: SituacaoDaAvaliacao;
  avaliacao: AvaliacaoEnviada | null;
}
