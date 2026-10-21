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
  linhaDoTempo: MarcoDoPedido[];
}

// POST /pedidos/:id/link-rastreio. O backend só guarda o hash do token: o
// link aparece uma vez, e gerar outro invalida o anterior.
export interface LinkDeRastreio {
  link: string;
  codigoRecebedor: string;
}

// GET e PATCH /empresa/configuracoes
export interface ConfiguracoesDaEmpresa {
  exibirMapa: boolean;
}
