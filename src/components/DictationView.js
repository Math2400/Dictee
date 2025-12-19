/**
 * Dictation View Component
 * Main dictation interface with TTS, timer, and text input
 */

import { geminiService } from '../services/gemini.js';
import { audioService } from '../services/audio.js';
import { storageService } from '../services/storage.js';
import { multiplayerService } from '../services/multiplayer.js';
import { TIMER_THRESHOLDS, SCORING } from '../utils/constants.js';

export class DictationView {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.theme = app.state.currentTheme;
    this.dictation = null;
    this.isTimerRunning = false;
    this.hasStartedWriting = false;
    this.draft = storageService.getDraft();
    this.redoData = this.app.state.redoData || null;
    this.minLength = 20;
    this.maxLength = 50; // Default

    this.init();
    this.elapsedSeconds = 0; // Initialize timer
    this.settings = storageService.getSettings(); // Load settings
    this.pressedKeys = new Set(); // Track currently pressed keys
  }

  async init() {
    // 0. Check for Storage-based Redo (Higher priority and robustness)
    const storageRedo = storageService.getPendingRedo();
    if (storageRedo) {
      // Hydrate Dictation State
      this.dictation = storageRedo.dictation;

      // Ensure Sentences Array exists (Critical for Audio/Render)
      if (!this.dictation.sentences || this.dictation.sentences.length === 0) {
        // Simple fallback if sentences weren't saved
        this.dictation.sentences = this.dictation.text.match(/[^.!?]+[.!?]+/g) || [this.dictation.text];
      }

      // Restore Theme (if possible, otherwise keep current)
      // If the stored dictation has metadata about the theme, use it?
      // For now, we assume current theme context or just use generic.
      // But render() uses this.theme.name...

      console.log("Redo initiated with:", this.dictation);

      this.render();

      // FORCE AUDIO SETUP WITH DELAY TO ENSURE DOM IS READY
      setTimeout(() => {
        if (this.dictation.text) {
          this.setupAudio();
          this.attachEventListeners();
          // Auto-start audio generation if check is needed?
          // usually setupAudio does it.
        }
      }, 100);

      storageService.clearPendingRedo();
      return;
    }

    // 0.5 Check for Multiplayer Dictation (Passed via state)
    if (this.app.state.multiplayerDictation) {
      this.dictation = this.app.state.multiplayerDictation;
      this.isMultiplayer = true;
      this.render();
      setTimeout(() => {
        this.setupAudio();
        this.attachEventListeners();
      }, 100);
      // Clean up from state? NO, keep it for re-renders and robustness
      // this.app.setState({ multiplayerDictation: null }); 
      return;
    }

    // 1. Check for State-based Redo (Legacy/Fallback)
    if (this.redoData) {
      this.dictation = this.redoData.dictation;
      this.render();
      // Force immediate audio setup and listeners
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        this.setupAudio();
        this.attachEventListeners();
      }, 0);

      // Clear redo state to avoid loops
      this.app.setState({ redoData: null });
      return;
    }

    // 2. Check for Draft
    if (this.draft) {
      this.renderResume();
      return;
    }

    // 3. New Dictation -> Setup Screen
    this.renderSetup();
  }

  renderSetup() {
    this.container.innerHTML = `
      <div class="setup-view card animate-fadeIn">
        <h2 class="text-gradient">Nouvelle Dictée</h2>
        <p class="text-secondary mb-6">Personnalisez votre session</p>

        <div class="setup-controls">
          <div class="control-group">
             <label class="label">Longueur (mots)</label>
             <div class="slider-container">
               <input type="range" id="length-slider" min="10" max="500" value="50" step="10" class="range-input">
               <input type="number" id="length-input" min="10" max="500" value="50" class="number-input">
             </div>
             <p class="text-muted text-sm mt-2">Entre 10 et 500 mots</p>
          </div>
        </div>

        <div class="setup-actions mt-8">
           <button class="btn btn-primary btn-lg w-full" id="start-btn">
             Commencer la dictée
           </button>
        </div>
      </div>
      <style>
        .setup-view { max-width: 500px; margin: 10vh auto; padding: var(--space-8); text-align: center; }
        .slider-container { display: flex; align-items: center; gap: var(--space-4); justify-content: center; }
        .range-input { flex: 1; }
        .number-input { width: 80px; padding: var(--space-2); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); text-align: center; }
      </style>
    `;

    const slider = document.getElementById('length-slider');
    const input = document.getElementById('length-input');

    // Sync inputs
    slider?.addEventListener('input', (e) => {
      if (input) input.value = e.target.value;
      this.updateLengthSettings(e.target.value);
    });
    input?.addEventListener('input', (e) => {
      if (slider) slider.value = e.target.value;
      this.updateLengthSettings(e.target.value);
    });

    document.getElementById('start-btn')?.addEventListener('click', () => {
      this.startNewDictation();
    });
  }

  updateLengthSettings(val) {
    const v = parseInt(val);
    if (!isNaN(v)) {
      this.minLength = Math.max(10, v - 10);
      this.maxLength = Math.min(500, v + 10);
    }
  }

  renderResume() {
    this.container.innerHTML = `
      <div class="resume-view card animate-fadeIn">
        <h2 class="text-gradient">Dictée en cours trouvée</h2>
        <p class="text-secondary mb-6">Voulez-vous reprendre votre dernière dictée ?</p>
        <p class="text-muted italic mb-6">"${this.draft.userText ? this.draft.userText.substring(0, 50) + '...' : '...'}"</p>

        <div class="resume-actions flex gap-4 justify-center">
           <button class="btn btn-primary" id="resume-btn">Reprendre</button>
           <button class="btn btn-ghost text-error" id="discard-btn">Nouvelle dictée</button>
        </div>
      </div>
       <style>
        .resume-view { max-width: 500px; margin: 10vh auto; padding: var(--space-8); text-align: center; }
      </style>
    `;

    document.getElementById('resume-btn')?.addEventListener('click', () => {
      this.dictation = this.draft.dictation;
      this.render();
      this.setupAudio();
      this.attachEventListeners();

      // Restore user text
      const textarea = document.getElementById('user-input');
      if (textarea) textarea.value = this.draft.userText;
      this.hasStartedWriting = true;
    });

    document.getElementById('discard-btn')?.addEventListener('click', () => {
      storageService.clearDraft();
      this.draft = null;
      this.renderSetup();
    });
  }

  async startNewDictation() {
    this.elapsedSeconds = 0; // Reset timer for new dictation
    this.hasStartedWriting = false; // Reset writing state
    this.renderLoading();
    try {
      await this.generateDictation();
      this.render();
      this.attachEventListeners();
      this.setupAudio();
      // Clear legacy draft if any
      storageService.clearDraft();
    } catch (error) {
      console.error('Erreur initialisation dictée:', error);
      this.renderError(error.message);
    }
  }

  async generateDictation() {
    const profile = storageService.getUserProfile();
    const vocabulary = storageService.getVocabularyToReview(3);
    const errorsToReview = storageService.getErrorsToReview(5);

    // Store for validation later
    this.currentReviewErrors = errorsToReview;

    const userProfile = {
      level: profile.level,
      errorsToReview: errorsToReview.map(e => ({
        word: e.word,
        type: e.type
      }))
    };

    this.dictation = await geminiService.generateDictation({
      theme: this.theme,
      userProfile,
      vocabulary,
      narrativeState: this.app.state.continueStory ? this.theme.narrativeState : null,
      minWords: this.minLength,
      maxWords: this.maxLength
    });

    // START PRE-ANALYSIS IF ENABLED
    const settings = storageService.getSettings();
    if (settings.autoGrammarAnalysis !== false) {
      console.log('Dictation loaded, triggering background grammar analysis...');
      this.app.state.grammarAnalysisPromise = geminiService.analyzeGrammar(this.dictation.text)
        .then(result => {
          console.log('Background grammar analysis complete');
          return result;
        })
        .catch(err => {
          console.warn('Background grammar analysis failed:', err);
          return null;
        });
    } else {
      console.log('Auto grammar analysis disabled');
      this.app.state.grammarAnalysisPromise = null;
    }
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <h2>Génération de votre dictée...</h2>
        <p class="text-secondary">L'IA compose une histoire unique pour vous</p>
      </div>
      <style>
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: var(--space-6);
          text-align: center;
        }
      </style>
    `;
  }

  renderError(message) {
    this.container.innerHTML = `
      <div class="error-state card">
        <span class="error-icon">❌</span>
        <h2>Erreur</h2>
        <p class="text-secondary">${message}</p>
        <button class="btn btn-primary" id="retry-btn">Réessayer</button>
        <button class="btn btn-ghost" id="back-btn">Retour</button>
      </div>
      <style>
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          max-width: 500px;
          margin: 10vh auto;
          text-align: center;
          gap: var(--space-4);
        }
        .error-icon { font-size: 3rem; }
      </style>
    `;

    document.getElementById('retry-btn')?.addEventListener('click', () => this.init());
    document.getElementById('back-btn')?.addEventListener('click', () => this.app.navigate('/dictation'));
  }

  render() {
    const sentences = this.dictation.sentences || [];
    const settings = this.settings || storageService.getSettings();
    const keyBindings = settings.keyBindings || {};

    // Helper to format key names
    const formatKey = (code) => {
      if (!code) return '';
      return code
        .replace('Key', '')
        .replace('Digit', '')
        .replace('ArrowUp', '↑')
        .replace('ArrowDown', '↓')
        .replace('ArrowLeft', '←')
        .replace('ArrowRight', '→')
        .replace('Space', 'Espace')
        .replace('Control', 'Ctrl')
        .replace('Shift', 'Maj');
    };

    this.container.innerHTML = `
      <div class="dictation-view animate-fadeIn">
        <!-- Header with theme info -->
        <header class="dictation-header">
          <div class="theme-info">
            <span class="theme-icon">${this.theme.icon}</span>
            <div>
              <h1>${this.theme.name}</h1>
              <p class="text-secondary">Épisode ${(this.theme.progress || 0) + 1}</p>
            </div>
          </div>
          <div class="dictation-meta">
            <span class="tag tag-level">${this.dictation.difficulty || 'B2'}</span>
          </div>
        </header>

        <!-- Multiplayer Leaderboard (Mini) -->
        ${this.isMultiplayer ? `
          <div class="multiplayer-leaderboard card mb-4">
             <div class="leaderboard-grid" id="mini-leaderboard">
                ${multiplayerService.players.map(p => `
                   <div class="player-progress-item" data-player="${p.name}">
                      <div class="flex justify-between text-xs mb-1">
                         <span>${p.name === multiplayerService.playerName ? '🍀 Vous' : '👤 ' + p.name}</span>
                         <span class="player-score">${p.score || 0}%</span>
                      </div>
                      <div class="progress-bar-mini">
                         <div class="progress-fill" style="width: ${p.score || 0}%"></div>
                      </div>
                   </div>
                `).join('')}
             </div>
          </div>
          <style>
             .multiplayer-leaderboard { padding: var(--space-3); background: var(--color-bg-secondary); border: 1px solid var(--color-primary-800); }
             .leaderboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-4); }
             .progress-bar-mini { height: 4px; background: var(--color-bg-tertiary); border-radius: 2px; overflow: hidden; }
             .progress-fill { height: 100%; background: var(--color-primary-400); transition: width 0.3s ease; }
          </style>
        ` : ''}

        <!-- Timer Section -->
        <section class="timer-section">
          <div class="timer" id="timer">
            <span class="timer-icon">⏱️</span>
            <span class="timer-display" id="timer-display">00:00</span>
          </div>
          <p class="timer-hint text-muted">Le chronomètre démarre quand vous commencez à écrire</p>
        </section>

        <!-- Audio Controls -->
        <section class="audio-section">
          <div class="audio-controls">
            <button class="audio-btn" id="prev-segment" title="Segment précédent">
              ⏮️
            </button>
            <button class="audio-btn primary" id="play-pause" title="Lecture/Pause">
              ▶️
            </button>
            <button class="audio-btn" id="next-segment" title="Segment suivant">
              ⏭️
            </button>
          </div>
          
          <div class="segment-indicator" id="segment-indicator">
            ${sentences.map((_, i) => `
              <span class="segment-dot" data-index="${i}"></span>
            `).join('')}
          </div>

          <div class="keyboard-hints">
             ${Object.entries(keyBindings).map(([action, keys]) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      if (keyArray.length === 0) return '';

      let label = '';
      switch (action) {
        case 'PLAY_PAUSE': label = 'Lecture/Pause'; break;
        case 'NEXT': label = 'Suivant'; break;
        case 'PREVIOUS': label = 'Précédent'; break;
        case 'REPLAY': label = 'Répéter'; break;
        default: label = action;
      }

      return `
                    <span class="shortcut-hint">
                    <span class="shortcut-hint">
                        ${keyArray.map(k => `<kbd class="kbd">${formatKey(k)}</kbd>`).join(' + ')} 
                        ${label}
                    </span>
                `;
    }).join('')}
          </div>

          <div class="audio-settings-row">
            <label for="segment-length" style="color: var(--color-text-secondary);">Mots par audio :</label>
            <input type="number" id="segment-length" value="5" min="2" max="50" style="width: 50px; padding: 4px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-tertiary); color: var(--color-text-primary); text-align: center;">
          </div>
        </section>

        <!-- Writing Section -->
        <section class="writing-section">
          <label for="user-input" class="input-label">Écrivez la dictée ici :</label>
          <textarea 
            id="user-input" 
            class="textarea" 
            placeholder="Commencez à écrire..."
            rows="8"
            spellcheck="false"
            autocorrect="off"
            autocapitalize="off"
          ></textarea>
          <div class="input-footer">
            <span class="word-count" id="word-count">0 mots</span>
            <span class="text-muted">Objectif: ~${this.countWords(this.dictation.text)} mots</span>
          </div>
        </section>

        <!-- Actions -->
        <section class="actions-section">
          <button class="btn btn-primary btn-lg" id="submit-dictation">
            ✓ Valider
          </button>
          <button class="btn btn-secondary" id="save-quit">
             💾 Sauvegarder & Quitter
          </button>
          <button class="btn btn-ghost" id="cancel-dictation">
            Annuler
          </button>
        </section>

        <!-- Pre-Analyze (Bottom, Discrete) -->
        <div class="text-center mt-4" style="display: flex; justify-content: center;">
             <button class="btn btn-sm btn-ghost text-muted hover-primary" id="pre-analyze-btn" title="Lancer l'analyse grammaticale maintenant">
              🧠 Pré-analyser
             </button>
        </div>

        <!-- Grammar Points Preview -->
        <section class="tips-section">
          <div class="card">
            <h3>Points de vigilance</h3>
            <div class="grammar-points">
              ${(this.dictation.grammarPoints || []).map(point => `
                <span class="tag">${point}</span>
              `).join('')}
            </div>
          </div>
        </section>
      </div>

      <style>
        .dictation-view {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .dictation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-surface-glass-border);
        }

        .theme-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .theme-info .theme-icon {
          font-size: var(--text-3xl);
        }

        .theme-info h1 {
          font-size: var(--text-xl);
          margin-bottom: var(--space-1);
        }

        .timer-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .timer {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-6);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-xl);
          font-family: 'Courier New', monospace;
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
        }

        .timer.running .timer-display { color: var(--color-success-400); }
        .timer.warning .timer-display { color: var(--color-warning-400); }
        .timer.danger .timer-display { color: var(--color-error-400); animation: pulse 0.5s infinite; }

        .audio-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          text-align: center;
        }

        .keyboard-hints {
          display: flex;
          gap: var(--space-6);
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: var(--space-2);
        }
        
        .audio-settings-row {
          display: flex; 
          gap: 10px; 
          align-items: center; 
          justify-content: center; 
          font-size: 0.9em;
        }

        .writing-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .writing-section .textarea {
          min-height: 200px;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-sm);
        }

        .word-count {
          color: var(--color-primary-400);
          font-weight: var(--font-medium);
        }

        .actions-section {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
        }

        .tips-section .card {
          background: var(--color-bg-tertiary);
        }

        .tips-section h3 {
          font-size: var(--text-base);
          margin-bottom: var(--space-3);
        }

        .grammar-points {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        
        .hover-primary:hover {
            color: var(--color-primary-400) !important;
            background: rgba(59, 130, 246, 0.1);
        }
      </style>
    `;
  }

  setupAudio() {
    const segmentLengthInput = document.getElementById('segment-length');
    const segmentLength = segmentLengthInput ? parseInt(segmentLengthInput.value) : 5;

    // Utiliser le segmentLength (5 mots par défaut) au lieu des phrases complètes
    audioService.loadText(this.dictation.text, null, segmentLength);

    audioService.onSegmentChange = (info) => {
      this.updateSegmentIndicator(info.currentIndex);
    };

    audioService.onPlayStateChange = (state) => {
      const playBtn = document.getElementById('play-pause');
      if (playBtn) {
        playBtn.textContent = state.isPlaying && !state.isPaused ? '⏸️' : '▶️';
      }
    };

    audioService.onComplete = () => {
      this.app.showToast('Dictée terminée! Vous pouvez réécouter ou valider.', 'info');
    };
  }

  attachEventListeners() {
    // Audio controls
    document.getElementById('play-pause')?.addEventListener('click', () => {
      audioService.togglePlayPause();
    });

    document.getElementById('prev-segment')?.addEventListener('click', () => {
      audioService.previousSegment();
    });

    document.getElementById('next-segment')?.addEventListener('click', () => {
      audioService.nextSegment();
    });

    // Segment dots
    this.container.querySelectorAll('.segment-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index);
        audioService.goToSegment(index);
      });
    });

    // Text input
    // Text input
    const textarea = document.getElementById('user-input');
    textarea?.addEventListener('input', () => {
      // Start timer on first keystroke
      if (!this.hasStartedWriting && textarea.value.length > 0) {
        // Double check to prevent multiple intervals
        if (!this.isTimerRunning) {
          this.hasStartedWriting = true;
          this.startTimer();
        }
      }

      // Auto-save draft
      if (this.dictation) {
        storageService.saveDraft(textarea.value, this.dictation, this.elapsedSeconds);
      }

      // Update word count
      const wordCount = this.countWords(textarea.value);
      document.getElementById('word-count').textContent = `${wordCount} mots`;

      // Multiplayer: Send incremental score 
      if (this.isMultiplayer && multiplayerService.channel) {
        const totalWords = this.countWords(this.dictation.text);
        const score = totalWords > 0 ? Math.floor((wordCount / totalWords) * 100) : 0;
        multiplayerService.sendScore(multiplayerService.playerName || 'Anonyme', Math.min(score, 100));
      }
    });

    // Submit
    document.getElementById('submit-dictation')?.addEventListener('click', () => {
      this.submitDictation();
    });

    // Changement longueur segment
    document.getElementById('segment-length')?.addEventListener('change', (e) => {
      const length = parseInt(e.target.value);
      if (length > 0) {
        audioService.loadText(this.dictation.text, null, length);
        // Reset indicator
        this.renderSegmentIndicator();
      }
    });

    // Pre-analyze button
    document.getElementById('pre-analyze-btn')?.addEventListener('click', () => {
      if (this.app.state.grammarAnalysisPromise) {
        this.app.showToast('Analyse déjà en cours...', 'info');
        return;
      }
      this.app.showToast('Lancement de l\'analyse grammaticale...', 'info');
      this.app.state.grammarAnalysisPromise = geminiService.analyzeGrammar(this.dictation.text)
        .then(result => {
          this.app.showToast('Pré-analyse terminée !', 'success');
          return result;
        });
    });

    // Save & Quit
    document.getElementById('save-quit')?.addEventListener('click', () => {
      const text = document.getElementById('user-input')?.value || '';
      storageService.saveDraft(text, this.dictation, this.elapsedSeconds);
      this.stopTimer();
      audioService.stop();
      this.app.showToast('Dictée sauvegardée ! Vous pourrez la reprendre plus tard.', 'success');
      this.app.navigate('/');
    });

    // Cancel
    document.getElementById('cancel-dictation')?.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir abandonner cette dictée ? Le brouillon sera supprimé.')) {
        this.stopTimer();
        audioService.stop();
        storageService.clearDraft(); // Explicit clear on cancel
        this.app.navigate('/dictation'); // Back to setup
      }
    });

    // Keyboard shortcuts in textarea based on settings
    const handleKeyChange = (e, isDown) => {
      // Use code for cross-layout consistency
      const code = e.code;

      if (isDown) {
        this.pressedKeys.add(code);
      } else {
        this.pressedKeys.delete(code);
      }

      if (!isDown) return; // Only trigger on keydown

      const settings = this.settings || storageService.getSettings();
      const defaultBindings = {
        PLAY_PAUSE: ['AltLeft', 'AltRight'],
        PREVIOUS: ['Tab', 'ShiftLeft'], // Simple version, or check modifiers
        NEXT: ['Tab'],
        REPLAY: ['ControlLeft', 'ControlRight']
      };

      const keyBindings = settings.keyBindings || defaultBindings;

      const matches = (action) => {
        const keys = keyBindings[action];
        if (!keys) return false;
        const requiredKeys = Array.isArray(keys) ? keys : [keys];
        if (requiredKeys.length === 0) return false;

        // Special handling for Tab vs Shift+Tab
        if (action === 'NEXT' && code === 'Tab' && e.shiftKey) return false;
        if (action === 'PREVIOUS' && code === 'Tab' && !e.shiftKey) return false;

        // For NEXT/PREVIOUS with Tab, we just check the code and shiftKey
        if ((action === 'NEXT' || action === 'PREVIOUS') && code === 'Tab') {
          return true;
        }

        // For other actions, check if ANY of the mapped keys are pressed
        return requiredKeys.some(k => this.pressedKeys.has(k) || code === k);
      };

      let handled = false;
      if (matches('PLAY_PAUSE')) {
        audioService.togglePlayPause();
        handled = true;
      } else if (matches('PREVIOUS')) {
        audioService.previousSegment();
        handled = true;
      } else if (matches('NEXT')) {
        audioService.nextSegment();
        handled = true;
      } else if (matches('REPLAY')) {
        audioService.replayCurrentSegment();
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    };

    textarea?.addEventListener('keydown', (e) => handleKeyChange(e, true));
    textarea?.addEventListener('keyup', (e) => handleKeyChange(e, false));

    // Clear pressed keys on blur to prevent stuck keys
    window.addEventListener('blur', () => {
      this.pressedKeys.clear();
    });

    // Ctrl+Enter: Valider
    textarea?.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.submitDictation();
      }
    });

    // Multiplayer: Handle live progress
    if (this.isMultiplayer) {
      multiplayerService.onScoreUpdate = (players) => {
        players.forEach(p => {
          const item = this.container.querySelector(`.player-progress-item[data-player="${p.name}"]`);
          if (item) {
            const scoreEl = item.querySelector('.player-score');
            const fillEl = item.querySelector('.progress-fill');
            if (scoreEl) scoreEl.textContent = `${p.score || 0}%`;
            if (fillEl) fillEl.style.width = `${p.score || 0}%`;
          }
        });
      };
    }
  }

  renderSegmentIndicator() {
    const info = audioService.getSegmentsInfo();
    const container = document.getElementById('segment-indicator');
    if (container) {
      container.innerHTML = info.segments.map((_, i) => `
        <span class="segment-dot ${i === info.currentIndex ? 'active' : ''}" data-index="${i}"></span>
      `).join('');

      // Re-attach listeners
      container.querySelectorAll('.segment-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          const index = parseInt(dot.dataset.index);
          audioService.goToSegment(index);
        });
      });
    }
  }

  updateSegmentIndicator(currentIndex) {
    this.container.querySelectorAll('.segment-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'completed');
      if (i < currentIndex) {
        dot.classList.add('completed');
      } else if (i === currentIndex) {
        dot.classList.add('active');
      }
    });
  }

  startTimer() {
    if (this.isTimerRunning) return;

    this.isTimerRunning = true;
    const timerEl = document.getElementById('timer');
    timerEl?.classList.add('running');

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();

      // Update timer state
      if (this.elapsedSeconds >= TIMER_THRESHOLDS.DANGER) {
        timerEl?.classList.remove('running', 'warning');
        timerEl?.classList.add('danger');
      } else if (this.elapsedSeconds >= TIMER_THRESHOLDS.WARNING) {
        timerEl?.classList.remove('running', 'danger');
        timerEl?.classList.add('warning');
      }
    }, 1000);
  }

  stopTimer() {
    this.isTimerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.classList.remove('running', 'warning', 'danger');
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const displayEl = document.getElementById('timer-display');
    if (displayEl) {
      displayEl.textContent = display;
    }
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  calculateSpeedMultiplier() {
    if (this.elapsedSeconds < TIMER_THRESHOLDS.FAST) {
      return SCORING.SPEED_MULTIPLIERS.FAST;
    } else if (this.elapsedSeconds < TIMER_THRESHOLDS.MEDIUM) {
      return SCORING.SPEED_MULTIPLIERS.MEDIUM;
    }
    return SCORING.SPEED_MULTIPLIERS.NORMAL;
  }

  async submitDictation() {
    const userText = document.getElementById('user-input')?.value.trim();
    console.log('Soumission dictée. Texte utilisateur:', userText ? userText.substring(0, 50) + '...' : 'VIDE');

    if (!userText) {
      this.app.showToast('Veuillez écrire la dictée avant de valider.', 'warning');
      return;
    }

    if (this.countWords(userText) < 5) {
      this.app.showToast('Votre texte semble trop court. Continuez à écrire!', 'warning');
      return;
    }

    this.stopTimer();
    audioService.stop();
    storageService.clearDraft(); // Clear draft on successful submission

    // Show loading
    this.app.showLoading('Analyse de votre dictée...');

    try {
      // Debug logs
      console.log('Dictation object:', this.dictation);
      const originalText = this.dictation?.text;
      console.log('Texte original:', originalText ? originalText.substring(0, 50) + '...' : 'INDÉFINI');

      if (!originalText) {
        throw new Error('Texte original de la dictée manquant');
      }

      console.log('Appel de geminiService.analyzeErrors...');
      // Analyze errors
      const analysis = await geminiService.analyzeErrors(originalText, userText);
      console.log('Résultat analyse:', analysis);

      // Vérifier si le parsing a échoué
      if (!analysis) {
        throw new Error('Réponse vide de l\'IA');
      }

      if (analysis._parseError) {
        console.warn('Parsing partiel, données minimales');
        this.app.showToast('Analyse partielle - réessayez si nécessaire', 'warning');
      }

      // Sécuriser les propriétés
      const errors = analysis.errors || [];
      const correctWords = analysis.correctWords || 0;
      const analysisScore = analysis.score || 0;

      // Store errors for SRS
      if (errors.length > 0) {
        errors.forEach(error => {
          storageService.addError({
            word: error.original,
            type: error.type,
            rule: error.rule,
            explanation: error.explanation
          });
        });
      }

      // SRS UPDATE FOR REVIEWED WORDS
      if (this.currentReviewErrors && this.currentReviewErrors.length > 0) {
        console.log('Checking reviewed errors status:', this.currentReviewErrors);

        this.currentReviewErrors.forEach(reviewError => {
          // Check if this specific reviewed word appears in the NEW errors list
          // We compare normalized strings to be safe
          const isStillWrong = errors.some(newErr =>
            newErr.original.toLowerCase().trim() === reviewError.word.toLowerCase().trim()
          );

          if (!isStillWrong) {
            // SUCCESS! The word was in the dictation and correct.
            // User requested "one degree" up, not "max". 
            // In our system, quality >= 3 moves up one step. We use 4 ("Good") to be safe/standard.
            console.log(`Error fixed: ${reviewError.word} -> Updating SRS (Step Up)`);
            storageService.updateErrorSRS(reviewError.id, 4); // 4 = Good response (Step +1)
          } else {
            // STILL WRONG
            console.log(`Error persisted: ${reviewError.word} -> Updating SRS (Reset)`);
            storageService.updateErrorSRS(reviewError.id, 0); // 0 = Complete blackout (Reset)
          }
        });
      }

      // Update theme progress
      storageService.updateThemeProgress(
        this.theme.id,
        {
          summary: this.dictation.narrativeSummary,
          lastExcerpt: this.dictation.narrativeExcerpt,
          episode: (this.theme.progress || 0) + 1
        },
        this.dictation.narrativeExcerpt
      );

      // Calculate score and points with proper validation
      const speedMultiplier = this.calculateSpeedMultiplier();

      // isPerfect requires: score >= 100 AND correctWords > 0 AND no errors
      const isPerfect = analysisScore >= 100 && correctWords > 0 && errors.length === 0;

      // isFailed: score < 30% or no correct words
      const isFailed = analysisScore < 30 || correctWords === 0;

      let points = 0;

      if (isFailed) {
        // Pas de points si échec total, pénalité optionnelle
        points = SCORING.REGRESSION_PENALTY || 0; // Perte de points
      } else {
        // Points normaux
        points = correctWords * SCORING.CORRECT_WORD;
        if (isPerfect) {
          points += SCORING.PERFECT_DICTATION;
        }
        points = Math.round(points * speedMultiplier);
      }

      // Update user stats
      storageService.incrementDictations(isPerfect);
      storageService.addPoints(points);

      // Add to history with FULL details for review
      // CAPTURE THE ID HERE
      const historyId = storageService.addToHistory({
        themeName: this.theme.name,
        themeId: this.theme.id,
        score: analysisScore,
        points,
        errors: errors.length,
        time: this.elapsedSeconds,
        // Full Details for Review
        original: this.dictation.text,
        userText: userText,
        analysis: { ...analysis, errors, correctWords, score: analysisScore },
        dictation: this.dictation,
        isPerfect,
        isFailed
      });

      // Pass historyId to CorrectionView so it can update the item later (e.g. adding grammar analysis)
      this.app.setState({
        correctionData: {
          original: this.dictation.text,
          userText: userText,
          analysis: { ...analysis, errors, correctWords, score: analysisScore },
          dictation: this.dictation,
          theme: this.theme,
          elapsedTime: this.elapsedSeconds,
          points,
          isPerfect,
          isFailed,
          speedMultiplier,
          historyId: historyId // CRITICAL: Pass ID for updates
        }
      });

      this.app.hideLoading();

      // Multiplayer: Broadcast full results
      if (this.isMultiplayer) {
        multiplayerService.sendResults({
          score: analysisScore,
          errorCount: errors.length,
          errorTypes: [...new Set(errors.map(e => e.type))]
        });
      }

      this.app.navigate('/correction');

    } catch (error) {
      console.error('Erreur analyse COMPLETE:', error);
      this.app.hideLoading();
      this.app.showToast(`Erreur: ${error.message}`, 'error');
    }
  }

  destroy() {
    this.stopTimer();
    audioService.stop();
    audioService.onSegmentChange = null;
    audioService.onPlayStateChange = null;
    audioService.onComplete = null;
    multiplayerService.onScoreUpdate = null;
  }
}
