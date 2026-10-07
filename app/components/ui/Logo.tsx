import Image from 'next/image';

export default function Logo() {
  return (
    <span className="flex items-center gap-1">
      <Image src="/logo-icone.svg" alt="" width={47} height={27} loading="eager" />
      <span className="font-titulo font-bold text-[15px] text-texto">VemVindo</span>
    </span>
  );
}
