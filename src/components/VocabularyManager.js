/**
 * Vocabulary Manager Component
 * Manage personal vocabulary with definitions and SRS status
 */

import { storageService } from '../services/storage.js';
import { LEVELS } from '../utils/constants.js';

export class VocabularyManager {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.vocabulary = storageService.getVocabulary();
    this.filter = 'all'; // all, due, mastered
    this.searchQuery = '';

    this.render();
  }

  render() {
    const filteredVocab = this.getFilteredVocabulary();
    const dueCount = this.vocabulary.filter(v => new Date(v.srsData.nextReview) <= new Date()).length;

    this.container.innerHTML = `
      <div class="vocabulary-view animate-fadeIn">
        <header class="page-header">
          <div>
            <h1 class="text-gradient">Mon Vocabulaire</h1>
            <p class="text-secondary">${this.vocabulary.length} mots enregistrés • ${dueCount} à réviser</p>
          </div>
          <button class="btn btn-primary" id="add-word-btn">
            + Ajouter un mot
          </button>
        </header>

        <!-- Filters -->
        <div class="vocab-filters">
          <div class="filter-tabs">
            <button class="filter-tab ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
              Tous (${this.vocabulary.length})
            </button>
            <button class="filter-tab ${this.filter === 'due' ? 'active' : ''}" data-filter="due">
              À réviser (${dueCount})
            </button>
            <button class="filter-tab ${this.filter === 'mastered' ? 'active' : ''}" data-filter="mastered">
              Maîtrisés
            </button>
          </div>
          <div class="search-box">
            <input type="text" class="input" id="vocab-search" placeholder="Rechercher..." value="${this.searchQuery}">
          </div>
        </div>

        <!-- Word List -->
        <div class="vocab-list">
          ${filteredVocab.length > 0 ? filteredVocab.map(word => `
            <div class="vocab-card card" data-word-id="${word.id}">
              <div class="vocab-header">
                <h3 class="vocab-word">${word.word}</h3>
                <span class="tag tag-level">${word.level}</span>
              </div>
              <p class="vocab-definition">${word.definition}</p>
              <div class="vocab-meta">
                <span class="srs-status ${this.getSRSStatus(word)}">
                  ${this.getSRSLabel(word)}
                </span>
                <div class="vocab-actions">
                  <button class="btn btn-ghost btn-sm" data-action="edit" data-word-id="${word.id}">
                    ✏️ Modifier
                  </button>
                  <button class="btn btn-ghost btn-sm" data-action="delete" data-word-id="${word.id}">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state">
              <span class="empty-state-icon">📚</span>
              <h3 class="empty-state-title">Aucun mot trouvé</h3>
              <p class="empty-state-description">
                ${this.filter === 'all' && !this.searchQuery
        ? 'Ajoutez des mots de vocabulaire pour les intégrer à vos dictées.'
        : 'Aucun mot ne correspond à vos critères.'}
              </p>
            </div>
          `}
        </div>

        <!-- Bottom Actions -->
        <div class="bottom-actions" style="margin-top: 4rem; text-align: center; border-top: 1px solid var(--color-border); padding-top: 2rem;">
            <div class="data-actions" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                <button class="btn btn-primary btn-sm" id="btn-export-vocab">
                    📤 Exporter le vocabulaire
                </button>
                <button class="btn btn-primary btn-sm" id="btn-import-vocab-trigger">
                    📥 Importer du vocabulaire
                </button>
                <input type="file" id="import-vocab-input" accept=".json" style="display: none;">
            </div>

           <button class="btn btn-ghost" id="back-to-dashboard">
            ← Retour au tableau de bord
          </button>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-overlay" id="word-modal" style="display: none;">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">Ajouter un mot</h2>
            <button class="modal-close" id="close-modal">✕</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label class="input-label">Mot</label>
              <input type="text" class="input" id="input-word" placeholder="Ex: quintessence">
            </div>
            <div class="input-group">
              <label class="input-label">Définition</label>
              <textarea class="textarea" id="input-definition" rows="3" placeholder="La définition du mot..."></textarea>
            </div>
            <div class="input-group">
              <label class="input-label">Niveau</label>
              <select class="input" id="input-level">
                ${Object.entries(LEVELS).map(([key, val]) => `
                  <option value="${key}">${val.name}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="cancel-modal">Annuler</button>
            <button class="btn btn-primary" id="save-word">Enregistrer</button>
          </div>
        </div>
      </div>

      <style>
        .vocabulary-view {
          max-width: 900px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .vocab-filters {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-2);
        }

        .filter-tab {
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }

        .filter-tab:hover {
          background: rgba(139, 92, 246, 0.1);
          color: var(--color-text-primary);
        }

        .filter-tab.active {
          background: var(--color-primary-600);
          color: white;
        }

        .search-box {
          min-width: 200px;
        }

        .vocab-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .vocab-card {
          transition: transform var(--transition-fast);
        }

        .vocab-card:hover {
          transform: translateX(4px);
        }

        .vocab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .vocab-word {
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
        }

        .vocab-definition {
          color: var(--color-text-secondary);
          margin-bottom: var(--space-4);
          line-height: 1.6;
        }

        .vocab-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-3);
        }

        .srs-status {
          font-size: var(--text-sm);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
        }

        .srs-status.due {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-error-400);
        }

        .srs-status.soon {
          background: rgba(250, 204, 21, 0.15);
          color: var(--color-warning-400);
        }

        .srs-status.mastered {
          background: rgba(34, 197, 94, 0.15);
          color: var(--color-success-400);
        }

        .vocab-actions {
          display: flex;
          gap: var(--space-2);
        }

        .btn-sm {
          padding: var(--space-1) var(--space-3);
          font-size: var(--text-xs);
        }

        .back-action {
          margin-top: var(--space-8);
          text-align: center;
        }

        .input-group {
          margin-bottom: var(--space-4);
        }

        .input-group select.input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23cbd5e1' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
      </style>
    `;

    this.attachEventListeners();
  }

  getFilteredVocabulary() {
    let filtered = [...this.vocabulary];
    const now = new Date();

    // Apply filter
    if (this.filter === 'due') {
      filtered = filtered.filter(v => new Date(v.srsData.nextReview) <= now);
    } else if (this.filter === 'mastered') {
      filtered = filtered.filter(v => v.srsData.repetitions >= 3);
    }

    // Apply search
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.word.toLowerCase().includes(query) ||
        v.definition.toLowerCase().includes(query)
      );
    }

    // Sort by next review date
    filtered.sort((a, b) => new Date(a.srsData.nextReview) - new Date(b.srsData.nextReview));

    return filtered;
  }

  getSRSStatus(word) {
    const now = new Date();
    const nextReview = new Date(word.srsData.nextReview);

    if (word.srsData.repetitions >= 5) {
      return 'mastered';
    } else if (nextReview <= now) {
      return 'due';
    } else {
      return 'soon';
    }
  }

  getSRSLabel(word) {
    const now = new Date();
    const nextReview = new Date(word.srsData.nextReview);

    if (word.srsData.repetitions >= 5) {
      return '✓ Maîtrisé';
    } else if (nextReview <= now) {
      return '⏰ À réviser';
    } else {
      const days = Math.ceil((nextReview - now) / (1000 * 60 * 60 * 24));
      return `📅 Dans ${days} jour${days > 1 ? 's' : ''}`;
    }
  }

  attachEventListeners() {
    // Filter tabs
    this.container.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.filter = tab.dataset.filter;
        this.render();
      });
    });

    // Search
    document.getElementById('vocab-search')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });

    // Add word button
    document.getElementById('add-word-btn')?.addEventListener('click', () => {
      this.openModal();
    });

    // Edit/Delete actions
    this.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wordId = btn.dataset.wordId;
        const action = btn.dataset.action;

        if (action === 'edit') {
          this.openModal(wordId);
        } else if (action === 'delete') {
          this.deleteWord(wordId);
        }
      });
    });

    // Modal controls
    document.getElementById('close-modal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('cancel-modal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('save-word')?.addEventListener('click', () => this.saveWord());

    // Back button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
      this.app.navigate('/');
    });

    // Close modal on overlay click
    document.getElementById('word-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'word-modal') {
        this.closeModal();
      }
    });

    // --- IMPORT / EXPORT LISTENERS ---

    // Export
    document.getElementById('btn-export-vocab')?.addEventListener('click', () => {
      const json = storageService.exportVocabulary();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dictee-vocabulaire-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.app.showToast('Vocabulaire exporté avec succès !', 'success');
    });

    // Import Trigger
    document.getElementById('btn-import-vocab-trigger')?.addEventListener('click', () => {
      document.getElementById('import-vocab-input').click();
    });

    // File Input Change
    document.getElementById('import-vocab-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = storageService.importVocabulary(event.target.result);
        if (result.success) {
          this.app.showToast(`${result.count} mots importés avec succès !`, 'success');
          this.vocabulary = storageService.getVocabulary();
          this.render();
        } else {
          this.app.showToast(`Erreur d'import : ${result.message}`, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  openModal(wordId = null) {
    const modal = document.getElementById('word-modal');
    const title = document.getElementById('modal-title');
    const inputWord = document.getElementById('input-word');
    const inputDefinition = document.getElementById('input-definition');
    const inputLevel = document.getElementById('input-level');

    if (wordId) {
      // Edit mode
      const word = this.vocabulary.find(v => v.id === wordId);
      if (word) {
        title.textContent = 'Modifier le mot';
        inputWord.value = word.word;
        inputDefinition.value = word.definition;
        inputLevel.value = word.level || 'B2';
        modal.dataset.editId = wordId;
      }
    } else {
      // Add mode
      title.textContent = 'Ajouter un mot';
      inputWord.value = '';
      inputDefinition.value = '';
      inputLevel.value = 'B2';
      delete modal.dataset.editId;
    }

    modal.style.display = 'flex';
    inputWord.focus();
  }

  closeModal() {
    const modal = document.getElementById('word-modal');
    modal.style.display = 'none';
    delete modal.dataset.editId;
  }

  saveWord() {
    const modal = document.getElementById('word-modal');
    const word = document.getElementById('input-word')?.value.trim();
    const definition = document.getElementById('input-definition')?.value.trim();
    const level = document.getElementById('input-level')?.value;

    if (!word || !definition) {
      this.app.showToast('Veuillez remplir tous les champs.', 'warning');
      return;
    }

    const editId = modal.dataset.editId;

    if (editId) {
      // Update existing
      storageService.updateVocabularyWord(editId, { word, definition, level });
      this.app.showToast('Mot mis à jour!', 'success');
    } else {
      // Add new
      const added = storageService.addVocabularyWord({ word, definition, level });
      if (added) {
        this.app.showToast('Mot ajouté!', 'success');
      } else {
        this.app.showToast('Ce mot existe déjà.', 'warning');
        return;
      }
    }

    this.vocabulary = storageService.getVocabulary();
    this.closeModal();
    this.render();
  }

  deleteWord(wordId) {
    if (confirm('Supprimer ce mot de votre vocabulaire?')) {
      storageService.deleteVocabularyWord(wordId);
      this.vocabulary = storageService.getVocabulary();
      this.app.showToast('Mot supprimé.', 'info');
      this.render();
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
