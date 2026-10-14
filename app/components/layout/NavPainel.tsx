'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import IconeFechar from '@/app/components/icones/IconeFechar';
import IconeMenu from '@/app/components/icones/IconeMenu';
import BotaoSair from '@/app/components/layout/BotaoSair';
import Logo from '@/app/components/ui/Logo';
import { MENU_PAINEL, TELA_INICIAL } from '@/app/lib/rotas';

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
        <Link href={TELA_INICIAL.ESTABELECIMENTO} className="md:w-[216px]">
          <Logo />
        </Link>

        <nav aria-label="Menu principal" className="hidden md:flex flex-1 h-full">
          {MENU_PAINEL.map((item) => {
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

        <div className="hidden md:block pr-4">
          <BotaoSair cargo="ESTABELECIMENTO" />
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-lateral"
          onClick={() => setMenuAberto(true)}
          className="md:hidden flex size-[38px] items-center justify-center rounded-full bg-primaria-clara text-primaria-escura cursor-pointer"
        >
          <IconeMenu className="size-5" />
        </button>
      </div>

      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            aria-hidden
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-sobreposicao/35"
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
                className="flex size-9 items-center justify-center rounded-full bg-primaria-clara text-texto-suave cursor-pointer"
              >
                <IconeFechar className="size-5" />
              </button>
            </div>
            <ul className="mt-8 flex flex-col">
              {MENU_PAINEL.map((item) => {
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
            <div className="mt-8">
              <BotaoSair cargo="ESTABELECIMENTO" larguraTotal />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
