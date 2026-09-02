import type { Map as MlMap } from "maplibre-gl";

const images = new Map<string, HTMLImageElement>();
const loading = new Map<string, Promise<HTMLImageElement>>();

function load(id: string, markup: string): Promise<HTMLImageElement> {
  const hit = images.get(id);
  if (hit) {
    return Promise.resolve(hit);
  }
  const wait = loading.get(id);
  if (wait) {
    return wait;
  }
  const next = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images.set(id, img);
      loading.delete(id);
      resolve(img);
    };
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
  loading.set(id, next);
  return next;
}

export function ensureImage(
  map: MlMap,
  id: string,
  markup: string,
  options?: Parameters<MlMap["addImage"]>[2],
): void {
  if (map.hasImage(id)) {
    return;
  }
  void load(id, markup).then((img) => {
    if (!map.hasImage(id)) {
      map.addImage(id, img, { pixelRatio: 2, ...options });
    }
  });
}
