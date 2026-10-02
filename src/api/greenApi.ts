export interface InstanceCredentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export type InstanceState =
  | "authorized"
  | "notAuthorized"
  | "blocked"
  | "starting"
  | "suspended"
  | "pendingPassword"
  | (string & {});

export interface InstanceStateResponse {
  stateInstance: InstanceState;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface DeleteNotificationResponse {
  result: boolean;
  reason: string;
}

export interface Notification {
  receiptId: number;
  body: Record<string, unknown>;
}

export const defaultApiUrl = (id: string): string =>
  `https://${id.slice(0, 4)}.api.green-api.com`;

const url = (creds: InstanceCredentials, method: string, tail = ""): string =>
  `${creds.apiUrl}/waInstance${creds.idInstance}/${method}/${creds.apiTokenInstance}${tail}`;

async function request<T>(endpoint: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(endpoint, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GREEN-API ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return text ? (JSON.parse(text) as T) : null;
}

export const getStateInstance = (
  creds: InstanceCredentials,
): Promise<InstanceStateResponse | null> => request<InstanceStateResponse>(url(creds, "getStateInstance"));

export const sendMessage = (
  creds: InstanceCredentials,
  chatId: string,
  message: string,
): Promise<SendMessageResponse | null> =>
  request<SendMessageResponse>(url(creds, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });

export const receiveNotification = (
  creds: InstanceCredentials,
  timeout = 5,
): Promise<Notification | null> =>
  request<Notification>(url(creds, "receiveNotification", `?receiveTimeout=${timeout}`));

export const deleteNotification = (
  creds: InstanceCredentials,
  receiptId: number,
): Promise<DeleteNotificationResponse | null> =>
  request<DeleteNotificationResponse>(url(creds, "deleteNotification", `/${receiptId}`), {
    method: "DELETE",
  });