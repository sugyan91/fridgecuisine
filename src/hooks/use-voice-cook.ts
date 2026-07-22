import { useEffect, useRef, useState, useCallback } from "react";

type Command = "next" | "back" | "repeat" | "start" | "pause" | "reset" | "howlong";

type SR = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSR(): (new () => SR) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

function parse(transcript: string): Command | null {
  const t = transcript.toLowerCase().trim();
  if (/\b(next|next step|continue|forward)\b/.test(t)) return "next";
  if (/\b(back|previous|prev|go back)\b/.test(t)) return "back";
  if (/\b(repeat|again|say that again)\b/.test(t)) return "repeat";
  if (/\b(start(?: timer)?|begin(?: timer)?|go|resume)\b/.test(t)) return "start";
  if (/\b(pause|stop|hold)\b/.test(t)) return "pause";
  if (/\b(reset|restart)\b/.test(t)) return "reset";
  if (/\b(how long|time left|how much time)\b/.test(t)) return "howlong";
  return null;
}

export function useVoiceCook(onCommand: (c: Command) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SR | null>(null);
  const stopFlagRef = useRef(false);

  const start = useCallback(() => {
    const SRCtor = getSR();
    if (!SRCtor) { setSupported(false); return; }
    const rec = new SRCtor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const t = last[0].transcript;
      const cmd = parse(t);
      if (cmd) onCommand(cmd);
    };
    rec.onerror = () => { /* ignore transient errors */ };
    rec.onend = () => {
      if (!stopFlagRef.current) {
        try { rec.start(); } catch { setListening(false); }
      } else {
        setListening(false);
      }
    };
    try {
      stopFlagRef.current = false;
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [onCommand]);

  const stop = useCallback(() => {
    stopFlagRef.current = true;
    try { recRef.current?.stop(); } catch { /* ignore */ }
    recRef.current = null;
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => { stopFlagRef.current = true; recRef.current?.stop(); }, []);

  return { listening, supported, toggle, start, stop };
}