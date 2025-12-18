// public/html/admin/admin-guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "cyberrank-a4380",
  // باقي القيم إذا موجودة عندك (storageBucket, messagingSenderId, appId...)
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function logSecurity(type, meta = {}) {
  try {
    await addDoc(collection(db, "security_logs"), {
      type,
      actorUid: auth.currentUser?.uid || null,
      meta,
      createdAt: serverTimestamp()
    });
  } catch (e) {}
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "/html/login.html";   // ✅ عندك login داخل public/html
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    await logSecurity("ROLE_DENIED", { page: location.pathname });
    location.href = "/html/index.html";
    return;
  }

  document.documentElement.style.visibility = "visible";
});

window.adminLogout = async () => {
  await signOut(auth);
  location.href = "/html/login.html";
};
