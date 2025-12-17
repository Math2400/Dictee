/**
 * Training View Component
 * Central hub for launching different types of practice exercises
 */

import { storageService } from '../services/storage.js';
import { geminiService } from '../services/gemini.js';

export class TrainingView {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.stats = storageService.getStatistics();

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="training-view animate-fadeIn">
        <header class="page-header">
          <h1 class="text-gradient">Centre d'Entraînement</h1>
          <p class="text-secondary">Choisissez votre mode d'exercice pour progresser</p>
        </header>

        <div class="training-grid">
          <!-- Carte Grammaire -->
          <div class="training-card card clickable" data-type="grammar">
            <div class="training-icon">📝</div>
            <div class="training-content">
              <h3>Grammaire & Conjugaison</h3>
              <p>Questions ciblées pour renforcer vos bases grammaticales.</p>
            </div>
            <div class="training-action">
              <button class="btn btn-primary btn-sm">Démarrer</button>
            </div>
          </div>

          <!-- Carte Vocabulaire -->
          <div class="training-card card clickable" data-type="vocabulary">
            <div class="training-icon">📚</div>
            <div class="training-content">
              <h3>Vocabulaire</h3>
              <p>Définitions, synonymes et usage des mots.</p>
            </div>
            <div class="training-action">
              <button class="btn btn-primary btn-sm">Démarrer</button>
            </div>
          </div>

          <!-- Carte Professeur Inversé -->
          <div class="training-card card clickable" data-type="professor">
            <div class="training-icon">🎓</div>
            <div class="training-content">
              <h3>Professeur Inversé</h3>
              <p>Trouvez l'erreur cachée dans des phrases littéraires.</p>
            </div>
            <div class="training-action">
              <button class="btn btn-primary btn-sm">Démarrer</button>
            </div>
          </div>

          <!-- Carte Mes Erreurs -->
          <div class="training-card card clickable" data-type="errors">
            <div class="training-icon">🔄</div>
            <div class="training-content">
              <h3>Mes Erreurs</h3>
              <p>Révisez vos fautes passées avec des exercices personnalisés.</p>
            </div>
            <div class="training-action">
              <button class="btn btn-secondary btn-sm">Réviser</button>
            </div>
          </div>
        </div>

        <div class="back-action">
          <button class="btn btn-ghost" id="back-to-dashboard">
            ← Retour au tableau de bord
          </button>
        </div>
      </div>

