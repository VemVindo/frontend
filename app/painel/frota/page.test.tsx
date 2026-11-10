import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  buscarDesempenhoEntregador,
  cadastrarEntregador,
  convidarEntregador,
  editarEntregador,
  listarFrota,
  removerEntregador,
} from '@/app/lib/api';
import type { DesempenhoEntregador } from '@/app/lib/tiposDesempenho';
import PaginaFrota from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarDesempenhoEntregador: vi.fn(),
  cadastrarEntregador: vi.fn(),
  convidarEntregador: vi.fn(),
  listarFrota: vi.fn(),
  editarEntregador: vi.fn(),
  removerEntregador: vi.fn(),
}));

const BRUNO = {
  nome: 'Bruno Lima',
  cpf: '98765432100',
  telefone: '61910000002',
  tipoVeiculo: 'CARRO',
  placa: 'XYZ9E87',
  disponivel: true,
};

const DESEMPENHO: DesempenhoEntregador = {
  cpf_entregador: BRUNO.cpf,
  periodo: { de: '1970-01-01T00:00:00.000Z', ate: '2026-11-09T21:00:00.000Z' },
  total_entregas: 59,
  tempo_medio_entrega_segundos: 1200,
  entregas_com_tempo_valido: 59,
  entregas_sem_tempo_valido: 0,
  avaliacao_media: 5,
  total_avaliacoes: 10,
  distancia_total_metros: 10000,
  distancia_conhecida_metros: 10000,
  entregas_com_distancia_conhecida: 59,
  entregas_com_distancia_desconhecida: 0,
};

const MENSAGEM_CONVITE = 'Se o CPF for de um entregador cadastrado, ele recebera o convite no app.';
const descritorDeAberturaOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const descritorDeFechamentoOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

function campo(rotulo: string) {
  return screen.getByLabelText(rotulo) as HTMLInputElement;
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(campo(rotulo), { target: { value: valor } });
}

function preencherCadastro(tipoVeiculo = 'MOTO') {
  preencher('Nome completo', 'Joana Lima');
  preencher('CPF', '529.982.247-25');
  preencher('Telefone', '(61) 98888-7777');
  preencher('Tipo de veículo', tipoVeiculo);
  if (tipoVeiculo !== 'BICICLETA') preencher('Placa', 'abc-1d23');
}

function abrirCadastro() {
  fireEvent.click(screen.getByRole('button', { name: '+ Cadastrar entregador' }));
}

async function abrirConvite() {
  fireEvent.click(await screen.findByRole('button', { name: 'Convidar entregador que já usa o VemVindo' }));
}

