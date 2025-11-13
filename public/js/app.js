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
    // تهيئة قائمة الإعدادات الجديدة
    wireDropdown('#settings-dd', '#settings-btn');
    // تهيئة قائمة معلومات المستخدم (إن وُجدت)
    wireDropdown('#user-info-dropdown', '#user-info-btn');

    // استعادة الوضع المحفوظ من localStorage
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'day' || savedTheme === 'night') {
        document.body.setAttribute('data-theme', savedTheme);
      }
    } catch (e) {}

    // التعامل مع أزرار اختيار الثيم داخل الإعدادات
    $$('[data-theme-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-theme-choice');
        if (!choice) return;
        document.body.setAttribute('data-theme', choice);
        try { localStorage.setItem('theme', choice); } catch (e) {}
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
    go('/index.html');
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
    const allowedKeys = ['username', 'fullName', 'email', 'age', 'stage', 'userType', 'major', 'university', 'country', 'photo'];
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

  window.setProfile = setProfile;
  window.getProfile = getProfile;
  window.updateProfile = updateProfile;
  window.getUser = getUser;

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
    const btnSettings = document.getElementById('apply-lang-settings');

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

    if (btnSettings) btnSettings.addEventListener('click', () => {
      const code = (document.getElementById('lang-settings') || {}).value;
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
  
  // تهيئة شريط التنقل
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
    
    // تحديث حالة شريط التنقل (سيقوم بإعداد handlers لـ nav-login و nav-signup)
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
    const fullName = form.fullName?.value.trim();
    const email    = form.email?.value.trim();
    const password = form.password?.value;
    const confirm  = form.confirmPassword?.value;
    const ageRaw   = form.age?.value.trim();
    const major    = form.major?.value.trim();
    const stage    = form.stage?.value.trim();
    const university = form.university?.value.trim();
    const country    = form.country?.value.trim();
    const userType = (form.userType?.value || '').trim();

    const usernameRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{5,}$/;
    if (!username || !usernameRegex.test(username)) { setError('signup-username', 'Username must be 5+ chars, include 1 capital and 1 number, letters/digits only.'); ok = false; }

    if (!fullName) { setError('signup-fullname', 'Full name is required.'); ok = false; }

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
    if (!major)   { setError('signup-major', 'Major is required.'); ok = false; }
    if (!stage)   { setError('signup-stage', 'This field is required.'); ok = false; }
    if (!userType) { setError('userType',      'Select a user type.');   ok = false; }

    return { ok, values: { username, fullName, email, password, userType, age, major, stage, university, country } };
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
      users[values.email] = {
        email: values.email,
        username: values.username,
        fullName: values.fullName,
        password: values.password,
        userType: values.userType,
        age: values.age,
        major: values.major,
        stage: values.stage,
        university: values.university || '',
        country: values.country || '',
        createdAt: new Date().toISOString()
      };
      saveUsers(users);

      try { localStorage.setItem('currentUser', values.username); } catch {}
      try {
        setProfile({
          username: values.username,
          fullName: values.fullName,
          email: values.email,
          age: values.age,
          userType: values.userType,
          major: values.major,
          stage: values.stage,
          university: values.university,
          country: values.country
        });
      } catch (err) {
        console.warn('[signup] setProfile failed', err);
      }
      go('/index.html');
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
      window.location.href = '/index.html';
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
  
  function initProfile() {
    if (!isLoggedIn()) {
      window.location.href = `/login.html?next=${encodeURIComponent('/profile.html')}`;
      return;
    }

    let currentIdentifier = '';
    try { currentIdentifier = localStorage.getItem('currentUser') || ''; } catch {}

    const profile = getProfile();
    const localUser = getCurrentUser();
    const resolved = {
      username: profile?.username || localUser?.username || (currentIdentifier && currentIdentifier.includes('@') ? currentIdentifier.split('@')[0] : currentIdentifier) || '—',
      fullName: profile?.fullName || localUser?.fullName || profile?.email || localUser?.email || '—',
      email: profile?.email || localUser?.email || (currentIdentifier && currentIdentifier.includes('@') ? currentIdentifier : '') || '—',
      userType: profile?.userType || localUser?.userType || '—',
      age: (profile?.age ?? localUser?.age ?? '—'),
      major: profile?.major || localUser?.major || '—',
      stage: profile?.stage || localUser?.stage || '—',
      university: profile?.university || localUser?.university || '—',
      country: profile?.country || localUser?.country || '—',
      photo: profile?.photo || localUser?.photo || null
    };

    const mapping = [
      ['profile-fullname', resolved.fullName],
      ['profile-email', resolved.email],
      ['profile-username', resolved.username],
      ['profile-usertype', resolved.userType],
      ['profile-age', resolved.age !== '' && resolved.age !== null ? String(resolved.age) : '—'],
      ['profile-major', resolved.major],
      ['profile-stage', resolved.stage],
      ['profile-university', resolved.university || '—'],
      ['profile-country', resolved.country || '—']
    ];

    mapping.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value && value !== '' ? value : '—';
    });

    const photoEl = document.getElementById('profile-photo');
    if (photoEl) {
      const defaultSrc = photoEl.dataset?.default || photoEl.getAttribute('data-default');
      photoEl.src = resolved.photo || defaultSrc || photoEl.src;
    }
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
    if (page === 'profile') initProfile();

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