      <style>
        .training-view { max-width: 900px; margin: 0 auto; }
        .page-header { text-align: center; margin-bottom: var(--space-8); }
        .training-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6); }
        .training-card { display: flex; align-items: flex-start; gap: var(--space-4); padding: var(--space-6); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .training-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary-400); }
        .training-icon { font-size: 2.5rem; background: var(--color-surface-glass); padding: var(--space-3); border-radius: var(--radius-lg); }
        .training-content { flex: 1; }
        .training-content h3 { margin-bottom: var(--space-2); font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--color-text-primary); }
        .training-content p { color: var(--color-text-secondary); font-size: var(--text-sm); line-height: 1.5; }
        .training-action { display: flex; align-items: center; }
        .back-action { margin-top: var(--space-8); text-align: center; }
      </style>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    this.container.querySelectorAll('.training-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        this.handleTrainingSelection(type);
      });
    });

    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
      this.app.navigate('/');
    });
  }

  showLoading(message = 'Chargement en cours...') {
    const existing = document.querySelector('.loading-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay animate-fadeIn';
    overlay.innerHTML = `
          <div class="loading-content">
              <div class="spinner"></div>
              <p class="text-gradient loading-text">${message}</p>
          </div>
          <style>
              .loading-overlay {
                  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(0,0,0,0.85);
                  z-index: 9999;
                  display: flex; align-items: center; justify-content: center;
                  backdrop-filter: blur(8px);
                  pointer-events: all; /* Blocks all clicks */
              }
              .loading-content { text-align: center; }
              .spinner {
                  width: 50px; height: 50px;
                  border: 4px solid rgba(139, 92, 246, 0.3);
                  border-radius: 50%;
                  border-top-color: var(--color-primary-500);
                  animation: spin 1s ease-in-out infinite;
                  margin: 0 auto 1.5rem;
              }
              .loading-text { font-size: 1.5rem; font-weight: bold; }
              @keyframes spin { to { transform: rotate(360deg); } }
          </style>
      `;
    document.body.appendChild(overlay);
  }

  hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.classList.add('animate-fadeOut');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  async handleTrainingSelection(type) {
    if (type === 'errors') {
      this.app.navigate('/errors');
      return;
    }

    this.showConfigModal(type, async (config) => {
      // Show blocking loading screen
      this.showLoading('Génération de votre entraînement...');

      // Default configuration for generic quizzes
      const count = config.count;

      // Create a generic "context" for generation based on type
      let promptType = 'grammar';
      let topic = 'Littérature et Culture Générale';

      if (type === 'vocabulary') promptType = 'vocabulary';
      if (type === 'professor') promptType = 'professor-inverse';

      const contextText = `Génère des questions de type ${promptType} sur le thème ${topic}.`;

      try {
        let questions = [];

        if (type === 'professor') {
          // Generate X professor challenges
          const promises = [];
          for (let i = 0; i < count; i++) {
            // Sequential to avoid hitting rate limits too hard if single key, but service rotates now
            // Better to do parallel to test rotation logic
            promises.push(geminiService.generateHiddenErrorChallenge(topic));
          }
          // Add delay between requests if needed, but let's try Promise.all with robust service
          const results = await Promise.all(promises);

          questions = results.map((q, idx) => ({
            id: `prof-${Date.now()}-${idx}`,
            type: 'professor-inverse',
            ...q
          }));
        } else {
          const dummyText = "La culture française est riche et variée. Elle comprend la littérature, la peinture et la gastronomie. Apprendre le français demande de la patience et de la rigueur.";

          const options = {
            count: count,
            optionsCount: 4,
            types: [type] // 'grammar' or 'vocabulary'
          };

          const result = await geminiService.generateQuestions(dummyText, [], options);
          questions = result.questions;
        }

        if (questions && questions.length > 0) {
          this.app.state.quizData = {
            questions: questions,
            isReviewQuiz: false,
            impactSRS: false
          };
          this.app.navigate('/quiz');
        } else {
          throw new Error('Aucune question générée');
        }

      } catch (e) {
        console.error(e);
        this.app.showToast('Erreur lors de la création du quiz.', 'error');
      } finally {
        this.hideLoading();
      }
    });
  }

  showConfigModal(type, onConfirm) {
    const settings = storageService.getSettings();
    const existingModal = document.querySelector('.config-modal-overlay');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'config-modal-overlay animate-fadeIn';
    modal.innerHTML = `
            <div class="config-modal card">
                <h3>Configuration de l'entraînement</h3>
                <p class="text-secondary mb-4">Personnalisez votre session ${type}</p>
                
                <div class="input-group">
                    <label class="input-label">Nombre de questions: <span id="modal-count-val">${settings.questionCount || 5}</span></label>
                    <input type="range" class="range-input" id="modal-count" min="1" max="10" value="${settings.questionCount || 5}">
                </div>

                <div class="modal-actions">
                    <button class="btn btn-ghost" id="modal-cancel">Annuler</button>
                    <button class="btn btn-primary" id="modal-start">Commencer</button>
                </div>
            </div>
            <style>
                .config-modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                .config-modal {
                    width: 90%; max-width: 400px;
                    background: var(--color-bg-primary);
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-xl);
                }
                .modal-actions {
                    display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6);
                }
            </style>
        `;

    document.body.appendChild(modal);

    const slider = modal.querySelector('#modal-count');
    const countVal = modal.querySelector('#modal-count-val');

    slider.addEventListener('input', (e) => {
      countVal.textContent = e.target.value;
    });

    modal.querySelector('#modal-cancel').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#modal-start').addEventListener('click', () => {
      const count = parseInt(slider.value);
      modal.remove();
      onConfirm({ count });
    });
  }
}
