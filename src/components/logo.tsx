/**
 * Marca de Control de Actas Parroquiales.
 *
 * Tres lomos en el estante: el acervo de libros de la parroquia, no una
 * partida suelta. El libro central lleva la cruz latina calada —el travesaño
 * a un tercio de la altura, no a la mitad, para que no lea como cruz médica—
 * y es el único en vino litúrgico; los laterales van en pizarra.
 *
 * Esta es la versión libre, para fondo claro. El favicon usa la variante con
 * placa de `src/app/icon.svg`, porque sobre una pestaña oscura los lomos en
 * pizarra se pierden.
 */
export function Logo({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Control de Actas Parroquiales"
    >
      <path
        fill="#334155"
        d="M2.2 8c0-.7.6-1.3 1.3-1.3h1c.7 0 1.3.6 1.3 1.3v11.8c0 .7-.6 1.3-1.3 1.3h-1c-.7 0-1.3-.6-1.3-1.3z"
      />
      <path
        fill="#334155"
        d="M18.2 8c0-.7.6-1.3 1.3-1.3h1c.7 0 1.3.6 1.3 1.3v11.8c0 .7-.6 1.3-1.3 1.3h-1c-.7 0-1.3-.6-1.3-1.3z"
      />
      <path
        fill="#7a1f28"
        fillRule="evenodd"
        d="M8.4 4c0-.8.6-1.4 1.4-1.4h4.4c.8 0 1.4.6 1.4 1.4v15.7c0 .8-.6 1.4-1.4 1.4H9.8c-.8 0-1.4-.6-1.4-1.4zm2.7 3.3v2.8H9.3v1.8h1.8v5.3h1.8v-5.3h1.8v-1.8h-1.8V7.3z"
      />
    </svg>
  );
}
