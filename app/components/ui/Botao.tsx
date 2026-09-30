import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'claro';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  larguraTotal?: boolean;
}

const estilosPorVariante: Record<Variante, string> = {
  primario: 'bg-primaria text-white hover:bg-primaria-escura',
  secundario: 'bg-superficie text-texto border border-borda hover:bg-superficie-suave',
  claro: 'bg-primaria-clara text-primaria-escura hover:bg-lilas',
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
      className={`font-titulo font-bold text-[13px] rounded-[14px] h-12 px-6 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${estilosPorVariante[variante]} ${larguraTotal ? 'w-full' : ''} ${className}`}
      {...props}
    />
  );
}
