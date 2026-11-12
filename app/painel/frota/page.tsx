'use client';

import { useEffect, useState } from 'react';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { buscarDesempenhoEntregador, consultarResumoDashboard, listarFrota } from '@/app/lib/api';
import { comEntregadorAtualizado, semEntregador } from '@/app/lib/entregadores';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import type { ResumoDoDashboard } from '@/app/lib/tiposDashboard';
import AcoesDaFrota from './AcoesDaFrota';
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
  const [totalPagoPorCpf, setTotalPagoPorCpf] = useState<Record<string, number>>({});
  const [erroTotalPago, setErroTotalPago] = useState(false);
  const [emEdicao, setEmEdicao] = useState<DadosCompartilhados | null>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [conviteAberto, setConviteAberto] = useState(false);
  const remocao = useRemocaoEntregador((cpf) => {
    setFrota((atuais) => semEntregador(atuais, cpf));
    setDesempenhoPorCpf((atuais) => {
      const atualizado = { ...atuais };
      delete atualizado[cpf];
      return atualizado;
    });
    setTotalPagoPorCpf((atuais) => {
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

  useEffect(() => {
    let cancelado = false;
    consultarResumoDashboard({
      dataInicio: '1970-01-01T00:00:00.000Z',
      dataFinal: new Date().toISOString(),
    })
      .then((resumo: ResumoDoDashboard) => {
        if (cancelado) return;
        setTotalPagoPorCpf(
          Object.fromEntries(resumo.relatorioPorEntregador.map(({ cpf, totalPago }) => [cpf, totalPago])),
        );
        setErroTotalPago(false);
      })
      .catch(() => {
        if (!cancelado) setErroTotalPago(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function registrarEdicao(atualizado: DadosCompartilhados) {
    setFrota((atuais) => comEntregadorAtualizado(atuais, atualizado));
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
            <AcoesDaFrota
              onCadastrar={() => setCadastroAberto(true)}
              onConvidar={() => abrirConvite()}
              className="hidden md:flex"
            />
          }
        />

        <PainelDaFrota
          entregadores={frota}
          erro={erroDaFrota}
          aviso={remocao.aviso}
          desempenhoPorCpf={desempenhoPorCpf}
          totalPagoPorCpf={totalPagoPorCpf}
          erroTotalPago={erroTotalPago}
          onCadastrar={() => setCadastroAberto(true)}
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
