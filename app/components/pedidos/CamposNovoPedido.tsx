import type { ReactNode } from 'react';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { somenteDigitos, UFS } from '@/app/lib/empresa';
import { somenteLetras } from '@/app/lib/entrada';
import type { ErrosNovoPedido, FormularioNovoPedido } from '@/app/lib/novoPedido';
interface CamposNovoPedidoProps {
  dadosDoFormulario: FormularioNovoPedido;
  erros: ErrosNovoPedido;
  idDoDialogo: string;
  localNoMapa?: ReactNode;
  atualizarCampo: <Campo extends keyof FormularioNovoPedido>(campo: Campo, valor: FormularioNovoPedido[Campo]) => void;
}

type CampoDeEndereco = 'cep' | 'logradouro' | 'numero' | 'complemento' | 'bairro' | 'cidade';

const CAMPOS_DE_ENDERECO: ReadonlyArray<{
  campo: CampoDeEndereco;
  rotulo: string;
  placeholder: string;
  autoComplete: string;
  numerico?: boolean;
  filtrar?: (texto: string) => string;
}> = [
  {
    campo: 'cep',
    rotulo: 'CEP',
    placeholder: '70000000',
    autoComplete: 'postal-code',
    numerico: true,
    filtrar: (texto) => somenteDigitos(texto, 8),
  },
  { campo: 'logradouro', rotulo: 'Logradouro', placeholder: 'Rua ou avenida', autoComplete: 'address-line1' },
  {
    campo: 'numero',
    rotulo: 'Número',
    placeholder: 'Ex.: 10',
    autoComplete: 'off',
    numerico: true,
    filtrar: (texto) => somenteDigitos(texto, 6),
  },
  {
    campo: 'complemento',
    rotulo: 'Complemento (opcional)',
    placeholder: 'Apartamento, bloco',
    autoComplete: 'address-line2',
  },
  { campo: 'bairro', rotulo: 'Bairro', placeholder: 'Ex.: Centro', autoComplete: 'address-level3' },
  {
    campo: 'cidade',
    rotulo: 'Cidade',
    placeholder: 'Ex.: Brasília',
    autoComplete: 'address-level2',
    filtrar: somenteLetras,
  },
];

function CampoUf({ dadosDoFormulario, erros, atualizarCampo, idDoDialogo }: CamposNovoPedidoProps) {
  const id = `${idDoDialogo}-uf`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-texto-corpo">
        UF
      </label>
      <select
        id={id}
        name="uf"
        required
        autoComplete="address-level1"
        value={dadosDoFormulario.uf}
        onChange={(evento) => atualizarCampo('uf', evento.target.value)}
        aria-invalid={erros.uf ? true : undefined}
        aria-describedby={erros.uf ? `${id}-erro` : undefined}
        className={`h-9 min-w-0 rounded-lg border bg-superficie px-3 text-xs text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${erros.uf ? 'border-erro' : 'border-borda'}`}
      >
        <option value="">Selecione o estado</option>
        {UFS.map((uf) => (
          <option key={uf} value={uf}>
            {uf}
          </option>
        ))}
      </select>
      {erros.uf && (
        <p id={`${id}-erro`} className="text-xs text-erro">
          {erros.uf}
        </p>
      )}
    </div>
  );
}

