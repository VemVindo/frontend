import type { Cargo } from '@/app/lib/tipos';

export const TELA_DE_LOGIN: Record<Cargo, string> = {
  ESTABELECIMENTO: '/',
  ENTREGADOR: '/login/entregador',
};

export const TELA_INICIAL: Record<Cargo, string> = {
  ESTABELECIMENTO: '/painel',
  ENTREGADOR: '/entregador',
};

export const TELA_TROCAR_SENHA = '/login/entregador/trocar-senha';
