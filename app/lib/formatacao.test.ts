import { describe, expect, it } from 'vitest';
import { formatarCpf, linhasDadosCompartilhados, rotuloDoVeiculo } from './dadosCompartilhados';
import { etapaAlcancada, formatarDataHora, pedidoEmAberto, rotuloDoStatus, tomDoStatus } from './pedidos';
import { TELA_INICIAL, telaPedidoDoEntregador, telaPedidoDoPainel } from './rotas';
import { iniciais } from './texto';
import { ERRO_ACAO, EXECUTAR_ACAO } from './vinculos';

describe('dadosCompartilhados', () => {
  it('formata o CPF com pontos e traço', () => {
    expect(formatarCpf('12345678909')).toBe('123.456.789-09');
  });

  it('traduz o veículo e mantém um tipo desconhecido', () => {
    expect(rotuloDoVeiculo('MOTO')).toBe('Moto');
    expect(rotuloDoVeiculo('PATINETE')).toBe('PATINETE');
  });

  it('lista os dados que a empresa vê, com placa e disponibilidade legíveis', () => {
    const linhas = linhasDadosCompartilhados({
      nome: 'Carla Reis',
      cpf: '24681357928',
      tipoVeiculo: 'BICICLETA',
      placa: null,
      disponivel: false,
    });

    expect(linhas).toEqual([
      { rotulo: 'Nome', valor: 'Carla Reis' },
      { rotulo: 'CPF', valor: '246.813.579-28' },
      { rotulo: 'Veículo', valor: 'Bicicleta' },
      { rotulo: 'Placa', valor: 'Sem placa' },
      { rotulo: 'Disponibilidade', valor: 'Indisponível' },
    ]);
  });
});

describe('pedidos', () => {
  it('traduz o status e repete o valor quando não conhece', () => {
    expect(rotuloDoStatus('EM_ANDAMENTO')).toBe('Em andamento');
    expect(rotuloDoStatus('DESCONHECIDO')).toBe('DESCONHECIDO');
  });

  it('dá tom de alerta ao pendente, de erro ao cancelado e neutro ao resto', () => {
    expect(tomDoStatus('PENDENTE')).toBe('alerta');
    expect(tomDoStatus('CANCELADO')).toBe('erro');
    expect(tomDoStatus('DESCONHECIDO')).toBe('neutro');
  });

  it('considera cancelado como encerrado', () => {
    expect(pedidoEmAberto('EM_ANDAMENTO')).toBe(true);
    expect(pedidoEmAberto('CANCELADO')).toBe(false);
  });

  it('marca a etapa atual como alcançada', () => {
    expect(etapaAlcancada('EM_ANDAMENTO', 'EM_ANDAMENTO')).toBe(true);
  });

  it('formata data e hora no padrão brasileiro', () => {
    expect(formatarDataHora('2026-10-07T14:02:00')).toBe('07/10, 14:02');
  });
});

describe('rotas', () => {
  it('monta as telas de detalhe do pedido', () => {
    expect(telaPedidoDoPainel(7)).toBe('/painel/pedidos/7');
    expect(telaPedidoDoEntregador(7)).toBe(`${TELA_INICIAL.ENTREGADOR}/pedidos/7`);
  });
});

describe('texto', () => {
  it('usa a primeira e a última inicial do nome', () => {
    expect(iniciais('Ana Maria Souza')).toBe('AS');
    expect(iniciais('  bruno ')).toBe('B');
  });
});

describe('vinculos', () => {
  it('tem uma ação e uma mensagem de erro para cada resposta ao convite', () => {
    expect(Object.keys(EXECUTAR_ACAO).sort()).toEqual(Object.keys(ERRO_ACAO).sort());
  });
});
