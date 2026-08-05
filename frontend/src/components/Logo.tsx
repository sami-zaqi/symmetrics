export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="symmetricsGrad" x1="4" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#58CC02" />
          <stop offset="1" stopColor="#1CB0F6" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line x1="4" y1="29" x2="36" y2="29" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round" />
      {/* axis of symmetry */}
      <line x1="20" y1="7" x2="20" y2="29" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.5 3.5" />
      {/* symmetric bell curve -- mirrored control points around x=20 */}
      <path
        d="M6,29 C10,29 12,10 20,9 C28,10 30,29 34,29"
        fill="none"
        stroke="url(#symmetricsGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  size = 30,
  withText = true,
  textClassName = "text-lg",
}: {
  size?: number;
  withText?: boolean;
  textClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      {withText && (
        <span className={`font-black tracking-tight text-duo-green ${textClassName}`}>
          Symmetrics
        </span>
      )}
    </div>
  );
}
