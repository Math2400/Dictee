/**
 * Errors Manager Component
 * Manage mistakes and SRS status
 */

import { storageService } from '../services/storage.js';
import { geminiService } from '../services/gemini.js';
import { ERROR_TYPES } from '../utils/constants.js';

export class ErrorsManager {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.errors = storageService.getErrors();
    this.filter = 'all'; // all, due
    this.searchQuery = '';

    this.render();
  }

  render() {
    const filteredErrors = this.getFilteredErrors();
    const dueCount = this.errors.filter(e => new Date(e.srsData.nextReview) <= new Date()).length;

    this.container.innerHTML = `
      <div class="vocabulary-view animate-fadeIn">
        ${this.getSRSLevelModalHTML()}
        <header class="page-header">
          <div>
            <h1 class="text-gradient">Mes Erreurs</h1>
            <p class="text-secondary">${this.errors.length} erreurs enregistrées • ${dueCount} à réviser</p>
          </div>
        </header>

        <!-- Filters -->
        <div class="vocab-filters">
          <div class="filter-tabs">
            <button class="filter-tab ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
              Toutes (${this.errors.length})
            </button>
            <button class="filter-tab ${this.filter === 'due' ? 'active' : ''}" data-filter="due">
              À réviser (${dueCount})
            </button>
          </div>
          <div class="search-box">
            <input type="text" class="input" id="errors-search" placeholder="Rechercher..." value="${this.searchQuery}">
          </div>
        </div>

        <!-- Actions Header -->
        <div class="vocab-actions-header" style="display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" id="quiz-impact-srs" checked>
                <label for="quiz-impact-srs" style="font-size: 0.9em; color: var(--color-text-secondary); cursor: pointer;">Compter pour l'apprentissage</label>
            </div>
            <button class="btn btn-primary" id="start-review-quiz" disabled>
                🧠 Lancer un Quiz de Révision
            </button>
        </div>

        <!-- Errors List -->
        <div class="vocab-list">
          ${filteredErrors.length > 0 ? filteredErrors.map(error => `
            <div class="vocab-card card" data-error-id="${error.id}">
              <div class="vocab-header">
                <div class="error-word-display">
                  <span class="vocab-word text-error">${error.word}</span>
                  <span class="tag tag-${error.type} ms-2">${ERROR_TYPES[error.type]?.label || error.type}</span>
                </div>
                <input type="checkbox" class="error-select-check" data-id="${error.id}" style="transform: scale(1.2);">
              </div>
              
              <div class="error-details mb-3">
                <p><strong>Règle :</strong> ${error.rule}</p>
                ${error.explanation ? `<p class="text-muted text-sm mt-1">${error.explanation}</p>` : ''}
              </div>

              <div class="vocab-meta">
                <span class="srs-status ${this.getSRSStatus(error)}">
                  ${this.getSRSLabel(error)}
                </span>
                <div class="vocab-actions">
                  <button class="btn btn-ghost btn-sm" data-action="mark-learned" data-error-id="${error.id}" title="Marquer comme appris">
                    🎓
                  </button>
                  <button class="btn btn-ghost btn-sm text-error" data-action="delete" data-error-id="${error.id}">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <span class="empty-state-icon">✅</span>
              <h3 class="empty-state-title">Aucune erreur trouvée</h3>
              <p class="empty-state-description">
                ${this.filter === 'all' && !this.searchQuery
        ? 'Bravo ! Vous n\'avez pas encore enregistré d\'erreurs.'
        : 'Aucune erreur ne correspond à vos critères.'}
              </p>
            </div>
          `}
        </div>

        <!-- Bottom Actions -->
        <div class="bottom-actions" style="margin-top: 4rem; text-align: center; border-top: 1px solid var(--color-border); padding-top: 2rem;">
            <div class="data-actions" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                <button class="btn btn-primary btn-sm" id="btn-export-errors">
                    📤 Exporter ma liste
                </button>
                <button class="btn btn-primary btn-sm" id="btn-import-errors-trigger">
                    📥 Importer une liste
                </button>
                <input type="file" id="import-file-input" accept=".json" style="display: none;">
            </div>

            <button class="btn btn-ghost text-error" id="delete-all-errors" style="opacity: 0.7; transition: opacity 0.2s;">
                🗑️ Supprimer TOUTES les erreurs
            </button>
            <div id="back-action-container" class="mt-4">
               <button class="btn btn-ghost" id="back-to-dashboard">
                ← Retour au tableau de bord
              </button>
            </div>
        </div>
      </div>

      <style>
        .vocabulary-view { max-width: 900px; margin: 0 auto; }
        .page-header { margin-bottom: var(--space-6); }
        .vocab-filters { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
        .filter-tabs { display: flex; gap: var(--space-2); }
        .filter-tab { padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--color-text-secondary); transition: all var(--transition-fast); }
        .filter-tab:hover { background: rgba(139, 92, 246, 0.1); color: var(--color-text-primary); }
        .filter-tab.active { background: var(--color-primary-600); color: white; }
        .vocab-list { display: flex; flex-direction: column; gap: var(--space-4); }
        .vocab-card { transition: transform var(--transition-fast); }
        .vocab-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .vocab-word { font-size: var(--text-xl); font-weight: var(--font-semibold); text-decoration: line-through; color: var(--color-error-400); }
        .vocab-meta { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-surface-glass-border); }
        .srs-status { font-size: var(--text-sm); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); }
        .srs-status.due { background: rgba(239, 68, 68, 0.15); color: var(--color-error-400); }
        .srs-status.soon { background: rgba(250, 204, 21, 0.15); color: var(--color-warning-400); }
        .back-action { margin-top: var(--space-8); text-align: center; }
        .ms-2 { margin-left: var(--space-2); }
        .mt-1 { margin-top: var(--space-1); }
        .mb-3 { margin-bottom: var(--space-3); }
        .text-sm { font-size: var(--text-sm); }
        
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .modal-overlay.active { opacity: 1; pointer-events: auto; }
        .modal-content {
            background: var(--color-surface);
            padding: 2rem; border-radius: 1rem;
            width: 100%; max-width: 400px;
            border: 1px solid var(--color-border);
        }
      </style>

      <!-- Configuration Modal -->
      <div class="modal-overlay" id="quiz-config-modal">
        <div class="modal-content animate-slideUp">
            <h3 class="text-xl font-bold mb-4">Configurer le Quiz</h3>
            
            <div class="form-group mb-4">
                <label class="block text-sm font-medium mb-2">Nombre de questions</label>
                <input type="number" id="config-question-count" class="input w-full" min="1" max="20" value="10">
                <p class="text-sm text-secondary mt-1" id="config-max-hint">Maximum disponible : 10</p>
            </div>

            <div class="flex gap-4 justify-end mt-6">
                <button class="btn btn-ghost" id="btn-cancel-config">Annuler</button>
                <button class="btn btn-primary" id="btn-confirm-start">C'est parti ! 🚀</button>
            </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  getSRSLevelModalHTML() {
    return `
      <div class="modal-overlay" id="srs-level-modal">
        <div class="modal-content animate-slideUp">
            <h3 class="text-xl font-bold mb-4">Évaluer votre maîtrise</h3>
            <p class="text-secondary mb-4">À quel point connaissez-vous ce mot/règle ?</p>
            
            <div class="grid-cols-1 gap-2" style="display: grid;">
                <button class="btn btn-ghost text-left" data-quality="0">🔴 0 - À faire aujourd'hui (0j)</button>
                <button class="btn btn-ghost text-left" data-quality="1">🟠 1 - Demain (1j)</button>
                <button class="btn btn-ghost text-left" data-quality="2">🟡 2 - Dans 3 jours</button>
                <button class="btn btn-ghost text-left" data-quality="3">🟢 3 - Dans 1 semaine (7j)</button>
                <button class="btn btn-ghost text-left" data-quality="4">🔵 4 - Dans 1 mois (30j)</button>
                <button class="btn btn-ghost text-left" data-quality="5">🟣 5 - Dans 3 mois (90j)</button>
                <button class="btn btn-ghost text-left" data-quality="6">🎓 6 - Validé (Jamais)</button>
            </div>

            <div class="flex gap-4 justify-end mt-6">
                <button class="btn btn-ghost" id="btn-cancel-srs">Annuler</button>
            </div>
        </div>
      </div>
    `;
  }

  // ... (Filter/Sort methods unchanged) ...

  attachEventListeners() {
    // Filter tabs
    this.container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.filter = tab.dataset.filter;
        this.render();
        this.updateQuizButtonState();
      });
    });

    // Search
    document.getElementById('errors-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
      this.updateQuizButtonState();
    });

    // Delete actions
    this.container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const errorId = btn.dataset.errorId;
        this.deleteError(errorId);
      });
    });

    // Mark as learned actions -> Open SRS Modal
    this.container.querySelectorAll('[data-action="mark-learned"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const errorId = btn.dataset.errorId;
        this.openSRSModal(errorId);
      });
    });

    // SRS Modal Actions
    const srsModal = document.getElementById('srs-level-modal');
    if (srsModal) {
      document.getElementById('btn-cancel-srs')?.addEventListener('click', () => {
        srsModal.classList.remove('active');
      });

      srsModal.querySelectorAll('[data-quality]').forEach(btn => {
        btn.addEventListener('click', () => {
          const quality = parseInt(btn.dataset.quality);
          if (this.currentSRSErrorId) {
            storageService.updateErrorSRS(this.currentSRSErrorId, quality);

            // REFRESH DATA FROM STORAGE IMMEDIATELY
            this.errors = storageService.getErrors(); // <--- CRITICAL FIX

            this.app.showToast(`Niveau mis à jour (Qualité: ${quality})`, 'success');
            srsModal.classList.remove('active');
            this.render();
          }
        });
      });
    }

    // Select Checkboxes
    this.container.querySelectorAll('.error-select-check').forEach(chk => {
      chk.addEventListener('change', () => {
        this.updateQuizButtonState();
      });
    });

    // Back button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
      this.app.navigate('/');
    });

    // Start Quiz Button (Opens Modal)
    document.getElementById('start-review-quiz')?.addEventListener('click', () => {
      this.openConfigModal();
    });

    // Modal Actions
    document.getElementById('btn-cancel-config')?.addEventListener('click', () => {
      document.getElementById('quiz-config-modal').classList.remove('active');
    });

    document.getElementById('btn-confirm-start')?.addEventListener('click', () => {
      const count = parseInt(document.getElementById('config-question-count').value, 10);
      this.startReviewQuiz(count);
    });

    // Delete All Action
    document.getElementById('delete-all-errors')?.addEventListener('click', () => {
      if (confirm('ATTENTION: Vous allez supprimer TOUTES vos erreurs enregistrées.\nputCette action est irréversible.\n\nÊtes-vous sûr ?')) {
        storageService.removeAllErrors();
        this.errors = [];
        this.render();
        this.app.showToast('Toutes les erreurs ont été supprimées.', 'success');
      }
    });

    // --- IMPORT / EXPORT LISTENERS ---

    // Export
    document.getElementById('btn-export-errors')?.addEventListener('click', () => {
      const json = storageService.exportErrors();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dictee-erreurs-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.app.showToast('Liste exportée avec succès !', 'success');
    });

    // Import Trigger
    document.getElementById('btn-import-errors-trigger')?.addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    // File Input Change
    document.getElementById('import-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = storageService.importErrors(event.target.result);
        if (result.success) {
          this.app.showToast(`${result.count} entrées importées avec succès !`, 'success');
          // Refresh data
          this.errors = storageService.getErrors();
          this.render();
        } else {
          this.app.showToast(`Erreur d'import : ${result.message}`, 'error');
        }
      };
      reader.readAsText(file);
      // Reset input to allow re-importing same file if needed
      e.target.value = '';
    });

    // Initial button state check
    this.updateQuizButtonState();
  }

  updateQuizButtonState() {
    const btn = document.getElementById('start-review-quiz');
    if (!btn) return;

    const hasSelection = this.container.querySelectorAll('.error-select-check:checked').length > 0;
    const hasVisibleErrors = this.container.querySelectorAll('.vocab-card').length > 0;

    // Enable if selection exists OR if no selection but visible errors (will take top 10)
    btn.disabled = !(hasSelection || hasVisibleErrors);
  }

  getFilteredErrors() {
    let filtered = [...this.errors];
    const now = new Date();

    // Apply filter
    if (this.filter === 'due') {
      filtered = filtered.filter(v => new Date(v.srsData.nextReview) <= now);
    }

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.word.toLowerCase().includes(query) ||
        (v.rule && v.rule.toLowerCase().includes(query))
      );
    }

    // Sort by next review date
    filtered.sort((a, b) => new Date(a.srsData.nextReview) - new Date(b.srsData.nextReview));

    return filtered;
  }

  getSRSStatus(error) {
    const now = new Date();
    const nextReview = new Date(error.srsData.nextReview);

    if (nextReview <= now) {
      return 'due';
    } else {
      return 'soon';
    }
  }

  getSRSLabel(error) {
    const now = new Date();
    const nextReview = new Date(error.srsData.nextReview);

    if (nextReview <= now) {
      return '⏰ À réviser';
    } else {
      const days = Math.ceil((nextReview - now) / (1000 * 60 * 60 * 24));
      return `📅 Dans ${days} jour${days > 1 ? 's' : ''}`;
    }
  }



  deleteError(errorId) {
    if (confirm('Supprimer cette erreur et arrêter de la réviser ?')) {
      storageService.removeError(errorId);
      // REFRESH FROM STORAGE TO AVOID SYNC ISSUES
      this.errors = storageService.getErrors();
      this.app.showToast('Erreur supprimée.', 'info');
      this.render();
    }
  }

  openSRSModal(errorId) {
    this.currentSRSErrorId = errorId;
    const modal = document.getElementById('srs-level-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  openConfigModal() {
    // Determine potential pool
    const selectedIds = Array.from(this.container.querySelectorAll('.error-select-check:checked')).map(c => c.dataset.id);
    const isSelection = selectedIds.length > 0;
    const totalAvailable = isSelection ? selectedIds.length : this.getFilteredErrors().length;

    if (totalAvailable === 0) {
      this.app.showToast('Aucune erreur disponible.', 'warning');
      return;
    }

    // Populate input
    const input = document.getElementById('config-question-count');
    const hint = document.getElementById('config-max-hint');

    // Default: If selection, use selection size. If no selection, use min(10, total).
    const defaultCount = isSelection ? totalAvailable : Math.min(10, totalAvailable);

    input.value = defaultCount;
    input.max = totalAvailable; // Limit to available errors? Or allow repetition? Let's limit for now.
    hint.textContent = `Sur ${totalAvailable} erreur${totalAvailable > 1 ? 's' : ''} disponible${totalAvailable > 1 ? 's' : ''}`;

    document.getElementById('quiz-config-modal').classList.add('active');
  }

  async startReviewQuiz(count) {
    const modal = document.getElementById('quiz-config-modal');
    const startBtn = document.getElementById('start-review-quiz');
    const confirmBtn = document.getElementById('btn-confirm-start');
    const impactSRS = document.getElementById('quiz-impact-srs').checked;

    // Prepare errors
    const selectedIds = Array.from(this.container.querySelectorAll('.error-select-check:checked')).map(c => c.dataset.id);
    let pool = selectedIds.length > 0
      ? this.errors.filter(e => selectedIds.includes(e.id))
      : this.getFilteredErrors();

    // Slice to configured count
    // If count > pool, we might want to repeat? For now, just slice/clamp.
    if (count < pool.length) {
      pool = pool.slice(0, count);
    }

    modal.classList.remove('active');
    startBtn.disabled = true;
    startBtn.textContent = 'Génération...';

    try {
      const quizResult = await geminiService.generateReviewQuiz(pool); // Pass filtered pool

      if (quizResult && quizResult.questions && quizResult.questions.length > 0) {
        this.app.state.quizData = {
          questions: quizResult.questions,
          isReviewQuiz: true,
          impactSRS: impactSRS,
          sourceErrors: pool
        };
        storageService.saveSession({
          quizData: this.app.state.quizData,
          currentView: '/quiz'
        });
        this.app.navigate('/quiz');
      } else {
        throw new Error('Aucune question générée par l\'IA');
      }
    } catch (e) {
      console.error(e);
      this.app.showToast(`Erreur: ${e.message}`, 'error');
      startBtn.disabled = false;
      startBtn.textContent = '🧠 Lancer un Quiz de Révision';
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
