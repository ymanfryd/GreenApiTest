import { useCallback, useEffect, useState } from "react";
import type { NotificationBody } from "../api/greenApi";
import { load, save } from "../utils/storage";
import { mergeIncoming, type Chat } from "./chats";

export type { Chat, ChatMessage } from "./chats";

export interface ChatsState {
  chats: Chat[];
  addOutgoing: (chatId: string, text: string, idMessage?: string) => void;
  addIncoming: (body: NotificationBody) => void;
  // chatId comes from checkAccount, so a message can be addressed the way the
  // API recommends before the other side has replied even once.
  createChat: (phone: string, chatId?: string) => string;
}

const STORAGE_KEY = "green_api_chats";

let counter = 0;
const makeId = (): string => `${Date.now()}-${counter++}`;

export function useChats(): ChatsState {
  const [chats, setChats] = useState<Chat[]>(() => load<Chat[]>(STORAGE_KEY, []));

  useEffect(() => {
    save(STORAGE_KEY, chats);
  }, [chats]);

  const addOutgoing = useCallback((chatId: string, text: string, idMessage?: string) => {
    const message = { id: idMessage ?? makeId(), text, outgoing: true, at: Date.now() };
    setChats((items) =>
      items.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat,
      ),
    );
  }, []);

  const addIncoming = useCallback((body: NotificationBody) => {
    setChats((items) => mergeIncoming(items, body, makeId));
  }, []);

  const createChat = useCallback(
    (phone: string, chatId?: string): string => {
      const existing = chats.find((chat) => chat.phone === phone);
      if (existing) return existing.id;

      const chat: Chat = { id: makeId(), phone, name: "", chatId, messages: [] };
      setChats((items) => (items.some((item) => item.phone === phone) ? items : [...items, chat]));
      return chat.id;
    },
    [chats],
  );

  return { chats, addOutgoing, addIncoming, createChat };
}
