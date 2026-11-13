import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import type { DesempenhoEntregador } from '@/app/lib/tiposDesempenho';
import ListaDaFrota from './ListaDaFrota';

const BRUNO: DadosCompartilhados = {
  nome: 'Bruno Lima',
  cpf: '98765432100',
  telefone: '61910000002',
  tipoVeiculo: 'CARRO',
  placa: 'XYZ9E87',
  disponivel: true,
};

const CARLA: DadosCompartilhados = {
  nome: 'Carla Reis',
  cpf: '24681357928',
  telefone: '61910000003',
  tipoVeiculo: 'BICICLETA',
  placa: null,
  disponivel: false,
};

const DESEMPENHO: DesempenhoEntregador = {
  cpf_entregador: BRUNO.cpf,
  periodo: { de: '1970-01-01T00:00:00.000Z', ate: '2026-11-09T21:00:00.000Z' },
  total_entregas: 59,
  tempo_medio_entrega_segundos: 1200,
  entregas_com_tempo_valido: 59,
  entregas_sem_tempo_valido: 0,
  avaliacao_media: 4.5,
  total_avaliacoes: 8,
  distancia_total_metros: 10000,
  distancia_conhecida_metros: 10000,
  entregas_com_distancia_conhecida: 59,
  entregas_com_distancia_desconhecida: 0,
};

const TOTAL_PAGO = { [BRUNO.cpf]: 12345 };

describe('ListaDaFrota', () => {
  afterEach(cleanup);

  it('mostra o entregador, disponibilidade, veículo, avaliação e entregas', () => {
    render(
      <ListaDaFrota
        entregadores={[BRUNO]}
        desempenhoPorCpf={{ [BRUNO.cpf]: { estado: 'carregado', dados: DESEMPENHO } }}
        totalPagoPorCpf={TOTAL_PAGO}
        erroTotalPago={false}
        onRemover={vi.fn()}
      />,
    );

    expect(screen.getByText('Bruno Lima')).toBeTruthy();
    expect(screen.getByText('Carro')).toBeTruthy();
    expect(screen.getByText('Disponível')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('59 entregas')).toBeTruthy();
    expect(screen.getByText(/R\$\s*123,45/)).toBeTruthy();
    expect(screen.queryByText('Total')).toBeNull();
  });

  it('mostra indisponibilidade, veículo sem placa e avaliação ausente', () => {
    render(
      <ListaDaFrota
        entregadores={[CARLA]}
        desempenhoPorCpf={{
          [CARLA.cpf]: {
            estado: 'carregado',
            dados: { ...DESEMPENHO, cpf_entregador: CARLA.cpf, total_entregas: 0, avaliacao_media: null },
          },
        }}
        totalPagoPorCpf={{ [CARLA.cpf]: 0 }}
        erroTotalPago={false}
        onRemover={vi.fn()}
      />,
    );

    expect(screen.getByText('Bicicleta')).toBeTruthy();
    expect(screen.getByText('Indisponível')).toBeTruthy();
    expect(screen.getByText('Sem avaliação')).toBeTruthy();
    expect(screen.getByText('0 entregas')).toBeTruthy();
    expect(screen.getByText(/R\$\s*0,00/)).toBeTruthy();
  });

  it('mostra o estado de carregamento do desempenho', () => {
    render(
      <ListaDaFrota
        entregadores={[BRUNO]}
        desempenhoPorCpf={{ [BRUNO.cpf]: { estado: 'carregando' } }}
        totalPagoPorCpf={{}}
        erroTotalPago={false}
        onRemover={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Carregando...')).toHaveLength(3);
  });

  it('mostra a falha ao consultar o desempenho', () => {
    render(
      <ListaDaFrota
        entregadores={[BRUNO]}
        desempenhoPorCpf={{ [BRUNO.cpf]: { estado: 'erro' } }}
        totalPagoPorCpf={{}}
        erroTotalPago={false}
        onRemover={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert').textContent).toBe('Não foi possível carregar o desempenho.');
  });

  it('avisa quando a frota está vazia', () => {
    render(
      <ListaDaFrota
        entregadores={[]}
        desempenhoPorCpf={{}}
        totalPagoPorCpf={{}}
        erroTotalPago={false}
        onRemover={vi.fn()}
      />,
    );

    expect(screen.getByText('Nenhum entregador na frota ainda.')).toBeTruthy();
  });

  it('o menu só oferece remover e solicita a remoção selecionada', () => {
    const onRemover = vi.fn();
    render(
      <ListaDaFrota
        entregadores={[BRUNO]}
        desempenhoPorCpf={{}}
        totalPagoPorCpf={{}}
        erroTotalPago={false}
        onRemover={onRemover}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ações de Bruno Lima' }));
    const acoes = screen.getByRole('menu').querySelectorAll('[role="menuitem"]');
    expect([...acoes].map((acao) => acao.textContent)).toEqual(['Remover entregador']);
    fireEvent.click(acoes[0]);

    expect(onRemover).toHaveBeenCalledWith(BRUNO);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
