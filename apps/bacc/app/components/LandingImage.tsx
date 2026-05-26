import type { ImgHTMLAttributes } from "react";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

type LandingImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "decoding" | "draggable" | "fetchPriority" | "loading"
> & {
  src: string;
  alt?: string;
  decoding?: "async" | "auto" | "sync";
  draggable?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "eager" | "lazy";
  media?: string;
};

export function LandingImage({
  src,
  alt = "",
  decoding = "async",
  draggable = false,
  fetchPriority = "low",
  loading = "lazy",
  media,
  ...props
}: LandingImageProps) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={media ? TRANSPARENT_PIXEL : src}
      alt={alt}
      decoding={decoding}
      draggable={draggable}
      fetchPriority={fetchPriority}
      loading={loading}
      data-landing-predecode="true"
    />
  );

  if (!media) {
    return image;
  }

  return (
    <picture>
      <source media={media} srcSet={src} />
      {image}
    </picture>
  );
}
