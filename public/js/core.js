// public/js/core.js
(function () {
    const $  = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  
    // Dropdowns
    function wireDropdown(rootSel, btnSel) {
      const root = $(rootSel);
      const btn  = $(btnSel);
      if (!root || !btn) return;
  
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        root.classList.toggle('open');
      });
  
      document.addEventListener('click', (e) => {
        if (!root.contains(e.target)) root.classList.remove('open');
      });
    }
  
    function initThemeControls() {
      wireDropdown('#settings-dd', '#settings-btn');
      wireDropdown('#user-info-dropdown', '#user-info-btn');
  
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'day' || savedTheme === 'night') {
          document.body.setAttribute('data-theme', savedTheme);
        }
      } catch (e) {}
  
      $$('[data-theme-choice]').forEach(btn => {
        btn.addEventListener('click', () => {
          const choice = btn.getAttribute('data-theme-choice');
          if (!choice) return;
          document.body.setAttribute('data-theme', choice);
          try { localStorage.setItem('theme', choice); } catch (e) {}
        });
      });
    }
  
    // ===== Local Users Storage =====
    function getUsers() {
      try {
        return JSON.parse(localStorage.getItem('users') || '{}');
      } catch {
        return {};
      }
    }
  
    function saveUsers(users) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  
    function findUserByUsername(username) {
      const users = getUsers();
      for (const email in users) {
        const u = users[email];
        if (!u) continue;
        const uname = u.username || (email.split('@')[0]);
        if (uname.toLowerCase() === username.toLowerCase()) return u;
      }
      return null;
    }
  
    function getCurrentUser() {
      const username = localStorage.getItem('currentUser');
      if (!username) return null;
      return findUserByUsername(username);
    }
  
    function isLoggedIn() {
      return !!localStorage.getItem('currentUser');
    }
  
    function getCurrentUserRecord() {
      const username = localStorage.getItem('currentUser');
      if (!username) return null;
      const users = getUsers();
      const target = username.toLowerCase();
      for (const email in users) {
        const user = users[email];
        if (!user) continue;
        const uname = (user.username || email.split('@')[0] || '').toLowerCase();
        const emailLower = (user.email || email || '').toLowerCase();
        if (uname === target || emailLower === target) return { email, user };
      }
      return null;
    }
  
    function writeUser(email, user) {
      const users = getUsers();
      users[email] = user;
      saveUsers(users);
      return users[email];
    }
  
    function sanitizeProfileInput(source = {}) {
      const allowedKeys = [
        'username', 'fullName', 'email', 'age', 'stage',
        'userType', 'major', 'university', 'country', 'photo'
      ];
      const cleaned = {};
      allowedKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          cleaned[key] = source[key];
        }
      });
      return cleaned;
    }
  
    function composeProfile(email, user) {
      if (!user) return null;
      const username = user.username || (email ? email.split('@')[0] : '');
      return {
        username,
        fullName: user.fullName || '',
        email: user.email || email || '',
        age: user.age ?? '',
        userType: user.userType || '',
        stage: user.stage || '',
        major: user.major || '',
        university: user.university || '',
        country: user.country || '',
        photo: user.photo || ''
      };
    }
  
    function setProfile(data = {}) {
      const record = getCurrentUserRecord();
      if (!record) return null;
      const sanitized = sanitizeProfileInput(data);
      const updated = { ...record.user, ...sanitized };
      writeUser(record.email, updated);
      updateNavigationState();
      return composeProfile(record.email, updated);
    }
  
    function updateProfile(patch = {}) {
      return setProfile(patch);
    }
  
    function getProfile() {
      const record = getCurrentUserRecord();
      if (!record) return null;
      return composeProfile(record.email, record.user);
    }
  
    function getUser() {
      return getCurrentUser();
    }
  
    function logout() {
      localStorage.removeItem('currentUser');
      updateNavigationState();
      go('/index.html');
    }
  
    // ===== About translations =====
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
      try { localStorage.setItem('lang', code); } catch {}
    }
  
    function initTranslateControls() {
      try {
        const saved = localStorage.getItem('lang');
        if (saved) applyAbout(saved);
      } catch {}
  
      const btnTop      = document.getElementById('apply-lang-top');
      const btnAbout    = document.getElementById('apply-lang-about');
      const btnSettings = document.getElementById('apply-lang-settings');
  
      if (btnTop) btnTop.addEventListener('click', () => {
        const code = (document.getElementById('lang-top') || {}).value;
        if (code === 'he' || code === 'iw') return;
        applyAbout(code);
      });
  
      if (btnAbout) btnAbout.addEventListener('click', () => {
        const code = (document.getElementById('lang-about') || {}).value;
        if (code === 'he' || code === 'iw') return;
        applyAbout(code);
      });
  
      if (btnSettings) btnSettings.addEventListener('click', () => {
        const code = (document.getElementById('lang-settings') || {}).value;
        if (code === 'he' || code === 'iw') return;
        applyAbout(code);
      });
    }
  
    // ===== Router =====
    function go(target) {
      const page = String(target || 'index.html').replace(/^\.?\//, '');
      const base = location.pathname.replace(/[^/]+$/, ''); 
      window.location.href = base + page;
    }
  
    // ===== Top Navigation =====
    function updateNavigationState() {
      const navLogin = document.getElementById('nav-login');
      const navSignup = document.getElementById('nav-signup');
      const userInfoDropdown = document.getElementById('user-info-dropdown');
      const infoFullName = document.getElementById('info-fullname');
      const infoEmail = document.getElementById('info-email');
      const infoPhoto = document.getElementById('info-photo');
  
      if (isLoggedIn()) {
        if (navLogin) {
          navLogin.textContent = 'Logout';
          navLogin.onclick = () => logout();
        }
        if (navSignup) navSignup.style.display = 'none';
        if (userInfoDropdown) userInfoDropdown.style.display = 'inline-flex';
  
        let currentIdentifier = '';
        try { currentIdentifier = localStorage.getItem('currentUser') || ''; } catch {}
  
        const profile = getProfile();
        const localUser = getCurrentUser();
        const derivedNameFromId = currentIdentifier && currentIdentifier.includes('@')
          ? currentIdentifier.split('@')[0]
          : currentIdentifier;
        const fallbackName = profile?.fullName
          || localUser?.fullName
          || localUser?.username
          || derivedNameFromId
          || profile?.email
          || localUser?.email
          || '—';
        const fallbackEmail = profile?.email
          || localUser?.email
          || (currentIdentifier && currentIdentifier.includes('@') ? currentIdentifier : '')
          || '—';
  
        if (infoFullName) infoFullName.textContent = fallbackName || '—';
        if (infoEmail) infoEmail.textContent = fallbackEmail || '—';
        if (infoPhoto) {
          const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
          infoPhoto.src = profile?.photo || localUser?.photo || defaultSrc || infoPhoto.src;
        }
      } else {
        if (navLogin) {
          navLogin.textContent = 'Login';
          navLogin.onclick = () => go('/login.html');
        }
        if (navSignup) {
          navSignup.style.display = 'inline-block';
          navSignup.onclick = () => go('/signup.html');
        }
        if (userInfoDropdown) userInfoDropdown.style.display = 'none';
        if (infoFullName) infoFullName.textContent = '—';
        if (infoEmail) infoEmail.textContent = '—';
        if (infoPhoto) {
          const defaultSrc = infoPhoto.dataset?.default || infoPhoto.getAttribute('data-default');
          if (defaultSrc) infoPhoto.src = defaultSrc;
        }
      }
    }
  
    function initTopNav() {
      const homeBtn = document.getElementById('go-home');
      if (homeBtn) {
        homeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          go('/index.html');
        });
      }
  
      const navQuizzes = document.getElementById('nav-quizzes');
      if (navQuizzes) {
        navQuizzes.addEventListener('click', () => {
          if (isLoggedIn()) {
            go('/quizzes.html');
          } else {
            go('/login.html');
          }
        });
      }
  
      updateNavigationState();
    }
  
    // ===== Error helpers =====
    function setError(inputId, message) {
      const p = document.querySelector(`[data-error-for="${inputId}"]`);
      if (p) p.textContent = message || '';
    }
  
    function clearErrors(form) {
      form.querySelectorAll('.error').forEach(e => (e.textContent = ''));
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  
    // ===== Expose to window =====
    window.$ = $;
    window.$$ = $$;
    window.go = go;
    window.getUsers = getUsers;
    window.saveUsers = saveUsers;
    window.findUserByUsername = findUserByUsername;
    window.getCurrentUser = getCurrentUser;
    window.isLoggedIn = isLoggedIn;
    window.logout = logout;
    window.setProfile = setProfile;
    window.updateProfile = updateProfile;
    window.getProfile = getProfile;
    window.getUser = getUser;
    window.initThemeControls = initThemeControls;
    window.initTranslateControls = initTranslateControls;
    window.initTopNav = initTopNav;
    window.updateNavigationState = updateNavigationState;
    window.setError = setError;
    window.clearErrors = clearErrors;
    window.emailRegex = emailRegex;
  })();
  