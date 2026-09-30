import type { Metadata } from 'next';
import FormularioRemuneracao from './FormularioRemuneracao';

export const metadata: Metadata = {
  title: 'Remuneração · VemVindo',
};

export default function PaginaRemuneracao() {
  return <FormularioRemuneracao />;
}
