// public/js/leaderboard.js
// Leaderboard rendering and filtering

(function() {
  'use strict';

  // Mock data for different scopes
  const mockData = {
    global: [
      { username: 'CyberMaster', level: 25, points: 12500, avatar: 'CM' },
      { username: 'SecurityPro', level: 23, points: 11800, avatar: 'SP' },
      { username: 'HackerHunter', level: 22, points: 11450, avatar: 'HH' },
      { username: 'NetGuard', level: 21, points: 10900, avatar: 'NG' },
      { username: 'CodeBreaker', level: 20, points: 10200, avatar: 'CB' },
      { username: 'FireWall', level: 19, points: 9800, avatar: 'FW' },
      { username: 'DataShield', level: 18, points: 9200, avatar: 'DS' },
      { username: 'CryptoVault', level: 17, points: 8750, avatar: 'CV' },
      { username: 'SafeNet', level: 16, points: 8200, avatar: 'SN' },
      { username: 'SecureGate', level: 15, points: 7800, avatar: 'SG' },
      { username: 'ByteGuard', level: 14, points: 7200, avatar: 'BG' },
      { username: 'PhishBuster', level: 13, points: 6800, avatar: 'PB' },
      { username: 'MalwareKiller', level: 12, points: 6400, avatar: 'MK' },
      { username: 'ThreatWatch', level: 11, points: 5900, avatar: 'TW' },
      { username: 'CyberShield', level: 10, points: 5400, avatar: 'CS' }
    ],
    weekly: [
      { username: 'CyberMaster', level: 25, points: 3200, avatar: 'CM' },
      { username: 'SecurityPro', level: 23, points: 2850, avatar: 'SP' },
      { username: 'HackerHunter', level: 22, points: 2700, avatar: 'HH' },
      { username: 'NetGuard', level: 21, points: 2500, avatar: 'NG' },
      { username: 'CodeBreaker', level: 20, points: 2300, avatar: 'CB' },
      { username: 'FireWall', level: 19, points: 2100, avatar: 'FW' },
      { username: 'DataShield', level: 18, points: 1950, avatar: 'DS' },
      { username: 'CryptoVault', level: 17, points: 1800, avatar: 'CV' },
      { username: 'SafeNet', level: 16, points: 1650, avatar: 'SN' },
      { username: 'SecureGate', level: 15, points: 1500, avatar: 'SG' }
    ],
    daily: [
      { username: 'CyberMaster', level: 25, points: 850, avatar: 'CM' },
      { username: 'SecurityPro', level: 23, points: 720, avatar: 'SP' },
      { username: 'HackerHunter', level: 22, points: 680, avatar: 'HH' },
      { username: 'NetGuard', level: 21, points: 620, avatar: 'NG' },
      { username: 'CodeBreaker', level: 20, points: 580, avatar: 'CB' },
      { username: 'FireWall', level: 19, points: 540, avatar: 'FW' },
      { username: 'DataShield', level: 18, points: 500, avatar: 'DS' },
      { username: 'CryptoVault', level: 17, points: 460, avatar: 'CV' }
    ]
  };

  const rowsContainer = document.getElementById('lbRows');
  const searchInput = document.getElementById('lbSearch');
  const scopeSelect = document.getElementById('lbScope');

  if (!rowsContainer) {
    console.warn('Leaderboard rows container not found');
    return;
  }

  let currentScope = 'global';
  let currentData = mockData[currentScope];
  let filteredData = currentData;

  // Render leaderboard rows
  function renderRows(data) {
    if (!rowsContainer) return;

    if (data.length === 0) {
      rowsContainer.innerHTML = '<div class="socx-lb-empty">No users found</div>';
      return;
    }

    rowsContainer.innerHTML = data.map((user, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
      const rankDisplay = medal ? `<span class="socx-lb-rank-medal">${medal}</span>` : rank;

      return `
        <div class="socx-lb-row">
          <div class="socx-lb-rank">${rankDisplay}</div>
          <div class="socx-lb-user">
            <div class="socx-lb-avatar">${user.avatar}</div>
            <div class="socx-lb-username">${escapeHtml(user.username)}</div>
          </div>
          <div class="socx-lb-level">Level ${user.level}</div>
          <div class="socx-lb-points">
            <span class="socx-lb-points-value">${formatNumber(user.points)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Format number with commas
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Filter data by search query
  function filterData(query) {
    if (!query || query.trim() === '') {
      filteredData = currentData;
    } else {
      const lowerQuery = query.toLowerCase().trim();
      filteredData = currentData.filter(user =>
        user.username.toLowerCase().includes(lowerQuery)
      );
    }
    renderRows(filteredData);
  }

  // Handle scope change
  function handleScopeChange() {
    if (!scopeSelect) return;
    currentScope = scopeSelect.value || 'global';
    currentData = mockData[currentScope] || [];
    filteredData = currentData;
    
    // Clear search when scope changes
    if (searchInput) {
      searchInput.value = '';
    }
    
    renderRows(filteredData);
  }

  // Initialize
  function init() {
    // Render initial data
    renderRows(currentData);

    // Setup search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterData(e.target.value);
      });
    }

    // Setup scope dropdown
    if (scopeSelect) {
      scopeSelect.addEventListener('change', handleScopeChange);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

