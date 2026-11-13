import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  atualizarCadastroDaEmpresa,
  buscarCadastroDaEmpresa,
  localizarEnderecoDaEmpresa,
} from '@/app/lib/api';
import type { CadastroDaEmpresa, EnderecoLocalizado } from '@/app/lib/tipos';
import PaginaEmpresa from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarCadastroDaEmpresa: vi.fn(),
  atualizarCadastroDaEmpresa: vi.fn(),
  localizarEnderecoDaEmpresa: vi.fn(),
}));

const mapa = vi.hoisted(() => ({ chave: 'chave-de-teste' }));

vi.mock('@/app/lib/mapa', async (original) => {
  const real = await original<typeof import('@/app/lib/mapa')>();
  return {
    ...real,
    get CHAVE_GOOGLE_MAPS() {
      return mapa.chave;
    },
  };
});

// O jsdom não desenha o mapa; o mock expõe toque no mapa e arraste do pino como botões.
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Map: ({
    children,
    defaultCenter,
    onClick,
  }: {
    children: ReactNode;
    defaultCenter: { lat: number; lng: number };
    onClick: (evento: { detail: { latLng: { lat: number; lng: number } | null } }) => void;
  }) => (
    <div data-testid="mapa" data-centro={`${defaultCenter.lat},${defaultCenter.lng}`}>
      <button type="button" onClick={() => onClick({ detail: { latLng: { lat: -15.5, lng: -47.5 } } })}>
        tocar no mapa
      </button>
      <button type="button" onClick={() => onClick({ detail: { latLng: null } })}>
        tocar fora
      </button>
      {children}
    </div>
  ),
  AdvancedMarker: ({
    title,
    onDragEnd,
  }: {
    title: string;
    onDragEnd: (evento: { latLng: { lat: () => number; lng: () => number } | null }) => void;
  }) => (
    <>
      <button type="button" onClick={() => onDragEnd({ latLng: { lat: () => -15.4, lng: () => -47.4 } })}>
        {title}
      </button>
      <button type="button" onClick={() => onDragEnd({ latLng: null })}>
        soltar fora
      </button>
    </>
  ),
}));

const REGIAO: EnderecoLocalizado = {
  coordenada: { lat: -15.77, lng: -47.88 },
  precisao: 'aproximado',
  enderecoEncontrado: 'Asa Norte, Brasília - DF',
};

function adiada<T>() {
  let resolver!: (valor: T) => void;
  let rejeitar!: (erro: unknown) => void;
  const promessa = new Promise<T>((res, rej) => {
    resolver = res;
    rejeitar = rej;
  });
  return { promessa, resolver, rejeitar };
}

function corpoDoPut() {
  return vi.mocked(atualizarCadastroDaEmpresa).mock.calls[0][0];
}

async function abrirEdicao() {
  render(<PaginaEmpresa />);
  fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
}

function status(texto: RegExp) {
  return screen.findByText(texto);
}

const CADASTRO: CadastroDaEmpresa = {
  nomeFantasia: 'Cantina Dona Marta',
  razaoSocial: 'Cantina Dona Marta Ltda',
  documento: { tipo: 'CNPJ', numero: '11222333000181' },
  email: 'contato@cantina.test',
  telefone: '61930000000',
  endereco: {
    cep: '70000000',
    logradouro: 'SQN 210 Bloco K',
    numero: 10,
    complemento: null,
    bairro: 'Asa Norte',
    cidade: 'Brasilia',
    uf: 'DF',
  },
  origem: null,
  criadaEm: '2026-09-01T12:00:00Z',
  atualizadaEm: '2026-09-01T12:00:00Z',
};

