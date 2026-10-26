import { ITEM_ICONS, itemArt, type ItemId } from "../../art/manifest";

// L'immagine di un santino, consumabile o cibo, o la sua icona finché il disegno non c'è
export default function ItemArt({ id, className = "" }: { id: ItemId; className?: string }) {
  const art = itemArt(id);
  return (
    <span className={`item-art ${className}`} aria-hidden="true">
      {art ? <img src={art} alt="" /> : ITEM_ICONS[id]}
    </span>
  );
}
