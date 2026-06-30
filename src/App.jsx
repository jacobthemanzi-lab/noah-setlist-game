import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot,
  setDoc
} from "firebase/firestore";

import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { useState, useEffect } from "react";
import { songs } from "./data/songs";


function SortableSong({ song, index, removeSong }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: song });

  const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  padding: "10px 12px",
  marginBottom: 6,
  background: "#ffffff",
  border: "1px solid #e5e5e5",
  borderRadius: 6,
  cursor: "grab"
};

  return (
  <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
    {(() => {
      const [title, album] = song.split(",").map(s => s.trim());

      return (
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          
          {/* LEFT: title + album (matches search UI) */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 500 }}>
              {title}
            </div>

            <div style={{ fontSize: "12px", fontStyle: "italic", color: "#666", marginTop: 2 }}>
              {album}
            </div>
          </div>

          {/* RIGHT: remove action */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              removeSong(song);
            }}
            style={{
              fontSize: "12px",
              color: "#aaa",
              cursor: "pointer",
              alignSelf: "center",
              paddingLeft: 10
            }}
          >
            remove
          </div>
        </div>
      );
    })()}
  </div>
);
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [name, setName] = useState("");
  const [allPredictions, setAllPredictions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);

  const [showAll, setShowAll] = useState(false);

  const [query, setQuery] = useState("");
  const [setlist, setSetlist] = useState([]);

  const [actualSetlist, setActualSetlist] = useState([]);
  useEffect(() => {
  const ref = doc(db, "meta", "ActualSetList");

  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setActualSetlist(Array.isArray(data.songs) ? data.songs : []);
      }
    },
    (error) => {
      console.error("Firestore listener error:", error);
    }
  );

  return () => unsub();
}, []);

  const [scores, setScores] = useState([]);

  function handleDragEnd(event) {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = setlist.indexOf(active.id);
  const newIndex = setlist.indexOf(over.id);

  setSetlist((items) => arrayMove(items, oldIndex, newIndex));
}

function calculateScore(userSetlist) {
  let score = 0;

  userSetlist.forEach((song, index) => {
    const actualIndex = actualSetlist.indexOf(song);

    if (actualIndex !== -1) score += 1;
    if (actualIndex === index) score += 1;
  });

  return score;
}
async function loadPredictions() {
  const snapshot = await getDocs(collection(db, "predictions"));

  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));

  setAllPredictions(data);
}

  function addSong(song) {
  if (submitted) return;
  if (setlist.includes(song)) return;
  if (setlist.length >= 26) return;
  setSetlist([...setlist, song]);
  setQuery("");
}

function removeSong(song) {
  if (submitted) return;
  setSetlist(setlist.filter((s) => s !== song));
}

