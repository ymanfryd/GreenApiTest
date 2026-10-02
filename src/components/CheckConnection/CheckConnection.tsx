import { useState, type SubmitEventHandler } from "react";
import {
  defaultApiUrl,
  getStateInstance,
  sendMessage,
  type InstanceCredentials,
} from "../../api/greenApi";

const toChatId = (raw: string): string => {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return `${digits}@c.us`;
};

const probe = async (creds: InstanceCredentials, phone: string) => {
  const state = await getStateInstance(creds);
  console.log("stateInstance:", state?.stateInstance);
  if (state?.stateInstance !== "authorized") throw new Error("Инстанс не авторизован");

  const sent = await sendMessage(
    creds,
    toChatId(phone),
    `Проверка связи ${new Date().toLocaleTimeString("ru-RU")}`,
  );
  console.log("idMessage:", sent?.idMessage);
};

export default function CheckConnection() {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const id = idInstance.trim();
    const creds: InstanceCredentials = {
      idInstance: id,
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: defaultApiUrl(id),
    };
    setBusy(true);
    try {
      await probe(creds, phone);
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        placeholder="idInstance"
        inputMode="numeric"
        value={idInstance}
        onChange={(e) => setIdInstance(e.target.value)}
        required
      />
      <input
        placeholder="apiTokenInstance"
        type="password"
        value={apiTokenInstance}
        onChange={(e) => setApiTokenInstance(e.target.value)}
        required
      />
      <input
        placeholder="Номер получателя, например 79991234567"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <button type="submit" disabled={busy}>
        {busy ? "Отправляем…" : "Отправить"}
      </button>
    </form>
  );
}