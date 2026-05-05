import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/catalogo" className="flex items-center" aria-label="Volver al inicio de MiBazar">
      <Image
        src="/image/logo.png"
        alt="MiaBazar"
        width={100}
        height={40}
        className="object-contain h-auto w-auto"
        priority
      />
    </Link>
  );
}
