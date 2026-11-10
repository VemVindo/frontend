export interface ResultadoDaRemocaoDoEntregador {
  reatribuidos: { idPedido: number; entregador: { cpf: string; nome: string } }[];
  pendentes: { idPedido: number }[];
}
