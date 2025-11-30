document.addEventListener('DOMContentLoaded', () => {
    const sendBtn   = document.getElementById("send-otp");
    const verifyBtn = document.getElementById("verify-otp");
  
    if (sendBtn) {
      sendBtn.addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const resultEl = document.getElementById("result");
  
        const res = await fetch("http://127.0.0.1:5001/cyberrank/us-central1/sendOtp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
  
        const data = await res.text();
        resultEl.textContent = data;
      });
    }
  
    if (verifyBtn) {
      verifyBtn.addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const otp   = document.getElementById("otp").value;
        const resultEl = document.getElementById("result");
  
        const res = await fetch("http://127.0.0.1:5001/cyberrank/us-central1/verifyOtp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });
  
        const data = await res.text();
        resultEl.textContent = data;
      });
    }
  });
  