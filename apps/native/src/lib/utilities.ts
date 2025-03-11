import { AudioContext } from "../../AudioContext";

export function msToTime(duration: number) {
  const seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  // var h = (hours < 10) ? "0" + hours : hours;
  const h = hours;
  const m = minutes < 10 ? "0" + minutes : minutes;
  const s = seconds < 10 ? "0" + seconds : seconds;
  // const ms = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

  return h + ":" + m + ":" + s; //+ "." + ms;
}

export function timeToMs(positionString: string) {
  const h = Number(positionString.slice(0, -6));
  const m = Number(positionString.slice(-5, -3));
  const s = Number(positionString.slice(-2));

  const newPosition = h * 1000 * 60 * 60 + m * 1000 * 60 + s * 1000;
  return newPosition;
}
