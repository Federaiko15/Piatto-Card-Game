import { useEffect, useRef } from "react";
import { SANTINI, type SantinoId } from "@piatto/game-core";
import coinsImg from "../assets/coins.png";
import { ITEM_ICONS, itemArt } from "../art/manifest";
import { useText } from "../i18n";
import { playSfx } from "../audio/sfx";
import type { AnchorRegistry } from "./anchors";
import type { SceneCue } from "./cues";
import "./fx.css";

interface FxLayerProps {
  cues: SceneCue[];
  moveId: number; // cambia a ogni mossa: le indicazioni di regia vengono eseguite una volta sola
  registry: AnchorRegistry;
}

const MAX_COINS = 10;
const BURST_PARTICLES = 14;
// quanto resta in scena un santino che si attiva: entra, si fa guardare, torna al suo posto
const SANTINO_DURATION = 1700;
const SANTINO_RETURN = 0.82; // la frazione della durata in cui comincia a tornare nel pannello

const centerOf = (registry: AnchorRegistry, anchor: string) => {
  const el = registry.get(anchor);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, top: r.top };
};

const spawn = (root: HTMLElement, className: string, x: number, y: number) => {
  const el = document.createElement("div");
  el.className = className;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  root.appendChild(el);
  return el;
};

// Il santino ingrandito al centro della scena, come una figurina tenuta in mano: illustrazione e nome
const santinoCard = (root: HTMLElement, id: SantinoId, label: string, x: number, y: number) => {
  const card = spawn(root, `fx-santino fx-santino--${SANTINI[id].rarity}`, x, y);
  const art = itemArt(id);
  const figure = document.createElement("span");
  figure.className = "fx-santino-art";
  if (art) {
    const img = document.createElement("img");
    img.src = art;
    img.alt = "";
    figure.appendChild(img);
  } else {
    figure.textContent = ITEM_ICONS[id];
  }
  const name = document.createElement("span");
  name.className = "fx-santino-name";
  name.textContent = label;
  card.append(figure, name);
  return card;
};

