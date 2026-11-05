import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { criarFluxoEnvioPedido, type FormularioNovoPedido } from './novoPedido';
import type { CriarPedidoResposta, Empresa } from './tipos';

const dados: FormularioNovoPedido = {
  nome_recebedor: 'Carla',
  telefone: '61999990000',
  cep: '70000000',
  logradouro: 'Rua A',
  numero: '10',
  complemento: '',
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  itens: '',
  observacoes: '',
  tipo_veiculo: 'DRIVE',
};
const empresa: Empresa = {
  id: 42,
  nomeFantasia: 'Empresa fictícia',
  email: 'teste@example.com',
  cargo: 'ESTABELECIMENTO',
};
const pedido: CriarPedidoResposta = {
  id_pedido: 91,
  nome_recebedor: 'Carla',
  telefone_recebedor: '61999990000',
  cep: '70000000',
  logradouro: 'Rua A',
  numero: 10,
  complemento: null,
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  descricao: '',
  valor_entrega: 1500,
  distancia: 4200,
  idEmpresa: 42,
  cpf_entregador: null,
  status: 'PENDENTE',
  data_criacao: '2026-10-22T12:00:00.000Z',
  data_inicio_entrega: null,
  data_finalizacao: null,
};

describe('criarFluxoEnvioPedido', () => {
  it.each(['sem sessão', 'sem veículo', 'formulário inválido'] as const)('não faz POST: %s', async (cenario) => {
    const enviarPedido = vi.fn().mockResolvedValue(pedido);
    const executar = () =>
      criarFluxoEnvioPedido(enviarPedido)(
        {
          ...dados,
          ...(cenario === 'sem veículo' ? { tipo_veiculo: '' } : {}),
          ...(cenario === 'formulário inválido' ? { cep: '' } : {}),
        },
        cenario === 'sem sessão' ? null : empresa,
      );
    if (cenario === 'sem sessão') expect(await executar()).toEqual({ estado: 'bloqueado' });
    else await expect(executar()).rejects.toThrow('Formulário inválido.');
    expect(enviarPedido).not.toHaveBeenCalled();
  });

  it('sucesso propaga o pedido e os valores calculados pelo backend', async () => {
    const enviarPedido = vi.fn().mockResolvedValue(pedido);
    expect(await criarFluxoEnvioPedido(enviarPedido)(dados, empresa)).toEqual({ estado: 'criado', pedido });
    expect(enviarPedido).toHaveBeenCalledOnce();
    expect(enviarPedido).toHaveBeenCalledWith({
      nome_recebedor: 'Carla',
      telefone_recebedor: '61999990000',
      cep: '70000000',
      logradouro: 'Rua A',
      numero: 10,
      bairro: 'Centro',
      cidade: 'Brasília',
      uf: 'DF',
      descricao: '',
      tipo_veiculo: 'DRIVE',
    });
  });

  it.each([
    { nome: 'cálculo no servidor', erro: new ApiError(409, 'Parâmetros de remuneração não configurados') },
    { nome: 'API', erro: new Error('Falha de teste') },
  ])('preserva rascunho e permite tentar novamente após falha: $nome', async ({ erro }) => {
    const enviarPedido = vi.fn().mockResolvedValue(pedido).mockRejectedValueOnce(erro);
    const fluxoDeEnvio = criarFluxoEnvioPedido(enviarPedido);
    const rascunho = Object.freeze({ ...dados });
    await expect(fluxoDeEnvio(rascunho, empresa)).rejects.toBe(erro);
    expect(enviarPedido).toHaveBeenCalledOnce();
    expect(rascunho).toEqual(dados);
    expect(await fluxoDeEnvio(rascunho, empresa)).toEqual({ estado: 'criado', pedido });
  });

  it.each(['imediatamente', 'durante POST'] as const)('bloqueia tentativa simultânea %s', async (momento) => {
    let liberar!: (pedido: CriarPedidoResposta) => void;
    const enviarPedido = vi.fn(
      () =>
        new Promise<CriarPedidoResposta>((resolver) => {
          liberar = resolver;
        }),
    );
    const fluxoDeEnvio = criarFluxoEnvioPedido(enviarPedido);
    const primeiroEnvio = fluxoDeEnvio(dados, empresa);
    if (momento === 'durante POST') await Promise.resolve();
    expect(await fluxoDeEnvio(dados, empresa)).toEqual({ estado: 'ocupado' });
    liberar(pedido);
    expect(await primeiroEnvio).toEqual({ estado: 'criado', pedido });
    expect(enviarPedido).toHaveBeenCalledOnce();
  });
});
