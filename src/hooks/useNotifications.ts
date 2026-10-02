import { useEffect, useRef, useState } from "react";
import {
  deleteNotification,
  receiveNotification,
  type InstanceCredentials,
  type NotificationBody,
} from "../api/greenApi";

const RETRY_MS = 3000;

export function useNotifications(
  creds: InstanceCredentials,
  onNotification: (body: NotificationBody) => void,
  enabled: boolean,
): string {
  const [error, setError] = useState("");
  const handlerRef = useRef(onNotification);

  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;

    (async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(creds);
          if (stopped) break;
          if (notification?.receiptId) {
            handlerRef.current(notification.body);
            await deleteNotification(creds, notification.receiptId);
          }
        } catch (e) {
          if (stopped) break;
          setError(e instanceof Error ? e.message : String(e));
          await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
        }
      }
    })();

    return () => {
      stopped = true;
    };
  }, [creds, enabled]);

  return error;
}
