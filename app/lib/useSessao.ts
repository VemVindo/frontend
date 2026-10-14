'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buscarUsuarioAtual } from '@/app/lib/api';
import { TELA_DE_LOGIN, TELA_TROCAR_SENHA } from '@/app/lib/rotas';
import type { Cargo, Empresa, Entregador } from '@/app/lib/tipos';

type UsuarioDo<C extends Cargo> = C extends 'ESTABELECIMENTO' ? Empresa : Entregador;

export function useSessao<C extends Cargo>(cargo: C): UsuarioDo<C> | null {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioDo<C> | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarUsuarioAtual()
      .then((atual) => {
        if (cancelado) return;
        if (atual.cargo !== cargo) {
          router.replace(TELA_DE_LOGIN[cargo]);
        } else if (atual.cargo === 'ENTREGADOR' && atual.senhaTemporaria) {
          router.replace(TELA_TROCAR_SENHA);
        } else {
          setUsuario(atual as UsuarioDo<C>);
        }
      })
      .catch(() => {
        if (!cancelado) router.replace(TELA_DE_LOGIN[cargo]);
      });
    return () => {
      cancelado = true;
    };
  }, [cargo, router]);

  return usuario;
}
