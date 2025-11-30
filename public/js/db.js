// public/js/db.js
import {
    collection, addDoc, serverTimestamp,
    query, where, orderBy, onSnapshot
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
  
  export async function addScore(db, uid, value) {
    if (Number.isNaN(Number(value))) throw new Error("score must be a number");
    await addDoc(collection(db, "scores"), {
      uid,
      value: Number(value),
      createdAt: serverTimestamp()
    });
  }
  
  export function listenUserScores(db, uid, listEl) {
    const q = query(
      collection(db, "scores"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      listEl.innerHTML = "";
      snap.forEach(doc => {
        const li = document.createElement("li");
        const d = doc.data();
        li.textContent = `score = ${d.value ?? "?"}`;
        listEl.appendChild(li);
      });
    });
  }
  