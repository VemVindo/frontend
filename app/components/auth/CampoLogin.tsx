'use client';

import { useId, type InputHTMLAttributes } from 'react';

interface CampoLoginProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
}

export default function CampoLogin({ rotulo, ...props }: CampoLoginProps) {
  const id = useId();

  return (
    <div className='flex flex-col gap-1 xl:gap-2'>
      <label htmlFor={id} className="text-[13px] text-texto-suave font-bold">
        {rotulo}
      </label>
      <input
        id={id}
        className="rounded-xl px-4 py-4 bg-superficie xl:bg-fundo text-black"
        {...props}
      />
    </div>
  );
}
