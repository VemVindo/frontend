import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PainelDadosCompartilhados from './PainelDadosCompartilhados';

describe('PainelDadosCompartilhados', () => {
  afterEach(cleanup);

  it('explica o uso da localização: quando, quem vê, Google e exclusão', () => {
    render(
      <PainelDadosCompartilhados
        dados={{
          nome: 'Carla Reis',
          cpf: '24681357928',
          telefone: '61987654321',
          tipoVeiculo: 'MOTO',
          placa: null,
          disponivel: true,
        }}
      />,
    );

    const aviso = screen.getByText(/Localização:/).textContent ?? '';
    expect(aviso).toMatch(/entrega em andamento/);
    expect(aviso).toMatch(/Compartilhar localização/);
    expect(aviso).toMatch(/Google Maps/);
    expect(aviso).toMatch(/apagada/);
  });

  it('mostra o telefone e avisa que ele é usado no WhatsApp', () => {
    render(
      <PainelDadosCompartilhados
        dados={{
          nome: 'Carla Reis',
          cpf: '24681357928',
          telefone: '61987654321',
          tipoVeiculo: 'MOTO',
          placa: null,
          disponivel: true,
        }}
      />,
    );

    expect(screen.getByText('(61) 98765-4321')).toBeTruthy();
    const aviso = screen.getByText(/WhatsApp:/).textContent ?? '';
    expect(aviso).toMatch(/entrega em andamento/);
    expect(aviso).toMatch(/não envia nem guarda/);
  });
});
