import {
  MAX_CONSUMABLES,
  MAX_FOODS,
  MAX_SANTINI,
  SANTINI,
  TABLE_MODIFIERS,
  rerollPrice,
  runTables,
  type RunState,
  type ShopItem,
  type TableModifierId,
} from "@piatto/game-core";
import { useState } from "react";
import coinsImg from "../../assets/coins.png";
import { MODIFIER_ICONS } from "../../art/manifest";
import AnimatedNumber from "../../scene/AnimatedNumber";
import ItemArt from "./ItemArt";
import SwapChooser from "./SwapChooser";
import { characterText, useText, type Text } from "../../i18n";

interface RunShopProps {
  run: RunState;
  onBuy: (index: number, replace?: number) => void;
  onReroll: () => void;
  onNextTable: () => void;
}

// nome, effetto ed etichetta di un oggetto in vetrina; tag è anche la classe del colore
const itemInfo = (item: ShopItem, t: Text) =>
  item.kind === "santino"
    ? { ...t.santini[item.id], tag: SANTINI[item.id].rarity, label: t.rarity[SANTINI[item.id].rarity] }
    : item.kind === "food"
      ? { ...t.foods[item.id], tag: "cibo", label: t.tagFood }
      : { ...t.consumables[item.id], tag: "consumabile", label: t.tagConsumable };

// Il motivo per cui un oggetto non si può comprare, o null se si può
const blockedReason = (run: RunState, item: ShopItem, t: Text): string | null => {
  if (item.price >= run.bankroll) return t.shop.noCoins;
  if (item.kind === "santino" && run.santini.length >= MAX_SANTINI && run.swapsLeft <= 0) return t.shop.santiniFull;
  if (item.kind === "consumable" && run.consumables.length >= MAX_CONSUMABLES) return t.shop.pocketFull;
  if (item.kind === "food" && run.foods.length >= MAX_FOODS) return t.shop.basketFull;
  return null;
};

function ModifierLine({ id }: { id: TableModifierId }) {
  const t = useText();
  const { kind } = TABLE_MODIFIERS[id];
  return (
    <li className="rk-modifier-line">
      <span className="rk-modifier-icon" aria-hidden="true">
        {MODIFIER_ICONS[id]}
      </span>
      <span>
        <span className={`ui-tag ui-tag--${kind}`}>{t.modifierKinds[kind]}</span> <strong>{t.modifiers[id].name}</strong>
        : {t.modifiers[id].effect}
      </span>
    </li>
  );
}

// La bottega tra un tavolo e l'altro: ogni acquisto rafforza la build ma lascia meno monete per il prossimo tavolo
export default function RunShop({ run, onBuy, onReroll, onNextTable }: RunShopProps) {
  const t = useText();
  const shop = run.shop!;
  const next = runTables(run)[run.tableIndex + 1];
  const reroll = rerollPrice(shop);
  const nextModifiers = [...(next.modifiers ?? []), ...(run.nextEvent ? [run.nextEvent] : [])];
  // l'offerta per cui l'eroe sta scegliendo quale santino lasciare
  const [swapping, setSwapping] = useState<number | null>(null);
  const swapItem = swapping === null ? null : shop.offers[swapping];

  return (
    <div className="rk-shop-screen">
      <header className="rk-shop-header">
        <div>
          <p className="ui-label">{t.shop.between}</p>
          <h1 className="ui-title rk-shop-title">{t.shop.title}</h1>
        </div>
        <p className="rk-shop-purse ui-panel">
          <span className="ui-label">{t.shop.purse}</span>
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
                <span>{t.shop.sold}</span>
              </li>
            );
          }
          const info = itemInfo(item, t);
          const blocked = blockedReason(run, item, t);
          const swap = item.kind === "santino" && run.santini.length >= MAX_SANTINI;
          return (
            <li key={`${index}-${item.id}`} className={`rk-offer ui-paper ui-pop rk-offer--${info.tag}`} style={{ animationDelay: `${index * 80}ms` }}>
              <span className="rk-offer-art">
                <ItemArt id={item.id} />
              </span>
              <span className={`ui-tag ui-tag--${info.tag}`}>{info.label}</span>
              <span className="rk-offer-name">{info.name}</span>
              <span className="rk-offer-effect">{info.effect}</span>
              <button
                type="button"
                className="ui-btn ui-btn--gold rk-offer-buy"
                disabled={blocked !== null}
                onClick={() => (swap ? setSwapping(index) : onBuy(index))}
                title={swap ? t.shop.swapTitle(run.swapsLeft) : undefined}
              >
                {blocked ?? (
                  <span className="ui-coins rk-offer-price">
                    {swap ? t.shop.swap : t.shop.buy} · <img src={coinsImg} alt="" />
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
          <p className="ui-label">{t.shop.next}</p>
          <h2 id="rk-next-title" className="rk-next-name">
            {next.boss && "👑 "}
            {t.tables[next.id]}
          </h2>
          <p className="rk-next-detail">
            {t.shop.tableDetail(
              next.ante,
              next.quota,
              next.opponents.map((o) => characterText(t, o.character).name).join(", "),
            )}
          </p>
          {nextModifiers.length > 0 ? (
            <ul className="rk-modifier-list">
              {nextModifiers.map((id) => (
                <ModifierLine key={id} id={id} />
              ))}
            </ul>
          ) : (
            <p className="rk-next-detail">{t.shop.quiet}</p>
          )}
          {run.bankroll < next.quota && (
            <p className="rk-shop-warning">
              {t.shop.belowQuota(next.quota - run.bankroll)}
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
            {t.shop.reroll}
            <span className="ui-btn-detail">{t.shop.rerollPrice(reroll)}</span>
          </button>
          <button type="button" className="ui-btn ui-btn--gold" onClick={onNextTable}>
            {t.shop.sit}
            <span className="ui-btn-detail">
              {t.shop.sitDetail(
                run.santini.length,
                MAX_SANTINI,
                run.swapsLeft,
                run.consumables.length,
                MAX_CONSUMABLES,
                run.foods.length,
                MAX_FOODS,
              )}
            </span>
          </button>
        </div>
      </div>

      {swapItem?.kind === "santino" && (
        <SwapChooser
          run={run}
          incoming={swapItem.id}
          onPick={(replace) => {
            onBuy(swapping!, replace);
            setSwapping(null);
          }}
          onCancel={() => setSwapping(null)}
        />
      )}
    </div>
  );
}