describe('PaginaEmpresa', () => {
  beforeEach(() => {
    mapa.chave = 'chave-de-teste';
    vi.mocked(localizarEnderecoDaEmpresa).mockResolvedValue(REGIAO);
    vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue(CADASTRO);
    vi.mocked(atualizarCadastroDaEmpresa).mockResolvedValue({
      ...CADASTRO,
      telefone: '61940000000',
      atualizadaEm: '2026-10-20T15:00:00Z',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra os dados em modo leitura, com documento e datas', async () => {
    render(<PaginaEmpresa />);

    expect(await screen.findByText('11.222.333/0001-81')).toBeTruthy();
    expect(screen.getByText('Cantina Dona Marta Ltda')).toBeTruthy();
    expect(screen.getByText('(61) 93000-0000')).toBeTruthy();
    expect(screen.getByText(/CEP 70000-000/)).toBeTruthy();
    expect(screen.getByText(/Cadastro criado em/)).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('edita, salva e volta para a leitura com os novos dados', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '61940000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Dados atualizados.')).toBeTruthy();
    expect(screen.getByText('(61) 94000-0000')).toBeTruthy();
    expect(atualizarCadastroDaEmpresa).toHaveBeenCalledWith(expect.objectContaining({ telefone: '61940000000' }));
  });

  it('cancelar descarta o que foi digitado', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('Nome fantasia'), { target: { value: 'Outro nome' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Cantina Dona Marta')).toBeTruthy();
    expect(screen.queryByText('Outro nome')).toBeNull();
    expect(atualizarCadastroDaEmpresa).not.toHaveBeenCalled();
  });

  it('não salva dados inválidos', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'invalido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('Informe um e-mail válido')).toBeTruthy();
    expect(atualizarCadastroDaEmpresa).not.toHaveBeenCalled();
  });

  it('mostra a recusa do backend e continua editando', async () => {
    vi.mocked(atualizarCadastroDaEmpresa).mockRejectedValue(new ApiError(409, 'E-mail ja cadastrado'));
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('E-mail ja cadastrado');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  it('avisa quando não consegue carregar', async () => {
    vi.mocked(buscarCadastroDaEmpresa).mockRejectedValue(new Error('falha'));
    render(<PaginaEmpresa />);

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeTruthy();
  });

  it('na edição, a cidade não aceita números', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Brasilia2' } });

    expect((screen.getByLabelText('Cidade') as HTMLInputElement).value).toBe('Brasilia');
  });

  describe('pino da empresa', () => {
    it('em leitura, diz se o ponto de saída já foi marcado', async () => {
      render(<PaginaEmpresa />);
      expect(await screen.findByText(/Ainda não marcado/)).toBeTruthy();
      cleanup();

      vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue({ ...CADASTRO, origem: { lat: -15.75, lng: -47.89 } });
      render(<PaginaEmpresa />);
      expect(await screen.findByText('Marcado no mapa')).toBeTruthy();
    });

    it('com ponto salvo, mostra o pino sem procurar e manda o mesmo ponto ao salvar', async () => {
      vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue({ ...CADASTRO, origem: { lat: -15.75, lng: -47.89 } });
      await abrirEdicao();

      expect(await status(/As entregas saem deste ponto/)).toBeTruthy();
      expect(screen.getByTestId('mapa').dataset.centro).toBe('-15.75,-47.89');
      expect(localizarEnderecoDaEmpresa).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      await screen.findByText('Dados atualizados.');
      expect(corpoDoPut()).toMatchObject({ origemLat: -15.75, origemLng: -47.89 });
    });

    it('sem ponto salvo, sugere pelo endereço e salva o ponto arrastado', async () => {
      await abrirEdicao();

      expect(await status(/Achamos só a região/)).toBeTruthy();
      expect(localizarEnderecoDaEmpresa).toHaveBeenCalledWith({
        cep: '70000000',
        logradouro: 'SQN 210 Bloco K',
        numero: 10,
        bairro: 'Asa Norte',
        cidade: 'Brasilia',
        uf: 'DF',
      });
      expect(screen.getByText('Asa Norte, Brasília - DF')).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Ponto de saída das entregas' }));
      expect(screen.getByText(/Ponto marcado/)).toBeTruthy();
      expect(screen.queryByText('Asa Norte, Brasília - DF')).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      await screen.findByText('Dados atualizados.');
      expect(corpoDoPut()).toMatchObject({ origemLat: -15.4, origemLng: -47.4 });
    });

    it('com o endereço exato, pede só para conferir', async () => {
      vi.mocked(localizarEnderecoDaEmpresa).mockResolvedValue({ ...REGIAO, precisao: 'exato' });
      await abrirEdicao();

      expect(await status(/Confira o pino/)).toBeTruthy();
    });

    it('sem resultado, deixa marcar tocando no mapa', async () => {
      vi.mocked(localizarEnderecoDaEmpresa).mockResolvedValue({
        coordenada: null,
        precisao: null,
        enderecoEncontrado: null,
      });
      await abrirEdicao();

      expect(await status(/Não encontramos esse endereço/)).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Ponto de saída das entregas' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'tocar fora' }));
      expect(screen.getByText(/Não encontramos esse endereço/)).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'tocar no mapa' }));
      expect(screen.getByText(/Ponto marcado/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'soltar fora' }));

      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      await screen.findByText('Dados atualizados.');
      expect(corpoDoPut()).toMatchObject({ origemLat: -15.5, origemLng: -47.5 });
    });

    it('se a busca falha, avisa e não manda pino nenhum', async () => {
      vi.mocked(localizarEnderecoDaEmpresa).mockRejectedValue(new Error('rede'));
      await abrirEdicao();

      expect(await status(/Não foi possível localizar agora/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      await screen.findByText('Dados atualizados.');
      expect(corpoDoPut()).not.toHaveProperty('origemLat');
    });

    it('quando o endereço muda, pede para confirmar o pino', async () => {
      vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue({ ...CADASTRO, origem: { lat: -15.75, lng: -47.89 } });
      await abrirEdicao();
      await status(/As entregas saem deste ponto/);

      fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Asa Sul' } });
      expect(screen.getByText(/O endereço mudou/)).toBeTruthy();

      fireEvent.click(screen.getByRole('button', { name: 'Manter o ponto atual' }));
      expect(screen.getByText(/Ponto marcado/)).toBeTruthy();

      fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Asa Sul Norte' } });
      fireEvent.click(screen.getByRole('button', { name: 'Localizar pelo endereço novo' }));
      expect(await status(/Achamos só a região/)).toBeTruthy();
      expect(localizarEnderecoDaEmpresa).toHaveBeenLastCalledWith(expect.objectContaining({ bairro: 'Asa Sul Norte' }));
    });

    it('com o endereço mudado e sem confirmar, salva sem pino para o back recalcular', async () => {
      vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue({ ...CADASTRO, origem: { lat: -15.75, lng: -47.89 } });
      await abrirEdicao();
      await status(/As entregas saem deste ponto/);

      fireEvent.change(screen.getByLabelText('Logradouro'), { target: { value: 'SQN 211 Bloco A' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

      await screen.findByText('Dados atualizados.');
      expect(corpoDoPut()).not.toHaveProperty('origemLat');
    });

    it('fora do endereço, os outros campos não mexem no pino', async () => {
      await abrirEdicao();
      await status(/Achamos só a região/);

      fireEvent.change(screen.getByLabelText('Nome fantasia'), { target: { value: 'Cantina Nova' } });
      expect(screen.getByText(/Achamos só a região/)).toBeTruthy();
    });

    it('ignora a resposta de uma busca antiga depois que o endereço mudou', async () => {
      const busca = adiada<EnderecoLocalizado>();
      vi.mocked(localizarEnderecoDaEmpresa).mockReturnValue(busca.promessa);
      await abrirEdicao();
      expect(screen.getByText(/Procurando o endereço/)).toBeTruthy();

      fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Asa Sul' } });
      busca.resolver(REGIAO);

      await waitFor(() => expect(screen.getByText(/O endereço mudou/)).toBeTruthy());
      expect(screen.queryByRole('button', { name: 'Manter o ponto atual' })).toBeNull();
    });

    it('ignora a falha de uma busca antiga depois que o pino foi marcado', async () => {
      vi.mocked(localizarEnderecoDaEmpresa).mockResolvedValue({ ...REGIAO, precisao: 'exato' });
      await abrirEdicao();
      await status(/Confira o pino/);

      const busca = adiada<EnderecoLocalizado>();
      vi.mocked(localizarEnderecoDaEmpresa).mockReturnValue(busca.promessa);
      fireEvent.click(screen.getByRole('button', { name: 'Localizar pelo endereço' }));
      expect(screen.getByText(/Procurando o endereço/)).toBeTruthy();

      fireEvent.change(screen.getByLabelText('Bairro'), { target: { value: 'Asa Sul' } });
      busca.rejeitar(new Error('rede'));

      await waitFor(() => expect(screen.getByText(/O endereço mudou/)).toBeTruthy());
    });

    it('com o endereço cadastrado incompleto, não procura e deixa marcar no mapa', async () => {
      vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue({
        ...CADASTRO,
        endereco: { ...CADASTRO.endereco, cep: '' },
      });
      await abrirEdicao();

      expect(await status(/Não encontramos esse endereço/)).toBeTruthy();
      expect(localizarEnderecoDaEmpresa).not.toHaveBeenCalled();
      expect((screen.getByRole('button', { name: 'Localizar pelo endereço' }) as HTMLButtonElement).disabled).toBe(
        true,
      );
    });

    it('cancelar no meio da busca e editar de novo faz uma busca nova', async () => {
      const busca = adiada<EnderecoLocalizado>();
      vi.mocked(localizarEnderecoDaEmpresa).mockReturnValueOnce(busca.promessa);
      await abrirEdicao();

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      busca.resolver({ ...REGIAO, precisao: 'exato' });
      fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

      expect(await status(/Achamos só a região/)).toBeTruthy();
      expect(screen.queryByText(/Confira o pino/)).toBeNull();
      expect(localizarEnderecoDaEmpresa).toHaveBeenCalledTimes(2);
    });

    it('sem chave do Google Maps, não mostra o mapa nem procura', async () => {
      mapa.chave = '';
      await abrirEdicao();

      expect(screen.queryByRole('region', { name: 'Ponto de saída das entregas' })).toBeNull();
      expect(localizarEnderecoDaEmpresa).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      await screen.findByText('Dados atualizados.');
      expect(corpoDoPut()).not.toHaveProperty('origemLat');
    });
  });
});
