import { useState, type SubmitEventHandler } from "react";
import { sendMessage, type InstanceCredentials } from "../api/greenApi";

type Props = {
  creds: InstanceCredentials;
  onBack: () => void;
};

const toChatId = (raw: string): string => {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return `${digits}@c.us`;
};

export default function SendMessage({ creds, onBack }: Props) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const sent = await sendMessage(
        creds,
        toChatId(phone),
        `Проверка связи ${new Date().toLocaleTimeString("ru-RU")}`,
      );
      if (sent?.idMessage) console.info("idMessage:", sent.idMessage);
      else setError("GREEN-API не вернул idMessage, проверьте очередь отправки");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h1>Инстанс {creds.idInstance}</h1>

      <label htmlFor="phone">Номер получателя</label>
      <input
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="79991234567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />

      <button type="submit" disabled={busy}>
        {busy ? "Отправляем…" : "Отправить тестовое сообщение"}
      </button>
      <button type="button" onClick={onBack}>
        Выйти
      </button>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
