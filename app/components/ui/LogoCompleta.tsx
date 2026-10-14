import Image from 'next/image';

export default function LogoCompleta({ className }: { className?: string }) {
  return <Image src="/logo.svg" width={414} height={306} alt="VemVindo" priority className={className} />;
}
