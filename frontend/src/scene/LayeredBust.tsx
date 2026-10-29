import { useEffect, useRef, useState } from "react";
import { Application, Assets, Container, Sprite, type Texture } from "pixi.js";
import { BREATH_SECONDS, characterLayers, type CharacterLayers, type Expression } from "../art/manifest";

interface LayeredBustProps {
  character: string;
  expression: Expression;
}

const EXPRESSIONS: Expression[] = ["neutral", "happy", "sad", "suspicious"];
const SIZE = 80; // la tela dei mezzobusti

// Di quanto si alzano busto e testa quando inspira, in pixel del disegno
const BREATH_PIXELS = 1;
// La contentezza: due saltelli di tutto il personaggio alti 2 pixel, ognuno lungo così
const HOP_SECONDS = 0.14;
// Quando cambia espressione il respiro si ferma per questo tempo (che copre anche i saltelli), poi riparte da fermo
const REACTION_SECONDS = 0.7;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Inspira per metà del respiro, espira per l'altra metà
const inhaling = (seconds: number, period: number) => (((seconds % period) + period) % period) / period < 0.5;

// Il mezzobusto a livelli disegnato con PixiJS. Si muove a scatti di pixel interi del disegno, come un'animazione
// in pixel art fatta a mano. Le braccia restano ferme sul tavolo, busto e testa respirano insieme;
// l'espressione cambia la testa e la posa, e mentre cambia il respiro si ferma
export default function LayeredBust({ character, expression }: LayeredBustProps) {
  const host = useRef<HTMLSpanElement>(null);
  const current = useRef({ expression, since: -Infinity }); // since: quando è cambiata, per le reazioni
  const [failed, setFailed] = useState(false);

  // il ticker legge l'espressione da qui, così cambiarla non ricrea la scena
  useEffect(() => {
    if (current.current.expression !== expression) current.current = { expression, since: performance.now() };
  }, [expression]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const heads = Object.fromEntries(
      EXPRESSIONS.map((e) => [e, characterLayers(character, e)]).filter(([, layers]) => layers),
    ) as Partial<Record<Expression, CharacterLayers>>;
    const neutral = heads.neutral;
    if (!neutral) return;

    const app = new Application();
    let ready = false;
    let destroyed = false;

    const start = async () => {
      await app.init({
        resizeTo: element,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        backgroundAlpha: 0,
        antialias: false,
      });
      const urls = [
        neutral.braccia,
        neutral.busto,
        ...(neutral.bustoInspira ? [neutral.bustoInspira] : []),
        ...Object.values(heads).flatMap((layers) => (layers?.testa ? [layers.testa] : [])),
      ];
      const textures: Record<string, Texture> = await Assets.load(urls);
      for (const texture of Object.values(textures)) texture.source.scaleMode = "nearest";
      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }
      ready = true;
      app.canvas.className = "portrait-art portrait-canvas";
      element.appendChild(app.canvas);

      // dal basso: la testa sta sotto il busto, così il colletto copre il collo; le braccia stanno sopra a tutto
      const figure = new Container();
      // senza testa a parte (l'incappucciato) la testa è già nel busto
      const testa = neutral.testa ? new Sprite(textures[neutral.testa]) : null;
      const busto = new Sprite(textures[neutral.busto]);
      const braccia = new Sprite(textures[neutral.braccia]);
      if (testa) figure.addChild(testa);
      figure.addChild(busto, braccia);
      app.stage.addChild(figure);

      const still = reducedMotion();
      const period = BREATH_SECONDS[character] ?? 3.6;
      const offset = Math.random() * period; // così al tavolo non respirano tutti insieme
      app.ticker.add(() => {
        // la tela 80×80 occupa tutto il riquadro, appoggiata in basso come l'immagine che sostituisce
        const scale = Math.min(app.screen.width, app.screen.height) / SIZE;
        figure.scale.set(scale);
        const left = (app.screen.width - SIZE * scale) / 2;
        const top = app.screen.height - SIZE * scale;

        const now = performance.now();
        const { expression: shown, since } = current.current;
        const head = (heads[shown] ?? neutral).testa;
        if (testa && head) testa.texture = textures[head];

        // chi è giù di morale respira più in fretta. Durante una reazione il respiro è fermo, così i movimenti non si
        // sommano; quando riprende comincia da mezzo respiro, cioè da espirato, per non scattare subito in su
        const reaction = (now - since) / 1000;
        const breath = shown === "sad" ? period * 0.6 : period;
        const breathing =
          reaction < REACTION_SECONDS
            ? false
            : inhaling(since === -Infinity ? now / 1000 + offset : reaction - REACTION_SECONDS + breath / 2, breath);
        const rise = !still && breathing ? -BREATH_PIXELS : 0;

        // contento: due saltelli appena cambia espressione
        const hop =
          !still && shown === "happy" && reaction < HOP_SECONDS * 4 && Math.floor(reaction / HOP_SECONDS) % 2 === 0
            ? -2
            : 0;

        // il saltello muove tutto il personaggio, braccia comprese, così non si scopre niente sotto le braccia
        figure.position.set(left, top + hop * scale);
        // con il busto disegnato mentre inspira cambia il disegno, altrimenti si alza tutto il busto;
        // la testa sale sempre insieme alle spalle
        if (neutral.bustoInspira) {
          busto.texture = textures[rise ? neutral.bustoInspira : neutral.busto];
        } else {
          busto.y = rise;
        }
        // deluso: la testa si abbassa
        if (testa) testa.y = rise + (shown === "sad" ? 1 : 0);
      });
    };

    start().catch(() => {
      if (!destroyed) setFailed(true);
    });

    return () => {
      destroyed = true;
      if (ready) app.destroy(true, { children: true });
    };
  }, [character]);

  // senza WebGL i livelli restano uno sopra l'altro, fermi
  if (failed) {
    const layers = characterLayers(character, expression);
    return layers ? (
      <span className="portrait-layers">
        {[layers.testa, layers.busto, layers.braccia].flatMap((src) => (src ? [src] : [])).map((src) => (
          <img key={src} src={src} alt="" className="portrait-art" />
        ))}
      </span>
    ) : null;
  }

  return <span ref={host} className="portrait-layers" />;
}
