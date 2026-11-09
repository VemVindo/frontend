import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DadosCompartilhados } from '@/app/lib/tipos';
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

describe('ListaDaFrota', () => {
  afterEach(cleanup);

  it.each([
    ['com placa e disponível', BRUNO, ['Bruno Lima', '(61) 91000-0002', 'Carro - XYZ9E87', 'Disponível']],
    ['de bicicleta e indisponível', CARLA, ['Carla Reis', '(61) 91000-0003', 'Bicicleta', 'Indisponível']],
  ] as [string, DadosCompartilhados, string[]][])('mostra o entregador %s', (_caso, entregador, textos) => {
    render(<ListaDaFrota entregadores={[entregador]} />);

    for (const texto of textos) {
      expect(screen.getByText(texto)).toBeTruthy();
    }
  });

  it('avisa quando a frota está vazia', () => {
    render(<ListaDaFrota entregadores={[]} />);

    expect(screen.getByText('Nenhum entregador na frota ainda.')).toBeTruthy();
  });

  it.each([
    ['sem', undefined, 0],
    ['com', vi.fn(), 1],
  ])('%s a função de editar mostra %d botão por entregador', (_caso, onEditar, botoes) => {
    render(<ListaDaFrota entregadores={[BRUNO]} onEditar={onEditar} />);

    expect(screen.queryAllByRole('button', { name: 'Editar Bruno Lima' })).toHaveLength(botoes);
  });

  it('avisa qual entregador foi escolhido para editar', () => {
    const onEditar = vi.fn();
    render(<ListaDaFrota entregadores={[BRUNO, CARLA]} onEditar={onEditar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar Carla Reis' }));

    expect(onEditar).toHaveBeenCalledWith(CARLA);
  });
});
