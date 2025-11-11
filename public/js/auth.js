// public/js/auth.js
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
  
  import {
    doc, getDoc, setDoc, serverTimestamp
  } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
  
  /** Sign up using username+email+password
   * - يتأكد من توفر اليوزرنيم
   * - لو الإيميل مستخدم مسبقًا: يسجّل دخول ثم يربط اليوزرنيم تلقائيًا
   * - يفتح dashboard عند النجاح
   */
  export async function signupWithUsername(auth, db, { username, email, password, profile = {} }) {
    const uname = String(username || "").trim();
    const unameLower = uname.toLowerCase();
    if (!uname) throw new Error("Username is required");
  
    const unameRef = doc(db, "usernames", unameLower);
    const unameSnap = await getDoc(unameRef);
    if (unameSnap.exists()) throw new Error("This username is already taken.");
  
    try {
      // 1) جرّب إنشاء مستخدم جديد
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
  
      // 2) خزّن بروفايل + اربط اليوزرنيم
      await Promise.all([
        setDoc(doc(db, "users", uid), {
          uid, email, username: uname, usernameLower: unameLower,
          createdAt: serverTimestamp(), ...profile
        }, { merge: true }),
        setDoc(unameRef, { uid, email })
      ]);
  
      try {
        localStorage.setItem('cr_user', uname);
        const p = { username: uname, email, ...profile };
        localStorage.setItem('cr_profile', JSON.stringify(p));
      } catch {}

      location.replace("./index.html");
    } catch (e) {
      // 3) لو الإيميل مستخدم مسبقاً، نسجّل الدخول ونربط اليوزرنيم
      if (e?.code === "auth/email-already-in-use") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
  
        const existsNow = await getDoc(unameRef);
        if (existsNow.exists()) throw new Error("This username is already taken.");
  
        await Promise.all([
          setDoc(doc(db, "users", uid), {
            uid, email, username: uname, usernameLower: unameLower,
            // ما نغيّر createdAt إذا كان موجود مسبقاً
          }, { merge: true }),
          setDoc(unameRef, { uid, email })
        ]);
  
        try {
          localStorage.setItem('cr_user', uname);
          const p = { username: uname, email, ...profile };
          localStorage.setItem('cr_profile', JSON.stringify(p));
        } catch {}

        location.replace("./index.html");
      } else {
        throw e;
      }
    }
  }
  
  /** Login using username (يحوّل داخليًا إلى email) */
  export async function loginWithUsername(auth, db, username, password) {
    const unameLower = String(username || "").trim().toLowerCase();
    if (!unameLower) throw new Error("Username is required");
  
    // جيب الإيميل من mapping
    const snap = await getDoc(doc(db, "usernames", unameLower));
    if (!snap.exists()) throw new Error("No account found with this username.");
    const { email } = snap.data();
  
    await signInWithEmailAndPassword(auth, email, password);
    try {
      localStorage.setItem('cr_user', username);
      // Merge/update profile email
      const existing = JSON.parse(localStorage.getItem('cr_profile') || '{}');
      const next = { ...existing, username, email };
      localStorage.setItem('cr_profile', JSON.stringify(next));
    } catch {}
    location.replace("./index.html");
  }
  
  /** Logout → back to login */
  export async function logout(auth) {
    await signOut(auth);
    try { localStorage.removeItem('cr_user'); } catch {}
    location.replace("./login.html");
  }
  
  /** عرض الأخطاء في عنصر #auth-msg إن وُجد */
  export function showMsg(err) {
    const el = document.getElementById("auth-msg");
    const msg = err?.message || String(err);
    if (el) el.textContent = msg;
    else alert(msg);
  }
  