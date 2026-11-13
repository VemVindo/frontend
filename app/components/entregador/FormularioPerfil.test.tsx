import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, atualizarPerfilDoEntregador } from '@/app/lib/api';
import type { PerfilDoEntregador } from '@/app/lib/tipos';
import FormularioPerfil, { NADA_MUDOU, PERFIL_SALVO } from './FormularioPerfil';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  atualizarPerfilDoEntregador: vi.fn(),
}));

const PERFIL: PerfilDoEntregador = {
  nome: 'Joana Lima',
  cpf: '52998224725',
  telefone: '61988887777',
  tipoVeiculo: 'MOTO',
  placa: 'ABC1D23',
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

function renderizar(perfil = PERFIL) {
  const onSalvo = vi.fn();
  const onSenhaTemporaria = vi.fn();
  render(<FormularioPerfil perfil={perfil} onSalvo={onSalvo} onSenhaTemporaria={onSenhaTemporaria} />);
  return { onSalvo, onSenhaTemporaria };
}

describe('FormularioPerfil', () => {
  beforeEach(() => {
    vi.mocked(atualizarPerfilDoEntregador).mockImplementation(async (edicao) => ({
      ...PERFIL,
      ...edicao,
      placa: edicao.tipoVeiculo === 'BICICLETA' ? null : (edicao.placa ?? PERFIL.placa),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra os dados atuais com o CPF só para leitura', () => {
    renderizar();

    expect(campo('Nome completo').value).toBe('Joana Lima');
    expect(campo('CPF').value).toBe('529.982.247-25');
    expect(campo('CPF').readOnly).toBe(true);
    expect(campo('Telefone').value).toBe('61988887777');
    expect((screen.getByLabelText('Tipo de veículo') as HTMLSelectElement).value).toBe('MOTO');
    expect(campo('Placa').value).toBe('ABC1D23');
    expect(screen.queryByRole('option', { name: 'Selecione' })).toBeNull();
  });

  it('salva só o que mudou e mostra a confirmação', async () => {
    const { onSalvo } = renderizar();

    preencher('Nome completo', 'Joana Souza');
    preencher('Telefone', '(61) 3333-4444');
    salvar();

    expect((await screen.findByRole('status')).textContent).toBe(PERFIL_SALVO);
    expect(atualizarPerfilDoEntregador).toHaveBeenCalledWith({ nome: 'Joana Souza', telefone: '6133334444' });
    expect(onSalvo).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Joana Souza', telefone: '6133334444' }));
    expect(atualizarPerfilDoEntregador).not.toHaveBeenCalledWith(expect.objectContaining({ cpf: expect.anything() }));
  });

  it('o nome não aceita números e a placa fica em maiúsculas', () => {
    renderizar();

    preencher('Nome completo', 'Joana 2 Lima');
    preencher('Placa', 'xyz-9e87');

    expect(campo('Nome completo').value).toBe('Joana  Lima');
    expect(campo('Placa').value).toBe('XYZ9E87');
  });

  it('esconde a placa para bicicleta e manda só o tipo', async () => {
    const { onSalvo } = renderizar();

    fireEvent.change(screen.getByLabelText('Tipo de veículo'), { target: { value: 'BICICLETA' } });
    expect(screen.queryByLabelText('Placa')).toBeNull();
    salvar();

    await screen.findByRole('status');
    expect(atualizarPerfilDoEntregador).toHaveBeenCalledWith({ tipoVeiculo: 'BICICLETA' });
    expect(onSalvo).toHaveBeenCalledWith(expect.objectContaining({ tipoVeiculo: 'BICICLETA', placa: null }));
  });

  it('pede a placa ao trocar de bicicleta para carro', async () => {
    renderizar({ ...PERFIL, tipoVeiculo: 'BICICLETA', placa: null });

    fireEvent.change(screen.getByLabelText('Tipo de veículo'), { target: { value: 'CARRO' } });
    salvar();

    expect(await screen.findByText('Use o formato ABC1234 ou ABC1D23')).toBeTruthy();
    expect(atualizarPerfilDoEntregador).not.toHaveBeenCalled();

    preencher('Placa', 'ABC1234');
    expect(screen.queryByText('Use o formato ABC1234 ou ABC1D23')).toBeNull();
    salvar();

    await screen.findByRole('status');
    expect(atualizarPerfilDoEntregador).toHaveBeenCalledWith({ tipoVeiculo: 'CARRO', placa: 'ABC1234' });
  });

  it('não envia com nome vazio ou telefone curto', () => {
    renderizar();

    preencher('Nome completo', '  ');
    preencher('Telefone', '6199');
    salvar();

    expect(screen.getByText('Preencha este campo')).toBeTruthy();
    expect(screen.getByText('Informe DDD e número (10 ou 11 dígitos)')).toBeTruthy();
    expect(atualizarPerfilDoEntregador).not.toHaveBeenCalled();
  });

  it('avisa quando nada mudou, sem chamar o back', () => {
    renderizar();

    salvar();

    expect(screen.getByRole('alert').textContent).toBe(NADA_MUDOU);
    expect(atualizarPerfilDoEntregador).not.toHaveBeenCalled();
  });

  it('mostra a mensagem de validação do back', async () => {
    vi.mocked(atualizarPerfilDoEntregador).mockRejectedValue(new ApiError(400, 'placa obrigatoria para MOTO e CARRO'));
    renderizar();

    preencher('Nome completo', 'Joana Souza');
    salvar();

    expect((await screen.findByRole('alert')).textContent).toBe('placa obrigatoria para MOTO e CARRO');
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toHaveProperty('disabled', false);
  });

  it('sem conexão, pede para tentar de novo', async () => {
    vi.mocked(atualizarPerfilDoEntregador).mockRejectedValue(new Error('rede caiu'));
    renderizar();

    preencher('Nome completo', 'Joana Souza');
    salvar();

    expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível salvar agora. Tente de novo.');
  });

  it('com senha temporária, manda trocar a senha', async () => {
    vi.mocked(atualizarPerfilDoEntregador).mockRejectedValue(new ApiError(403, 'troque a senha'));
    const { onSenhaTemporaria, onSalvo } = renderizar();

    preencher('Nome completo', 'Joana Souza');
    salvar();

    await vi.waitFor(() => expect(onSenhaTemporaria).toHaveBeenCalled());
    expect(onSalvo).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('desabilita o formulário enquanto salva', async () => {
    let terminar: (perfil: PerfilDoEntregador) => void = () => undefined;
    vi.mocked(atualizarPerfilDoEntregador).mockReturnValue(new Promise((resolver) => (terminar = resolver)));
    renderizar();

    preencher('Nome completo', 'Joana Souza');
    salvar();

    expect(screen.getByRole('button', { name: 'Salvando...' })).toHaveProperty('disabled', true);
    expect(campo('Nome completo').disabled).toBe(true);
    terminar({ ...PERFIL, nome: 'Joana Souza' });
    expect(await screen.findByRole('status')).toBeTruthy();
  });
});