// Gli effetti speciali sopra la scena (monete che volano, scintille, lampi, numeri che salgono).
// Sono elementi usa e getta creati e animati a mano, come farebbe un sistema di particelle,
// così un'animazione non fa mai ridisegnare la pagina React.
export default function FxLayer({ cues, moveId, registry }: FxLayerProps) {
  const layer = useRef<HTMLDivElement>(null);
  const t = useText();

  useEffect(() => {
    const root = layer.current;
    if (!root || cues.length === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = el.animate(keyframes, { fill: "both", ...options });
      animation.onfinish = () => {
        if (el.parentElement === root) el.remove();
      };
    };

    // scintille che si allargano da un punto (delay: per farle partire quando arriva un santino)
    const sparks = (root: HTMLElement, x: number, y: number, tone: string, delay = 0) => {
      for (let i = 0; i < BURST_PARTICLES; i++) {
        const spark = spawn(root, `fx-spark fx-spark--${tone}`, x, y);
        if (delay) spark.style.opacity = "0"; // invisibili finché non partono
        const angle = (i / BURST_PARTICLES) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 50 + Math.random() * 50;
        animate(
          spark,
          [
            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
            {
              transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0.2)`,
              opacity: 0,
            },
          ],
          { duration: 700 + Math.random() * 300, delay, fill: "forwards", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
    };

    for (const cue of cues) {
      if (cue.kind === "sfx") {
        playSfx(cue.name);
        continue;
      }
      if (cue.kind === "shake") {
        if (!reduced) {
          registry.get("scene")?.animate(
            [
              { transform: "translate(0, 0)" },
              { transform: "translate(-6px, 2px)" },
              { transform: "translate(5px, -3px)" },
              { transform: "translate(-3px, 2px)" },
              { transform: "translate(0, 0)" },
            ],
            { duration: 380, easing: "ease-out" },
          );
        }
        continue;
      }
      if (cue.kind === "santino") {
        const slot = registry.get(`santino:${cue.id}`);
        const major = cue.size === "major";
        // il posto nel pannello si accende quando il santino ci torna (subito, per quelli minori)
        slot?.animate(
          [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(1.12)", filter: "brightness(1.5)" },
            { transform: "scale(1)", filter: "brightness(1)" },
          ],
          { duration: 700, delay: major && !reduced ? SANTINO_DURATION * SANTINO_RETURN : 0, easing: "ease-out" },
        );

        const from = centerOf(registry, `santino:${cue.id}`);
        if (!major) {
          // i santini frequenti non fermano il gioco: la vincita sale dal pannello
          if (from && cue.amount) {
            const float = spawn(root, "fx-float fx-float--gold fx-float--small", from.x, from.top);
            float.textContent = `+${cue.amount}`;
            animate(
              float,
              [
                { transform: "translate(-50%, 0) scale(0.6)", opacity: 0 },
                { transform: "translate(-50%, -14px) scale(1.1)", opacity: 1, offset: 0.2 },
                { transform: "translate(-50%, -34px) scale(1)", opacity: 0 },
              ],
              { duration: 1100, easing: "ease-out" },
            );
          }
          continue;
        }

        // quelli che cambiano il colpo entrano in scena: partono dal pannello, si fermano al centro, ci tornano
        const stage = registry.get("scene")?.getBoundingClientRect();
        const x = stage ? stage.left + stage.width / 2 : window.innerWidth / 2;
        const y = stage ? stage.top + stage.height * 0.42 : window.innerHeight / 2;
        const dx = from ? from.x - x : 0;
        const dy = from ? from.y - y : 0;
        // la scena si fa scura intorno e resta la luce di una candela dietro al santino
        const halo = spawn(root, `fx-santino-halo fx-santino-halo--${SANTINI[cue.id].rarity}`, 0, 0);
        halo.style.setProperty("--x", `${x}px`);
        halo.style.setProperty("--y", `${y}px`);
        const card = santinoCard(root, cue.id, t.santini[cue.id].name, x, y);
        const away = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.25) rotate(0deg)`;
        const held = (tilt: number, scale = 1) => `translate(-50%, -50%) scale(${scale}) rotate(${tilt}deg)`;
        const hold = SANTINO_RETURN - 0.04;
        // l'andatura va su ogni tratto: entra di slancio, torna accelerando (un easing nelle opzioni
        // deformerebbe tutta la sequenza e la pausa al centro durerebbe un attimo)
        const enter = "cubic-bezier(0.33, 1, 0.68, 1)";
        const leave = "cubic-bezier(0.32, 0, 0.67, 0)";

        if (reduced) {
          animate(card, [{ opacity: 0, transform: held(0) }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.8 }, { opacity: 0, transform: held(0) }], {
            duration: SANTINO_DURATION,
          });
          animate(halo, [{ opacity: 0 }, { opacity: 0.8, offset: 0.15 }, { opacity: 0 }], { duration: SANTINO_DURATION });
          continue;
        }

        animate(
          card,
          cue.spent
            ? [
                // il corno fa il suo dovere, si spegne e torna grigio nel pannello
                { transform: away, opacity: 0, filter: "none", easing: enter },
                { transform: held(-4, 1.12), opacity: 1, filter: "none", offset: 0.16 },
                { transform: held(-3), opacity: 1, filter: "none", offset: 0.26 },
                { transform: held(-3), opacity: 1, filter: "none", offset: 0.5 },
                { transform: held(2), opacity: 1, filter: "grayscale(0.7) brightness(0.8)", offset: 0.54 },
                { transform: held(-5), opacity: 1, offset: 0.58 },
                { transform: held(-2), opacity: 1, filter: "grayscale(0.85) brightness(0.7)", offset: hold, easing: leave },
                { transform: away, opacity: 0.3, filter: "grayscale(0.85) brightness(0.7)" },
              ]
            : [
                { transform: away, opacity: 0, easing: enter },
                { transform: held(-4, 1.12), opacity: 1, offset: 0.16 },
                { transform: held(-3), opacity: 1, offset: 0.26 },
                { transform: held(-2), opacity: 1, offset: hold, easing: leave },
                { transform: away, opacity: 0.3 },
              ],
          { duration: SANTINO_DURATION },
        );
        animate(
          halo,
          [
            { opacity: 0, easing: enter },
            { opacity: 1, offset: 0.16 },
            { opacity: cue.spent ? 0.6 : 1, offset: hold, easing: leave },
            { opacity: 0 },
          ],
          { duration: SANTINO_DURATION },
        );
        sparks(root, x, y, "gold", 120);
        continue;
      }
      if (cue.kind === "flash") {
        const flash = spawn(root, `fx-flash fx-flash--${cue.tone}`, 0, 0);
        animate(flash, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], {
          duration: reduced ? 300 : 650,
        });
        continue;
      }
      if (cue.kind === "float") {
        const at = centerOf(registry, cue.at);
        if (!at) continue;
        const float = spawn(root, `fx-float fx-float--${cue.tone}`, at.x, at.top);
        float.textContent = cue.text;
        animate(
          float,
          [
            { transform: "translate(-50%, 0) scale(0.6)", opacity: 0 },
            { transform: "translate(-50%, -18px) scale(1.15)", opacity: 1, offset: 0.2 },
            { transform: "translate(-50%, -46px) scale(1)", opacity: 0 },
          ],
          { duration: 1400, easing: "ease-out" },
        );
        continue;
      }
      if (reduced) continue;

      if (cue.kind === "coins") {
        const from = centerOf(registry, cue.from);
        const to = centerOf(registry, cue.to);
        if (!from || !to) continue;
        const count = Math.min(MAX_COINS, Math.max(1, Math.ceil(cue.amount / 3)));
        for (let i = 0; i < count; i++) {
          const coin = spawn(root, "fx-coin", from.x, from.y);
          coin.style.backgroundImage = `url(${coinsImg})`;
          const dx = to.x - from.x + (Math.random() - 0.5) * 24;
          const dy = to.y - from.y + (Math.random() - 0.5) * 16;
          const lift = -40 - Math.random() * 40;
          animate(
            coin,
            [
              { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
              { transform: `translate(calc(-50% + ${dx / 2}px), calc(-50% + ${dy / 2 + lift}px)) scale(1.15)`, opacity: 1, offset: 0.5 },
              { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.8)`, opacity: 0.2 },
            ],
            { duration: 700, delay: i * 45, easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
          );
        }
        continue;
      }

      if (cue.kind === "burst") {
        const at = centerOf(registry, cue.at);
        if (at) sparks(root, at.x, at.y, cue.tone);
      }
    }

    return () => root.replaceChildren();
  }, [cues, moveId, registry, t]);

  return <div ref={layer} className="fx-layer" aria-hidden="true" />;
}
