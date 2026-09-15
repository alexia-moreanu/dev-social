export default function Avatar({
  src,
  name,
  size = 32,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(name)}`}
      alt={name}
      width={size}
      height={size}
      className="rounded-md bg-surface border border-border shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
