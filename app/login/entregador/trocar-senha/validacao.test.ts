import { describe, expect, it } from 'vitest';
import { TAMANHO_MAXIMO, TAMANHO_MINIMO, validarNovaSenha } from './validacao';

const TEMPORARIA = 'Temp@2026';
const NOVA = 'NovaSenha@1';

describe('validarNovaSenha', () => {
  it('aceita senha nova válida e confirmada', () => {
    expect(validarNovaSenha(TEMPORARIA, NOVA, NOVA)).toBeNull();
  });

  it('exige o tamanho mínimo', () => {
    const curta = 'a'.repeat(TAMANHO_MINIMO - 1);
    expect(validarNovaSenha(TEMPORARIA, curta, curta)).toMatch(/pelo menos/);
  });

  it('respeita o tamanho máximo do bcrypt', () => {
    const longa = 'a'.repeat(TAMANHO_MAXIMO + 1);
    expect(validarNovaSenha(TEMPORARIA, longa, longa)).toMatch(/no máximo/);
    const limite = 'a'.repeat(TAMANHO_MAXIMO);
    expect(validarNovaSenha(TEMPORARIA, limite, limite)).toBeNull();
  });

  it('recusa repetir a senha temporária', () => {
    expect(validarNovaSenha(TEMPORARIA, TEMPORARIA, TEMPORARIA)).toMatch(/diferente/);
  });

  it('recusa confirmação diferente', () => {
    expect(validarNovaSenha(TEMPORARIA, NOVA, 'Outra@1234')).toMatch(/não conferem/);
  });
});
