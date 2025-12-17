/**
 * Theme Selector Component
 * Allows user to select a narrative theme for dictation
 */

import { storageService } from '../services/storage.js';

export class ThemeSelector {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.themes = storageService.getThemes();

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="theme-selector animate-fadeIn">
        <header class="page-header">
          <h1 class="text-gradient">Choisissez votre Thème</h1>
          <p class="text-secondary">Plongez dans une histoire captivante tout en améliorant votre français</p>
        </header>

        <div class="themes-grid">
          ${this.themes.map(theme => `
            <div class="theme-card ${theme.isCustom ? 'custom-theme' : ''}" data-theme-id="${theme.id}">
              <div class="theme-header">
                <span class="theme-icon">${theme.icon}</span>
                ${theme.isCustom ? `
                    <button class="btn-icon delete-theme-btn" data-theme-id="${theme.id}" title="Supprimer ce thème">✕</button>
                ` : ''}
              </div>
              <h3 class="theme-name">${theme.name}</h3>
              <p class="theme-description">${theme.description}</p>
              
              ${theme.progress > 0 ? `
                <div class="theme-progress">
                  <span class="progress-label">Épisode ${theme.progress}</span>
                  <div class="progress-container" style="flex: 1;">
                    <div class="progress-bar" style="width: ${Math.min(theme.progress * 10, 100)}%;"></div>
                  </div>
                </div>
                ${theme.lastDictation ? `
                  <p class="theme-excerpt">"${theme.lastDictation.slice(0, 60)}..."</p>
                ` : ''}
                <div class="theme-actions">
                  <button class="btn btn-primary continue-btn" data-theme-id="${theme.id}">
                    Continuer
                  </button>
                  <button class="btn btn-ghost new-story-btn" data-theme-id="${theme.id}">
                    Recommencer
                  </button>
                </div>
              ` : `
                <div class="theme-actions">
                  <button class="btn btn-primary start-btn" data-theme-id="${theme.id}">
                    Commencer
                  </button>
                </div>
              `}
            </div>
          `).join('')}

          <!-- Create Custom Theme Card -->
          <div class="theme-card create-card" id="create-theme-btn">
            <span class="theme-icon">✨</span>
            <h3 class="theme-name">Thème Personnalisé</h3>
            <p class="theme-description">Créez votre propre aventure ou sujet d'étude spécifique.</p>
            <div class="theme-actions mt-auto">
              <button class="btn btn-outline-primary w-full">
                + Créer un thème
              </button>
            </div>
          </div>
        </div>

        <div class="back-action">
          <button class="btn btn-ghost" id="back-to-dashboard">
            ← Retour au tableau de bord
          </button>
        </div>
      </div>

      <!-- Create Theme Modal -->
      <div class="modal-overlay" id="theme-modal" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Créer un nouveau thème</h2>
            <button class="modal-close" id="close-theme-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label class="input-label">Nom du thème</label>
              <input type="text" class="input" id="theme-name" placeholder="Ex: Voyage au Japon">
            </div>
            <div class="input-group">
              <label class="input-label">Description / Contexte</label>
              <textarea class="textarea" id="theme-context" rows="4" placeholder="Décrivez le contexte de l'histoire ou le sujet que vous souhaitez aborder... (Ex: Une aventure culinaire à travers les régions du Japon)"></textarea>
            </div>
            <div class="input-group">
              <label class="input-label">Icône (Emoji)</label>
              <input type="text" class="input" id="theme-icon" placeholder="🇯🇵" maxlength="2" style="width: 60px; text-align: center;">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-theme-modal">Annuler</button>
            <button class="btn btn-primary" id="save-theme">Créer</button>
          </div>
        </div>
      </div>

      <style>
        .theme-selector {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: var(--space-10);
        }

        .page-header h1 {
          font-size: var(--text-3xl);
          margin-bottom: var(--space-3);
        }

