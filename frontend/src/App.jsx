import "./App.css";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FaMoon, FaSun, FaPlus } from "react-icons/fa";

function App() {

  const [topic, setTopic] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [level, setLevel] = useState("Kid 👶");

  const [chats, setChats] = useState([
    {
      id: 1,
      title: "New Chat",
      messages: []
    }
  ]);

  const [currentChatId, setCurrentChatId] = useState(1);

  const chatEndRef = useRef(null);

  // Current chat
  const currentChat = chats.find(
    (chat) => chat.id === currentChatId
  );

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [currentChat]);

  // Save chats
  useEffect(() => {
    localStorage.setItem(
      "smartsimplify_chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // Load chats
  useEffect(() => {

    const savedChats = localStorage.getItem(
      "smartsimplify_chats"
    );

    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }

  }, []);

  // Create new chat
  const createNewChat = () => {

    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: []
    };

    setChats((prev) => [...prev, newChat]);

    setCurrentChatId(newChat.id);
  };

  // Update messages
  const updateCurrentChatMessages = (messages) => {

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages }
          : chat
      )
    );
  };

  // Handle explain
  const handleExplain = async () => {

    if (!topic.trim()) return;

    const userMessage = {
      role: "user",
      content: topic
    };

    const updatedMessages = [
      ...currentChat.messages,
      userMessage
    ];

    updateCurrentChatMessages(updatedMessages);

    // Update title from first message
    if (
      currentChat.title === "New Chat"
    ) {

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                title: topic.slice(0, 25)
              }
            : chat
        )
      );
    }

    setTopic("");

    try {

      const res = await fetch(
        "http://127.0.0.1:8000/explain",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            level: level,
            history: updatedMessages,
          }),
        }
      );

      const data = await res.json();

      // Streaming effect
      let currentText = "";

      const aiMessage = {
        role: "assistant",
        content: ""
      };

      updateCurrentChatMessages([
        ...updatedMessages,
        aiMessage
      ]);

      let index = 0;

      const interval = setInterval(() => {

        currentText += data.response[index];

        const streamedMessages = [
          ...updatedMessages,
          {
            role: "assistant",
            content: currentText
          }
        ];

        updateCurrentChatMessages(
          streamedMessages
        );

        index++;

        if (
          index >= data.response.length
        ) {
          clearInterval(interval);
        }

      }, 10);

    } catch (error) {

      updateCurrentChatMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Something went wrong 😢"
        }
      ]);
    }
  };

  return (

    <div className={darkMode ? "app dark" : "app light"}>

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-top">

          <h2>
            SmartSimplify 🧠
          </h2>

          <button
            className="new-chat-btn"
            onClick={createNewChat}
          >
            <FaPlus />
            New Chat
          </button>

        </div>

        <div className="chat-list">

          {chats.map((chat) => (

            <div
              key={chat.id}
              className={
                currentChatId === chat.id
                  ? "chat-item active-chat"
                  : "chat-item"
              }
              onClick={() =>
                setCurrentChatId(chat.id)
              }
            >

              {chat.title}

            </div>
          ))}

        </div>

      </aside>

      {/* MAIN CHAT AREA */}
      <div className="main-chat">

        {/* HEADER */}
        <header className="header">

          <h1 className="logo">
            SmartSimplify ✨
          </h1>

          <div className="header-right">

            <select
              className="level-select"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value)
              }
            >
              <option>Kid 👶</option>
              <option>Student 🎓</option>
              <option>Engineer 👨‍💻</option>
            </select>

            <button
              className="theme-btn"
              onClick={() =>
                setDarkMode(!darkMode)
              }
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>

          </div>

        </header>

        {/* CHAT AREA */}
        <main className="chat-container">

          {currentChat.messages.length === 0 && (

            <div className="welcome">

              <h2>
                Learn anything with AI ✨
              </h2>

              <p>
                Ask questions at your level
              </p>

            </div>
          )}

          {currentChat.messages.map(
            (msg, index) => (

              <div
                key={index}
                className={
                  msg.role === "user"
                    ? "user-wrapper"
                    : "ai-wrapper"
                }
              >

                <div
                  className={
                    msg.role === "user"
                      ? "user-message"
                      : "ai-message"
                  }
                >

                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>

                  {msg.role ===
                    "assistant" && (

                    <div className="message-actions">

                      <button
                        onClick={async () => {

                          await navigator.clipboard.writeText(
                            msg.content
                          );

                          alert(
                            "Copied ✅"
                          );
                        }}
                      >
                        📋 Copy
                      </button>

                    </div>
                  )}

                </div>

              </div>
            )
          )}

          <div ref={chatEndRef}></div>

        </main>

        {/* INPUT AREA */}
        <div className="input-area">

          <input
            type="text"
            placeholder="Ask anything..."
            value={topic}
            onChange={(e) =>
              setTopic(e.target.value)
            }
            className="input-box"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleExplain();
              }
            }}
          />

          <button
            className="send-btn"
            onClick={handleExplain}
          >
            Send 🚀
          </button>

        </div>

      </div>

    </div>
  );
}

export default App;