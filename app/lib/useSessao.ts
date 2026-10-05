'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buscarUsuarioAtual, type Empresa, type Entregador } from '@/app/lib/api';

type Papel = Empresa['role'] | Entregador['role'];
type UsuarioDo<P extends Papel> = P extends 'ESTABELECIMENTO' ? Empresa : Entregador;

export const TELA_DE_LOGIN: Record<Papel, string> = {
  ESTABELECIMENTO: '/',
  ENTREGADOR: '/login/entregador',
};

export function useSessao<P extends Papel>(papel: P): UsuarioDo<P> | null {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioDo<P> | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarUsuarioAtual()
      .then((atual) => {
        if (cancelado) return;
        if (atual.role !== papel) {
          router.replace(TELA_DE_LOGIN[papel]);
        } else if (atual.role === 'ENTREGADOR' && atual.senhaTemporaria) {
          router.replace('/login/entregador/trocar-senha');
        } else {
          setUsuario(atual as UsuarioDo<P>);
        }
      })
      .catch(() => {
        if (!cancelado) router.replace(TELA_DE_LOGIN[papel]);
      });
    return () => {
      cancelado = true;
    };
  }, [papel, router]);

  return usuario;
}
