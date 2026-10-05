'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { sair } from '@/app/lib/api';

interface AreaLogadaProps {
  titulo: string;
  usuario: string;
  telaDeLogin: string;
  children: ReactNode;
}

export default function AreaLogada({ titulo, usuario, telaDeLogin, children }: AreaLogadaProps) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    setSaindo(true);
    await sair().catch(() => undefined);
    router.replace(telaDeLogin);
  }

  return (
    <main className="bg-[#F6F5FB] flex-1 w-full px-6 py-8 xl:px-16 xl:py-12">
      <header className="flex items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-[#1D1B2E] text-[22px] xl:text-[28px] font-semibold">{titulo}</h1>
          <p className="text-[13px] text-[#8B8A9A]">{usuario}</p>
        </div>
        <button
          type="button"
          onClick={handleSair}
          disabled={saindo}
          className="hover:cursor-pointer rounded-xl border border-[#6C5DD3] px-4 py-2 text-sm font-medium text-[#6C5DD3] disabled:opacity-50"
        >
          Sair
        </button>
      </header>
      {children}
    </main>
  );
}
