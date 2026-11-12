import type { ButtonHTMLAttributes } from 'react';

export type VarianteBotao = 'primario' | 'secundario' | 'claro' | 'perigo';

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  larguraTotal?: boolean;
}

const estilosPorVariante: Record<VarianteBotao, string> = {
  primario: 'bg-primaria text-white hover:bg-primaria-escura',
  secundario: 'bg-superficie text-texto border border-borda hover:bg-superficie-suave',
  claro: 'bg-primaria-clara text-primaria-escura hover:bg-lilas',
  perigo: 'bg-erro text-white hover:brightness-90',
};

export default function Botao({
  variante = 'primario',
  larguraTotal = false,
  type = 'button',
  className = '',
  ...props
}: BotaoProps) {
  return (
    <button
      type={type}
      className={`font-titulo font-bold text-sm rounded-[14px] h-12 px-6 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${estilosPorVariante[variante]} ${larguraTotal ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}
