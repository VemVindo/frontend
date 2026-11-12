import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UFS } from '@/app/lib/empresa';
import type { FormularioNovoPedido } from '@/app/lib/novoPedido';
import CamposNovoPedido from './CamposNovoPedido';

const VAZIO: FormularioNovoPedido = {
  nome_recebedor: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  itens: '',
  observacoes: '',
  tipo_veiculo: '',
};

const atualizarCampo = vi.fn();

function renderizar(erros = {}) {
  render(
    <CamposNovoPedido dadosDoFormulario={VAZIO} erros={erros} idDoDialogo="novo" atualizarCampo={atualizarCampo} />,
  );
}

function digitar(nome: string, valor: string) {
  fireEvent.change(document.querySelector(`[name="${nome}"]`)!, { target: { value: valor } });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CamposNovoPedido', () => {
  it('escolhe a UF numa lista com os 27 estados', () => {
    renderizar();

    const uf = screen.getByRole('combobox', { name: 'UF' });
    const opcoes = within(uf).getAllByRole('option');
    expect(opcoes.map((opcao) => opcao.getAttribute('value'))).toEqual(['', ...UFS]);
    expect(UFS).toHaveLength(27);

    fireEvent.change(uf, { target: { value: 'SP' } });
    expect(atualizarCampo).toHaveBeenCalledWith('uf', 'SP');
  });

  it('mostra o erro da UF ligado à lista', () => {
    renderizar({ uf: 'Informe a UF.' });

    const uf = screen.getByRole('combobox', { name: 'UF' });
    expect(uf.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(uf.getAttribute('aria-describedby')!)?.textContent).toBe('Informe a UF.');
  });

  it.each([
    ['telefone', '(61) 99999-0000', '61999990000'],
    ['telefone', '6199999000012345', '61999990000'],
    ['cep', '70000-000', '70000000'],
    ['numero', '12a', '12'],
    ['numero', '12345678', '123456'],
    ['nome_recebedor', 'Carla2 Menezes', 'Carla Menezes'],
    ['cidade', 'Brasília1', 'Brasília'],
    ['logradouro', 'Quadra 10 Bloco B', 'Quadra 10 Bloco B'],
    ['bairro', 'Setor 2', 'Setor 2'],
  ])('o campo %s recebe %s e guarda %s', (campo, digitado, guardado) => {
    renderizar();

    digitar(campo, digitado);

    expect(atualizarCampo).toHaveBeenCalledWith(campo, guardado);
  });

  it('abre o teclado numérico no telefone, no CEP e no número', () => {
    renderizar();

    for (const nome of ['telefone', 'cep', 'numero']) {
      expect(document.querySelector(`[name="${nome}"]`)?.getAttribute('inputmode')).toBe('numeric');
    }
  });

  it('liga o erro dos itens e das observações ao próprio campo', () => {
    renderizar({ itens: 'Itens longos demais.', observacoes: 'Observações longas demais.' });

    for (const [rotulo, mensagem] of [
      ['Itens do pedido (opcional)', 'Itens longos demais.'],
      ['Observações (opcional)', 'Observações longas demais.'],
    ]) {
      const campo = screen.getByLabelText(rotulo);
      expect(campo.getAttribute('aria-invalid')).toBe('true');
      expect(campo.className).toContain('border-erro');
      expect(document.getElementById(campo.getAttribute('aria-describedby')!)?.textContent).toBe(mensagem);
    }
  });
});
