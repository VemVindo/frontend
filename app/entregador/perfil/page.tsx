'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import FormularioPerfil from '@/app/components/entregador/FormularioPerfil';
import IconeVoltar from '@/app/components/icones/IconeVoltar';
import Card from '@/app/components/ui/Card';
import { ApiError, buscarPerfilDoEntregador } from '@/app/lib/api';
import { TELA_INICIAL, TELA_TROCAR_SENHA } from '@/app/lib/rotas';
import type { PerfilDoEntregador } from '@/app/lib/tipos';

const SENHA_TEMPORARIA = 403;

export default function PaginaPerfilDoEntregador() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilDoEntregador | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    buscarPerfilDoEntregador()
      .then((dados) => {
        if (!cancelado) setPerfil(dados);
      })
      .catch((falha) => {
        if (cancelado) return;
        if (falha instanceof ApiError && falha.status === SENHA_TEMPORARIA) router.replace(TELA_TROCAR_SENHA);
        else setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href={TELA_INICIAL.ENTREGADOR}
          aria-label="Voltar para as entregas"
          className="flex size-[38px] items-center justify-center rounded-full bg-primaria-clara text-primaria-escura"
        >
          <IconeVoltar className="size-5" />
        </Link>
        <h1 className="font-titulo text-base font-bold">Meu cadastro</h1>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-erro">
          Não foi possível carregar seu cadastro agora.
        </p>
      )}
      {!perfil && !erro && <p className="text-xs text-texto-apoio">Carregando cadastro...</p>}
      {perfil && (
        <Card>
          <FormularioPerfil
            perfil={perfil}
            onSalvo={setPerfil}
            onSenhaTemporaria={() => router.replace(TELA_TROCAR_SENHA)}
          />
        </Card>
      )}
    </div>
  );
}
