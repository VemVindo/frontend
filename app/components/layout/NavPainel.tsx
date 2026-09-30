'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/app/components/ui/Logo';

const itensMenu = [
  { rotulo: 'Dashboard', href: '/painel' },
  { rotulo: 'Pedidos', href: '/painel/pedidos' },
  { rotulo: 'Frota', href: '/painel/frota' },
  { rotulo: 'Remuneração', href: '/painel/remuneracao' },
  { rotulo: 'Avaliações', href: '/painel/avaliacoes' },
  { rotulo: 'Empresa', href: '/painel/empresa' },
];

export default function NavPainel() {
  const caminhoAtual = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!menuAberto) return;
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuAberto(false);
    }
    document.addEventListener('keydown', fecharComEsc);
    return () => document.removeEventListener('keydown', fecharComEsc);
  }, [menuAberto]);

  return (
    <header className="bg-superficie">
      <div className="mx-auto flex h-[62px] md:h-[68px] max-w-[1280px] items-center justify-between px-4 md:px-1">
        <Link href="/painel" className="md:w-[216px]">
          <Logo />
        </Link>

        <nav aria-label="Menu principal" className="hidden md:flex flex-1 h-full">
          {itensMenu.map((item) => {
            const ativo = caminhoAtual === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex items-center px-[10px] text-[13px] transition-colors hover:text-texto ${ativo ? 'text-texto font-semibold' : 'text-texto-suave'}`}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-lateral"
          onClick={() => setMenuAberto(true)}
          className="md:hidden flex size-[38px] items-center justify-center rounded-full bg-primaria-clara text-primaria-escura font-bold cursor-pointer"
        >
          ☰
        </button>
      </div>

      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            aria-hidden
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-[#29243a]/35"
          />
          <nav
            id="menu-lateral"
            aria-label="Menu principal"
            className="absolute right-0 top-0 h-full w-[298px] max-w-[85%] bg-superficie px-6 py-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-titulo font-bold text-lg">VemVindo</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuAberto(false)}
                className="flex size-9 items-center justify-center rounded-full bg-primaria-clara text-texto-suave text-lg cursor-pointer"
              >
                ×
              </button>
            </div>
            <ul className="mt-8 flex flex-col">
              {itensMenu.map((item) => {
                const ativo = caminhoAtual === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={ativo ? 'page' : undefined}
                      onClick={() => setMenuAberto(false)}
                      className={`block py-2 text-[15px] ${ativo ? 'text-primaria font-semibold' : 'text-texto'}`}
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
