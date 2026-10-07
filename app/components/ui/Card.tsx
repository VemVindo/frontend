import type { ReactNode } from 'react';

export interface CardProps {
  titulo?: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export default function Card({ titulo, descricao, acao, className = '', children }: CardProps) {
  return (
    <section className={`bg-superficie rounded-[18px] p-4 md:p-5 ${className}`}>
      {(titulo || acao) && (
        <header className={`flex items-start justify-between gap-4 ${children ? 'mb-4' : ''}`}>
          <div>
            {titulo && <h2 className="font-titulo font-bold text-[15px] md:text-base">{titulo}</h2>}
            {descricao && <p className="text-xs text-texto-apoio mt-1">{descricao}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}
