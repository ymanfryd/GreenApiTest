import { useState } from "react";
import type { InstanceCredentials } from "./api/greenApi";
import Login from "./pages/Login";
import SendMessage from "./pages/SendMessage";

export default function App() {
  const [creds, setCreds] = useState<InstanceCredentials | null>(null);

  return creds ? (
    <SendMessage creds={creds} onBack={() => setCreds(null)} />
  ) : (
    <Login onConnect={setCreds} />
  );
}
