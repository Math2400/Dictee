/**
 * Dashboard Component
 * Main dashboard with radar chart, statistics, and achievements
 */

import { storageService } from '../services/storage.js';
import { geminiService } from '../services/gemini.js';

export class Dashboard {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.stats = null;

    this.render();
  }

  render() {
    this.stats = storageService.getStatistics();
    const achievements = storageService.getAchievementsConfig();
    const unlockedAchievements = storageService.getAchievements();

    this.container.innerHTML = `
      <div class="dashboard animate-fadeIn">
        <!-- Header -->
        <header class="dashboard-header">
          <div class="welcome-section">
            <h1 class="text-gradient">Bienvenue sur Dictée Intelligente</h1>
            <p class="text-secondary">Améliorez votre maîtrise du français grâce à l'IA</p>
          </div>
          ${!geminiService.isInitialized() ? `
            <div class="api-warning card animate-pulse mb-6">
                 <p>⚠️ Clé API Gemini non configurée. <a href="#/settings" class="text-gradient">Configurer maintenant</a></p>
            </div>
          ` : ''}
          
          <div class="cloud-status-dashboard mt-2">
            ${storageService.getCloudSettings().enabled ? `
              <span class="badge badge-success">☁️ Cloud Actif</span>
              ${storageService.getCloudSettings().lastSync ? `
                <span class="text-xs text-muted">Dernière synchro : ${new Date(storageService.getCloudSettings().lastSync).toLocaleTimeString()}</span>
              ` : ''}
            ` : `
              <span class="badge badge-ghost">📡 Local uniquement</span>
            `}
          </div>
        </header>

        <!-- Quick Actions -->
        <section class="quick-actions">
          <button class="btn btn-primary btn-lg" id="start-dictation">
            <span>📝</span> Nouvelle Dictée
          </button>
          <button class="btn btn-secondary btn-lg" id="review-errors">
            <span>🔄</span> Réviser mes erreurs
          </button>
          <button class="btn btn-secondary btn-lg" id="manage-vocabulary">
            <span>📚</span> Vocabulaire
          </button>
          <button class="btn btn-secondary btn-lg" id="start-training">
            <span>🧠</span> Entraînement
          </button>
          <button class="btn btn-secondary btn-lg" id="goto-multiplayer">
            <span>🎮</span> Multijoueur
          </button>
        </section>

        <!-- Stats Grid -->
        <section class="stats-section">
          <h2>Vos Statistiques</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">${this.stats.profile.totalPoints}</span>
              <span class="stat-label">Points totaux</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${this.stats.profile.totalDictations}</span>
              <span class="stat-label">Dictées complétées</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${this.stats.profile.perfectDictations}</span>
              <span class="stat-label">Dictées parfaites</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${this.stats.profile.streakDays} 🔥</span>
              <span class="stat-label">Jours consécutifs</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${this.stats.totalVocabulary}</span>
              <span class="stat-label">Mots de vocabulaire</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">${this.stats.profile.level}</span>
              <span class="stat-label">Niveau actuel</span>
            </div>
          </div>
        </section>

        <!-- Radar Chart Section -->
        <section class="radar-section">
          <div class="card">
            <h2>Journal de Bord de Maîtrise</h2>
            <p class="text-secondary mb-4">Visualisez vos forces et faiblesses par catégorie</p>
            <div class="radar-container">
              <canvas id="radar-chart" width="400" height="400"></canvas>
            </div>
            <div class="radar-legend">
              <div class="legend-item">
                <span class="legend-dot" style="background: var(--color-primary-400);"></span>
                <span>Grammaire: ${this.stats.strengths.grammaire}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: var(--color-accent-400);"></span>
                <span>Orthographe: ${this.stats.strengths.orthographe}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: var(--color-success-400);"></span>
                <span>Conjugaison: ${this.stats.strengths.conjugaison}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: var(--color-warning-400);"></span>
                <span>Ponctuation: ${this.stats.strengths.ponctuation}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: var(--color-error-400);"></span>
                <span>Attention: ${this.stats.strengths.inattention}%</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Achievements Section -->
        <section class="achievements-section">
          <h2>Médailles et Succès</h2>
          <div class="achievements-grid">
            ${achievements.map(a => {
      const unlocked = unlockedAchievements.includes(a.id);
      return `
                <div class="medal ${unlocked ? 'unlocked' : ''}">
                  <span class="medal-icon ${unlocked ? '' : 'locked'}">${a.icon}</span>
                  <span class="medal-name">${a.name}</span>
                  <span class="medal-description">${a.description}</span>
                  ${a.points > 0 ? `<span class="tag tag-level">+${a.points} pts</span>` : ''}
                </div>
              `;
    }).join('')}
          </div>
        </section>

        <!-- Recent History -->
        ${this.stats.recentHistory.length > 0 ? `
          <section class="history-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h2>Historique Récent</h2>
              <div>
                   <button class="btn btn-sm btn-secondary" id="btn-import-history-trigger" title="Importer une dictée">
                    📥 Importer
                  </button>
                  <input type="file" id="import-history-input" accept=".json" style="display: none;">
              </div>
            </div>
            <div class="history-list">
              ${this.stats.recentHistory.map(h => `
                <div class="history-item card clickable" data-history-id="${h.id}">
                  <div class="history-info">
                    <span class="history-theme">${h.themeName || 'Dictée'}</span>
                    <span class="history-date">${new Date(h.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div class="history-score">
                    <span class="score ${h.score >= 80 ? 'good' : h.score >= 60 ? 'medium' : 'bad'}">${h.score}%</span>
                    <span class="points">+${h.points} pts</span>
                  </div>
                  <div class="history-actions" style="display: flex; gap: 0.5rem;">
                      <button class="btn btn-sm btn-ghost export-history-btn" data-history-id="${h.id}" title="Exporter cette dictée">
                        📤
                      </button>
                      <button class="btn btn-sm btn-ghost redo-btn" data-history-id="${h.id}" title="Refaire cette dictée">
                        🔄
                      </button>
                      <button class="btn btn-sm btn-ghost text-error delete-history-btn" data-history-id="${h.id}" title="Supprimer de l'historique">
                        🗑️
                      </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
      </div>

      <style>
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .dashboard-header {
          text-align: center;
          padding: var(--space-8) 0;
        }

        .dashboard-header h1 {
          font-size: var(--text-4xl);
          margin-bottom: var(--space-2);
        }

        .quick-actions {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .quick-actions .btn {
          min-width: 200px;
        }

        .stats-section h2,
        .achievements-section h2,
        .history-section h2,
        .radar-section h2 {
          margin-bottom: var(--space-6);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-4);
        }

        .radar-section .card {
          max-width: 600px;
          margin: 0 auto;
        }

        .radar-container {
          display: flex;
          justify-content: center;
          margin: var(--space-6) 0;
        }

        .radar-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-4);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-4);
        }

        .medal {
          background: var(--color-surface-glass);
          border: 1px solid var(--color-surface-glass-border);
          border-radius: var(--radius-xl);
          transition: all var(--transition-normal);
        }

        .medal.unlocked {
          border-color: var(--color-primary-400);
          box-shadow: var(--shadow-glow);
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .history-theme {
          font-weight: var(--font-medium);
        }

        .history-date {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .history-score {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .history-score .score {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
        }

        .history-score .score.good { color: var(--color-success-400); }
        .history-score .score.medium { color: var(--color-warning-400); }
        .history-score .score.bad { color: var(--color-error-400); }

        .history-score .points {
          font-size: var(--text-sm);
          color: var(--color-primary-400);
        }

        .api-warning {
          display: inline-block;
          padding: var(--space-3) var(--space-5);
        }

        .api-warning a {
          text-decoration: underline;
          font-weight: var(--font-medium);
        }

        .clickable {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .clickable:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
      </style>
    `;

    this.attachEventListeners();
    this.drawRadarChart();
  }

  attachEventListeners() {
    document.getElementById('start-dictation')?.addEventListener('click', () => {
      if (!geminiService.isInitialized()) {
        this.app.showToast('Veuillez d\'abord configurer votre clé API Gemini', 'warning');
        this.app.navigate('/settings');
        return;
      }
      this.app.navigate('/dictation');
    });

    document.getElementById('review-errors')?.addEventListener('click', () => {
      const errorsToReview = storageService.getErrorsToReview();
      if (errorsToReview.length === 0) {
        this.app.showToast('Aucune erreur à réviser pour le moment!', 'info');
        // On peut quand même laisser aller voir la liste
        this.app.navigate('/errors');
        return;
      }
      // Naviguer vers le gestionnaire d'erreurs
      this.app.navigate('/errors');
    });

    document.getElementById('manage-vocabulary')?.addEventListener('click', () => {
      this.app.navigate('/vocabulary');
    });

    document.getElementById('start-training')?.addEventListener('click', () => {
      this.app.navigate('/training');
    });

    document.getElementById('goto-multiplayer')?.addEventListener('click', () => {
      this.app.navigate('/multiplayer');
    });

    // Clickable History Items
    this.container.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.historyId;
        // Récupérer l'historique complet car stats.recentHistory peut être tronqué
        const fullHistory = storageService.getHistory();
        const entry = fullHistory.find(h => h.id === id);

        if (entry && entry.original && entry.analysis) {
          // Charger les données dans l'état pour CorrectionView
          this.app.setState({
            correctionData: {
              original: entry.original,
              userText: entry.userText,
              analysis: entry.analysis,
              dictation: entry.dictation,
              theme: { id: entry.themeId, name: entry.themeName }, // Reconstruction partielle
              elapsedTime: entry.time,
              speedMultiplier: 1, // Pas pertinent en review
              points: entry.points,
              isPerfect: entry.isPerfect,
              isFailed: entry.isFailed
            }
          });
          this.app.navigate('/correction');
        } else {
          this.app.showToast('Détails indisponibles pour cette dictée ancienne.', 'info');
        }
      });
    });

    // Redo Button - ROBUST IMPLEMENTATION (using storage)
    this.container.querySelectorAll('.redo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent opening correction view
        const id = btn.dataset.historyId;
        const fullHistory = storageService.getHistory();
        const entry = fullHistory.find(h => h.id === id);

        if (entry && entry.dictation) {
          // Save to session storage to persist across navigation/reloads
          storageService.setPendingRedo({
            dictation: entry.dictation,
            originalScore: entry.score,
            theme: { id: entry.themeId || 'unknown', name: entry.themeName || 'Dictée' }
          });

          // Clear app state just in case to force reading from storage
          this.app.setState({ redoData: null });

          this.app.navigate('/dictation');
        } else {
          this.app.showToast('Impossible de refaire cette dictée (données manquantes)', 'error');
        }
      });
    });

    // Delete History Button
    this.container.querySelectorAll('.delete-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Supprimer cette dictée de l\'historique ?')) {
          const id = btn.dataset.historyId;
          storageService.deleteHistoryItem(id);
          this.app.showToast('Dictée supprimée.', 'info');
          this.render(); // Refresh list
        }
      });
    });

    // --- EXPORT HISTORY ---
    this.container.querySelectorAll('.export-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.historyId;
        try {
          const json = storageService.exportHistoryItem(id);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dictee-archive-${id.substr(0, 6)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.app.showToast('Dictée exportée !', 'success');
        } catch (err) {
          this.app.showToast('Erreur export: ' + err.message, 'error');
        }
      });
    });

    // --- IMPORT HISTORY ---
    document.getElementById('btn-import-history-trigger')?.addEventListener('click', () => {
      document.getElementById('import-history-input').click();
    });

    document.getElementById('import-history-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = storageService.importHistoryItem(event.target.result);
        if (result.success) {
          this.app.showToast('Dictée importée dans l\'historique !', 'success');
          // Reload dashboard to show new item
          this.render();
        } else {
          this.app.showToast(`Erreur d'import : ${result.message}`, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  drawRadarChart() {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 50;

    const categories = [
      { name: 'Grammaire', value: this.stats.strengths.grammaire, color: '#a78bfa' },
      { name: 'Orthographe', value: this.stats.strengths.orthographe, color: '#22d3ee' },
      { name: 'Conjugaison', value: this.stats.strengths.conjugaison, color: '#4ade80' },
      { name: 'Ponctuation', value: this.stats.strengths.ponctuation, color: '#fbbf24' },
      { name: 'Attention', value: this.stats.strengths.inattention, color: '#f87171' }
    ];

    const angleStep = (2 * Math.PI) / categories.length;
    const startAngle = -Math.PI / 2; // Start from top

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background circles
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axis lines and labels
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    categories.forEach((cat, i) => {
      const angle = startAngle + i * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw label
      const labelX = centerX + Math.cos(angle) * (radius + 25);
      const labelY = centerY + Math.sin(angle) * (radius + 25);
      ctx.fillText(cat.name, labelX, labelY + 4);
    });

    // Draw data polygon
    ctx.beginPath();
    categories.forEach((cat, i) => {
      const angle = startAngle + i * angleStep;
      const value = cat.value / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Stroke the polygon
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    categories.forEach((cat, i) => {
      const angle = startAngle + i * angleStep;
      const value = cat.value / 100;
      const x = centerX + Math.cos(angle) * radius * value;
      const y = centerY + Math.sin(angle) * radius * value;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = cat.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  destroy() {
    // Cleanup if needed
  }
}
