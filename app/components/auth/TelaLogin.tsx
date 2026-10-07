import type { ReactNode } from 'react';
import Logo from '@/app/components/Logo';

interface TelaLoginProps {
  titulo: string;
  children: ReactNode;
}

export default function TelaLogin({ titulo, children }: TelaLoginProps) {
  return (
    <main className="bg-[#F6F5FB] flex h-full w-full flex-1 flex-col xl:flex-row items-center gap-[50px] px-6 py-16 xl:p-0">
      <div className='xl:w-[40%] xl:flex xl:items-center xl:justify-center'>
        <Logo className='w-[250px] xl:w-[460px] h-auto' />
      </div>

      <div className='w-full h-full xl:w-[60%] xl:bg-[#6C5DD3] xl:py-[150px] xl:px-[100px]'>
        <div className='w-full h-full flex flex-col justify-start xl:justify-center items-center gap-[75px] xl:rounded-3xl xl:bg-white xl:p-[50px] xl:items-start xl:justify-normal'>
          <h1 className='text-[#1D1B2E] text-[22px] xl:text-[28px] font-semibold'>{titulo}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