        .themes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-6);
        }

        .theme-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
        }

        .theme-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .delete-theme-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            font-size: var(--text-lg);
            padding: var(--space-1);
        }
        .delete-theme-btn:hover {
            color: var(--color-error-400);
        }

        .create-card {
            border: 2px dashed var(--color-primary-500);
            background: rgba(139, 92, 246, 0.05);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .create-card:hover {
            background: rgba(139, 92, 246, 0.1);
            transform: translateY(-2px);
        }

        .theme-card .theme-progress {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .theme-card .progress-label {
          font-size: var(--text-xs);
          color: var(--color-primary-400);
          white-space: nowrap;
        }

        .theme-excerpt {
          font-size: var(--text-sm);
          font-style: italic;
          color: var(--color-text-muted);
          margin-bottom: var(--space-4);
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          font-family: var(--font-serif);
        }

        .theme-actions {
          display: flex;
          gap: var(--space-3);
          margin-top: auto;
          flex-wrap: wrap;
        }

        .theme-actions .btn {
          flex: 1;
          min-width: 120px; 
        }

        .back-action {
          margin-top: var(--space-10);
          text-align: center;
        }

        .w-full { width: 100%; }
        .mt-auto { margin-top: auto; }
      </style>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Start new theme
    this.container.querySelectorAll('.start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeId = btn.dataset.themeId;
        this.startDictation(themeId, false);
      });
    });

    // Continue existing story
    this.container.querySelectorAll('.continue-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeId = btn.dataset.themeId;
        this.startDictation(themeId, true);
      });
    });

    // Start new story on existing theme
    this.container.querySelectorAll('.new-story-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeId = btn.dataset.themeId;
        // Reset narrative state
        storageService.updateTheme(themeId, {
          progress: 0,
          narrativeState: null,
          lastDictation: null
        });
        this.startDictation(themeId, false);
      });
    });

    // Delete theme
    this.container.querySelectorAll('.delete-theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Voulez-vous vraiment supprimer ce thème ?')) {
          storageService.deleteTheme(btn.dataset.themeId);
          this.themes = storageService.getThemes();
          this.render();
        }
      });
    });

    // Create Custom Theme Modal
    document.getElementById('create-theme-btn')?.addEventListener('click', () => {
      this.openModal();
    });

    document.getElementById('close-theme-modal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancel-theme-modal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('save-theme')?.addEventListener('click', () => this.saveTheme());
    document.getElementById('theme-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'theme-modal') this.closeModal();
    });

    // Card click (handle carefully to avoid conflict with buttons)
    this.container.querySelectorAll('.theme-card:not(.create-card)').forEach(card => {
      card.addEventListener('click', (e) => {
        // Ignore clicks on buttons inside card
        if (e.target.closest('button')) return;

        const themeId = card.dataset.themeId;
        const theme = this.themes.find(t => t.id === themeId);
        if (theme.progress > 0) {
          this.startDictation(themeId, true);
        } else {
          this.startDictation(themeId, false);
        }
      });
    });

    // Back button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
      this.app.navigate('/');
    });
  }

  openModal() {
    const modal = document.getElementById('theme-modal');
    if (!modal) return;
    document.getElementById('theme-name').value = '';
    document.getElementById('theme-context').value = '';
    document.getElementById('theme-icon').value = '';
    modal.style.display = 'flex';
    document.getElementById('theme-name').focus();
  }

  closeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) modal.style.display = 'none';
  }

  saveTheme() {
    const name = document.getElementById('theme-name').value.trim();
    const context = document.getElementById('theme-context').value.trim();
    const icon = document.getElementById('theme-icon').value.trim() || '✨';

    if (!name) {
      this.app.showToast('Veuillez donner un nom au thème.', 'warning');
      return;
    }

    storageService.addTheme({
      name,
      description: context || 'Thème personnalisé',
      context: context, // Pour le prompt Gemini
      icon
    });

    this.closeModal();
    this.themes = storageService.getThemes();
    this.app.showToast('Thème créé avec succès !', 'success');
    this.render();
  }

  startDictation(themeId, continueStory) {
    const theme = storageService.getTheme(themeId);
    this.app.setState({
      currentTheme: theme,
      continueStory: continueStory
    });
    this.app.navigate(`/dictation/${themeId}`);
  }

  destroy() {
    // Cleanup if needed
  }
}
