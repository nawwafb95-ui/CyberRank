(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Theme dropdowns
  function wireDropdown(rootId, btnId) {
    const root = $(rootId);
    const btn = $(btnId);
    if (!root || !btn) return;
    document.addEventListener('click', (e) => {
      const inside = root.contains(e.target);
      const onBtn = (e.target === btn) || btn.contains(e.target);
      root.classList.toggle('open', inside && onBtn);
      if (!inside) root.classList.remove('open');
    });
  }

  function initThemeControls() {
    wireDropdown('#lang-dd', '#lang-btn');
    wireDropdown('#theme-dd', '#theme-btn');
    $$('[data-theme-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-theme-choice');
        document.body.setAttribute('data-theme', choice);
      });
    });
  }

  // Local storage helpers
  function getUsers() { try { return JSON.parse(localStorage.getItem('users') || '{}'); } catch { return {}; } }
  function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
  function findUserByUsername(username) {
    const users = getUsers();
    for (const email in users) {
      const u = users[email]; if (!u) continue;
      const uname = u.username || (email.split('@')[0]);
      if (uname.toLowerCase() === username.toLowerCase()) return u;
    }
    return null;
  }

  // Shared About translations
  const ABOUT_COPY = {
    'en-US': 'CyberRank helps you test yourself with cybersecurity questions, track your level by age group, and earn points as you progress. Practice real-world scenarios, review explanations, and discover your strengths. Designed for learners at any stage—whether you’re an employee, school student, or university student—CyberRank adapts to your journey.',
    'en-GB': 'CyberRank helps you test yourself with cyber security questions, track your level by age group, and earn points as you progress. Practise real-world scenarios, review explanations, and discover your strengths. Designed for learners at any stage—whether you’re an employee, school pupil, or university student—CyberRank adapts to your journey.',
    'ar': 'يساعدك CyberRank على اختبار نفسك بأسئلة في الأمن السيبراني، وتتبع مستواك حسب فئتك العمرية، وكسب النقاط أثناء التقدم. تدرب على سيناريوهات واقعية، واطّلع على الشروحات، واكتشف نقاط قوتك. صُمم لأي مرحلة تعليمية — سواء كنت موظفاً أو طالبَ مدرسة أو طالبَ جامعة — ليتكيف مع رحلتك.',
    'fr': 'CyberRank vous aide à vous tester avec des questions de cybersécurité, à suivre votre niveau par tranche d’âge et à gagner des points en progressant. Entraînez-vous sur des scénarios réels, consultez les explications et découvrez vos points forts. Conçu pour tous les niveaux — employé, élève ou étudiant — CyberRank s’adapte à votre parcours.'
  };

  function applyAbout(code) {
    const aboutText = document.getElementById('about-text');
    if (!aboutText) return;
    aboutText.textContent = ABOUT_COPY[code] || ABOUT_COPY['en-US'];
  }

  function initTranslateControls() {
    const btnTop = document.getElementById('apply-lang-top');
    const btnAbout = document.getElementById('apply-lang-about');
    if (btnTop) btnTop.addEventListener('click', () => { const code = (document.getElementById('lang-top')||{}).value; if (code==='he'||code==='iw') return; applyAbout(code); });
    if (btnAbout) btnAbout.addEventListener('click', () => { const code = (document.getElementById('lang-about')||{}).value; if (code==='he'||code==='iw') return; applyAbout(code); });
  }

  // Page routers
  function go(href) { window.location.href = href; }

  function initTopNav() {
    const homeBtn = document.getElementById('go-home');
    if (homeBtn) homeBtn.addEventListener('click', (e)=>{ e.preventDefault(); go('/HTML/index.html'); });
    const navLogin = document.getElementById('nav-login');
    if (navLogin) navLogin.addEventListener('click', ()=> go('/HTML/login.html'));
    const navSignup = document.getElementById('nav-signup');
    if (navSignup) navSignup.addEventListener('click', ()=> go('/HTML/signup.html'));
  }

  // Home page
  function initHome() {
    const login = document.getElementById('home-go-login');
    const signup = document.getElementById('home-go-signup');
    if (login) login.addEventListener('click', ()=> go('/HTML/login.html'));
    if (signup) signup.addEventListener('click', ()=> go('/HTML/signup.html'));
  }

  // Auth shared
  function setError(inputId, message) {
    const p = document.querySelector(`[data-error-for="${inputId}"]`);
    if (p) p.textContent = message || '';
  }
  function clearErrors(form) { form.querySelectorAll('.error').forEach(e => (e.textContent = '')); }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  function validateSignup(form) {
    clearErrors(form);
    let ok = true;
    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const ageRaw = form.age.value.trim();
    const stage = form.stage.value.trim();
    const userType = (form.userType.value || '').trim();
    const usernameRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{5,}$/;
    if (!username || !usernameRegex.test(username)) { setError('signup-username', 'Username must be 5+ chars, include 1 capital and 1 number, letters/digits only.'); ok = false; }
    const usersNow = getUsers();
    for (const emailKey in usersNow) {
      const u = usersNow[emailKey]; if (!u) continue;
      const uname = (u.username || emailKey.split('@')[0]).toLowerCase();
      if (uname === username.toLowerCase()) { setError('signup-username', 'This username is already taken.'); ok = false; break; }
    }
    if (!email || !emailRegex.test(email)) { setError('signup-email', 'Enter a valid email.'); ok = false; }
    if (!password || password.length < 8) { setError('signup-password', 'Password must be at least 8 characters.'); ok = false; }
    if (confirmPassword !== password) { setError('signup-confirm', 'Passwords do not match.'); ok = false; }
    const age = Number(ageRaw);
    if (!ageRaw || Number.isNaN(age) || age < 1 || age > 120) { setError('signup-age', 'Enter a valid age (1-120).'); ok = false; }
    if (!stage) { setError('signup-stage', 'This field is required.'); ok = false; }
    if (!userType) { setError('userType', 'Select a user type.'); ok = false; }
    return { ok, values: { username, email, password, userType, age, stage } };
  }

  function validateLogin(form) {
    clearErrors(form);
    let ok = true;
    const username = form.username.value.trim();
    const password = form.password.value;
    if (!username) { setError('login-username', 'Enter a valid username.'); ok = false; }
    if (!password) { setError('login-password', 'Password is required.'); ok = false; }
    return { ok, values: { username, password } };
  }

  function initSignup() {
    const stageLabel = document.getElementById('stage-label');
    const stageInput = document.getElementById('signup-stage');
    function updateStageLabel() {
      const selected = ($$("input[name='userType']").find(r => r.checked) || {}).value;
      if (selected === 'school') { stageLabel.textContent = 'Grade Level'; stageInput.placeholder = 'e.g., Grade 10'; }
      else if (selected === 'university') { stageLabel.textContent = 'University Year'; stageInput.placeholder = 'e.g., Year 2'; }
      else { stageLabel.textContent = 'Stage/Level'; stageInput.placeholder = 'e.g., Junior'; }
    }
    $$("input[name='userType']").forEach(r => r.addEventListener('change', updateStageLabel));
    updateStageLabel();

    const usernameInput = document.getElementById('signup-username');
    const usernamePreview = document.getElementById('username-preview');
    const previewUpdate = () => { const v = (usernameInput.value || '').trim(); usernamePreview.textContent = v ? v : '—'; };
    if (usernameInput && usernamePreview) {
      usernameInput.addEventListener('input', previewUpdate);
      previewUpdate();
    }

    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validateSignup(signupForm);
      if (!ok) return;
      const users = getUsers();
      if (users[values.email]) { setError('signup-email', 'An account with this email already exists.'); return; }
      users[values.email] = { email: values.email, password: values.password, userType: values.userType, age: values.age, stage: values.stage, username: values.username, createdAt: new Date().toISOString() };
      saveUsers(users);
      localStorage.setItem('currentUser', values.username);
      window.location.href = '/HTML/login.html';
    });
  }

  function initLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validateLogin(loginForm);
      if (!ok) return;
      const user = findUserByUsername(values.username);
      if (!user || user.password !== values.password) { setError('login-password', 'Invalid username or password.'); return; }
      const username = user.username || (user.email.split('@')[0]);
      localStorage.setItem('currentUser', username);
      window.location.href = '/HTML/success.html';
    });
  }

  function initSuccess() {
    const user = localStorage.getItem('currentUser');
    const el = document.getElementById('success-user');
    if (el && user) el.innerHTML = `Welcome, <strong>${user}</strong> — your journey starts now.`;
    const confettiBox = document.getElementById('confetti');
    if (confettiBox) {
      confettiBox.innerHTML = '';
      const count = 60;
      for (let i=0;i<count;i++) {
        const s = document.createElement('span');
        s.style.left = Math.random()*100 + '%';
        s.style.animationDelay = (Math.random()*1.2)+'s';
        s.style.background = Math.random() > .5
          ? 'linear-gradient(180deg, var(--brand-blue), var(--brand-cyan))'
          : 'linear-gradient(180deg, #ff8cc6, #ffc46b)';
        confettiBox.appendChild(s);
      }
    }
    const toHome = document.getElementById('success-home');
    const toLogin = document.getElementById('success-login');
    if (toHome) toHome.addEventListener('click', ()=> go('/HTML/index.html'));
    if (toLogin) toLogin.addEventListener('click', ()=> go('/HTML/login.html'));
  }

  function boot() {
    initThemeControls();
    initTranslateControls();
    initTopNav();
    const page = document.body.getAttribute('data-page');
    if (page === 'home') initHome();
    if (page === 'login') initLogin();
    if (page === 'signup') initSignup();
    if (page === 'success') initSuccess();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();


