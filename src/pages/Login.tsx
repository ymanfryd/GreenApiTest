import { useState, type SubmitEventHandler } from "react";
import {
  defaultApiUrl,
  getStateInstance,
  type InstanceCredentials,
} from "../api/greenApi";

type Props = {
  onConnect: (creds: InstanceCredentials) => void;
};

export default function Login({ onConnect }: Props) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const creds: InstanceCredentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: defaultApiUrl(idInstance.trim()),
    };

    setBusy(true);
    setError("");
    try {
      const state = await getStateInstance(creds);
      if (state?.stateInstance !== "authorized") {
        setError(
          `Инстанс не авторизован: ${state?.stateInstance ?? "нет ответа"}. ` +
            "Отсканируйте QR-код в личном кабинете GREEN-API.",
        );
        return;
      }
      onConnect(creds);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <h1 className="login__title">Подключение к GREEN-API</h1>

        <label htmlFor="idInstance">idInstance</label>
        <input
          id="idInstance"
          name="idInstance"
          inputMode="numeric"
          autoComplete="off"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          required
        />

        <label htmlFor="apiTokenInstance">apiTokenInstance</label>
        <input
          id="apiTokenInstance"
          name="apiTokenInstance"
          type="password"
          autoComplete="off"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          required
        />

        <button type="submit" className="login__submit" disabled={busy}>
          {busy ? "Проверяем…" : "Войти"}
        </button>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
