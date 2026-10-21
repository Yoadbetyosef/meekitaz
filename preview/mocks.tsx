// Minimal stand-ins for next/* so the home page can run as a plain React bundle in one HTML file.
import React from "react";
export const Image = React.forwardRef<HTMLImageElement, any>(function Img({ src, alt, fill, sizes, quality, priority, width, height, style, ...rest }, ref) {
  const s = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...(style||{}) } : style;
  return <img ref={ref} src={typeof src === "string" ? src : src?.src} alt={alt || ""} width={fill?undefined:width} height={fill?undefined:height} style={s as any} {...rest} />;
});
export function getImageProps({ src, alt, ...rest }: any) { return { props: { src, alt, ...rest } }; }
export const Link = React.forwardRef<HTMLAnchorElement, any>(function L({ href, children, prefetch, scroll, ...rest }, ref) { return <a ref={ref} href={href} {...rest}>{children}</a>; });
export const usePathname = () => "/";
export const useRouter = () => ({ push: (h: string) => { location.hash = h; }, replace: () => {}, refresh: () => {}, back: () => {} });
export const useSearchParams = () => new URLSearchParams("");
