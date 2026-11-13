import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  buscarDesempenhoEntregador,
  cadastrarEntregador,
  consultarResumoDashboard,
  convidarEntregador,
  listarFrota,
  removerEntregador,
} from '@/app/lib/api';
import type { DesempenhoEntregador } from '@/app/lib/tiposDesempenho';
import PaginaFrota from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarDesempenhoEntregador: vi.fn(),
  cadastrarEntregador: vi.fn(),
  consultarResumoDashboard: vi.fn(),
  convidarEntregador: vi.fn(),
  listarFrota: vi.fn(),
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
  fireEvent.click(screen.getAllByRole('button', { name: 'Cadastrar entregador' })[0]);
}

async function abrirConvite() {
  fireEvent.click((await screen.findAllByRole('button', { name: 'Convidar entregador que já usa o VemVindo' }))[0]);
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
    vi.mocked(consultarResumoDashboard).mockResolvedValue({
      idEmpresa: 1,
      totalPedidos: 59,
      totalPedidosPendentes: 0,
      totalPedidosAndamento: 0,
      totalPedidosConcluidos: 59,
      totalPedidosCancelados: 0,
      mediaAvaliacoes: 5,
      tempoMedioEntregaMinutos: 20,
      totalDistanciaPercorrida: 10000,
      relatorioPorEntregador: [
        {
          cpf: BRUNO.cpf,
          nome: BRUNO.nome,
          totalPedidosAndamento: 0,
          totalPedidosConcluidos: 59,
          valorMedioEntrega: 1000,
          totalPago: 59000,
        },
      ],
    });
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
    expect(await screen.findByText(/R\$\s*590,00/)).toBeTruthy();
    expect(screen.getByText('1 entregador vinculado a este estabelecimento')).toBeTruthy();
    expect(consultarResumoDashboard).toHaveBeenCalledWith(
      expect.objectContaining({
        dataInicio: '1970-01-01T00:00:00.000Z',
        dataFinal: expect.any(String),
      }),
    );
    expect(buscarDesempenhoEntregador).toHaveBeenCalledWith(
      BRUNO.cpf,
      expect.objectContaining({ de: '1970-01-01T00:00:00.000Z', ate: expect.any(String) }),
    );
    expect(new Date(vi.mocked(buscarDesempenhoEntregador).mock.calls[0][1].ate).getTime()).not.toBeNaN();
  });

  it('mostra os dados só para leitura, sem opção de editar o entregador', async () => {
    render(<PaginaFrota />);

    await screen.findByText('Bruno Lima');
    fireEvent.click(screen.getByRole('button', { name: 'Ações de Bruno Lima' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Remover entregador']);
    expect(screen.queryByRole('textbox', { name: /nome do entregador/i })).toBeNull();
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
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar entregador' }));

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
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar entregador' }));
    await vi.waitFor(() => expect(cadastrarEntregador).toHaveBeenCalled());
    expect(vi.mocked(cadastrarEntregador).mock.calls[0][0]).not.toHaveProperty('placa');
  });

  it('não envia o cadastro com campo inválido', () => {
    render(<PaginaFrota />);

    abrirCadastro();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar entregador' }));

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
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar entregador' }));
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
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar entregador' }));

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

  it('mostra o total ganho como indisponível quando o resumo não carrega', async () => {
    vi.mocked(consultarResumoDashboard).mockRejectedValue(new ApiError(500, 'Erro'));
    render(<PaginaFrota />);

    expect(await screen.findByText('Indisponível')).toBeTruthy();
  });

  it('no celular, cadastra e convida pelos botões no fim do card', async () => {
    render(<PaginaFrota />);
    await screen.findByText('Bruno Lima');

    fireEvent.click(screen.getAllByRole('button', { name: 'Cadastrar entregador' })[1]);
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Cadastrar entregador' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar cadastrar entregador' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: 'Convidar entregador que já usa o VemVindo' })[1]);
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Convidar entregador' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar convidar entregador' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  describe('respostas que chegam depois de sair da tela', () => {
    async function esperarRespostas(...promessas: Promise<unknown>[]) {
      await Promise.allSettled(promessas);
      await new Promise((resolver) => setTimeout(resolver, 0));
    }

    type Resumo = Awaited<ReturnType<typeof consultarResumoDashboard>>;
    type Frota = Awaited<ReturnType<typeof listarFrota>>;

    it('ignora o desempenho e o resumo que chegam ou falham depois', async () => {
      const ana = { ...BRUNO, nome: 'Ana Souza', cpf: '22222222222' };
      vi.mocked(listarFrota).mockResolvedValue([BRUNO, ana]);
      const desempenhoDoBruno = Promise.withResolvers<DesempenhoEntregador>();
      const desempenhoDaAna = Promise.withResolvers<DesempenhoEntregador>();
      vi.mocked(buscarDesempenhoEntregador).mockImplementation((cpf) =>
        cpf === BRUNO.cpf ? desempenhoDoBruno.promise : desempenhoDaAna.promise,
      );
      const resumo = Promise.withResolvers<Resumo>();
      vi.mocked(consultarResumoDashboard).mockReturnValue(resumo.promise);
      const erroNoConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { unmount } = render(<PaginaFrota />);
      await screen.findByText('Ana Souza');

      unmount();
      desempenhoDoBruno.resolve(DESEMPENHO);
      desempenhoDaAna.reject(new Error('falha'));
      resumo.resolve({ relatorioPorEntregador: [] } as unknown as Resumo);
      await esperarRespostas(desempenhoDoBruno.promise, desempenhoDaAna.promise, resumo.promise);

      expect(erroNoConsole).not.toHaveBeenCalled();
      erroNoConsole.mockRestore();
    });

    it.each([
      ['a frota chega e o resumo falha', 'resolve', 'reject'],
      ['a frota falha e o resumo chega', 'reject', 'resolve'],
    ] as const)('ignora quando %s depois', async (_, frotaResponde, resumoResponde) => {
      const frota = Promise.withResolvers<Frota>();
      const resumo = Promise.withResolvers<Resumo>();
      vi.mocked(listarFrota).mockReturnValue(frota.promise);
      vi.mocked(consultarResumoDashboard).mockReturnValue(resumo.promise);
      const erroNoConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { unmount } = render(<PaginaFrota />);

      unmount();
      if (frotaResponde === 'resolve') frota.resolve([BRUNO]);
      else frota.reject(new Error('falha'));
      if (resumoResponde === 'resolve') resumo.resolve({ relatorioPorEntregador: [] } as unknown as Resumo);
      else resumo.reject(new Error('falha'));
      await esperarRespostas(frota.promise, resumo.promise);

      expect(buscarDesempenhoEntregador).not.toHaveBeenCalled();
      expect(erroNoConsole).not.toHaveBeenCalled();
      erroNoConsole.mockRestore();
    });
  });

  it('no cadastro, o nome do entregador não aceita números', async () => {
    render(<PaginaFrota />);
    await screen.findByText('Bruno Lima');
    abrirCadastro();

    preencher('Nome completo', 'Joana7 Lima');

    expect(campo('Nome completo').value).toBe('Joana Lima');
  });

  it('sem conexão, o cadastro pede para tentar de novo', async () => {
    vi.mocked(cadastrarEntregador).mockRejectedValue(new Error('rede caiu'));
    render(<PaginaFrota />);
    await screen.findByText('Bruno Lima');
    abrirCadastro();

    preencherCadastro();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cadastrar entregador' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Não foi possível cadastrar agora. Tente de novo.',
    );
  });
});
