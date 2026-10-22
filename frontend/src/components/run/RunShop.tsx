import {
  CONSUMABLES,
  MAX_CONSUMABLES,
  MAX_SANTINI,
  RUN_TABLES,
  SANTINI,
  TABLE_MODIFIERS,
  rerollPrice,
  type RunState,
  type ShopItem,
  type TableModifierId,
} from "@piatto/game-core";
import coinsImg from "../../assets/coins.png";
import { MODIFIER_ICONS } from "../../art/manifest";
import AnimatedNumber from "../../scene/AnimatedNumber";
import ItemArt from "./ItemArt";

interface RunShopProps {
  run: RunState;
  onBuy: (index: number) => void;
  onReroll: () => void;
  onNextTable: () => void;
}

const itemInfo = (item: ShopItem) =>
  item.kind === "santino"
    ? { ...SANTINI[item.id], tag: SANTINI[item.id].rarity }
    : { ...CONSUMABLES[item.id], tag: "consumabile" };

// Il motivo per cui un oggetto non si può comprare, o null se si può
const blockedReason = (run: RunState, item: ShopItem): string | null => {
  if (item.price >= run.bankroll) return "Monete insufficienti";
  if (item.kind === "santino" && run.santini.length >= MAX_SANTINI) return "Santini al completo";
  if (item.kind === "consumable" && run.consumables.length >= MAX_CONSUMABLES) return "Tasche piene";
  return null;
};

function ModifierLine({ id }: { id: TableModifierId }) {
  const info = TABLE_MODIFIERS[id];
  return (
    <li className="rk-modifier-line">
      <span className="rk-modifier-icon" aria-hidden="true">
        {MODIFIER_ICONS[id]}
      </span>
      <span>
        <span className={`ui-tag ui-tag--${info.kind}`}>{info.kind}</span> <strong>{info.name}</strong>
        : {info.effect}
      </span>
    </li>
  );
}

// La bottega tra un tavolo e l'altro: ogni acquisto rafforza la build ma lascia meno monete per il prossimo tavolo
export default function RunShop({ run, onBuy, onReroll, onNextTable }: RunShopProps) {
  const shop = run.shop!;
  const next = RUN_TABLES[run.tableIndex + 1];
  const reroll = rerollPrice(shop);
  const nextModifiers = [...(next.modifiers ?? []), ...(run.nextEvent ? [run.nextEvent] : [])];

  return (
    <div className="rk-shop-screen">
      <header className="rk-shop-header">
        <div>
          <p className="ui-label">Tra un tavolo e l'altro</p>
          <h1 className="ui-title rk-shop-title">La bottega</h1>
        </div>
        <p className="rk-shop-purse ui-panel">
          <span className="ui-label">Le tue monete</span>
          <span className="ui-coins rk-shop-coins">
            <img src={coinsImg} alt="" />
            <AnimatedNumber value={run.bankroll} />
          </span>
        </p>
      </header>

      <ul className="rk-offers">
        {shop.offers.map((item, index) => {
          if (!item) {
            return (
              <li key={index} className="rk-offer rk-offer--sold">
                <span>Venduto</span>
              </li>
            );
          }
          const info = itemInfo(item);
          const blocked = blockedReason(run, item);
          return (
            <li key={`${index}-${item.id}`} className={`rk-offer ui-paper ui-pop rk-offer--${info.tag}`} style={{ animationDelay: `${index * 80}ms` }}>
              <span className="rk-offer-art">
                <ItemArt id={item.id} />
              </span>
              <span className={`ui-tag ui-tag--${info.tag}`}>{info.tag}</span>
              <span className="rk-offer-name">{info.name}</span>
              <span className="rk-offer-effect">{info.effect}</span>
              <button
                type="button"
                className="ui-btn ui-btn--gold rk-offer-buy"
                disabled={blocked !== null}
                onClick={() => onBuy(index)}
              >
                {blocked ?? (
                  <span className="ui-coins rk-offer-price">
                    Compra · <img src={coinsImg} alt="" />
                    {item.price}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="rk-shop-bottom">
        <section className="ui-panel rk-next" aria-labelledby="rk-next-title">
          <p className="ui-label">Prossimo tavolo</p>
          <h2 id="rk-next-title" className="rk-next-name">
            {next.boss && "👑 "}
            {next.name}
          </h2>
          <p className="rk-next-detail">
            Posta {next.ante} · Quota {next.quota} · Al tavolo: {next.opponents.map((o) => o.name).join(", ")}
          </p>
          {nextModifiers.length > 0 ? (
            <ul className="rk-modifier-list">
              {nextModifiers.map((id) => (
                <ModifierLine key={id} id={id} />
              ))}
            </ul>
          ) : (
            <p className="rk-next-detail">Stanotte questo tavolo è tranquillo.</p>
          )}
          {run.bankroll < next.quota && (
            <p className="rk-shop-warning">
              Ti siedi sotto la quota: dovrai vincere almeno {next.quota - run.bankroll} monete.
            </p>
          )}
        </section>

        <div className="rk-shop-actions">
          <button
            type="button"
            className="ui-btn ui-btn--wood"
            disabled={reroll >= run.bankroll}
            onClick={onReroll}
          >
            Rimescola la vetrina
            <span className="ui-btn-detail">{reroll} monete</span>
          </button>
          <button type="button" className="ui-btn ui-btn--gold" onClick={onNextTable}>
            Siediti al tavolo
            <span className="ui-btn-detail">
              Santini {run.santini.length}/{MAX_SANTINI} · In tasca {run.consumables.length}/{MAX_CONSUMABLES}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