function CamposEndereco(propriedades: CamposNovoPedidoProps) {
  const { dadosDoFormulario, erros, atualizarCampo } = propriedades;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {CAMPOS_DE_ENDERECO.map(({ campo, rotulo, placeholder, autoComplete, numerico, filtrar }) => (
        <CampoTexto
          key={campo}
          aparencia="modal"
          rotulo={rotulo}
          name={campo}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={numerico ? 'numeric' : undefined}
          required={campo !== 'complemento'}
          value={dadosDoFormulario[campo]}
          erro={erros[campo]}
          onChange={(evento) => atualizarCampo(campo, filtrar ? filtrar(evento.target.value) : evento.target.value)}
        />
      ))}
      <CampoUf {...propriedades} />
    </div>
  );
}
function CamposOpcionais({ dadosDoFormulario, erros, atualizarCampo, idDoDialogo }: CamposNovoPedidoProps) {
  return (
    <>
      {' '}
      {(['itens', 'observacoes'] as const).map((campo) => (
        <div key={campo} className="flex flex-col gap-1">
          <label htmlFor={`${idDoDialogo}-${campo}`} className="text-xs text-texto-apoio">
            {campo === 'itens' ? 'Itens do pedido (opcional)' : 'Observações (opcional)'}
          </label>
          <textarea
            id={`${idDoDialogo}-${campo}`}
            name={campo}
            rows={campo === 'itens' ? 3 : 2}
            placeholder={campo === 'itens' ? 'Descreva os itens e quantidades' : undefined}
            value={dadosDoFormulario[campo]}
            onChange={(evento) => atualizarCampo(campo, evento.target.value)}
            aria-invalid={erros[campo] ? true : undefined}
            aria-describedby={erros[campo] ? `${idDoDialogo}-${campo}-erro` : undefined}
            className={`min-w-0 resize-y rounded-lg border bg-superficie px-3 py-2 text-xs text-texto-corpo placeholder:text-texto-apoio focus:border-primaria focus:outline-none focus:ring-2 focus:ring-primaria-clara ${erros[campo] ? 'border-erro' : 'border-borda'}`}
          />
          {erros[campo] && (
            <p id={`${idDoDialogo}-${campo}-erro`} className="text-xs text-erro">
              {erros[campo]}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
export default function CamposNovoPedido(propriedades: CamposNovoPedidoProps) {
  const { dadosDoFormulario, erros, atualizarCampo, idDoDialogo, localNoMapa } = propriedades;
  return (
    <>
      {' '}
      <CampoTexto
        aparencia="modal"
        rotulo="Nome do recebedor"
        name="nome_recebedor"
        placeholder="Ex.: Carla Menezes"
        autoComplete="name"
        required
        value={dadosDoFormulario.nome_recebedor}
        erro={erros.nome_recebedor}
        onChange={(evento) => atualizarCampo('nome_recebedor', somenteLetras(evento.target.value))}
      />
      <CampoTexto
        aparencia="modal"
        rotulo="Telefone"
        name="telefone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="DDD e número, ex.: 61999990000"
        required
        value={dadosDoFormulario.telefone}
        erro={erros.telefone}
        onChange={(evento) => atualizarCampo('telefone', somenteDigitos(evento.target.value, 11))}
      />
      <CamposEndereco {...propriedades} />
      {localNoMapa}
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={`${idDoDialogo}-veiculo`} className="text-xs text-texto-apoio">
          Tipo de veículo
        </label>
        <select
          id={`${idDoDialogo}-veiculo`}
          name="tipo_veiculo"
          required
          value={dadosDoFormulario.tipo_veiculo}
          onChange={(evento) =>
            atualizarCampo('tipo_veiculo', evento.target.value as FormularioNovoPedido['tipo_veiculo'])
          }
          aria-invalid={erros.tipo_veiculo ? true : undefined}
          aria-describedby={erros.tipo_veiculo ? `${idDoDialogo}-veiculo-erro` : undefined}
          className="h-9 min-w-0 rounded-lg border border-borda bg-superficie px-3 text-xs focus:border-primaria focus:outline-none focus:ring-2 focus:ring-primaria-clara"
        >
          <option value="">Selecione o tipo de veículo</option>
          <option value="DRIVE">Veículo motorizado</option>
          <option value="BICYCLE">Bicicleta</option>
        </select>
        {erros.tipo_veiculo && (
          <p id={`${idDoDialogo}-veiculo-erro`} className="text-xs text-erro">
            {erros.tipo_veiculo}
          </p>
        )}
      </div>
      <CamposOpcionais {...propriedades} />
    </>
  );
}
