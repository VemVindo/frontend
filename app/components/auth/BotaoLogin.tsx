import type { ReactNode } from 'react';

interface BotaoLoginProps {
  carregando: boolean;
  erro?: string | null;
  children: ReactNode;
}

export default function BotaoLogin({ carregando, erro, children }: BotaoLoginProps) {
  return (
    <div className='w-full flex flex-col justify-center items-center'>
      {carregando ? (
        <div
          role="status"
          aria-label="Carregando"
          className="h-10 w-10 animate-spin rounded-full border-4 border-borda border-t-primaria"
        />
      ) : (
        <button
          type="submit"
          className="hover:cursor-pointer transition-transform duration-300 hover:scale-101 rounded-xl bg-primaria w-full py-4 xl:py-5 text-sm xl:text-lg font-medium text-white disabled:opacity-50"
        >
          {children}
        </button>
      )}
      {erro && <p role="alert" className='text-[14px] text-erro mt-5'>{erro}</p>}
    </div>
  );
}
