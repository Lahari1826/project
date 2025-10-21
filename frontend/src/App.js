import React from "react";
import Chat from "./Chat";

function App() {
  const username = prompt("Enter your username:");
  if (!username) return <h2>Reload and enter a username to continue</h2>;
  return <Chat username={username} />;
}

export default App;
