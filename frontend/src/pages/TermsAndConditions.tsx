import { useNavigate } from "react-router-dom";
import authBg from "../assets/auth.png";
import "../styles/Auth.css";

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div
      className="auth-container"
      style={{ backgroundImage: `url(${authBg})`, imageRendering: "pixelated" }}
    >
      <div
        className="auth-box"
        style={{
          width: "100%",
          maxWidth: "800px",
          maxHeight: "85vh",
          overflowY: "auto",
          textAlign: "left",
          boxSizing: "border-box",
        }}
      >
        <h1 className="auth-title">Note Legali ⚖️</h1>

        <section style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#f1c40f" }}>1. Termini e Condizioni</h2>
          <div style={{ fontSize: "0.9rem", color: "#fff" }}>
            <p>Utilizzando Piatto accetti i presenti termini.</p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Account
            </h3>
            <p>
              Ogni utente è responsabile del proprio account e delle credenziali
              di accesso.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Uso consentito
            </h3>
            <p>È severamente vietato:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
              <li>Utilizzare sistemi automatici (bot)</li>
              <li>Tentare accessi non autorizzati</li>
              <li>Alterare il funzionamento del gioco o sfruttare bug</li>
              <li>Manipolare classifiche o statistiche</li>
            </ul>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Valuta virtuale
            </h3>
            <p>La valuta disponibile nel gioco:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
              <li>È puramente virtuale e non rappresenta denaro reale</li>
              <li>Non è convertibile né riscattabile in alcun modo</li>
              <li>Non genera alcun tipo di diritto economico</li>
            </ul>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Disponibilità e Responsabilità
            </h3>
            <p>
              Il servizio può essere modificato, sospeso o interrotto senza
              preavviso. Il gestore non garantisce la continuità assoluta del
              servizio o l'assenza di interruzioni tecniche.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Sospensione
            </h3>
            <p>
              Il gestore si riserva il diritto di sospendere o eliminare account
              in caso di abuso o violazione dei termini.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#f1c40f" }}>2. Privacy Policy</h2>
          <div style={{ fontSize: "0.9rem", color: "#fff" }}>
            <p>Ultimo aggiornamento: 14 maggio 2026</p>
            <p>
              Il presente documento descrive le modalità di raccolta, utilizzo e
              protezione dei dati personali degli utenti.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Titolare del trattamento
            </h3>
            <p>
              Il titolare del trattamento dei dati è:{" "}
              <strong>Federaiko15</strong>. Per comunicazioni relative alla
              privacy, contattare il gestore tramite i canali ufficiali del
              sito.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Dati raccolti
            </h3>
            <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
              <li>Indirizzo email e Username</li>
              <li>Password (esclusivamente in forma cifrata/hash)</li>
              <li>Statistiche di gioco e bilancio virtuale</li>
              <li>Dati tecnici di accesso (log server)</li>
            </ul>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Finalità del trattamento
            </h3>
            <p>
              I dati vengono trattati per l'autenticazione, il salvataggio dei
              progressi, la sicurezza del servizio e la prevenzione di abusi.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Conservazione e Infrastruttura
            </h3>
            <p>I dati sono archiviati in modo sicuro tramite:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
              <li>
                <strong>Database:</strong> MongoDB
              </li>
              <li>
                <strong>Server:</strong> Render
              </li>
              <li>
                <strong>Frontend:</strong> Vercel
              </li>
            </ul>
            <p>
              I dati vengono conservati finché l’account rimane attivo o fino a
              richiesta di cancellazione.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Diritti dell’utente (GDPR)
            </h3>
            <p>
              L'utente può richiedere in ogni momento l'accesso, la modifica o
              la cancellazione definitiva dei propri dati.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#f1c40f" }}>3. Cookie Policy</h2>
          <div style={{ fontSize: "0.9rem", color: "#fff" }}>
            <p>
              Piatto utilizza esclusivamente <strong>cookie tecnici</strong>{" "}
              necessari al funzionamento del servizio.
            </p>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Cookie di Autenticazione
            </h3>
            <p>Utilizzati per:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
              <li>Mantenimento del login</li>
              <li>Rinnovo del token di accesso</li>
              <li>Gestione della sessione utente</li>
            </ul>

            <h3
              style={{
                color: "#f1c40f",
                fontSize: "0.85rem",
                marginTop: "10px",
              }}
            >
              Cosa NON utilizziamo
            </h3>
            <p>Per garantire la massima privacy, non vengono utilizzati:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "10px" }}>
              <li>Cookie pubblicitari o di profilazione</li>
              <li>Cookie di marketing</li>
              <li>Cookie di terze parti per tracciamento</li>
            </ul>
            <p>
              Poiché vengono utilizzati esclusivamente cookie tecnici, non è
              richiesto il consenso preventivo tramite banner, ma l'informativa
              rimane sempre consultabile qui.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: "20px" }}>
          <h2 style={{ color: "#f1c40f" }}>4. Gioco Responsabile</h2>
          <p style={{ fontSize: "0.9rem", color: "#fff" }}>
            Piatto è un simulatore di gioco di carte con valuta virtuale senza
            valore reale. Ricorda che il gioco deve rimanere un divertimento.
          </p>
        </section>

        <button
          onClick={() => navigate("/")}
          className="auth-submit-btn"
          style={{ marginTop: "20px" }}
        >
          Torna al Login
        </button>
      </div>

      <style>{`
        .auth-box::-webkit-scrollbar {
          width: 8px;
        }
        .auth-box::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .auth-box::-webkit-scrollbar-thumb {
          background: #f1c40f;
          border-radius: 4px;
        }
        section h2 {
          font-family: 'Press Start 2P', cursive;
          font-size: 1rem;
          margin-top: 15px;
        }
      `}</style>
    </div>
  );
}
