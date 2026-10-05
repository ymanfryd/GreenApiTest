// MAX accepts a phone number as a chat identifier in the form
// phoneNumber@c.us, and reports the chatId it assigns in the notification.
// Only the country codes 7 and 375 are allowed in that form, which is 11
// digits for a Russian number and 12 for a Belarusian one.
// https://green-api.com/v3/docs/api/chat-id/

export const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  // The national 8 is written instead of 7, as in 89991234567.
  if (digits.length === 11 && digits.startsWith("8")) return `7${digits.slice(1)}`;
  return digits;
};

export const formatPhone = (phone: string): string => {
  if (phone.length === 11 && phone.startsWith("7")) {
    return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
  }
  return `+${phone}`;
};

// The API accepts the country codes 7 and 375, but any number starting with 7
// has the same shape, so this checks the form only, not the country itself.
export const isRoutablePhone = (phone: string): boolean =>
  (phone.length === 11 && phone.startsWith("7")) || (phone.length === 12 && phone.startsWith("375"));

export const chatAddress = (chat: { chatId?: string; phone: string }): string =>
  chat.chatId ?? `${chat.phone}@c.us`;

export const chatTitle = (chat: { name: string; phone: string }): string =>
  chat.name || formatPhone(chat.phone);

export const formatTime = (at: number): string =>
  new Date(at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const startOfDay = (at: number): number => new Date(at).setHours(0, 0, 0, 0);

// Today and Yesterday, or 4 октября for anything older.
export const formatDay = (at: number): string => {
  const today = new Date().setHours(0, 0, 0, 0);
  const day = startOfDay(at);
  if (day === today) return "Сегодня";
  if (day === today - 86400000) return "Вчера";
  return new Date(at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
};

export const isSameDay = (a: number, b: number): boolean => startOfDay(a) === startOfDay(b);

// MAX shows a profile picture, but the API reports only a name, so the avatar
// falls back to the first letters of the name, or to the phone digits.
export const initials = (name: string, phone: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return phone.slice(-2);
};

const GRADIENTS: [string, string][] = [
  ["#6f5bd4", "#8f6ae0"],
  ["#4a76c9", "#5b9bd5"],
  ["#3f8f7f", "#4fb39b"],
  ["#a05bb8", "#c470cf"],
  ["#b1613f", "#cf8455"],
  ["#4f6d8f", "#6f8fb3"],
];

// Stable per chat, so the colour does not change between renders.
export const avatarGradient = (key: string): [string, string] => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  return GRADIENTS[hash % GRADIENTS.length];
};
