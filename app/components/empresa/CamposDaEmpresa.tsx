'use client';

import CampoTexto from '@/app/components/ui/CampoTexto';
import { somenteDigitos, UFS, type ErrosDoFormulario, type ValoresDaEmpresa } from '@/app/lib/empresa';

export interface CamposDaEmpresaProps {
  valores: ValoresDaEmpresa;
  erros: ErrosDoFormulario<ValoresDaEmpresa>;
  desabilitado?: boolean;
  onChange: (campo: keyof ValoresDaEmpresa, valor: string) => void;
}

// Campos comuns ao cadastro (E-US01) e à edição (E-US03).
export default function CamposDaEmpresa({ valores, erros, desabilitado, onChange }: CamposDaEmpresaProps) {
  const idUf = 'empresa-uf';
  const texto = (campo: keyof ValoresDaEmpresa) => ({
    id: `empresa-${campo}`,
    value: valores[campo],
    erro: erros[campo],
    disabled: desabilitado,
    onChange: (evento: React.ChangeEvent<HTMLInputElement>) => onChange(campo, evento.target.value),
  });

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <CampoTexto rotulo="Nome fantasia" autoComplete="organization" className="md:col-span-6" {...texto('nomeFantasia')} />
      <CampoTexto rotulo="E-mail" type="email" autoComplete="email" className="md:col-span-3" {...texto('email')} />
      <CampoTexto
        rotulo="Telefone"
        descricao="Com DDD, só números"
        inputMode="numeric"
        autoComplete="tel-national"
        className="md:col-span-3"
        {...texto('telefone')}
        onChange={(evento) => onChange('telefone', somenteDigitos(evento.target.value, 11))}
      />
      <CampoTexto
        rotulo="CEP"
        inputMode="numeric"
        autoComplete="postal-code"
        className="md:col-span-2"
        {...texto('cep')}
        onChange={(evento) => onChange('cep', somenteDigitos(evento.target.value, 8))}
      />
      <CampoTexto rotulo="Logradouro" autoComplete="address-line1" className="md:col-span-4" {...texto('logradouro')} />
      <CampoTexto
        rotulo="Número"
        inputMode="numeric"
        className="md:col-span-2"
        {...texto('numero')}
        onChange={(evento) => onChange('numero', somenteDigitos(evento.target.value, 6))}
      />
      <CampoTexto rotulo="Complemento (opcional)" autoComplete="address-line2" className="md:col-span-4" {...texto('complemento')} />
      <CampoTexto rotulo="Bairro" className="md:col-span-2" {...texto('bairro')} />
      <CampoTexto rotulo="Cidade" autoComplete="address-level2" className="md:col-span-3" {...texto('cidade')} />
      <div className="flex flex-col gap-1 md:col-span-1">
        <label htmlFor={idUf} className="text-xs text-texto-corpo">
          UF
        </label>
        <select
          id={idUf}
          value={valores.uf}
          disabled={desabilitado}
          aria-invalid={erros.uf ? true : undefined}
          aria-describedby={erros.uf ? `${idUf}-erro` : undefined}
          onChange={(evento) => onChange('uf', evento.target.value)}
          className={`h-10 rounded-[7px] border bg-superficie-suave px-2 text-[13px] text-texto-corpo outline-none focus:border-primaria focus:ring-2 focus:ring-primaria-clara ${erros.uf ? 'border-erro' : 'border-borda'}`}
        >
          <option value="">--</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        {erros.uf && (
          <p id={`${idUf}-erro`} className="text-[11px] text-erro">
            {erros.uf}
          </p>
        )}
      </div>
    </div>
  );
}
