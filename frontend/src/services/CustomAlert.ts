import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { AlertProps } from "../types/index";

const MySwal = withReactContent(Swal);

export default function showSwal(props: AlertProps) {
  if (props.alert === false) {
    if (props.type === "login_register") {
      MySwal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      }).fire({
        icon: "success",
        title: props.title,
      });
    } else if (props.type === "getLobbies") {
      MySwal.mixin({
        toast: true,
        position: "center",
        showConfirmButton: false,
        timer: 1000,
      }).fire({
        icon: "info",
        title: props.title,
      });
    } else if (props.type === "game_alert") {
      MySwal.mixin({
        toast: true,
        position: "center",
        showConfirmButton: true,
      }).fire({
        icon: "warning",
        title: props.title,
      });
    }
  } else if (props.alert === true) {
    // qui è fondamentale il return perchè così ritorno una Promise, che è fondamentale per bloccare React in attesa della risposta
    if (props.type === "leave_lobby") {
      return MySwal.fire({
        title: props.title,
        text: "Non potrai più tornare indietro!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sì, esco dalla lobby",
        cancelButtonText: "Annulla",
      }).then((result) => {
        if (result.isConfirmed) {
          MySwal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
          }).fire({
            icon: "success",
            title: "Sei tornato nella lobby",
          });
        }
        // Ritorna un booleano (true se ha detto sì, false se ha annullato)
        return result.isConfirmed;
      });
    } else if (props.type === "error") {
      return MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: props.title,
      });
    } else if (props.type === "logout") {
      return MySwal.fire({
        title: props.title,
        text: "Non potrai più tornare indietro!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sì, esco dalla lobby",
        cancelButtonText: "Annulla",
      }).then((result) => {
        if (result.isConfirmed) {
          MySwal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
          }).fire({
            icon: "success",
            title: "Ci vediamo presto!",
          });
        }
        // Ritorna un booleano (true se ha detto sì, false se ha annullato)
        return result.isConfirmed;
      });
    } else if (props.type === "rematch") {
      return MySwal.fire({
        title: props.title,
        text: "Se scegli di non rigiocare, uscirai dalla lobby!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Rigioca",
        cancelButtonText: "Esci dalla lobby",
      }).then((result) => {
        if (result.isConfirmed) {
          MySwal.mixin({
            toast: true,
            position: "center",
            showConfirmButton: false,
            timerProgressBar: true,
            timer: 2000,
          }).fire({
            icon: "success",
            title: "In attesa della risposta degli altri giocatori...!",
          });
        }

        return result.isConfirmed;
      });
    } else if (props.type === "piatto") {
      return MySwal.fire({
        title: props.title,
        text: "È una mossa rischiosa, potresti perdere tutto!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745", // Verde per indicare coraggio/azione positiva
        cancelButtonColor: "#d33",
        confirmButtonText: "Sì, chiamo PIATTO!",
        cancelButtonText: "Ci ripenso",
      }).then((result) => {
        if (result.isConfirmed) {
          MySwal.mixin({
            toast: true,
            position: "center",
            showConfirmButton: false,
            timer: 1500,
          }).fire({
            icon: "success",
            title: "PIATTO chiamato! Buona fortuna!",
          });
        }
        return result.isConfirmed;
      });
    }
  }
}
