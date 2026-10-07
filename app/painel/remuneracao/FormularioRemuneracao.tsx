'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { centavosParaReais, reaisParaCentavos } from '@/app/lib/moeda';
import {
  buscarParametrosRemuneracao,
  salvarParametrosRemuneracao,
  type ParametrosRemuneracao,
} from '@/app/lib/remuneracao';
import CampoParametro from './CampoParametro';

type NomeCampo = keyof ParametrosRemuneracao;
type Valores = Record<NomeCampo, string>;
type Erros = Partial<Record<NomeCampo, string>>;
type Estado = 'carregando' | 'erro-carregar' | 'pronto' | 'salvando';
type Mensagem = { tipo: 'sucesso' | 'erro'; texto: string };

const campos: { nome: NomeCampo; rotulo: string; descricao: string }[] = [
  {
    nome: 'taxaFixa',
    rotulo: 'Valor base por entrega',
    descricao: 'Valor fixo pago a cada entrega concluída',
  },
  {
    nome: 'coeficienteKm',
    rotulo: 'Adicional por quilômetro',
    descricao: 'Somado conforme a distância percorrida',
  },
];

function paraValores(parametros: ParametrosRemuneracao): Valores {
  return {
    taxaFixa: centavosParaReais(parametros.taxaFixa),
    coeficienteKm: centavosParaReais(parametros.coeficienteKm),
  };
}

function validar(texto: string): string | undefined {
  if (texto.trim() === '') return 'Preencha este campo';
  if (texto.includes('-')) return 'O valor precisa ser positivo';
  const centavos = reaisParaCentavos(texto);
  if (centavos === null) return 'Use só números, por exemplo 8,50';
  if (centavos === 0) return 'O valor precisa ser maior que zero';
  return undefined;
}

export default function FormularioRemuneracao() {
  const [valores, setValores] = useState<Valores>({ taxaFixa: '', coeficienteKm: '' });
  const [erros, setErros] = useState<Erros>({});
  const [estado, setEstado] = useState<Estado>('carregando');
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);

  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    buscarParametrosRemuneracao()
      .then((parametros) => {
        if (cancelado) return;
        setValores(paraValores(parametros));
        setEstado('pronto');
      })
      .catch(() => {
        if (!cancelado) setEstado('erro-carregar');
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  function tentarDeNovo() {
    setEstado('carregando');
    setTentativa((anterior) => anterior + 1);
  }

  function alterarCampo(nome: NomeCampo, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [nome]: valor }));
    setErros((anteriores) => ({ ...anteriores, [nome]: undefined }));
    setMensagem(null);
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();

    const novosErros: Erros = {};
    for (const campo of campos) {
      const erro = validar(valores[campo.nome]);
      if (erro) novosErros[campo.nome] = erro;
    }
    setErros(novosErros);

    const primeiroInvalido = campos.find((campo) => novosErros[campo.nome]);
    if (primeiroInvalido) {
      document.getElementById(primeiroInvalido.nome)?.focus();
      return;
    }

    setEstado('salvando');
    setMensagem(null);
    try {
      const salvos = await salvarParametrosRemuneracao({
        taxaFixa: reaisParaCentavos(valores.taxaFixa)!,
        coeficienteKm: reaisParaCentavos(valores.coeficienteKm)!,
      });
      setValores(paraValores(salvos));
      setMensagem({
        tipo: 'sucesso',
        texto: 'Parâmetros salvos. Os novos valores valem para as próximas entregas.',
      });
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar. Tente de novo.' });
    } finally {
      setEstado('pronto');
    }
  }

  return (
    <form
      onSubmit={salvar}
      noValidate
      className="grid md:grid-cols-[minmax(0,900px)_minmax(0,300px)] md:justify-between md:gap-x-6"
    >
      <div className="md:col-start-1 md:row-start-1">
        <TituloPagina
          titulo="Remuneração"
          subtitulo="Parâmetros usados para calcular o pagamento dos motoboys"
        />
      </div>

      <Card
        titulo="Parâmetros de cálculo"
        descricao="Defina os valores usados no cálculo automático de cada entrega."
        className="md:col-start-1 md:row-start-2"
      >
        {estado === 'carregando' && (
          <p className="text-xs text-texto-apoio">Carregando parâmetros...</p>
        )}

        {estado === 'erro-carregar' && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs text-erro">Não foi possível carregar os parâmetros.</p>
            <Botao variante="claro" onClick={tentarDeNovo}>
              Tentar de novo
            </Botao>
          </div>
        )}

        {(estado === 'pronto' || estado === 'salvando') && (
          <div className="flex flex-col gap-[10px]">
            {campos.map((campo) => (
              <CampoParametro
                key={campo.nome}
                id={campo.nome}
                rotulo={campo.rotulo}
                descricao={campo.descricao}
                valor={valores[campo.nome]}
                erro={erros[campo.nome]}
                desabilitado={estado === 'salvando'}
                onChange={(valor) => alterarCampo(campo.nome, valor)}
              />
            ))}

            <div className="mt-2 rounded-[8px] border border-borda bg-superficie-suave px-[11px] py-3 md:mt-[10px] md:border-0 md:px-4 md:py-[14px]">
              <p className="text-[11px] font-semibold text-texto-corpo md:text-xs md:font-normal">
                Como o ganho é calculado
              </p>
              <p className="mt-1 text-[10px] text-texto-apoio md:mt-3 md:text-xs">
                Valor base + (adicional por quilômetro × distância percorrida)
              </p>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-5 flex flex-col gap-3 md:col-start-2 md:row-start-1 md:mt-0">
        <Botao type="submit" disabled={estado !== 'pronto'} className="w-full">
          {estado === 'salvando' ? 'Salvando...' : 'Salvar parâmetros'}
        </Botao>
        <p
          role="status"
          className={`text-xs ${mensagem?.tipo === 'erro' ? 'text-erro' : 'text-sucesso-texto'}`}
        >
          {mensagem?.texto}
        </p>
      </div>
    </form>
  );
}
