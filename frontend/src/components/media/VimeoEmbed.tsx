
interface VimeoEmbedProps {
  url: string;
  className?: string;
}

export function VimeoEmbed({ url, className = '' }: VimeoEmbedProps) {
  return (
    <div className={`relative pt-[56.25%] rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
