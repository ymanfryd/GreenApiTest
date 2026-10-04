import type { NotificationBody } from "../api/greenApi";
import { normalizePhone } from "../utils/chat";

export interface ChatMessage {
  id: string;
  text: string;
  outgoing: boolean;
  at: number;
}

export interface Chat {
  id: string;
  phone: string;
  name: string;
  chatId?: string;
  messages: ChatMessage[];
}

const isTextMessage = (body: NotificationBody): boolean =>
  body.messageData?.typeMessage === "textMessage";

const messageText = (body: NotificationBody): string =>
  body.messageData?.textMessageData?.textMessage?.trim() ?? "";

const senderPhone = (body: NotificationBody): string => {
  const phone = normalizePhone(String(body.senderData?.senderPhoneNumber ?? ""));
  return phone === "0" ? "" : phone;
};

const append = (chat: Chat, message: ChatMessage): Chat => ({
  ...chat,
  messages: [...chat.messages, message],
});

export const mergeIncoming = (
  chats: Chat[],
  body: NotificationBody,
  makeId: () => string,
): Chat[] => {
  // Group messages have nothing to belong to: chats are created by phone number.
  if (body.senderData?.chatType === "group") return chats;
  // The account's own messages arrive under other typeWebhook values, and the
  // local echo already covers what was sent from here.
  if (body.typeWebhook !== "incomingMessageReceived") return chats;
  if (!isTextMessage(body)) return chats;

  const text = messageText(body);
  if (!text) return chats;

  const phone = senderPhone(body);
  const remoteChatId = body.senderData?.chatId;
  const name = body.senderData?.senderName ?? "";
  const at = body.timestamp ? body.timestamp * 1000 : Date.now();
  const message: ChatMessage = { id: body.idMessage ?? makeId(), text, outgoing: false, at };

  const index = chats.findIndex(
    (chat) => (remoteChatId && chat.chatId === remoteChatId) || (phone && chat.phone === phone),
  );

  if (index === -1) {
    return [
      ...chats,
      {
        id: makeId(),
        phone: phone || remoteChatId || "",
        name,
        chatId: remoteChatId,
        messages: [message],
      },
    ];
  }

  const chat = chats[index];
  const updated: Chat = {
    ...append(chat, message),
    chatId: chat.chatId ?? remoteChatId,
    name: chat.name || name,
  };
  return chats.map((item, i) => (i === index ? updated : item));
};
