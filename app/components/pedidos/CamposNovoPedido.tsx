import type { ReactNode } from 'react';
import CampoTexto from '@/app/components/ui/CampoTexto';
import type { ErrosNovoPedido, FormularioNovoPedido } from '@/app/lib/novoPedido';
interface CamposNovoPedidoProps {
  dadosDoFormulario: FormularioNovoPedido;
  erros: ErrosNovoPedido;
  idDoDialogo: string;
  localNoMapa?: ReactNode;
  atualizarCampo: <Campo extends keyof FormularioNovoPedido>(campo: Campo, valor: FormularioNovoPedido[Campo]) => void;
}

function CamposEndereco({ dadosDoFormulario, erros, atualizarCampo }: CamposNovoPedidoProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {(
        [
          ['cep', 'CEP', '70000-000', 'postal-code'],
          ['logradouro', 'Logradouro', 'Rua ou avenida', 'address-line1'],
          ['numero', 'Número', 'Ex.: 10', 'off'],
          ['complemento', 'Complemento (opcional)', 'Apartamento, bloco', 'address-line2'],
          ['bairro', 'Bairro', 'Ex.: Centro', 'address-level3'],
          ['cidade', 'Cidade', 'Ex.: Brasília', 'address-level2'],
          ['uf', 'UF', 'Ex.: DF', 'address-level1'],
        ] as const
      ).map(([campo, rotulo, placeholder, autoComplete]) => (
        <CampoTexto
          key={campo}
          aparencia="modal"
          rotulo={rotulo}
          name={campo}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={campo === 'numero' || campo === 'cep' ? 'numeric' : undefined}
          autoCapitalize={campo === 'uf' ? 'characters' : undefined}
          required={campo !== 'complemento'}
          value={dadosDoFormulario[campo]}
          erro={erros[campo]}
          onChange={(evento) => atualizarCampo(campo, evento.target.value)}
        />
      ))}
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
        onChange={(evento) => atualizarCampo('nome_recebedor', evento.target.value)}
      />
      <CampoTexto
        aparencia="modal"
        rotulo="Telefone"
        name="telefone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(61) 99999-0000"
        required
        value={dadosDoFormulario.telefone}
        erro={erros.telefone}
        onChange={(evento) => atualizarCampo('telefone', evento.target.value)}
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
