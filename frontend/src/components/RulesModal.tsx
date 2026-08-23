import "../styles/RulesModal.css";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay per chiudere al click esterno */}
      <div className="rules-modal-overlay" onClick={onClose} />

      {/* Contenitore Modale a forma di libro */}
      <div className="rules-modal-wrapper" role="dialog" aria-modal="true">
        <div className="book-page-container">
          {/* Segnalibro decorativo */}
          <div className="book-bookmark" />

          {/* Intestazione del Libro */}
          <div className="book-page-header">
            <div className="book-title-group">
              <span className="book-ornament">✦ ❦ ✦</span>
              <h2 className="book-title">Regolamento di Piatto</h2>
              <p className="book-subtitle">L'antico gioco delle carte siciliane</p>
            </div>
            <button
              type="button"
              className="book-close-btn"
              onClick={onClose}
              aria-label="Chiudi regole"
            >
              ✕
            </button>
          </div>

          <div className="book-divider" />

          {/* Corpo delle Regole */}
          <div className="book-page-content">
            <section className="rule-section">
              <h3 className="rule-section-title">
                <span className="rule-icon">🎯</span> 1. Obiettivo del Gioco
              </h3>
              <p className="rule-text">
                Lo scopo di <strong>Piatto</strong> è vincere le monete accumulate al centro del tavolo (il <em>Piatto</em>). Ogni mano mette alla prova il tuo intuito e la tua gestione del rischio per massimizzare le vincite e proteggere il tuo gruzzolo.
              </p>
            </section>

            <section className="rule-section">
              <h3 className="rule-section-title">
                <span className="rule-icon">🪙</span> 2. Quota Iniziale (Starter Bet)
              </h3>
              <p className="rule-text">
                All'inizio di ogni tavolo, tutti i partecipanti versano la puntata iniziale stabilita (<em>Starter Bet</em>). La somma di tutte le quote forma il <strong>Piatto iniziale</strong> su cui si andrà a giocare.
              </p>
            </section>

            <section className="rule-section">
              <h3 className="rule-section-title">
                <span className="rule-icon">🎲</span> 3. Il Turno e la Puntata
              </h3>
              <p className="rule-text">
                Quando tocca a te, decidi quante monete puntare (<strong>Bet</strong>) prima che il Mazziere estragga la carta dal mazzo.
              </p>
              <div className="rule-callout">
                <strong>⚠️ Limiti della Puntata:</strong>
                <ul>
                  <li>Puntata minima: <strong>1 moneta</strong>.</li>
                  <li>Non puoi puntare più del tuo <strong>saldo disponibile</strong>.</li>
                  <li>Non puoi puntare più di quanto è presente nel <strong>Piatto</strong>.</li>
                </ul>
              </div>
            </section>

            <section className="rule-section">
              <h3 className="rule-section-title">
                <span className="rule-icon">🧠</span> 4. Strategia & Gestione del Rischio
              </h3>
              <p className="rule-text">
                La vera abilità a Piatto sta nel <strong>dosare la puntata</strong>:
              </p>
              <div className="rule-strategy-box">
                <p>
                  💡 <strong>Puntare poco per difendersi:</strong> Se intuisci o ti aspetti che possa uscire una carta sfavorevole, punta il minimo indispensabile (anche solo <strong>1 moneta</strong>) per passare il turno perdendo il meno possibile!
                </p>
                <p>
                  🔥 <strong>Puntare forte per vincere:</strong> Quando senti che è il momento giusto o vuoi svuotare il piatto, alza la puntata o chiama <strong>PIATTO</strong> per tentare il grande colpo!
                </p>
              </div>
            </section>

            <section className="rule-section">
              <h3 className="rule-section-title">
                <span className="rule-icon">🃏</span> 5. La Pescata e l'Esito
              </h3>
              <p className="rule-text">
                Si gioca con un mazzo da <strong>40 carte siciliane</strong> (Coppe, Ori, Spade, Bastoni da 1 a 10). Il valore della carta estratta determina l'esito:
              </p>

              <div className="cards-outcome-grid">
                {/* CARTE BASSE (1 - 5) */}
                <div className="outcome-card loss-card">
                  <div className="outcome-header">
                    <span className="outcome-badge loss-badge">1 - 5: CARTA SFAVOREVOLE</span>
                  </div>
                  <p className="outcome-desc">
                    <strong>Asso, 2, 3, 4, 5</strong>
                  </p>
                  <p className="outcome-effect">
                    ❌ <strong>Perdi la puntata:</strong> l'importo viene detratto dal tuo saldo e versato nel <strong>Piatto</strong>, ingrossando il montepremi per i turni successivi.
                  </p>
                </div>

                {/* CARTE ALTE (6 - 10) */}
                <div className="outcome-card win-card">
                  <div className="outcome-header">
                    <span className="outcome-badge win-badge">6 - 10: CARTA VINCENTE</span>
                  </div>
                  <p className="outcome-desc">
                    <strong>6, 7, Donna (8), Cavallo (9), Re (10)</strong>
                  </p>
                  <p className="outcome-effect">
                    ✨ <strong>Vinci la puntata:</strong> l'importo viene <strong>prelevato dal Piatto</strong> e accreditato direttamente nel tuo saldo!
                  </p>
                </div>
              </div>
            </section>

            <section className="rule-section">
              <h3 className="rule-section-title">
                <span className="rule-icon">🏆</span> 6. Svuotare il Piatto & Rematch
              </h3>
              <ul className="rules-bullets">
                <li>
                  <strong>Vittoria a Piatto Svuotato:</strong> Quando un giocatore azzecca la carta vincente e il Piatto raggiunge <strong>0 monete</strong>, la mano termina e compare la richiesta di <em>Rematch</em> per giocare subito una nuova partita.
                </li>
                <li>
                  <strong>Rimescolamento:</strong> Se il mazzo di carte si esaurisce durante la partita, il Mazziere rimescola istantaneamente tutte le 40 carte.
                </li>
              </ul>
            </section>
          </div>

          <div className="book-divider" />

          {/* Footer del Libro */}
          <div className="book-page-footer">
            <p className="book-quote">
              "La fortuna aiuta gli audaci, ma a Piatto vince chi sa quando rischiare e quando difendersi!"
            </p>
            <button type="button" className="book-action-btn" onClick={onClose}>
              Ho Capito, Andiamo al Tavolo! 🎴
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
