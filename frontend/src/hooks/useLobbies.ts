// custom hook per la pagina generale nel quale ho inserito tutte le funzioni, gli stati e gli useEffect necessari per la gestione
// delle lobby

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type {
  Lobby,
  NewLobbyData,
  FetchLobbiesResponse,
  CreateLobbyResponse,
  UserProfile,
  GetUserInformationsResponse,
} from "../types";
import { fetchWithAuth } from "../services/fetchWithAuth";
import showSwal from "../services/CustomAlert";
import getIdFromToken from "../services/utilities";

export function useLobbies() {
  const [lobbiesList, setLobbiesList] = useState<Lobby[]>([]); // stato per ricevere la lista delle lobby dal DB
  const [isLoading, setIsLoading] = useState<boolean>(false); // stato per bloccare i bottoni e aspettare la risposta del server
  const [viewProfile, setViewProfile] = useState<boolean>(false); // stato per la pagina laterare per visualizzare il profilo
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // lo stato per le variabili che contengono le info dello user
  const [newLobby, setNewLobby] = useState<NewLobbyData>({
    // e le variabili mandate dallo user al momento della creazione della lobby
    lobbyname: "",
    starterBet: 0,
    numPlayers: 0,
  });

  const navigate = useNavigate();
  const location = useLocation();

  const fetchLobbies = async (
    isInitialLoad: boolean = false, // questa è una variabile che utilizzo per capire se l'utente è appena arrivato dal login o meno
    searchStatus: string,
    searchStarterBet: number,
  ) => {
    setIsLoading(true);
    setLobbiesList([]); // Svuoto la lista per mostrare lo stato di caricamento

    try {
      // definisco solo il body e il metodo della fetch, perchè l'headers sarà riempito direttamente dalla funzione fetchWIthAuth
      const options = {
        method: "POST",
        body: JSON.stringify({
          searchStatus: searchStatus,
          searchStarterBet: searchStarterBet,
        }),
      };

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/lobbies/getLobbies`,
        options,
      );

      if (!response.ok) {
        console.error(
          "Errore nella risposta del server dopo la chiamata a getLobbies",
        );
        if (response.status === 401) return; // questo è il caso in cui anche il refresh token è scaduto

        if (!isInitialLoad) {
          showSwal({
            type: "getLobbies",
            title: "Nessuna lobby disponibile è stata trovata, creane una tu!",
            alert: false,
          });
        }
        return; // La lista è già vuota, il finally gestirà il loading
      }
      const data = (await response.json()) as FetchLobbiesResponse;
      // Salviamo sia il caso in cui arrivino le freeLobbies di default, sia le filteredLobbies della ricerca
      setLobbiesList(data.filteredLobbies || data.allFreeLobbies || []);
    } catch (error) {
      console.error("Errore di rete:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    // stessa logica della fetch precedente, in questo caso però mi serve l'id dell'utente che prendo grazie alla funzione getIdFromToken
    try {
      const playerId = getIdFromToken();
      if (!playerId) return;

      const options = {
        method: "GET",
      };

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/users/profile/${playerId}`,
        options,
      );

      if (response.ok) {
        const data = (await response.json()) as GetUserInformationsResponse;
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error("Server Error nella richiesta del profilo utente:", error);
    }
  };

  useEffect(() => {
    // questo useEffect si attiva una volta qunado renderizziamo questa pagina, e controlla se l'utente è appena arrivato dal login o
    // da una partita
    const justLoggedIn = location.state?.justLoggedIn;

    if (justLoggedIn) {
      showSwal({
        type: "login_register",
        title: "Login effettuato con successo!",
        alert: false,
      });
      fetchLobbies(true, "free", -1);
    }

    fetchUserProfile(); // ogni volta che arrivo nella pagine prendo le informazione dell'utente che magari nel frattempo sono cambiate
    // come il saldo se si viene da una partita appena terminata
    window.history.replaceState({}, document.title);
  }, []);

  const fetchCreateLobby = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      console.log("Creazione la lobby...");
      const options = {
        method: "POST",
        body: JSON.stringify(newLobby),
      };

      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/api/v1/lobbies/create`,
        options,
      );

      const data = (await response.json()) as CreateLobbyResponse;
      if (response.ok) {
        // se la lobby è stata creata con successo, prendo l'id della lobby e navigo nella sua pagina
        const createdLobbyId = data.lobby._id;
        navigate(`/game/${createdLobbyId}`);
      } else {
        if (response.status === 401) return;
        showSwal({
          type: "error",
          title: data.message,
          alert: true,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      const confirmed = await showSwal({
        type: "logout",
        title: "Sei sicuro di uscire da Piatto?",
        alert: true,
      });
      if (confirmed) {
        const options = {
          method: "POST",
        };
        await fetchWithAuth(
          `${import.meta.env.VITE_API_URL}/api/v1/users/profile/${getIdFromToken()}`,
          options,
        );
        localStorage.removeItem("tokenPiatto");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    lobbiesList,
    isLoading,
    viewProfile,
    setViewProfile,
    userProfile,
    newLobby,
    setNewLobby,
    fetchLobbies,
    fetchCreateLobby,
    handleLogout,
  };
}
