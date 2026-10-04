import { useEffect, useState } from "react";
import { getSettings, setSettings, type InstanceCredentials } from "../api/greenApi";

export interface ReceiveSettingsState {
  enabled: boolean;
  error: string;
}

// Only incoming text messages are handled, so every other notification kind is
// turned off explicitly instead of relying on the instance defaults.
export const RECEIVE_SETTINGS = {
  webhookUrl: "",
  incomingWebhook: "yes",
  outgoingWebhook: "no",
  outgoingMessageWebhook: "no",
  outgoingAPIMessageWebhook: "no",
  editedMessageWebhook: "no",
  deletedMessageWebhook: "no",
  pollMessageWebhook: "no",
  stateWebhook: "no",
} as const;

const isSet = (value: unknown, expected: "yes" | "no"): boolean => value === expected;

export const isConfigured = (settings: Record<string, unknown>): boolean =>
  !settings.webhookUrl &&
  isSet(settings.incomingWebhook, "yes") &&
  isSet(settings.outgoingWebhook, "no") &&
  isSet(settings.outgoingMessageWebhook, "no") &&
  isSet(settings.outgoingAPIMessageWebhook, "no") &&
  isSet(settings.editedMessageWebhook, "no") &&
  isSet(settings.deletedMessageWebhook, "no") &&
  isSet(settings.pollMessageWebhook, "no") &&
  isSet(settings.stateWebhook, "no");

// getSettings and setSettings allow one request per second, and StrictMode fires effects twice.
const MIN_GAP_MS = 1100;
const lastCallAt = new Map<string, number>();

async function throttle<T>(key: string, action: () => Promise<T>): Promise<T> {
  const wait = MIN_GAP_MS - (Date.now() - (lastCallAt.get(key) ?? 0));
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt.set(key, Date.now());
  return action();
}

export function useReceiveSettings(creds: InstanceCredentials): ReceiveSettingsState {
  const [state, setState] = useState<ReceiveSettingsState>({ enabled: false, error: "" });

  useEffect(() => {
    let stopped = false;

    (async () => {
      try {
        const settings = await throttle(creds.idInstance, () => getSettings(creds));
        if (stopped) return;

        // setSettings restarts the instance and takes up to five minutes to apply.
        if (settings && isConfigured(settings)) {
          setState({ enabled: true, error: "" });
          return;
        }

        const saved = await throttle(creds.idInstance, () => setSettings(creds, RECEIVE_SETTINGS));
        if (stopped) return;
        if (saved?.saveSettings === false) {
          setState({ enabled: false, error: "GREEN-API не сохранил настройки получения" });
          return;
        }
        setState({ enabled: true, error: "" });
      } catch (e) {
        if (stopped) return;
        const reason = e instanceof Error ? e.message : String(e);
        setState({ enabled: false, error: `Не удалось включить получение входящих: ${reason}` });
      }
    })();

    return () => {
      stopped = true;
    };
  }, [creds]);

  return state;
}