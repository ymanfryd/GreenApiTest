import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type SubmitEventHandler,
} from "react";
import { sendMessage, type InstanceCredentials } from "../api/greenApi";
import Avatar from "../components/Avatar";
import { useChats, type Chat } from "../hooks/useChats";
import { useNotifications } from "../hooks/useNotifications";
import { useReceiveSettings } from "../hooks/useReceiveSettings";
import {
  chatAddress,
  chatTitle,
  formatDay,
  formatPhone,
  formatTime,
  isRoutablePhone,
  isSameDay,
  normalizePhone,
} from "../utils/chat";

type Props = {
  creds: InstanceCredentials;
  onBack: () => void;
};

const MAX_MESSAGE_LENGTH = 4000;

const preview = (chat: Chat): string => {
  const last = chat.messages[chat.messages.length - 1];
  return last ? last.text : "";
};

export default function Chat({ creds, onBack }: Props) {
  const { chats, addIncoming, addOutgoing, createChat } = useChats();
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const { enabled, error: settingsError } = useReceiveSettings(creds);
  const receiveError = useNotifications(creds, addIncoming, enabled);

  const active = chats.find((chat) => chat.id === activeId) ?? null;

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [chats, active]);

  const openComposer = useCallback((chatId: string) => {
    setActiveId(chatId);
    draftRef.current?.focus();
  }, []);

  const create: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const normalized = normalizePhone(phone);
    if (!isRoutablePhone(normalized)) {
      setError("Введите номер в формате 79991234567 или +375291234567");
      return;
    }
    setError("");
    setPhone("");
    openComposer(createChat(normalized));
  };

  const send: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!active) return;

    const text = draft.trim();
    if (!text) return;

    setBusy(true);
    setError("");
    try {
      const sent = await sendMessage(creds, chatAddress(active), text);
      if (!sent?.idMessage) throw new Error("GREEN-API не вернул idMessage");
      addOutgoing(active.id, text, sent.idMessage);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <header className="app__bar">
        <span className="app__title">Чат MAX через GREEN-API</span>
        <span className="app__instance">Инстанс {creds.idInstance}</span>
        <button type="button" className="app__back" onClick={onBack}>
          Выйти
        </button>
      </header>

      <main className="app__body">
        <aside className="sidebar">
          <h2 className="sidebar__title">Чаты</h2>

          <form className="new-chat" onSubmit={create}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="79991234567"
              inputMode="tel"
              aria-label="Номер получателя"
            />
            <button type="submit">Создать чат</button>
          </form>

          {chats.length === 0 ? (
            <p className="sidebar__empty">Введите номер получателя, чтобы создать чат.</p>
          ) : (
            <ul className="chat-list">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    type="button"
                    className={`chat-item${chat.id === activeId ? " chat-item_active" : ""}`}
                    onClick={() => setActiveId(chat.id)}
                  >
                    <Avatar name={chat.name} phone={chat.phone} seed={chat.id} />
                    <span className="chat-item__body">
                      <span className="chat-item__name">{chatTitle(chat)}</span>
                      <span className="chat-item__preview">{preview(chat)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="conversation">
          {active ? (
            <>
              <header className="conversation__head">
                <Avatar name={active.name} phone={active.phone} seed={active.id} />
                <span className="conversation__who">
                  <span className="conversation__name">{chatTitle(active)}</span>
                  <span className="conversation__status">
                    {active.name ? formatPhone(active.phone) : "Новый чат"}
                  </span>
                </span>
              </header>

              <div className="feed" ref={feedRef}>
                {active.messages.length === 0 ? (
                  <p className="feed__empty">Сообщений пока нет.</p>
                ) : (
                  active.messages.map((message, index) => {
                    const previous = active.messages[index - 1];
                    const newDay = !previous || !isSameDay(previous.at, message.at);
                    return (
                      <Fragment key={message.id}>
                        {newDay && <div className="day">{formatDay(message.at)}</div>}
                        <div className={`bubble${message.outgoing ? " bubble_out" : " bubble_in"}`}>
                          <span className="bubble__text">{message.text}</span>
                          <span className="bubble__time">{formatTime(message.at)}</span>
                        </div>
                      </Fragment>
                    );
                  })
                )}
              </div>

              <form className="composer" onSubmit={send}>
                <textarea
                  ref={draftRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Напишите сообщение"
                  aria-label="Текст сообщения"
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={1}
                  disabled={busy}
                />
                <button type="submit" disabled={busy || !draft.trim()}>
                  Отправить
                </button>
              </form>
            </>
          ) : (
            <p className="conversation__empty">Выберите чат слева или создайте новый.</p>
          )}
        </section>
      </main>

      {(error || settingsError || receiveError) && (
        <footer className="app__errors" role="alert">
          {error && <span>{error}</span>}
          {settingsError && <span>{settingsError}</span>}
          {receiveError && <span>{receiveError}</span>}
        </footer>
      )}
    </div>
  );
}
