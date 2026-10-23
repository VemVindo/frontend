import { describe, expect, it, vi } from 'vitest';
import { criarFluxoEnvioPedido, type FormularioNovoPedido } from './novoPedido';
import type { CriarPedidoResposta, Empresa } from './tipos';

const dados: FormularioNovoPedido = {
  nome_recebedor: 'Carla', telefone: '61999990000', cep: '70000000', logradouro: 'Rua A',
  numero: '10', complemento: '', bairro: 'Centro', cidade: 'Brasília', uf: 'DF', itens: '', observacoes: '',
};
const empresa: Empresa = { id: 42, nomeFantasia: 'Empresa fictícia', email: 'teste@example.com', cargo: 'ESTABELECIMENTO' };
const entrega = { valor_entrega: 1500, distancia: 4200 };
const pedido: CriarPedidoResposta = {
  id_pedido: 91, nome_recebedor: 'Carla', telefone_recebedor: '61999990000', cep: '70000000',
  logradouro: 'Rua A', numero: 10, complemento: null, bairro: 'Centro', cidade: 'Brasília', uf: 'DF',
  descricao: '', ...entrega, idEmpresa: 42, cpf_entregador: null, status: 'Pendente',
  data_criacao: '2026-10-22T12:00:00.000Z', data_inicio_entrega: null, data_finalizacao: null,
};

describe('criarFluxoEnvioPedido', () => {
  it.each(['sem sessão', 'sem cálculo', 'formulário inválido'] as const)('não faz POST: %s', async (cenario) => {
    const enviar = vi.fn().mockResolvedValue(pedido);
    const obter = vi.fn().mockResolvedValue(entrega);
    const executar = () => criarFluxoEnvioPedido(enviar)(
      cenario === 'formulário inválido' ? { ...dados, cep: '' } : dados,
      cenario === 'sem sessão' ? null : empresa,
      cenario === 'sem cálculo' ? undefined : obter,
    );
    if (cenario === 'formulário inválido') await expect(executar()).rejects.toThrow();
    else expect(await executar()).toEqual({ estado: 'bloqueado' });
    expect(enviar).not.toHaveBeenCalled();
    expect(obter).not.toHaveBeenCalled();
  });

  it.each([{ nome: 'sucesso' }])('$nome propaga o pedido confirmado', async () => {
    const enviar = vi.fn().mockResolvedValue(pedido);
    const obter = vi.fn().mockResolvedValue(entrega);
    expect(await criarFluxoEnvioPedido(enviar)(dados, empresa, obter)).toEqual({ estado: 'criado', pedido });
    expect(obter).toHaveBeenCalledWith(dados, empresa);
    expect(enviar).toHaveBeenCalledOnce();
    expect(enviar).toHaveBeenCalledWith({
      nome_recebedor: 'Carla', telefone_recebedor: '61999990000', cep: '70000000', logradouro: 'Rua A',
      numero: 10, bairro: 'Centro', cidade: 'Brasília', uf: 'DF', descricao: '', ...entrega, idEmpresa: 42,
    });
  });

  it.each(['cálculo', 'API'] as const)('preserva rascunho e permite tentar novamente após falha: %s', async (etapa) => {
    const erro = new Error('Falha de teste');
    const enviar = vi.fn().mockResolvedValue(pedido);
    const obter = vi.fn().mockResolvedValue(entrega);
    (etapa === 'cálculo' ? obter : enviar).mockRejectedValueOnce(erro);
    const fluxo = criarFluxoEnvioPedido(enviar);
    const rascunho = Object.freeze({ ...dados });
    await expect(fluxo(rascunho, empresa, obter)).rejects.toBe(erro);
    expect(enviar).toHaveBeenCalledTimes(etapa === 'cálculo' ? 0 : 1);
    expect(rascunho).toEqual(dados);
    expect(await fluxo(rascunho, empresa, obter)).toEqual({ estado: 'criado', pedido });
  });

  it.each(['cálculo', 'POST'] as const)('bloqueia tentativa simultânea durante %s', async (etapa) => {
    let liberar!: () => void;
    const pendente = new Promise<void>((resolve) => { liberar = resolve; });
    const obter = vi.fn(async () => { if (etapa === 'cálculo') await pendente; return entrega; });
    const enviar = vi.fn(async () => { if (etapa === 'POST') await pendente; return pedido; });
    const fluxo = criarFluxoEnvioPedido(enviar);
    const primeiro = fluxo(dados, empresa, obter);
    await Promise.resolve();
    expect(await fluxo(dados, empresa, obter)).toEqual({ estado: 'ocupado' });
    liberar();
    expect(await primeiro).toEqual({ estado: 'criado', pedido });
    expect(obter).toHaveBeenCalledOnce();
    expect(enviar).toHaveBeenCalledOnce();
  });
});
