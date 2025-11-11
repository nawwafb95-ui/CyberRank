(function () {
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ⛔️ نعطّل الديمو المحلي (login/signup/success) ونترك Firebase يتولّى كل شيء
  const USE_LOCAL_DEMO = false;

  /* -----------------------------
   * Dropdowns (open on button, close on outside)
   * ----------------------------- */
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
    // تهيئة القوائم المنسدلة للغة والثيم
    wireDropdown('#lang-dd', '#lang-btn');
    wireDropdown('#theme-dd', '#theme-btn');
    // تهيئة قائمة معلومات المستخدم
    wireDropdown('#user-info-dropdown', '#user-info-btn');
    // إضافة مستمعات الأحداث لاختيار الثيم
    $$('[data-theme-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-theme-choice');
        document.body.setAttribute('data-theme', choice);
      });
    });
  }

  // ========== دوال إدارة البيانات المحلية (Local Storage) ==========
  
  // الحصول على جميع المستخدمين من التخزين المحلي
  function getUsers() { 
    try { 
      return JSON.parse(localStorage.getItem('users') || '{}'); 
    } catch { 
      return {}; 
    } 
  }
  
  // حفظ المستخدمين في التخزين المحلي
  function saveUsers(users) { 
    localStorage.setItem('users', JSON.stringify(users)); 
  }
  
  // البحث عن مستخدم بواسطة اسم المستخدم
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
  
  // الحصول على المستخدم الحالي المسجل دخوله
  function getCurrentUser() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;
    return findUserByUsername(username);
  }
  
  // التحقق من حالة تسجيل الدخول
  function isLoggedIn() {
    return !!localStorage.getItem('currentUser');
  }
  
  // تسجيل الخروج
  function logout() {
    localStorage.removeItem('currentUser');
    updateNavigationState();
    go('/HTML/index.html');
  }

  /* -----------------------------
   * About translations (+ persist)
   * ----------------------------- */
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
    // restore saved language
    try {
      const saved = localStorage.getItem('lang');
      if (saved) applyAbout(saved);
    } catch {}

    const btnTop   = document.getElementById('apply-lang-top');
    const btnAbout = document.getElementById('apply-lang-about');

    if (btnTop) btnTop.addEventListener('click', () => {
      const code = (document.getElementById('lang-top') || {}).value;
      if (code === 'he' || code === 'iw') return; // ignore RTL not supported here
      applyAbout(code);
    });

    if (btnAbout) btnAbout.addEventListener('click', () => {
      const code = (document.getElementById('lang-about') || {}).value;
      if (code === 'he' || code === 'iw') return;
      applyAbout(code);
    });
  }

  /* -----------------------------
   * Simple router (robust relative paths)
   * ----------------------------- */
  function go(target) {
    const page = String(target || 'index.html').replace(/^\.?\//, '');
    const base = location.pathname.replace(/[^/]+$/, ''); // current folder
    window.location.href = base + page;
  }

  // ========== إدارة شريط التنقل العلوي ==========
  
  // تحديث حالة شريط التنقل حسب حالة تسجيل الدخول
  function updateNavigationState() {
    const navLogin = document.getElementById('nav-login');
    const navSignup = document.getElementById('nav-signup');
    const userInfoDropdown = document.getElementById('user-info-dropdown');
    const infoUsername = document.getElementById('info-username');
    const infoEmail = document.getElementById('info-email');
    
    if (isLoggedIn()) {
      // إذا كان المستخدم مسجل دخول: تغيير زر Login إلى Logout وإظهار معلومات المستخدم
      if (navLogin) {
        navLogin.textContent = 'Logout';
        navLogin.onclick = () => logout();
      }
      if (navSignup) navSignup.style.display = 'none'; // إخفاء زر Sign Up
      if (userInfoDropdown) userInfoDropdown.style.display = 'block'; // إظهار معلومات المستخدم
      
      // تحديث معلومات المستخدم
      const user = getCurrentUser();
      if (user) {
        if (infoUsername) infoUsername.textContent = user.username || user.email.split('@')[0];
        if (infoEmail) infoEmail.textContent = user.email;
      }
    } else {
      // إذا لم يكن المستخدم مسجل دخول: إظهار زر Login وSign Up وإخفاء معلومات المستخدم
      if (navLogin) {
        navLogin.textContent = 'Login';
        navLogin.onclick = () => go('/login.html');
      }
      if (navSignup) navSignup.style.display = 'inline-block'; // إظهار زر Sign Up
      if (userInfoDropdown) userInfoDropdown.style.display = 'none'; // إخفاء معلومات المستخدم
    }
  }
  
  // تهيئة شريط التنقل
  function initTopNav() {
    const homeBtn = document.getElementById('go-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        go('/index.html');
      });
    }
    
    const navAbout = document.getElementById('nav-about');
    if (navAbout) {
      // التمرير إلى قسم About عند النقر على الزر
      navAbout.addEventListener('click', () => {
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
          // إذا كان القسم موجوداً في الصفحة الحالية: التمرير إليه
          aboutSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          // إذا لم يكن موجوداً: الانتقال إلى الصفحة الرئيسية
          go('/index.html');
        }
      });
    }
    
    // تحديث حالة شريط التنقل
    updateNavigationState();
  }

  // ========== تهيئة الصفحة الرئيسية ==========
  
  function initHome() {
    // تهيئة زر Quizzes الكبير
    const quizzesBtn = document.getElementById('home-quizzes');
    if (quizzesBtn) {
      quizzesBtn.addEventListener('click', () => {
        // التحقق من حالة تسجيل الدخول
        if (isLoggedIn()) {
          // إذا كان المستخدم مسجل دخول: الانتقال إلى صفحة الاختبارات
          go('/quizzes.html');
        } else {
          // إذا لم يكن مسجل دخول: الانتقال إلى صفحة تسجيل الدخول
          go('/login.html');
        }
      });
    }
    
    // تحديث حالة شريط التنقل عند تحميل الصفحة
    updateNavigationState();
  }

  /* -----------------------------
   * Local demo auth (مُعطّل الآن)
   * ----------------------------- */
  function setError(inputId, message) {
    const p = document.querySelector(`[data-error-for="${inputId}"]`);
    if (p) p.textContent = message || '';
  }
  function clearErrors(form) { form.querySelectorAll('.error').forEach(e => (e.textContent = '')); }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  function validateSignup(form) {
    clearErrors(form);
    let ok = true;
    const username = form.username?.value.trim();
    const email    = form.email?.value.trim();
    const password = form.password?.value;
    const confirm  = form.confirmPassword?.value;
    const ageRaw   = form.age?.value.trim();
    const stage    = form.stage?.value.trim();
    const userType = (form.userType?.value || '').trim();

    const usernameRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{5,}$/;
    if (!username || !usernameRegex.test(username)) { setError('signup-username', 'Username must be 5+ chars, include 1 capital and 1 number, letters/digits only.'); ok = false; }

    const usersNow = getUsers();
    for (const emailKey in usersNow) {
      const u = usersNow[emailKey]; if (!u) continue;
      const uname = (u.username || emailKey.split('@')[0]).toLowerCase();
      if (uname === (username || '').toLowerCase()) { setError('signup-username', 'This username is already taken.'); ok = false; break; }
    }

    if (!email || !emailRegex.test(email)) { setError('signup-email', 'Enter a valid email.'); ok = false; }
    if (!password || password.length < 8)  { setError('signup-password', 'Password must be at least 8 characters.'); ok = false; }
    if (confirm !== password)              { setError('signup-confirm', 'Passwords do not match.'); ok = false; }

    const age = Number(ageRaw);
    if (!ageRaw || Number.isNaN(age) || age < 1 || age > 120) { setError('signup-age', 'Enter a valid age (1-120).'); ok = false; }
    if (!stage)    { setError('signup-stage', 'This field is required.'); ok = false; }
    if (!userType) { setError('userType',      'Select a user type.');   ok = false; }

    return { ok, values: { username, email, password, userType, age, stage } };
  }

  function validateLogin(form) {
    clearErrors(form);
    let ok = true;
    const username = form.username?.value.trim();
    const password = form.password?.value;
    if (!username) { setError('login-username', 'Enter a valid username.'); ok = false; }
    if (!password) { setError('login-password', 'Password is required.');  ok = false; }
    return { ok, values: { username, password } };
  }

  function initSignup() {
    const stageLabel = document.getElementById('stage-label');
    const stageInput = document.getElementById('signup-stage');
    function updateStageLabel() {
      const selected = ($$("input[name='userType']").find(r => r.checked) || {}).value;
      if (selected === 'school')      { stageLabel.textContent = 'Grade Level';     stageInput.placeholder = 'e.g., Grade 10'; }
      else if (selected === 'university') { stageLabel.textContent = 'University Year'; stageInput.placeholder = 'e.g., Year 2'; }
      else                            { stageLabel.textContent = 'Stage/Level';     stageInput.placeholder = 'e.g., Junior'; }
    }
    $$("input[name='userType']").forEach(r => r.addEventListener('change', updateStageLabel));
    if (stageLabel && stageInput) updateStageLabel();

    const usernameInput   = document.getElementById('signup-username');
    const usernamePreview = document.getElementById('username-preview');
    const previewUpdate = () => {
      const v = (usernameInput?.value || '').trim();
      if (usernamePreview) usernamePreview.textContent = v ? v : '—';
    };
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

      // كان ديمو محلي — مُعطّل الآن لصالح Firebase
      const users = getUsers();
      if (users[values.email]) { setError('signup-email', 'An account with this email already exists.'); return; }
      users[values.email] = { email: values.email, password: values.password, userType: values.userType, age: values.age, stage: values.stage, username: values.username, createdAt: new Date().toISOString() };
      saveUsers(users);

      try { localStorage.setItem('currentUser', values.username); } catch {}
      go('login.html');
    });
  }

  // ========== تهيئة صفحة تسجيل الدخول ==========
  
  function initLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { ok, values } = validateLogin(loginForm);
      if (!ok) return;
      
      // البحث عن المستخدم
      const user = findUserByUsername(values.username);
      if (!user || user.password !== values.password) {
        setError('login-password', 'Invalid username or password.');
        return;
      }
      
      // حفظ المستخدم الحالي وتسجيل الدخول
      const username = user.username || (user.email.split('@')[0]);
      localStorage.setItem('currentUser', username);
      
      // بعد تسجيل الدخول الناجح: الانتقال إلى الصفحة الرئيسية
      window.location.href = '/HTML/index.html';
    });
  }

  function initSuccess() {
    const user = localStorage.getItem('currentUser');
    const el   = document.getElementById('success-user');
    if (el && user) el.innerHTML = `Welcome, <strong>${user}</strong> — your journey starts now.`;

    const confettiBox = document.getElementById('confetti');
    if (confettiBox) {
      confettiBox.innerHTML = '';
      const count = 60;
      for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.style.left = Math.random() * 100 + '%';
        s.style.animationDelay = (Math.random() * 1.2) + 's';
        s.style.background = Math.random() > .5
          ? 'linear-gradient(180deg, var(--brand-blue), var(--brand-cyan))'
          : 'linear-gradient(180deg, #ff8cc6, #ffc46b)';
        confettiBox.appendChild(s);
      }
    }

    const toHome  = document.getElementById('success-home');
    const toLogin = document.getElementById('success-login');
    if (toHome)  toHome.addEventListener('click',  () => go('index.html'));
    if (toLogin) toLogin.addEventListener('click', () => go('login.html'));
  }

  // ========== تهيئة صفحة الاختبارات ==========
  
  function initQuizzes() {
    // إضافة مستمعات الأحداث لأزرار الاختبارات
    const quiz1Btn = document.getElementById('quiz-1');
    const quiz2Btn = document.getElementById('quiz-2');
    const quiz3Btn = document.getElementById('quiz-3');
    
    if (quiz1Btn) {
      quiz1Btn.addEventListener('click', () => {
        // الانتقال إلى صفحة السؤال الأول من الاختبار الأول
        go('/question.html?quiz=1&question=1');
      });
    }
    
    if (quiz2Btn) {
      quiz2Btn.addEventListener('click', () => {
        // الانتقال إلى صفحة السؤال الأول من الاختبار الثاني
        go('/question.html?quiz=2&question=1');
      });
    }
    
    if (quiz3Btn) {
      quiz3Btn.addEventListener('click', () => {
        // الانتقال إلى صفحة السؤال الأول من الاختبار الثالث
        go('/question.html?quiz=3&question=1');
      });
    }
    
    // تحديث حالة شريط التنقل
    updateNavigationState();
  }
  
  // ========== تهيئة صفحة السؤال ==========
  
  function initQuestion() {
    // الحصول على رقم الاختبار ورقم السؤال من URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizNum = urlParams.get('quiz') || '1';
    const questionNum = parseInt(urlParams.get('question') || '1');
    
    // تهيئة المؤقت
    let timeLeft = 60; // 60 ثانية
    const timerElement = document.getElementById('question-timer');
    const questionText = document.getElementById('question-text');
    const nextBtn = document.getElementById('question-next');
    const skipBtn = document.getElementById('question-skip');
    
    // تحديث نص السؤال (يمكن استبداله بأسئلة حقيقية من قاعدة بيانات)
    if (questionText) {
      questionText.textContent = `السؤال ${questionNum} من الاختبار ${quizNum}: ما هو أفضل ممارسة لأمان كلمة المرور؟`;
    }
    
    // تحديث المؤقت كل ثانية
    const timerInterval = setInterval(() => {
      timeLeft--;
      if (timerElement) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // إذا انتهى الوقت
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        if (timerElement) timerElement.textContent = 'انتهى الوقت!';
        // يمكن إضافة منطق للانتقال إلى السؤال التالي أو إنهاء الاختبار
      }
    }, 1000);
    
    // زر Next: الانتقال إلى السؤال التالي
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        const nextQuestion = questionNum + 1;
        go(`/question.html?quiz=${quizNum}&question=${nextQuestion}`);
      });
    }
    
    // زر Skip: تخطي السؤال الحالي
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        const nextQuestion = questionNum + 1;
        go(`/question.html?quiz=${quizNum}&question=${nextQuestion}`);
      });
    }
    
    // تحديث حالة شريط التنقل
    updateNavigationState();
  }
  
  // ========== دالة التهيئة الرئيسية ==========
  
  function boot() {
    // تهيئة جميع المكونات الأساسية
    initThemeControls();
    initTranslateControls();
    initTopNav();
    
    // تهيئة الصفحات حسب نوع الصفحة الحالية
    const page = document.body.getAttribute('data-page');
    if (page === 'home') initHome();
    if (page === 'login') initLogin();
    if (page === 'signup') initSignup();
    if (page === 'success') initSuccess();
    if (page === 'quizzes') initQuizzes();
    if (page === 'question') initQuestion();

    // Password toggles
    try {
      document.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const input = targetId ? document.getElementById(targetId) : btn.previousElementSibling;
          if (input && input.tagName === 'INPUT') {
            const isPassword = input.getAttribute('type') === 'password';
            input.setAttribute('type', isPassword ? 'text' : 'password');
            btn.textContent = isPassword ? '🙈' : '👁️';
            btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
          }
        });
      });
    } catch {}
  }

  // بدء التطبيق عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', boot);
})();
