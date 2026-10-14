import { describe, expect, it } from 'vitest';
import { cpfValido, somenteDigitosCpf } from './cpf';

// CPFs gerados pelo algoritmo, sem relação com pessoas reais.
const CPF_FICTICIO = '52998224725';

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido(CPF_FICTICIO)).toBe(true);
    expect(cpfValido('11144477735')).toBe(true);
  });

  it('recusa CPF com pontos e traço', () => {
    expect(cpfValido('529.982.247-25')).toBe(false);
  });

  it('recusa dígito verificador errado', () => {
    expect(cpfValido('52998224724')).toBe(false);
    expect(cpfValido('52998224715')).toBe(false);
  });

  it('recusa sequências repetidas', () => {
    expect(cpfValido('00000000000')).toBe(false);
    expect(cpfValido('11111111111')).toBe(false);
  });

  it('recusa tamanho errado', () => {
    expect(cpfValido('5299822472')).toBe(false);
    expect(cpfValido('529982247250')).toBe(false);
    expect(cpfValido('')).toBe(false);
  });
});

describe('somenteDigitosCpf', () => {
  it('remove pontos, traço e letras', () => {
    expect(somenteDigitosCpf('529.982.247-25')).toBe(CPF_FICTICIO);
    expect(somenteDigitosCpf('abc529')).toBe('529');
  });

  it('limita a 11 dígitos', () => {
    expect(somenteDigitosCpf('529982247251234')).toBe(CPF_FICTICIO);
  });
});
