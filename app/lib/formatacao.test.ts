import { describe, expect, it } from 'vitest';
import {
  formatarCpf,
  formatarTelefone as formatarTelefoneCompartilhado,
  linhasDadosCompartilhados,
  rotuloDoVeiculo,
} from './dadosCompartilhados';
import { etapaAlcancada, formatarDataHora, pedidoEmAberto, rotuloDoStatus, tomDoStatus } from './pedidos';
import { TELA_INICIAL, telaPedidoDoEntregador, telaPedidoDoPainel } from './rotas';
import { formatarTelefone, iniciais, primeiroNome } from './texto';
import { ERRO_ACAO, EXECUTAR_ACAO } from './vinculos';

describe('dadosCompartilhados', () => {
  it('formata o CPF com pontos e traço', () => {
    expect(formatarCpf('12345678909')).toBe('123.456.789-09');
  });

  it('formata o telefone com máscara ou DDI e mantém um valor fora do padrão', () => {
    expect(formatarTelefoneCompartilhado('5561987654321')).toBe('(61) 98765-4321');
    expect(formatarTelefoneCompartilhado('(61) 98765-4321')).toBe('(61) 98765-4321');
    expect(formatarTelefoneCompartilhado('556132345678')).toBe('(61) 3234-5678');
    expect(formatarTelefoneCompartilhado('123')).toBe('123');
  });

  it('traduz o veículo e mantém um tipo desconhecido', () => {
    expect(rotuloDoVeiculo('MOTO')).toBe('Moto');
    expect(rotuloDoVeiculo('PATINETE')).toBe('PATINETE');
  });

  it('lista os dados que a empresa vê, com placa e disponibilidade legíveis', () => {
    const linhas = linhasDadosCompartilhados({
      nome: 'Carla Reis',
      cpf: '24681357928',
      telefone: '6132345678',
      tipoVeiculo: 'BICICLETA',
      placa: null,
      disponivel: false,
    });

    expect(linhas).toEqual([
      { rotulo: 'Nome', valor: 'Carla Reis' },
      { rotulo: 'CPF', valor: '246.813.579-28' },
      { rotulo: 'Telefone', valor: '(61) 3234-5678' },
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

describe('formatarTelefone', () => {
  it('formata celular e fixo com DDD', () => {
    expect(formatarTelefone('61930000000')).toBe('(61) 93000-0000');
    expect(formatarTelefone('6133334444')).toBe('(61) 3333-4444');
  });

  it('deixa como está o que não tem o formato esperado', () => {
    expect(formatarTelefone('123')).toBe('123');
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

  it('pega o primeiro nome, ignorando espaços', () => {
    expect(primeiroNome('  Pedro Alves ')).toBe('Pedro');
    expect(primeiroNome('Ana')).toBe('Ana');
  });
});
