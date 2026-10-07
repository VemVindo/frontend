import { aceitarVinculo, encerrarVinculo, recusarVinculo } from '@/app/lib/api';

export type AcaoVinculo = 'aceitar' | 'recusar' | 'encerrar';

export const EXECUTAR_ACAO: Record<AcaoVinculo, (id: number) => Promise<void>> = {
  aceitar: aceitarVinculo,
  recusar: recusarVinculo,
  encerrar: encerrarVinculo,
};

export const ERRO_ACAO: Record<AcaoVinculo, string> = {
  aceitar: 'Não foi possível aceitar o convite agora.',
  recusar: 'Não foi possível recusar o convite agora.',
  encerrar: 'Não foi possível sair da frota agora.',
};
