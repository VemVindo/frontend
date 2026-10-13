import type { ReactNode } from 'react';
import LogoCompleta from '@/app/components/ui/LogoCompleta';

interface TelaLoginProps {
  titulo: string;
  children: ReactNode;
}

export default function TelaLogin({ titulo, children }: TelaLoginProps) {
  return (
    <main className="bg-fundo flex h-full w-full flex-1 flex-col xl:flex-row items-center gap-[50px] px-6 py-16 xl:p-0">
      <div className='xl:w-[40%] xl:flex xl:items-center xl:justify-center'>
        <LogoCompleta className='w-[250px] xl:w-[460px] h-auto' />
      </div>

      <div className='w-full h-full xl:w-[60%] xl:bg-primaria xl:py-[150px] xl:px-[100px]'>
        <div className='w-full h-full flex flex-col justify-start xl:justify-center items-center gap-[75px] xl:rounded-3xl xl:bg-superficie xl:p-[50px] xl:items-start xl:justify-normal'>
          <h1 className='text-texto text-[22px] xl:text-[28px] font-semibold'>{titulo}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
