import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Replace with your deployed backend URLhttps://your-backend-name.onrender.com
const socket = io("http://localhost:3000");

export default function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [file, setFile] = useState(null);

  // Connect to server
  useEffect(() => {
    if (!username) return;

    socket.emit("login", username);

    socket.on("previousMessages", (msgs) => setMessages(msgs));
    socket.on("receiveMessage", (msg) =>
      setMessages((prev) => [...prev, msg])
    );
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    socket.on("typing", (user) => {
      if (user !== username) {
        setTypingUser(user);
        setTimeout(() => setTypingUser(""), 2000);
      }
    });

    return () => {
      socket.off("previousMessages");
      socket.off("receiveMessage");
      socket.off("onlineUsers");
      socket.off("typing");
    };
  }, [username]);

  // Send message
  const sendMessage = () => {
    if (!input.trim() && !file) return;

    const msgData = {
      sender: username,
      receiver,
      message: input,
      file: null,
    };

    if (file) {
      uploadFile(file, msgData);
    } else {
      socket.emit("sendMessage", msgData);
    }

    setInput("");
    setFile(null);
  };

  // Upload file to backend
  const uploadFile = async (selectedFile, msgData) => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(" https://chat-backend-es8u.onrender.com", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      msgData.file = data.url;
      msgData.message = `[File: ${selectedFile.name}]`;
      socket.emit("sendMessage", msgData);
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    socket.emit("typing", { sender: username, receiver });
  };

  // Select user for private chat
  const selectUser = (user) => {
    if (user === username) return;
    setReceiver(user === receiver ? null : user);
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3>Online Users</h3>
        {onlineUsers.map((user) => (
          <p
            key={user}
            onClick={() => selectUser(user)}
            style={{
              cursor: "pointer",
              fontWeight: receiver === user ? "bold" : "normal",
              color: user === username ? "gray" : "black",
            }}
          >
            {user}
          </p>
        ))}
      </div>

      <div style={styles.chatArea}>
        <div style={styles.messages}>
          {messages.map((msg, index) => (
            <div key={index} style={styles.message}>
              <strong>{msg.sender}</strong>
              {msg.receiver && (
                <span style={{ color: "gray" }}>
                  {" "}
                  → {msg.receiver} (Private)
                </span>
              )}
              : {msg.message}
              {msg.file && (
                <div>
                  <a href={msg.file} target="_blank" rel="noreferrer">
                    📎 View File
                  </a>
                </div>
              )}
            </div>
          ))}
          {typingUser && <p style={styles.typing}>{typingUser} is typing...</p>}
        </div>

        <div style={styles.inputArea}>
          <input
            type="text"
            placeholder={`Message ${receiver || "Everyone"}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleTyping}
            style={styles.input}
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.fileInput}
          />
          <button onClick={sendMessage} style={styles.sendBtn}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "90vh",
    maxWidth: "900px",
    margin: "30px auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
  },
  sidebar: {
    width: "25%",
    backgroundColor: "#f5f5f5",
    padding: "15px",
    borderRight: "1px solid #ccc",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  messages: {
    flex: 1,
    padding: "15px",
    overflowY: "auto",
    backgroundColor: "#fafafa",
  },
  message: {
    marginBottom: "8px",
  },
  typing: {
    fontStyle: "italic",
    color: "gray",
  },
  inputArea: {
    display: "flex",
    padding: "10px",
    borderTop: "1px solid #ccc",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "8px",
    marginRight: "8px",
  },
  fileInput: {
    marginRight: "8px",
  },
  sendBtn: {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};
