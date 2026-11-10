'use client';

import { useEffect, useState } from 'react';
import Botao from '@/app/components/ui/Botao';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { buscarDesempenhoEntregador, listarFrota } from '@/app/lib/api';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import ConfirmacaoRemocaoEntregador from './ConfirmacaoRemocaoEntregador';
import DialogoFrota from './DialogoFrota';
import FormularioCadastroEntregador from './FormularioCadastroEntregador';
import FormularioConviteEntregador from './FormularioConviteEntregador';
import FormularioEdicaoEntregador from './FormularioEdicaoEntregador';
import PainelDaFrota from './PainelDaFrota';
import { type EstadoDesempenho } from './ListaDaFrota';
import useRemocaoEntregador from './useRemocaoEntregador';

export default function PaginaFrota() {
  const [cpfParaConvite, setCpfParaConvite] = useState('');
  const [frota, setFrota] = useState<DadosCompartilhados[] | null>(null);
  const [erroDaFrota, setErroDaFrota] = useState(false);
  const [desempenhoPorCpf, setDesempenhoPorCpf] = useState<Record<string, EstadoDesempenho>>({});
  const [emEdicao, setEmEdicao] = useState<DadosCompartilhados | null>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [conviteAberto, setConviteAberto] = useState(false);
  const remocao = useRemocaoEntregador((cpf) => {
    setFrota((atuais) => atuais?.filter((entregador) => entregador.cpf !== cpf) ?? null);
    setDesempenhoPorCpf((atuais) => {
      const atualizado = { ...atuais };
      delete atualizado[cpf];
      return atualizado;
    });
  });

  useEffect(() => {
    let cancelado = false;
    listarFrota()
      .then((lista) => {
        if (cancelado) return;
        setFrota(lista);
        setErroDaFrota(false);

        const periodo = {
          de: '1970-01-01T00:00:00.000Z',
          ate: new Date().toISOString(),
        };
        for (const { cpf } of lista) {
          buscarDesempenhoEntregador(cpf, periodo)
            .then((dados) => {
              if (!cancelado) {
                setDesempenhoPorCpf((anteriores) => ({
                  ...anteriores,
                  [cpf]: { estado: 'carregado', dados },
                }));
              }
            })
            .catch(() => {
              if (!cancelado) {
                setDesempenhoPorCpf((anteriores) => ({
                  ...anteriores,
                  [cpf]: { estado: 'erro' },
                }));
              }
            });
        }
      })
      .catch(() => {
        if (!cancelado) setErroDaFrota(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function registrarEdicao(atualizado: DadosCompartilhados) {
    setFrota((atuais) => atuais?.map((atual) => (atual.cpf === atualizado.cpf ? atualizado : atual)) ?? null);
    setEmEdicao(null);
  }

  function abrirConvite(cpf = '') {
    setCpfParaConvite(cpf);
    setCadastroAberto(false);
    setConviteAberto(true);
  }

  return (
    <div>
      <div className="mx-auto max-w-[1020px]">
        <TituloPagina
          titulo="Frota"
          subtitulo={
            frota
              ? `${frota.length} ${frota.length === 1 ? 'entregador vinculado' : 'entregadores vinculados'} a este estabelecimento`
              : 'Entregadores vinculados a este estabelecimento'
          }
          acao={
            <Botao
              variante="primario"
              onClick={() => setCadastroAberto(true)}
              className="h-11 w-full rounded-[14px] px-5 text-xs md:w-[300px]"
            >
              + Cadastrar entregador
            </Botao>
          }
        />

        <PainelDaFrota
          entregadores={frota}
          erro={erroDaFrota}
          aviso={remocao.aviso}
          desempenhoPorCpf={desempenhoPorCpf}
          onEditar={setEmEdicao}
          onRemover={remocao.escolher}
          onConvidar={() => abrirConvite()}
        />
      </div>

      <DialogoFrota aberto={cadastroAberto} titulo="Cadastrar entregador" onFechar={() => setCadastroAberto(false)}>
        <FormularioCadastroEntregador onCpfJaCadastrado={abrirConvite} />
      </DialogoFrota>

      <DialogoFrota aberto={conviteAberto} titulo="Convidar entregador" onFechar={() => setConviteAberto(false)}>
        <FormularioConviteEntregador key={cpfParaConvite} cpfInicial={cpfParaConvite} />
      </DialogoFrota>

      {emEdicao && (
        <DialogoFrota aberto titulo={`Editar ${emEdicao.nome}`} onFechar={() => setEmEdicao(null)}>
          <FormularioEdicaoEntregador
            key={emEdicao.cpf}
            entregador={emEdicao}
            onSalvo={registrarEdicao}
            onCancelar={() => setEmEdicao(null)}
          />
        </DialogoFrota>
      )}

      <ConfirmacaoRemocaoEntregador
        entregador={remocao.paraRemover}
        removendo={remocao.removendo}
        erro={remocao.erroDaRemocao}
        onFechar={remocao.fechar}
        onConfirmar={remocao.confirmar}
      />
    </div>
  );
}
