import { useState } from "react";
import type { InstanceCredentials } from "./api/greenApi";
import Login from "./pages/Login";
import SendMessage from "./pages/SendMessage";
import { load, remove, save } from "./utils/storage";

const SESSION_KEY = "green_api_credentials";

export default function App() {
  const [creds, setCreds] = useState<InstanceCredentials | null>(() =>
    load<InstanceCredentials | null>(SESSION_KEY, null),
  );

  const connect = (next: InstanceCredentials) => {
    save(SESSION_KEY, next);
    setCreds(next);
  };

  const disconnect = () => {
    remove(SESSION_KEY);
    setCreds(null);
  };

  return creds ? <SendMessage creds={creds} onBack={disconnect} /> : <Login onConnect={connect} />;
}