function generateLeaderboard() {
  return allPredictions
    .map((p) => ({
      name: p.name,
      score: calculateScore(p.setlist)
    }))
    .sort((a, b) => b.score - a.score);
}

  const filteredSongs = songs.filter(
    (s) =>
      s.toLowerCase().includes(query.toLowerCase()) &&
      !setlist.includes(s)
  );

  if (!started) {
    return (
      <div style={{ padding: 40, fontFamily: "Arial" }}>
        <h1> Friends Noah Kahan Setlist Game</h1>
        <h2>Fenway Park, 7/8/2026</h2>

        <p>Enter your name:</p>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />

        <br /><br />

        <button
          onClick={() => setStarted(true)}
          disabled={!name}
          style={{ padding: 10 }}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
  <div
    style={{
      padding: 20,
      fontFamily: "Arial",
      display: "flex",
      gap: 40
    }}
  >
    <button
  onClick={() => {
    const pass = prompt("Admin password?");
    if (pass === "jacob") {
      setIsAdmin(true);
    }
  }}
  style={{
    position: "fixed",
    top: 12,
    right: 12,
    padding: "6px 10px",
    fontSize: 12,
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "white",
    cursor: "pointer"
  }}
>
  Admin
</button>


    {/* LEFT SIDE */}
    <div style={{ width: "50%" }}>
      <h2>Search Songs</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type a song..."
        style={{ padding: 10, width: "100%", fontSize: 16 }}
      />

      <div style={{ marginTop: 10 }}>
        {filteredSongs.map((song) => {
  const [title, album] = song.split(",").map(s => s.trim());

  return (
    <div
      key={song}
      onClick={() => addSong(song)}
      style={{
        padding: "10px 12px",
        border: "1px solid #e5e5e5",
        marginBottom: 6,
        cursor: "pointer",
        borderRadius: 6,
        background: "white"
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 500 }}>
        {title}
      </div>

      <div style={{ fontSize: "12px", fontStyle: "italic", color: "#666", marginTop: 2 }}>
        {album}
      </div>
    </div>
  );
})}
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div style={{ width: "50%" }}>
      <h2>Your Setlist ({setlist.length}/26)</h2>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={setlist}
          strategy={verticalListSortingStrategy}
        >
          {setlist.map((song, index) => (
            <SortableSong
              key={song}
              song={song}
              index={index}
              removeSong={removeSong}
            />
          ))}
        </SortableContext>
      </DndContext>

      {setlist.length === 26 && !submitted && (
<button
  onClick={async () => {
    try {
      await addDoc(collection(db, "predictions"), {
        name,
        setlist,
        submittedAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Error saving prediction:", err);
    }
  }}
  style={{
    padding: 12,
    marginTop: 20,
    fontSize: 16,
    cursor: "pointer"
  }}
>
  Lock In Prediction
</button>
      )}

      {submitted && (
        <div style={{ marginTop: 20, fontWeight: "bold" }}>
          Prediction locked!!! May the best bug win.
        </div>
      )}
    </div>

  <div style={{ marginTop: 40 }}>
    <h2>Game Controls</h2>

    <button onClick={loadPredictions}>
      Load Submissions
    </button>

    <button
      onClick={() => setShowAll(!showAll)}
      style={{ marginLeft: 10 }}
    >
      View Participants
    </button>

    <button
      onClick={() => {
        const leaderboard = generateLeaderboard();
        setScores(leaderboard);
      }}
      style={{ marginLeft: 10 }}
    >
      Calculate Leaderboard
    </button>

    {showAll && (
      <div style={{ marginTop: 30 }}>
        <h3>Participants</h3>

        {allPredictions.map((p) => (
          <div key={p.id}>
            {p.name}
          </div>
        ))}
      </div>
    )}

    {scores.length > 0 && (
      <div style={{ marginTop: 30 }}>
        <h3>Leaderboard</h3>

        {scores.map((s, i) => (
          <div
            key={i}
            style={{
              padding: 10,
              border: "1px solid #ddd",
              marginBottom: 8,
              fontWeight: i === 0 ? "bold" : "normal"
            }}
          >
            #{i + 1} {s.name} — {s.score} pts
          </div>
        ))}
      </div>
    )}
  </div>{isAdmin && (
  <div
    style={{
      marginTop: 40,
      padding: 20,
      border: "1px solid #ddd",
      borderRadius: 8,
      background: "#fafafa"
    }}
  >
    <h3>Admin</h3>

    <p style={{ fontSize: 12, color: "#666" }}>
      Paste one song per line in the format:
      <br />
      Song, Album
    </p>

    <textarea
      value={adminInput}
      onChange={(e) => setAdminInput(e.target.value)}
      style={{
        width: "100%",
        height: 220,
        padding: 10
      }}
    />

    <button
      onClick={async () => {
        const songs = adminInput
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        await setDoc(doc(db, "meta", "ActualSetList"), {
          songs,
          updatedAt: serverTimestamp(),
        });

        alert("Actual setlist updated!");
      }}
      style={{
        marginTop: 12,
        padding: "10px 18px",
      }}
    >
      Save Actual Setlist
    </button>
  </div>
)}



  </div>
);
}
