// public/js/leaderboard.js
// Leaderboard with Firestore integration

import { auth, db } from './firebaseInit.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

(function() {
  'use strict';

  const rowsContainer = document.getElementById('lbRows');
  const searchInput = document.getElementById('lbSearch');
  const scopeSelect = document.getElementById('lbScope');

  if (!rowsContainer) {
    console.warn('Leaderboard rows container not found');
    return;
  }

  let currentData = [];
  let filteredData = [];

  // Check authentication and load leaderboard
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '../login.html';
      return;
    }

    // User is authenticated, load leaderboard
    loadLeaderboard();
  });

  /**
   * Load leaderboard data from Firestore
   */
  async function loadLeaderboard() {
    try {
      // Show loading state
      rowsContainer.innerHTML = '<div class="socx-lb-empty">Loading leaderboard...</div>';

      // Query Firestore: userStats collection, ordered by totalScore desc, limit 10
      const userStatsRef = collection(db, 'userStats');
      const q = query(
        userStatsRef,
        orderBy('totalScore', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        rowsContainer.innerHTML = '<div class="socx-lb-empty">No leaderboard data yet.</div>';
        currentData = [];
        filteredData = [];
        return;
      }

      // Process documents
      currentData = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        currentData.push({
          userId: data.userId || docSnap.id,
          username: data.username || 'User',
          totalScore: data.totalScore || 0,
          bestScore: data.bestScore || 0,
          totalAttempts: data.totalAttempts || 0,
          lastAttemptAt: data.lastAttemptAt || null
        });
      });

      // Sort by totalScore (desc) as backup
      currentData.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

      filteredData = [...currentData];
      renderRows(filteredData);

    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      rowsContainer.innerHTML = '<div class="socx-lb-empty">Ready to receive your points! Start your first challenge now.</div>';
      currentData = [];
      filteredData = [];
    }
  }

  /**
   * Render leaderboard rows
   */
  function renderRows(data) {
    if (!rowsContainer) return;

    if (data.length === 0) {
      rowsContainer.innerHTML = '<div class="socx-lb-empty">No leaderboard data yet.</div>';
      return;
    }

    rowsContainer.innerHTML = data.map((user, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
      const rankDisplay = medal ? `<span class="socx-lb-rank-medal">${medal}</span>` : `#${rank}`;

      // Get initials for avatar
      const initials = getUserInitials(user.username);

      return `
        <div class="socx-lb-row">
          <div class="socx-lb-rank">${rankDisplay}</div>
          <div class="socx-lb-user">
            <div class="socx-lb-avatar">${escapeHtml(initials)}</div>
            <div class="socx-lb-username">${escapeHtml(user.username)}</div>
          </div>
          <div class="socx-lb-level">${formatNumber(user.totalAttempts || 0)} attempts</div>
          <div class="socx-lb-points">
            <span class="socx-lb-points-value">${formatNumber(user.totalScore || 0)}</span>
            ${user.bestScore && user.bestScore > 0 ? `<div style="font-size: 12px; color: var(--muted); margin-top: 4px;">Best: ${formatNumber(user.bestScore)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Get user initials from username
   */
  function getUserInitials(username) {
    if (!username || username.trim() === '') return 'U';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  /**
   * Format number with commas
   */
  function formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return Number(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Filter data by search query
   */
  function filterData(query) {
    if (!query || query.trim() === '') {
      filteredData = [...currentData];
    } else {
      const lowerQuery = query.toLowerCase().trim();
      filteredData = currentData.filter(user =>
        user.username.toLowerCase().includes(lowerQuery)
      );
    }
    renderRows(filteredData);
  }

  /**
   * Handle scope change (currently only global is implemented)
   */
  function handleScopeChange() {
    if (!scopeSelect) return;
    const scope = scopeSelect.value || 'global';
    
    // For now, only global scope is implemented
    // Future: implement weekly/daily filtering
    if (scope === 'global') {
      filteredData = [...currentData];
    } else {
      // Placeholder for future scope filtering
      filteredData = [...currentData];
    }
    
    // Clear search when scope changes
    if (searchInput) {
      searchInput.value = '';
    }
    
    renderRows(filteredData);
  }

  /**
   * Initialize event listeners
   */
  function init() {
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
