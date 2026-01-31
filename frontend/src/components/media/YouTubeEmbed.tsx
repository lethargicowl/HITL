
interface YouTubeEmbedProps {
  url: string;
  className?: string;
}

export function YouTubeEmbed({ url, className = '' }: YouTubeEmbedProps) {
  return (
    <div className={`relative pt-[56.25%] rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={url}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
