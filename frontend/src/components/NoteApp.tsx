import React, { useState, useEffect, KeyboardEvent } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { Plus, BookOpen } from "lucide-react";
import "./NoteApp.css";

interface Task {
  text: string;
  createdAt: string;
}

// point at your backend
const socket = io(process.env.REACT_APP_API_URL!);

const NoteApp: React.FC = () => {
  const [notes, setNotes] = useState<Task[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    // 1) initial load via HTTP
    axios
      .get<Task[]>(`${process.env.REACT_APP_API_URL}/fetchAllTasks`)
      .then((res) => setNotes(res.data))
      .catch(console.error);

    // 2) listen for any newTask broadcast
    socket.on("newTask", (task: Task) => {
      setNotes((prev) => [...prev, task]);
    });

    return () => {
      socket.off("newTask");
    };
  }, []);

  const addNote = () => {
    if (!text.trim()) return;
    // emits over WS
    socket.emit("add", text);
    setText("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addNote();
  };

  return (
    <div className="note-app">
      <header className="note-header">
        <BookOpen size={32} className="note-icon" />
        <h1>Note App</h1>
      </header>

      <div className="input-group">
        <input
          className="note-input"
          placeholder="New Note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="add-btn" onClick={addNote}>
          <Plus size={16} className="plus-icon" />
          <span className="add-text">Add</span>
        </button>
      </div>

      <div className="notes-section">
        <div className="notes-title">Notes</div>
        <div className="notes-list">
          {notes.map((n, i) => (
            <div className="note-item" key={i}>
              {n.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteApp;
