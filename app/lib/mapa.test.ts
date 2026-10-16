import { describe, expect, it } from 'vitest';
import {
  INTERVALO_ENVIO_MS,
  deveEnviarPosicao,
  formatarDistanciaRestante,
  formatarTempoRestante,
  horarioDeChegada,
  linkDeNavegacao,
  mensagemDeErroDeLocalizacao,
} from './mapa';
import { formatarEndereco } from './pedidos';

describe('mapa', () => {
  it('formata a distância em metros arredondados ou em km', () => {
    expect(formatarDistanciaRestante(null)).toBeNull();
    expect(formatarDistanciaRestante(0)).toBe('0 m');
    expect(formatarDistanciaRestante(847)).toBe('850 m');
    expect(formatarDistanciaRestante(4230)).toBe('4,2 km');
  });

  it('formata o tempo restante em minutos e horas', () => {
    expect(formatarTempoRestante(null)).toBeNull();
    expect(formatarTempoRestante(30)).toBe('menos de 1 min');
    expect(formatarTempoRestante(780)).toBe('13 min');
    expect(formatarTempoRestante(3600)).toBe('1 h');
    expect(formatarTempoRestante(5400)).toBe('1 h 30 min');
  });

  it('soma a duração ao horário atual para a chegada prevista', () => {
    const agora = new Date(2026, 9, 15, 12, 50);
    expect(horarioDeChegada(15 * 60, agora)).toBe('13:05');
    expect(horarioDeChegada(null, agora)).toBeNull();
  });

  it('abre a navegação pela coordenada e, sem ela, pelo endereço', () => {
    expect(linkDeNavegacao({ lat: -15.8, lng: -47.9 }, 'ignorado')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-15.8%2C-47.9',
    );
    expect(linkDeNavegacao(null, 'SQS 308 Bloco C, 101 - Asa Sul')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=SQS%20308%20Bloco%20C%2C%20101%20-%20Asa%20Sul',
    );
  });

  it('envia no máximo uma posição por intervalo', () => {
    expect(deveEnviarPosicao(null, 1000)).toBe(true);
    expect(deveEnviarPosicao(1000, 1000 + INTERVALO_ENVIO_MS - 1)).toBe(false);
    expect(deveEnviarPosicao(1000, 1000 + INTERVALO_ENVIO_MS)).toBe(true);
  });

  it('explica cada erro de localização do navegador', () => {
    expect(mensagemDeErroDeLocalizacao(1)).toMatch(/negada/);
    expect(mensagemDeErroDeLocalizacao(2)).toMatch(/GPS/);
    expect(mensagemDeErroDeLocalizacao(3)).toMatch(/demorou/);
    expect(mensagemDeErroDeLocalizacao(99)).toBe('Não foi possível obter a sua localização.');
  });

  it('formata o endereço igual ao backend', () => {
    const endereco = {
      logradouro: 'SQS 308 Bloco C',
      numero: 101,
      complemento: null,
      bairro: 'Asa Sul',
      cidade: 'Brasilia',
      uf: 'DF',
    };
    expect(formatarEndereco(endereco)).toBe('SQS 308 Bloco C, 101 - Asa Sul, Brasilia/DF');
    expect(formatarEndereco({ ...endereco, complemento: 'Apto 101' })).toBe(
      'SQS 308 Bloco C, 101, Apto 101 - Asa Sul, Brasilia/DF',
    );
  });
});
