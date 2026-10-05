'use client';

import { useId, type InputHTMLAttributes } from 'react';

interface CampoLoginProps extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
}

export default function CampoLogin({ rotulo, ...props }: CampoLoginProps) {
  const id = useId();

  return (
    <div className='flex flex-col gap-1 xl:gap-2'>
      <label htmlFor={id} className="text-[13px] text-[#8B8A9A] font-bold">
        {rotulo}
      </label>
      <input
        id={id}
        className="rounded-xl px-4 py-4 bg-white xl:bg-[#F6F5FB] text-black"
        {...props}
      />
    </div>
  );
}
