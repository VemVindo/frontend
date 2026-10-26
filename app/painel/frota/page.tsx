'use client';

import { useEffect, useState } from 'react';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { listarFrota } from '@/app/lib/api';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import FormularioCadastroEntregador from './FormularioCadastroEntregador';
import FormularioConviteEntregador from './FormularioConviteEntregador';
import FormularioEdicaoEntregador from './FormularioEdicaoEntregador';
import ListaDaFrota from './ListaDaFrota';

export default function PaginaFrota() {
  const [cpfParaConvite, setCpfParaConvite] = useState('');
  const [frota, setFrota] = useState<DadosCompartilhados[] | null>(null);
  const [erroDaFrota, setErroDaFrota] = useState(false);
  const [emEdicao, setEmEdicao] = useState<DadosCompartilhados | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarFrota()
      .then((lista) => {
        if (!cancelado) setFrota(lista);
      })
      .catch(() => {
        if (!cancelado) setErroDaFrota(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function escolherParaEditar(entregador: DadosCompartilhados) {
    setEmEdicao(entregador);
    setAviso(null);
  }

  function registrarEdicao(atualizado: DadosCompartilhados) {
    setFrota((atuais) => atuais?.map((atual) => (atual.cpf === atualizado.cpf ? atualizado : atual)) ?? null);
    setEmEdicao(null);
    setAviso(`Dados de ${atualizado.nome} atualizados.`);
  }

  return (
    <div>
      <TituloPagina titulo="Frota" subtitulo="Cadastre entregadores novos ou convide quem já usa o VemVindo" />
      <div className="flex flex-col gap-5">
        {emEdicao && (
          <FormularioEdicaoEntregador
            key={emEdicao.cpf}
            entregador={emEdicao}
            onSalvo={registrarEdicao}
            onCancelar={() => setEmEdicao(null)}
          />
        )}
        <Card titulo="Entregadores da frota">
          {aviso && (
            <p role="status" className="mb-3 text-xs text-sucesso-texto">
              {aviso}
            </p>
          )}
          {erroDaFrota && <p className="text-xs text-erro">Não foi possível carregar a frota agora.</p>}
          {!frota && !erroDaFrota && <p className="text-xs text-texto-apoio">Carregando a frota...</p>}
          {frota && <ListaDaFrota entregadores={frota} onEditar={escolherParaEditar} />}
        </Card>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <FormularioCadastroEntregador onCpfJaCadastrado={setCpfParaConvite} />
          <FormularioConviteEntregador key={cpfParaConvite} cpfInicial={cpfParaConvite} />
        </div>
      </div>
    </div>
  );
}
