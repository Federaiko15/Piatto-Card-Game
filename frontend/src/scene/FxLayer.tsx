import { useEffect, useRef } from "react";
import coinsImg from "../assets/coins.png";
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

// Gli effetti speciali sopra la scena (monete che volano, scintille, lampi, numeri che salgono).
// Sono elementi usa e getta creati e animati a mano, come farebbe un sistema di particelle,
// così un'animazione non fa mai ridisegnare la pagina React.
export default function FxLayer({ cues, moveId, registry }: FxLayerProps) {
  const layer = useRef<HTMLDivElement>(null);

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
        registry.get(`santino:${cue.id}`)?.animate(
          [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(1.12)", filter: "brightness(1.5)" },
            { transform: "scale(1)", filter: "brightness(1)" },
          ],
          { duration: 700, easing: "ease-out" },
        );
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
        if (!at) continue;
        for (let i = 0; i < BURST_PARTICLES; i++) {
          const spark = spawn(root, `fx-spark fx-spark--${cue.tone}`, at.x, at.y);
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
            { duration: 700 + Math.random() * 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          );
        }
      }
    }

    return () => root.replaceChildren();
  }, [cues, moveId, registry]);

  return <div ref={layer} className="fx-layer" aria-hidden="true" />;
}
