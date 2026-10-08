import Etiqueta from '@/app/components/ui/Etiqueta';
import { rotuloDoStatus, tomDoStatus } from '@/app/lib/pedidos';

export interface EtiquetaStatusProps {
  status: string;
}

export default function EtiquetaStatus({ status }: EtiquetaStatusProps) {
  return <Etiqueta tom={tomDoStatus(status)}>{rotuloDoStatus(status)}</Etiqueta>;
}
