import { createContext, useCallback, useContext, useState } from "react";

// I punti della scena da cui partono e a cui arrivano le animazioni (posti dei giocatori, piatto, scena).
// I componenti si registrano con useAnchor; gli effetti leggono la posizione al momento di animare.

export type AnchorRegistry = Map<string, HTMLElement>;

export const AnchorContext = createContext<AnchorRegistry | null>(null);

export const useAnchorRegistry = (): AnchorRegistry => {
  const [registry] = useState<AnchorRegistry>(() => new Map());
  return registry;
};

export const useAnchor = (id: string) => {
  const registry = useContext(AnchorContext);
  return useCallback(
    (el: HTMLElement | null) => {
      if (!registry) return;
      if (el) registry.set(id, el);
      else registry.delete(id);
    },
    [registry, id],
  );
};
