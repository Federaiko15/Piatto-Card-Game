class NotificationManager {
  permission: NotificationPermission;

  constructor() {
    this.permission =
      "Notification" in window ? Notification.permission : "denied";
  }

  // questa funzione sarà chiamata appena verrà caricata la pagina iniziale del gioco
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Notifiche non supportate da questo browser");
      return false;
    }
    if (this.permission === "granted") {
      return true;
    }
    this.permission = await Notification.requestPermission();
    return this.permission === "granted";
  }

  // funzione che serve per mandare notifiche "generali", in base a quello che passiamo noi come parametri
  send(title: string, options: NotificationOptions = {}): Notification | null {
    if (Notification.permission !== "granted") return null;

    try {
      const notif = new Notification(title, {
        // si potrebbero aggiungere le icone per mobile e per web
        ...options,
      });

      notif.onclick = () => {
        window.focus(); // riporta il giocatore sulla tab
        notif.close();
      };

      return notif;
    } catch (error) {
      console.warn(
        "Il browser ha impedito la notifica. (Nota: Su smartphone richiederebbe un Service Worker):",
        error,
      );
      return null;
    }
  }

  notifyGameTurn(heroName: string): Notification | null {
    return this.send(`È il tuo turno ${heroName}`, {
      body: `Fai la tua mossa prima che scada il tempo.`,
      tag: "turno", // avendo ogni notifica un suo tag sostituisco quelle vecchie così da non creare sempre di nuove
      requireInteraction: false, // in questo caso si chiuderà da sola, senza che l'utente clicchi
    });
  }

  notifyTimer(): Notification | null {
    return this.send("Tempo scaduto!", {
      body: "Il tuo turno è stato saltato.",
      tag: "timer",
    });
  }
}

export const notificationManager = new NotificationManager();
