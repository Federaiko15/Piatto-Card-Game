import { useEffect, useState } from "react";

// Quanto è largo il bordo lontano del tavolo disegnato, in frazione della larghezza del disegno: è lì che i
// personaggi appoggiano le braccia, quindi decide quanto possono essere grandi. Si misura dai pixel del disegno
// (le righe in alto non trasparenti), così resta giusto anche quando il tavolo viene ridisegnato a mano.

const ARMS_ROW = 0.06; // le braccia poggiano poco sotto il filo del bordo, non sul filo stesso
const cache = new Map<string, number>();

const measure = (img: HTMLImageElement): number | undefined => {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.width || !canvas.height) return undefined;
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const opaque = (x: number, y: number) => data[(y * width + x) * 4 + 3] > 128;
  const rowExtent = (y: number) => {
    let left = -1;
    let right = -1;
    for (let x = 0; x < width; x++) {
      if (!opaque(x, y)) continue;
      if (left < 0) left = x;
      right = x;
    }
    return left < 0 ? 0 : right - left + 1;
  };

  let top = 0;
  while (top < height && rowExtent(top) === 0) top++;
  if (top === height) return undefined;
  return rowExtent(Math.min(height - 1, top + Math.round(height * ARMS_ROW))) / width;
};

export const useTableFarEdge = (url: string | undefined): number | undefined => {
  const [, setMeasured] = useState(0);

  useEffect(() => {
    if (!url || cache.has(url)) return;
    const img = new Image();
    img.onload = () => {
      const edge = measure(img);
      if (edge === undefined) return;
      cache.set(url, edge);
      setMeasured((n) => n + 1);
    };
    img.src = url;
  }, [url]);

  return url ? cache.get(url) : undefined;
};

// Un tavolo dal bordo lontano stretto si ingrandisce oltre i lati della scena (il bordo vicino esce già dallo
// schermo) finché il bordo lontano non ne copre almeno questa parte: così c'è posto per i personaggi
const MIN_FAR_EDGE = 0.74;
export const tableZoom = (farEdge: number) => Math.max(1, MIN_FAR_EDGE / farEdge);
