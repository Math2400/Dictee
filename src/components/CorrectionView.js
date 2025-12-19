/**
 * Correction View Component
 * Displays error analysis, grammar breakdown, and correction details
 */

import { geminiService } from '../services/gemini.js';
import { storageService } from '../services/storage.js';
import { ERROR_TYPES } from '../utils/constants.js';

export class CorrectionView {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.data = app.state.correctionData;
    this.grammarAnalysis = null;
    this.mnemonics = {};
    this.etymologies = {};
    this.multiplayerResults = [];
    this.isMultiplayer = !!app.state.multiplayerDictation;
    this.playAgainVotes = new Set();

    this.render();
    this.setupMultiplayerListeners();
    this.loadEnhancements();
  }

  setupMultiplayerListeners() {
    if (!this.isMultiplayer) return;

    multiplayerService.onResultsUpdate = (payload) => {
      console.log('Results update received:', payload);
      const existing = this.multiplayerResults.find(r => r.playerName === payload.playerName);
      if (existing) {
        Object.assign(existing, payload);
      } else {
        this.multiplayerResults.push(payload);
      }
      this.updateMultiplayerUI();
    };

    multiplayerService.onPlayAgainRequest = (payload) => {
      this.playAgainVotes.add(payload.playerName);
      this.updateMultiplayerUI();

      // If host and everyone voted (or just someone else), or predefined logic
      // For now: if host says play again, everyone goes back to multiplayer view
      if (payload.isHost) {
        this.app.showToast(`${payload.playerName} souhaite rejouer !`, 'info');
        // If host triggers it, we might want to redirect everyone
        // But let's look for a manual click first or shared state
      }

      // If HOST and client is ready, host can click 'Lancer une nouvelle'
    };
  }

  updateMultiplayerUI() {
    const container = document.getElementById('multiplayer-results-container');
    if (container) {
      container.innerHTML = this.renderMultiplayerResults();
      this.attachPlayAgainListener();
    }
  }

  formatTime(seconds) {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  render() {
    const { original, userText, analysis, dictation, theme, elapsedTime, speedMultiplier, points, isPerfect, isFailed } = this.data;

    // Safe access to analysis properties
    const errors = analysis?.errors || [];
    const correctWords = analysis?.correctWords || 0;
    const totalWords = analysis?.totalWords || 0;
    const score = analysis?.score || 0;
    const feedback = analysis?.feedback || '';

    this.container.innerHTML = `
      <div class="correction-view animate-fadeIn">
        <!-- Multiplayer Results (if applicable) -->
        ${this.isMultiplayer ? `
          <section id="multiplayer-results-container" class="multiplayer-results-section">
            ${this.renderMultiplayerResults()}
          </section>
        ` : ''}

        <!-- Score Header -->
        <header class="score-header card ${isFailed ? 'failed' : ''}">
          <div class="score-display">
            <span class="score-value ${isFailed ? 'text-error' : ''}">${score}%</span>
            <span class="score-label">Score de précision</span>
          </div>
          <div class="score-breakdown">
            <div class="score-item">
              <span class="score-item-value ${points >= 0 ? 'positive' : 'negative'}">${points >= 0 ? '+' : ''}${points}</span>
              <span class="score-item-label">Points ${points >= 0 ? 'gagnés' : 'perdus'}</span>
            </div>
            <div class="score-item">
              <span class="score-item-value">${correctWords}/${totalWords}</span>
              <span class="score-item-label">Mots corrects</span>
            </div>
            <div class="score-item">
              <span class="score-item-value ${errors.length === 0 ? 'positive' : 'negative'}">${errors.length}</span>
              <span class="score-item-label">Erreur${errors.length > 1 ? 's' : ''}</span>
            </div>
            <div class="score-item">
              <span class="score-item-value feature-highlight">${this.formatTime(elapsedTime)}</span>
              <span class="score-item-label">Temps</span>
            </div>
            ${speedMultiplier > 1 && !isFailed ? `
              <div class="score-item">
                <span class="score-item-value positive">x${speedMultiplier}</span>
                <span class="score-item-label">Bonus vitesse</span>
              </div>
            ` : ''}
          </div>
          ${isPerfect ? `
            <div class="perfect-badge">
              🌟 Dictée Parfaite!
            </div>
          ` : ''}
          ${isFailed ? `
            <div class="failed-badge">
              ❌ À retravailler
            </div>
          ` : ''}
        </header>

        <!-- Diff View -->
        <section class="diff-section">
          <h2>Comparaison</h2>
          <div class="diff-container">
            <div class="diff-panel diff-correct">
              <div class="diff-panel-header">✓ Texte correct</div>
              <div class="diff-content font-serif">${original}</div>
            </div>
            <div class="diff-panel diff-user">
              <div class="diff-panel-header">Votre texte</div>
              <div class="diff-content font-serif">${this.highlightErrors(userText, errors)}</div>
            </div>
          </div>
        </section>

        <!-- Errors Detail -->
        ${errors.length > 0 ? `
          <section class="errors-section">
            <h2>Analyse des erreurs</h2>
            <div class="errors-list">
              ${errors.map((error, idx) => `
                <div class="error-card card" data-error-index="${idx}">
                  <div class="error-header">
                    <span class="tag tag-${error.type}">${ERROR_TYPES[error.type]?.icon || '❓'} ${ERROR_TYPES[error.type]?.label || error.type}</span>
                    <div class="error-words">
                      <span class="word-error">${error.user}</span>
                      <span class="arrow">→</span>
                      <span class="word-correct">${error.original}</span>
                    </div>
                  </div>
                  
                  <div class="error-trinity">
                    <div class="trinity-item">
                      <h4>📏 Règle</h4>
                      <p>${error.rule}</p>
                    </div>
                    <div class="trinity-item">
                      <h4>💡 Explication</h4>
                      <p>${error.explanation}</p>
                    </div>
                    <div class="trinity-item mnemonic-container" id="mnemonic-${idx}">
                      <h4>🧠 Astuce mnémotechnique</h4>
                      <p class="loading-text">Chargement...</p>
                    </div>
                    ${error.type === 'orthographe' ? `
                      <div class="trinity-item etymology-container" id="etymology-${idx}">
                        <h4>📜 Étymologie</h4>
                        <p class="loading-text">Chargement...</p>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Grammar Analysis -->
        <section class="grammar-section">
          <h2>Analyse grammaticale complète</h2>
          <div class="card">
            <div id="grammar-analysis" class="grammar-content">
              <div class="loading-spinner"></div>
              <p class="text-muted text-center">Analyse en cours...</p>
            </div>
            <div class="grammar-legend">
              <div class="legend-group">
                <h4>Nature (couleurs froides)</h4>
                <div class="legend-items">
                  <span class="nature-noun">Nom</span>
                  <span class="nature-verb">Verbe</span>
                  <span class="nature-adjective">Adjectif</span>
                  <span class="nature-adverb">Adverbe</span>
                  <span class="nature-pronoun">Pronom</span>
                </div>
              </div>
              <div class="legend-group">
                <h4>Fonction (couleurs chaudes)</h4>
                <div class="legend-items">
                  <span class="function-subject">Sujet</span>
                  <span class="function-verb">Verbe</span>
                  <span class="function-object">COD/COI</span>
                  <span class="function-complement">CC</span>
                  <span class="function-attribute">Attribut</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Feedback -->
        <section class="feedback-section card">
          <h3>📝 Commentaire</h3>
          <p class="feedback-text">${feedback || 'Continuez vos efforts !'}</p>
        </section>

        <!-- Actions -->
        <section class="actions-section">
          ${this.isMultiplayer ? `
             <button class="btn btn-primary btn-lg" id="btn-play-again">
                🎮 Rejouer ensemble ${this.playAgainVotes.size > 0 ? `(${this.playAgainVotes.size})` : ''}
             </button>
          ` : `
             <button class="btn btn-primary btn-lg" id="preload-questions">
                ⚡ Précharger les questions
             </button>
             <button class="btn btn-primary btn-lg" id="continue-quiz">
                Continuer vers les Questions →
             </button>
          `}
          <button class="btn btn-secondary" id="back-dashboard">
            Retour au tableau de bord
          </button>
        </section>
      </div>

      <style>
        .multiplayer-results-section {
          margin-bottom: var(--space-4);
        }
        .multiplayer-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-primary-800);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
        }
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-3);
        }
        .player-result-card {
          padding: var(--space-3);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--color-primary-500);
        }
        .player-result-card.waiting {
          opacity: 0.7;
          border-left-color: var(--color-text-muted);
        }
        .result-stats {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-xs);
          margin-top: var(--space-2);
          color: var(--color-text-secondary);
        }
        .correction-view {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        .score-header {
          text-align: center;
          padding: var(--space-8);
        }

        .perfect-badge {
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-6);
          background: linear-gradient(135deg, var(--color-warning-500), var(--color-warning-400));
          border-radius: var(--radius-full);
          color: #000;
          font-weight: var(--font-bold);
          display: inline-block;
          animation: bounce 1s ease infinite;
        }

        .failed-badge {
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-6);
          background: linear-gradient(135deg, var(--color-error-500), var(--color-error-400));
          border-radius: var(--radius-full);
          color: #fff;
          font-weight: var(--font-bold);
          display: inline-block;
        }

        .score-header.failed {
          border: 2px solid var(--color-error-500);
        }

        .text-error {
          color: var(--color-error-400) !important;
        }

        .diff-section h2,
        .errors-section h2,
        .grammar-section h2 {
          margin-bottom: var(--space-4);
        }

        .diff-content {
          line-height: 2;
          font-size: var(--text-lg);
        }

        .errors-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .error-card {
          border-left: 4px solid var(--color-error-500);
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .error-words {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-lg);
        }

        .error-words .arrow {
          color: var(--color-text-muted);
        }

        .error-words .word-error {
          text-decoration: line-through;
          color: var(--color-error-400);
        }

        .error-words .word-correct {
          color: var(--color-success-400);
          font-weight: var(--font-semibold);
        }

        .error-trinity {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
        }

        .trinity-item {
          padding: var(--space-4);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .trinity-item h4 {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-2);
        }

        .trinity-item p {
          font-size: var(--text-sm);
          line-height: 1.6;
        }

        .loading-text {
          color: var(--color-text-muted);
          font-style: italic;
        }

        .grammar-content {
          min-height: 150px;
          padding: var(--space-6);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-xl);
          margin-bottom: var(--space-4);
        }

        .grammar-text {
          font-family: var(--font-serif);
          font-size: var(--text-lg);
          line-height: 2.5;
        }

        .grammar-word {
          position: relative;
          padding: var(--space-1) var(--space-2);
          margin: 0 2px;
          border-radius: var(--radius-sm);
          cursor: help;
          transition: background var(--transition-fast);
        }

        .grammar-word:hover {
          background: rgba(255,255,255,0.1);
        }

        .grammar-legend {
          display: flex;
          gap: var(--space-8);
          flex-wrap: wrap;
        }

        .legend-group h4 {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin-bottom: var(--space-2);
        }

        .legend-items {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
          font-size: var(--text-sm);
        }

        .feedback-section {
          background: var(--color-bg-tertiary);
        }

        .feedback-text {
          font-size: var(--text-lg);
          line-height: 1.8;
          font-style: italic;
        }

        .actions-section {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
      </style>
    `;

    this.attachEventListeners();
  }

  highlightErrors(text, errors) {
    if (!errors || errors.length === 0) return text;

    let result = text;
    // Sort by position descending to avoid offset issues
    const sortedErrors = [...errors].sort((a, b) => (b.position || 0) - (a.position || 0));

    sortedErrors.forEach(error => {
      if (error.user) {
        const regex = new RegExp(`\\b${this.escapeRegex(error.user)}\\b`, 'gi');
        result = result.replace(regex, `<span class="word-error">${error.user}</span>`);
      }
    });

    return result;
  }

  renderMultiplayerResults() {
    const players = multiplayerService.players;
    return `
      <div class="multiplayer-card">
        <h3>📊 Résultats de la partie</h3>
        <div class="results-grid">
          ${players.map(p => {
      const res = this.multiplayerResults.find(r => r.playerName === p.name);
      const isSelf = p.name === multiplayerService.playerName;

      // If self, use current data
      const displayScore = isSelf ? this.data.analysis.score : (res ? res.score : null);
      const displayErrors = isSelf ? this.data.analysis.errors.length : (res ? res.errorCount : null);

      return `
              <div class="player-result-card ${!res && !isSelf ? 'waiting' : ''}">
                <div class="flex justify-between items-center">
                  <strong>${isSelf ? '🍀 Vous' : '👤 ' + p.name}</strong>
                  <span class="text-lg font-bold">${displayScore !== null ? displayScore + '%' : '...'}</span>
                </div>
                ${displayScore !== null ? `
                  <div class="result-stats">
                    <span>❌ ${displayErrors} erreur${displayErrors > 1 ? 's' : ''}</span>
                    ${res?.errorTypes ? `
                       <span class="text-xs opacity-75">${res.errorTypes.map(t => ERROR_TYPES[t]?.icon || '').join(' ')}</span>
                    ` : ''}
                  </div>
                ` : `
                  <div class="text-xs italic mt-2 opacity-50">En cours de correction...</div>
                `}
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  }

  attachPlayAgainListener() {
    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      const btn = document.getElementById('btn-play-again');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏱️ Attente des autres...';
      }
      multiplayerService.requestPlayAgain();

      // If host clicks or second player clicks, we take them back to lobby
      // or if everyone voted. 
      // For simplicity: If host requests play again, guests see notification.
      // If everyone is on this screen, they can all click.
      if (multiplayerService.isHost) {
        // Broadcast a state update to lobby after 2 seconds to give time to see results
        setTimeout(() => {
          multiplayerService.sendRoomState('lobby');
          this.app.navigate('/multiplayer');
        }, 1500);
      }
    });
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async loadEnhancements() {
    const errors = this.data.analysis.errors;

    // Load mnemonics and etymologies for each error
    for (let i = 0; i < errors.length; i++) {
      const error = errors[i];

      // Load mnemonic
      try {
        const mnemonic = await geminiService.generateMnemonic(error.rule, error.original);
        const container = document.getElementById(`mnemonic-${i}`);
        if (container) {
          container.querySelector('p').textContent = mnemonic;
          container.querySelector('p').classList.remove('loading-text');
        }
      } catch (e) {
        console.error('Error loading mnemonic:', e);
      }

      // Load etymology for spelling errors
      if (error.type === 'orthographe') {
        try {
          const etymology = await geminiService.getEtymology(error.original);
          const container = document.getElementById(`etymology-${i}`);
          if (container) {
            container.querySelector('p').textContent = etymology;
            container.querySelector('p').classList.remove('loading-text');
          }
        } catch (e) {
          console.error('Error loading etymology:', e);
        }
      }
    }

    // Load grammar analysis
    await this.loadGrammarAnalysis();
  }

  async loadGrammarAnalysis() {
    const container = document.getElementById('grammar-analysis');
    if (!container) return;

    // 1. Check if analysis is already available (from history or previous run)
    if (this.data.analysis && this.data.analysis.grammarAnalysis) {
      this.renderGrammarAnalysis(this.data.analysis.grammarAnalysis);
      return;
    }

    // 2. Check if we have a promise from DictationView (Auto mode)
    if (this.app.state.grammarAnalysisPromise) {
      this.renderLoadingAnalysis(container);
      try {
        const result = await this.app.state.grammarAnalysisPromise;
        // Clear promise
        this.app.state.grammarAnalysisPromise = null;

        if (result) {
          this.handleAnalysisSuccess(result);
        } else {
          this.renderManualAnalysisButton(container); // Fallback if auto failed silently
        }
      } catch (error) {
        console.error('Erreur chargement analyse:', error);
        this.renderAnalysisError(container, error.message);
      }
      return;
    }

    // 3. Manual Mode (default if no promise and no existing data)
    this.renderManualAnalysisButton(container);
  }

  renderLoadingAnalysis(container) {
    container.innerHTML = `
      <div class="analysis-loading" style="display:flex; flex-direction:column; align-items:center; gap:var(--space-4); padding:var(--space-4);">
        <div class="loading-spinner small"></div>
        <p>Analyse grammaticale en cours...</p>
      </div>
    `;
  }

  renderManualAnalysisButton(container) {
    container.innerHTML = `
        <div class="manual-analysis-container placeholder-card">
            <span class="placeholder-icon">🧠</span>
            <p>L'analyse grammaticale détaillée est prête à être générée.</p>
            <button class="btn btn-primary" id="start-grammar-analysis">
                Lancer l'analyse grammaticale
            </button>
        </div>
        <style>
            .manual-analysis-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--space-4);
                padding: var(--space-6);
                text-align: center;
            }
            .placeholder-card {
                background: var(--color-bg-tertiary);
                border-radius: var(--radius-lg);
                border: 1px dashed var(--color-border);
            }
            .placeholder-icon { font-size: 2.5rem; }
        </style>
    `;

    document.getElementById('start-grammar-analysis')?.addEventListener('click', async () => {
      this.renderLoadingAnalysis(container);
      try {
        const result = await geminiService.analyzeGrammar(this.data.original);
        this.handleAnalysisSuccess(result);
      } catch (error) {
        this.renderAnalysisError(container, error.message);
      }
    });
  }

  handleAnalysisSuccess(result) {
    // 1. Render result
    this.renderGrammarAnalysis(result);

    // 2. Save to history if we have an ID
    if (this.data.historyId) {
      console.log('Saving grammar analysis to history...', this.data.historyId);
      storageService.updateHistoryItem(this.data.historyId, {
        grammarAnalysis: result
      });

      // Update local state too so if we stay on this view it persists
      if (!this.data.analysis) this.data.analysis = {};
      this.data.analysis.grammarAnalysis = result;
    }
  }

  renderAnalysisError(container, message) {
    container.innerHTML = `
        <div class="analysis-error text-center" style="padding:var(--space-4);">
            <p class="text-error mb-2">Erreur: ${message}</p>
            <button class="btn btn-sm btn-secondary" id="retry-grammar">Réessayer</button>
        </div>
      `;
    document.getElementById('retry-grammar')?.addEventListener('click', () => this.loadGrammarAnalysis());
  }

  renderGrammarAnalysis(analysis) {
    const container = document.getElementById('grammar-analysis');
    if (!container) return;

    if (!analysis || !analysis.words || !Array.isArray(analysis.words)) {
      container.innerHTML = `
        <div class="error-state text-center">
          <p class="text-error">Données d'analyse invalides</p>
        </div>
      `;
      return;
    }

    const html = analysis.words.map(word => {
      const natureClass = this.getNatureClass(word.nature);
      const functionClass = this.getFunctionClass(word.function);

      return `
        <span class="grammar-word ${natureClass}" 
              data-nature="${word.natureDetail || word.nature}"
              data-function="${word.functionDetail || word.function}"
              title="${word.natureDetail || word.nature} — ${word.functionDetail || word.function}">
          ${word.word}
          <span class="grammar-tooltip">
            <strong class="${natureClass}">${word.nature}</strong><br>
            <span class="${functionClass}">${word.function}</span>
          </span>
        </span>
      `;
    }).join(' ');

    container.innerHTML = `<div class="grammar-text">${html}</div>`;
  }

  getNatureClass(nature) {
    const mapping = {
      'nom': 'nature-noun',
      'verbe': 'nature-verb',
      'adjectif': 'nature-adjective',
      'adverbe': 'nature-adverb',
      'pronom': 'nature-pronoun',
      'préposition': 'nature-preposition',
      'conjonction': 'nature-conjunction',
      'déterminant': 'nature-determiner',
      'interjection': 'nature-interjection'
    };
    return mapping[nature?.toLowerCase()] || '';
  }

  getFunctionClass(func) {
    const mapping = {
      'sujet': 'function-subject',
      'verbe': 'function-verb',
      'cod': 'function-object',
      'coi': 'function-object',
      'complément': 'function-complement',
      'cc': 'function-complement',
      'attribut': 'function-attribute',
      'épithète': 'function-modifier'
    };
    return mapping[func?.toLowerCase()] || '';
  }

  attachEventListeners() {

    // Preload Questions
    document.getElementById('preload-questions')?.addEventListener('click', async () => {
      const btn = document.getElementById('preload-questions');
      if (btn) btn.disabled = true;

      try {
        const settings = storageService.getSettings();

        // Check if disabled by setting
        let count = settings.postDictationQuestionCount !== undefined ? settings.postDictationQuestionCount : 3;

        const wordCount = this.data.dictation.text.trim().split(/\s+/).length;
        const isShort = wordCount < 30;

        if (isShort && !settings.shortDictationQuestions) {
          this.app.showToast('Questions désactivées pour les dictées courtes.', 'info');
          count = 0;
        }

        if (count === 0) {
          this.app.showToast('Questions après dictée désactivées dans les paramètres.', 'info');
          if (btn) btn.disabled = false;
          return;
        }

        this.app.showToast('Génération des questions en fond...', 'info');
        // 1. Generate Questions
        const questions = await geminiService.generateQuestions(
          this.data.dictation.text,
          this.data.analysis.errors,
          { count: count } // Override with specific post-dictation setting
        );

        // 2. Generate Hidden Error
        const hiddenError = await geminiService.generateHiddenErrorChallenge(
          this.data.theme.name
        );

        // Store in state immediately
        this.app.setState({
          quizData: {
            questions: questions.questions,
            hiddenError,
            correctionData: this.data
          }
        });

        // Persist session
        storageService.saveSession({
          quizData: {
            questions: questions.questions,
            hiddenError,
            correctionData: this.data
          },
          correctionData: this.data,
          currentView: '/correction'
        });

        this.app.showToast('Questions préchargées !', 'success');
        if (btn) {
          btn.textContent = '✓ Questions prêtes';
          btn.classList.add('btn-success');
        }
      } catch (error) {
        console.error('Error preloading:', error);
        this.app.showToast('Erreur préchargement.', 'error');
        if (btn) btn.disabled = false;
      }
    });

    document.getElementById('continue-quiz')?.addEventListener('click', async () => {
      // Check if already loaded
      if (this.app.state.quizData) {
        this.app.navigate('/quiz');
        return;
      }

      this.app.showLoading('Génération des questions...');

      try {
        const settings = storageService.getSettings();
        let count = settings.postDictationQuestionCount !== undefined ? settings.postDictationQuestionCount : 3;

        const wordCount = this.data.dictation.text.trim().split(/\s+/).length;
        const isShort = wordCount < 30;

        if (isShort && !settings.shortDictationQuestions) {
          this.app.showToast('Questions désactivées pour les dictées courtes.', 'info');
          count = 0;
        }

        if (count === 0) {
          this.app.showToast('Questions après dictée désactivées.', 'info');
          this.app.hideLoading();
          return;
        }

        const questions = await geminiService.generateQuestions(
          this.data.dictation.text,
          this.data.analysis.errors,
          { count: count }
        );

        // Also generate hidden error challenge
        const hiddenError = await geminiService.generateHiddenErrorChallenge(
          this.data.theme.name
        );

        this.app.setState({
          quizData: {
            questions: questions.questions,
            hiddenError,
            correctionData: this.data
          }
        });

        this.app.hideLoading();
        this.app.navigate('/quiz');
      } catch (error) {
        console.error('Error generating questions:', error);
        this.app.hideLoading();
        this.app.showToast('Erreur lors de la génération des questions.', 'error');
      }
    });

    document.getElementById('back-dashboard')?.addEventListener('click', () => {
      this.app.navigate('/');
    });

    this.attachPlayAgainListener();

    // Listen for room state changes (e.g. host going back to lobby)
    if (this.isMultiplayer) {
      multiplayerService.onStateUpdate = (payload) => {
        if (payload.state === 'lobby') {
          this.app.showToast('Retour au lobby...', 'info');
          this.app.navigate('/multiplayer');
        }
      };
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
