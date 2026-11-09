import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, editarEntregador } from '@/app/lib/api';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import FormularioEdicaoEntregador, { ERRO_EDICAO_RECUSADA } from './FormularioEdicaoEntregador';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  editarEntregador: vi.fn(),
}));

const BRUNO: DadosCompartilhados = {
  nome: 'Bruno Lima',
  cpf: '98765432100',
  telefone: '61910000002',
  tipoVeiculo: 'CARRO',
  placa: 'XYZ9E87',
  disponivel: true,
};

function campo(rotulo: string) {
  return screen.getByLabelText(rotulo) as HTMLInputElement;
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(campo(rotulo), { target: { value: valor } });
}

function salvar() {
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
}

describe('FormularioEdicaoEntregador', () => {
  beforeEach(() => {
    vi.mocked(editarEntregador).mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('abre preenchido com os dados atuais', () => {
    render(<FormularioEdicaoEntregador entregador={BRUNO} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    expect(campo('Nome do entregador').value).toBe('Bruno Lima');
    expect(campo('Telefone do entregador').value).toBe('61910000002');
    expect((screen.getByLabelText('Tipo de veículo') as HTMLSelectElement).value).toBe('CARRO');
    expect(campo('Placa do veículo').value).toBe('XYZ9E87');
  });

  it.each([
    ['moto', 'MOTO', { placa: 'XYZ9E87' }],
    ['bicicleta, sem placa', 'BICICLETA', {}],
  ])('salva a troca para %s e devolve o entregador atualizado', async (_caso, veiculo, placa) => {
    const onSalvo = vi.fn();
    render(<FormularioEdicaoEntregador entregador={BRUNO} onSalvo={onSalvo} onCancelar={vi.fn()} />);

    preencher('Nome do entregador', ' Bruno Lima Souza ');
    preencher('Tipo de veículo', veiculo);
    salvar();

    await vi.waitFor(() => expect(onSalvo).toHaveBeenCalled());
    expect(editarEntregador).toHaveBeenCalledWith({
      cpf: '98765432100',
      nome: 'Bruno Lima Souza',
      telefone: '61910000002',
      veiculo,
      ...placa,
    });
    expect(onSalvo.mock.calls[0][0]).toMatchObject({ nome: 'Bruno Lima Souza', tipoVeiculo: veiculo });
  });

  it.each([
    ['o back recusa a edição', () => vi.mocked(editarEntregador).mockResolvedValue(false), ERRO_EDICAO_RECUSADA],
    [
      'o back devolve erro',
      () => vi.mocked(editarEntregador).mockRejectedValue(new ApiError(400, 'telefone must be a string')),
      'telefone must be a string',
    ],
  ])('mostra o erro quando %s', async (_caso, simular, mensagem) => {
    simular();
    const onSalvo = vi.fn();
    render(<FormularioEdicaoEntregador entregador={BRUNO} onSalvo={onSalvo} onCancelar={vi.fn()} />);

    salvar();

    expect((await screen.findByRole('alert')).textContent).toBe(mensagem);
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it.each([
    ['Nome do entregador', '   ', 'Preencha este campo'],
    ['Telefone do entregador', '6191', 'Informe DDD e número (10 ou 11 dígitos)'],
    ['Placa do veículo', 'AB12', 'Use o formato ABC1234 ou ABC1D23'],
  ])('não envia com o campo %s inválido', (rotulo, valor, erro) => {
    render(<FormularioEdicaoEntregador entregador={BRUNO} onSalvo={vi.fn()} onCancelar={vi.fn()} />);

    preencher(rotulo, valor);
    salvar();

    expect(screen.getByText(erro)).toBeTruthy();
    expect(editarEntregador).not.toHaveBeenCalled();
  });

  it('cancela sem enviar nada', () => {
    const onCancelar = vi.fn();
    render(<FormularioEdicaoEntregador entregador={BRUNO} onSalvo={vi.fn()} onCancelar={onCancelar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancelar).toHaveBeenCalled();
    expect(editarEntregador).not.toHaveBeenCalled();
  });
});
