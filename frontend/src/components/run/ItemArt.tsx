import type { ConsumableId, SantinoId } from "@piatto/game-core";
import { ITEM_ICONS, itemArt } from "../../art/manifest";

// L'immagine di un santino o consumabile, o la sua icona finché il disegno non c'è
export default function ItemArt({ id, className = "" }: { id: SantinoId | ConsumableId; className?: string }) {
  const art = itemArt(id);
  return (
    <span className={`item-art ${className}`} aria-hidden="true">
      {art ? <img src={art} alt="" /> : ITEM_ICONS[id]}
    </span>
  );
}
