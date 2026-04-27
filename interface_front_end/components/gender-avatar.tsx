export function GenderAvatar({ genre, size = 56 }: { genre: string | null | undefined; size?: number }) {
  const color =
    genre === "Homme" ? "#3b82f6"
    : genre === "Femme" ? "#ec4899"
    : "#9ca3af";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="28" cy="28" r="28" fill={color} fillOpacity="0.15" />
      <circle cx="28" cy="21" r="9" fill={color} />
      <path d="M10 47c0-9.941 8.059-18 18-18s18 8.059 18 18" fill={color} />
    </svg>
  );
}
