// public/js/profile.js
document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn()) {
      window.location.href = `/login.html?next=${encodeURIComponent('/profile.html')}`;
      return;
    }
  
    let currentIdentifier = '';
    try { currentIdentifier = localStorage.getItem('currentUser') || ''; } catch {}
  
    const profile   = getProfile();
    const localUser = getCurrentUser();
    const resolved = {
      username: profile?.username || localUser?.username ||
        (currentIdentifier && currentIdentifier.includes('@')
          ? currentIdentifier.split('@')[0]
          : currentIdentifier) || '—',
      fullName: profile?.fullName || localUser?.fullName ||
        profile?.email || localUser?.email || '—',
      email: profile?.email || localUser?.email ||
        (currentIdentifier && currentIdentifier.includes('@') ? currentIdentifier : '') || '—',
      userType: profile?.userType || localUser?.userType || '—',
      age: (profile?.age ?? localUser?.age ?? '—'),
      major: profile?.major || localUser?.major || '—',
      stage: profile?.stage || localUser?.stage || '—',
      university: profile?.university || localUser?.university || '—',
      country: profile?.country || localUser?.country || '—',
      photo: profile?.photo || localUser?.photo || null
    };
  
    const mapping = [
      ['profile-fullname',   resolved.fullName],
      ['profile-email',      resolved.email],
      ['profile-username',   resolved.username],
      ['profile-usertype',   resolved.userType],
      ['profile-age',        resolved.age !== '' && resolved.age !== null ? String(resolved.age) : '—'],
      ['profile-major',      resolved.major],
      ['profile-stage',      resolved.stage],
      ['profile-university', resolved.university || '—'],
      ['profile-country',    resolved.country || '—']
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
  });
  