describe('PaginaFrota', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    });
    vi.mocked(cadastrarEntregador).mockResolvedValue({
      entregador: { cpf: '52998224725', nome: 'Joana Lima', tipoVeiculo: 'MOTO', placa: 'ABC1D23' },
      status: 'PENDENTE',
      senhaTemporaria: 'Kx7#pQ2m',
      senhaTemporariaExpiraEm: '2026-10-25T15:00:00Z',
    });
    vi.mocked(convidarEntregador).mockResolvedValue({ mensagem: MENSAGEM_CONVITE });
    vi.mocked(listarFrota).mockResolvedValue([BRUNO]);
    vi.mocked(removerEntregador).mockResolvedValue({ reatribuidos: [], pendentes: [] });
    vi.mocked(buscarDesempenhoEntregador).mockImplementation(async (cpf, periodo) => ({
      ...DESEMPENHO,
      cpf_entregador: cpf,
      periodo,
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    if (descritorDeAberturaOriginal)
      Object.defineProperty(HTMLDialogElement.prototype, 'showModal', descritorDeAberturaOriginal);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    if (descritorDeFechamentoOriginal)
      Object.defineProperty(HTMLDialogElement.prototype, 'close', descritorDeFechamentoOriginal);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  });

  it('mostra os dados da frota e consulta o desempenho para todo o histórico', async () => {
    render(<PaginaFrota />);

    expect(await screen.findByText('Bruno Lima')).toBeTruthy();
    expect(screen.getByText('Carro', { selector: 'span' })).toBeTruthy();
    expect(screen.getByText('Disponível')).toBeTruthy();
    expect(await screen.findByText('5.0')).toBeTruthy();
    expect(screen.getByText('59 entregas')).toBeTruthy();
    expect(screen.getByText('1 entregador vinculado a este estabelecimento')).toBeTruthy();
    expect(buscarDesempenhoEntregador).toHaveBeenCalledWith(
      BRUNO.cpf,
      expect.objectContaining({ de: '1970-01-01T00:00:00.000Z', ate: expect.any(String) }),
    );
    expect(new Date(vi.mocked(buscarDesempenhoEntregador).mock.calls[0][1].ate).getTime()).not.toBeNaN();
  });

  it('abre a edição pelo menu e atualiza os dados da linha', async () => {
    vi.mocked(editarEntregador).mockResolvedValue(true);
    render(<PaginaFrota />);

    await screen.findByText('Bruno Lima');
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Bruno Lima' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar dados' }));
    preencher('Nome do entregador', 'Bruno Lima Souza');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Bruno Lima Souza')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).toBeNull();
  });

  it('confirma a remoção e mostra o resultado da redistribuição dos pedidos', async () => {
    vi.mocked(removerEntregador).mockResolvedValue({
      reatribuidos: [{ idPedido: 15, entregador: { cpf: '11144477735', nome: 'Ana Lima' } }],
      pendentes: [{ idPedido: 16 }],
    });
    render(<PaginaFrota />);

    await screen.findByText('Bruno Lima');
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Bruno Lima' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover entregador' }));

    expect(screen.getByRole('dialog', { name: 'Remover entregador' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remover entregador' }).className).toContain('bg-erro');
    expect(removerEntregador).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remover entregador' }));

    expect((await screen.findByRole('status')).textContent).toBe(
      'Bruno Lima foi removido da frota. 1 pedido foi reatribuído; 1 pedido voltou para a fila.',
    );
    expect(removerEntregador).toHaveBeenCalledWith(BRUNO.cpf);
    expect(screen.queryByText('Bruno Lima')).toBeNull();
  });

  it('cancela a remoção sem chamar o backend', async () => {
    render(<PaginaFrota />);

    await screen.findByText('Bruno Lima');
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Bruno Lima' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover entregador' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(removerEntregador).not.toHaveBeenCalled();
    expect(screen.getByText('Bruno Lima')).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Remover entregador' })).toBeNull();
  });

  it('mostra erro do backend e mantém a confirmação aberta', async () => {
    vi.mocked(removerEntregador).mockRejectedValue(new ApiError(409, 'Um pedido mudou durante a remocao'));
    render(<PaginaFrota />);

    await screen.findByText('Bruno Lima');
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Bruno Lima' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover entregador' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remover entregador' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Um pedido mudou durante a remocao');
    expect(screen.getByRole('dialog', { name: 'Remover entregador' })).toBeTruthy();
    expect(within(screen.getByRole('dialog', { name: 'Remover entregador' })).getByText('Bruno Lima')).toBeTruthy();
  });

  it('avisa quando a frota não carrega', async () => {
    vi.mocked(listarFrota).mockRejectedValue(new ApiError(500, 'Erro'));
    render(<PaginaFrota />);

    expect(await screen.findByText('Não foi possível carregar a frota agora.')).toBeTruthy();
    expect(buscarDesempenhoEntregador).not.toHaveBeenCalled();
  });

  it('mantém o convite acessível mesmo quando a lista da frota falha', async () => {
    vi.mocked(listarFrota).mockRejectedValue(new ApiError(500, 'Erro'));
    render(<PaginaFrota />);

    await screen.findByText('Não foi possível carregar a frota agora.');
    await abrirConvite();

    expect(campo('CPF do entregador').value).toBe('');
  });

  it('mantém a lista e informa quando o desempenho não carrega', async () => {
    vi.mocked(buscarDesempenhoEntregador).mockRejectedValue(new ApiError(500, 'Erro'));
    render(<PaginaFrota />);

    expect(await screen.findByText('Bruno Lima')).toBeTruthy();
    expect(await screen.findByText('Não foi possível carregar o desempenho.')).toBeTruthy();
  });

  it('cadastra pelo modal e mostra a senha temporária uma vez', async () => {
    render(<PaginaFrota />);

    abrirCadastro();
    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));

    expect(await screen.findByText('Kx7#pQ2m')).toBeTruthy();
    expect(cadastrarEntregador).toHaveBeenCalledWith({
      nome: 'Joana Lima',
      cpf: '52998224725',
      telefone: '61988887777',
      tipoVeiculo: 'MOTO',
      placa: 'ABC1D23',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar outro entregador' }));

    expect(screen.queryByText('Kx7#pQ2m')).toBeNull();
    expect(campo('Nome completo').value).toBe('');
  });

  it('esconde a placa e não a envia para bicicleta', async () => {
    render(<PaginaFrota />);

    abrirCadastro();
    preencherCadastro('BICICLETA');

    expect(screen.queryByLabelText('Placa')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));
    await vi.waitFor(() => expect(cadastrarEntregador).toHaveBeenCalled());
    expect(vi.mocked(cadastrarEntregador).mock.calls[0][0]).not.toHaveProperty('placa');
  });

  it('não envia o cadastro com campo inválido', () => {
    render(<PaginaFrota />);

    abrirCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));

    expect(screen.getByText('Escolha o tipo de veículo')).toBeTruthy();
    expect(cadastrarEntregador).not.toHaveBeenCalled();
  });

  it('leva o CPF já cadastrado para o modal de convite', async () => {
    vi.mocked(cadastrarEntregador).mockRejectedValue(
      new ApiError(409, 'Entregador ja cadastrado na plataforma; envie um convite pelo CPF'),
    );
    render(<PaginaFrota />);

    abrirCadastro();
    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Convidar este CPF' }));

    expect(campo('CPF do entregador').value).toBe('52998224725');
    expect(document.activeElement).toBe(campo('CPF do entregador'));
    expect(campo('CPF').value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mostra o erro do backend sem oferecer convite nos outros casos', async () => {
    vi.mocked(cadastrarEntregador).mockRejectedValue(new ApiError(429, 'ThrottlerException: Too Many Requests'));
    render(<PaginaFrota />);

    abrirCadastro();
    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Too Many Requests');
    expect(screen.queryByRole('button', { name: 'Convidar este CPF' })).toBeNull();
  });

  it('envia convite pelo modal e mostra a resposta do backend', async () => {
    render(<PaginaFrota />);

    await abrirConvite();
    preencher('CPF do entregador', '98765432100');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByText(MENSAGEM_CONVITE)).toBeTruthy();
    expect(convidarEntregador).toHaveBeenCalledWith('98765432100');
    expect(campo('CPF do entregador').value).toBe('');
  });

  it('não envia convite com CPF inválido', async () => {
    render(<PaginaFrota />);

    await abrirConvite();
    preencher('CPF do entregador', '12345678900');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(screen.getByText('CPF inválido')).toBeTruthy();
    expect(convidarEntregador).not.toHaveBeenCalled();
  });
});
