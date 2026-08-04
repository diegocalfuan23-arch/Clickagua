/**
 * Ilustración propia del hero: cordillera + estanque, en siluetas planas
 * dentro de la misma paleta celeste/índigo del sitio. No es una foto de
 * stock ni un ícono genérico — es lo que le da textura visual a la página
 * mientras no existan fotos reales de comités.
 */
export function PaisajeRural({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      role="img"
      aria-label="Ilustración de cordillera y estero"
    >
      <defs>
        <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef7fb" />
          <stop offset="100%" stopColor="#d6ebf3" />
        </linearGradient>
      </defs>

      <rect width="420" height="320" fill="url(#cielo)" rx="28" />

      {/* sol/luna discreto */}
      <circle cx="330" cy="70" r="26" fill="#ffffff" opacity="0.55" />

      {/* cordillera trasera */}
      <path
        d="M0,190 L70,110 L130,165 L190,90 L250,160 L310,105 L360,150 L420,120 L420,320 L0,320 Z"
        fill="#b9d9e6"
      />

      {/* cordillera con nieve, delantera */}
      <path
        d="M0,230 L60,150 L100,190 L150,120 L210,200 L260,140 L300,185 L360,130 L420,175 L420,320 L0,320 Z"
        fill="#8fbfd4"
      />
      <path
        d="M60,150 L75,168 L45,168 Z M150,120 L168,142 L132,142 Z M260,140 L275,158 L245,158 Z M360,130 L375,150 L345,150 Z"
        fill="#ffffff"
        opacity="0.85"
      />

      {/* estero/laguna al frente, con el índigo de marca */}
      <path
        d="M0,260 C60,240 100,275 160,255 C220,235 260,270 320,250 C360,236 400,248 420,242 L420,320 L0,320 Z"
        fill="#3607F2"
        opacity="0.9"
      />
      <path
        d="M0,275 C70,258 110,285 170,268 C230,250 270,280 330,262 C365,251 400,260 420,256 L420,320 L0,320 Z"
        fill="#3607F2"
      />

      {/* reflejo/brillo sutil en el agua */}
      <ellipse cx="150" cy="285" rx="46" ry="6" fill="#ffffff" opacity="0.18" />
      <ellipse cx="300" cy="292" rx="34" ry="5" fill="#ffffff" opacity="0.14" />
    </svg>
  );
}
