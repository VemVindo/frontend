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

export const MENU_PAINEL = [
  { rotulo: 'Dashboard', href: '/painel' },
  { rotulo: 'Pedidos', href: '/painel/pedidos' },
  { rotulo: 'Frota', href: '/painel/frota' },
  { rotulo: 'Remuneração', href: '/painel/remuneracao' },
  { rotulo: 'Avaliações', href: '/painel/avaliacoes' },
  { rotulo: 'Empresa', href: '/painel/empresa' },
] as const;
