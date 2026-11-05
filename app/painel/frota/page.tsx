'use client';

import { useState } from 'react';
import TituloPagina from '@/app/components/ui/TituloPagina';
import FormularioCadastroEntregador from './FormularioCadastroEntregador';
import FormularioConviteEntregador from './FormularioConviteEntregador';

export default function PaginaFrota() {
  const [cpfParaConvite, setCpfParaConvite] = useState('');

  return (
    <div>
      <TituloPagina titulo="Frota" subtitulo="Cadastre entregadores novos ou convide quem já usa o VemVindo" />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <FormularioCadastroEntregador onCpfJaCadastrado={setCpfParaConvite} />
        <FormularioConviteEntregador key={cpfParaConvite} cpfInicial={cpfParaConvite} />
      </div>
    </div>
  );
}
