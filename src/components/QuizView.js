/**
 * Quiz View Component
 * Post-dictation questions with QCM and Professor Inversé mode
 */

import { storageService } from '../services/storage.js';
import { audioService } from '../services/audio.js';
import { SCORING } from '../utils/constants.js';

export class QuizView {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.quizData = app.state.quizData;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.showingResults = false;
    this.totalPoints = 0;

    this.render();
  }

  render() {
    const { questions, hiddenError } = this.quizData;
    const allQuestions = [...questions];

    if (!allQuestions || allQuestions.length === 0) {
      this.app.showToast('Erreur: Aucune question valide trouvée.', 'error');
      this.app.navigate('/');
      return;
    }

    // Add hidden error as last question
    if (hiddenError) {
      allQuestions.push({
        id: 'professor-inverse',
        type: 'professor-inverse',
        question: 'Mode Professeur Inversé: Trouvez l\'erreur cachée dans cette phrase',
        ...hiddenError
      });
    }

    this.allQuestions = allQuestions;

    this.container.innerHTML = `
      <div class="quiz-view animate-fadeIn">
        <!-- Progress Header -->
        <header class="quiz-header">
          <div class="quiz-progress">
            <span>Question ${this.currentQuestionIndex + 1} / ${allQuestions.length}</span>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${((this.currentQuestionIndex) / allQuestions.length) * 100}%;"></div>
            </div>
          </div>
          <div class="quiz-score">
            <span class="text-gradient">+${this.totalPoints} pts</span>
          </div>
        </header>

        <!-- Question Container -->
        <div id="question-container">
          ${this.renderQuestion(allQuestions[this.currentQuestionIndex])}
        </div>

        <!-- Navigation -->
        <div class="quiz-nav">
          <button class="btn btn-ghost" id="skip-question">
            Passer
          </button>
          <button class="btn btn-primary" id="submit-answer" disabled>
            Valider
          </button>
        </div>
      </div>

      <style>
        .quiz-view {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          background: var(--color-surface-glass);
          border-radius: var(--radius-xl);
        }

        .quiz-progress {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .quiz-progress .progress-container {
          max-width: 300px;
        }

        .quiz-score {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
        }

        .question-card {
          background: var(--color-surface-glass);
          border: 1px solid var(--color-surface-glass-border);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
        }

        .question-type {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--color-primary-600);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          margin-bottom: var(--space-4);
        }

        .question-type.professor-inverse {
          background: linear-gradient(135deg, var(--color-warning-500), var(--color-error-500));
          color: #000;
        }

        .question-text {
          font-size: var(--text-xl);
          font-weight: var(--font-medium);
          margin-bottom: var(--space-6);
          line-height: 1.6;
        }

        .question-context {
          padding: var(--space-4);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-6);
          font-family: var(--font-serif);
          font-style: italic;
        }

        .professor-sentence {
          font-family: var(--font-serif);
          font-size: var(--text-lg);
          line-height: 2;
          padding: var(--space-6);
          background: var(--color-bg-tertiary);
          border-radius: var(--radius-xl);
          margin-bottom: var(--space-4);
        }

        .professor-hint {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          font-style: italic;
          margin-bottom: var(--space-4);
        }

        .professor-input {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .professor-input .input {
          flex: 1;
          min-width: 200px;
        }

        .quiz-nav {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
        }

        .answer-feedback {
          margin-top: var(--space-6);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
        }

        .answer-feedback.correct {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid var(--color-success-500);
        }

        .answer-feedback.incorrect {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid var(--color-error-500);
        }

        .answer-feedback h4 {
          margin-bottom: var(--space-2);
        }

        .answer-feedback.correct h4 { color: var(--color-success-400); }
        .answer-feedback.incorrect h4 { color: var(--color-error-400); }

        .results-card {
          text-align: center;
          padding: var(--space-10);
        }

        .results-score {
          font-size: 4rem;
          font-weight: var(--font-bold);
          margin-bottom: var(--space-4);
        }

        .results-breakdown {
          display: flex;
          justify-content: center;
          gap: var(--space-8);
          margin: var(--space-6) 0;
        }

        .results-stat {
          text-align: center;
        }

        .results-stat .value {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
        }

        .results-stat .value.correct { color: var(--color-success-400); }
        .results-stat .value.incorrect { color: var(--color-error-400); }

        .results-actions {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
          margin-top: var(--space-8);
        }
      </style>
    `;

    this.attachEventListeners();
  }

  renderQuestion(question) {
    if (question.type === 'professor-inverse') {
      return this.renderProfessorInverse(question);
    } else if (question.type === 'dictation') {
      return this.renderDictationQuestion(question);
    } else if (question.type === 'question') {
      return this.renderOpenQuestion(question);
    }

    // Default QCM (grammar, vocabulary, qcm)
    return `
      <div class="question-card">
        <span class="question-type">📝 Question à Choix Multiple</span>
        <h2 class="question-text">${question.question}</h2>
        
        ${question.context ? `
          <div class="question-context">
            "${question.context}"
          </div>
        ` : ''}
        
        <div class="quiz-options">
          ${question.options.map(opt => `
            <button class="quiz-option" data-letter="${opt.letter}">
              <span class="quiz-option-letter">${opt.letter.toUpperCase()}</span>
              ${opt.text}
            </button>
          `).join('')}
        </div>
        
        <div id="answer-feedback"></div>
      </div>
    `;
  }

  renderDictationQuestion(question) {
    return `
      <div class="question-card">
        <span class="question-type" style="background: var(--color-primary-600);">✍️ Mini-Dictée de Révision</span>
        <h2 class="question-text">${question.question}</h2>
        <p class="text-secondary mb-4">Écoutez et écrivez exactement la phrase :</p>
        
        <div class="audio-controls mb-4" style="display: flex; gap: 1rem; align-items: center; justify-content: center; background: var(--color-bg-tertiary); padding: 1rem; border-radius: 1rem;">
             <button class="btn btn-primary btn-sm" id="btn-listen" title="Écouter / Pause">▶️ Écouter</button>
             <button class="btn btn-ghost btn-sm" id="btn-replay" title="Réécouter">🔄 Répéter</button>
        </div>

        <textarea class="input w-full p-4 text-lg" id="dictation-input" rows="3" placeholder="Votre réponse..."></textarea>
        
        <div id="answer-feedback"></div>
      </div>
    `;
  }

  renderOpenQuestion(question) {
    return `
      <div class="question-card">
        <span class="question-type" style="background: var(--color-secondary-600);">❓ Question Ouverte</span>
        <h2 class="question-text">${question.question}</h2>
        
        <input type="text" class="input w-full p-4 text-lg" id="open-input" placeholder="Votre réponse...">
        
        <div id="answer-feedback"></div>
      </div>
    `;
  }

  renderProfessorInverse(question) {
    return `
      <div class="question-card">
        <span class="question-type professor-inverse">🎓 Mode Professeur Inversé</span>
        <h2 class="question-text">${question.question}</h2>
        
        <div class="professor-sentence">
          ${question.sentenceWithError}
        </div>
        
        <p class="professor-hint">💡 Indice: ${question.hint}</p>
        
        <div class="professor-input">
          <input type="text" class="input" id="error-word-input" placeholder="Mot erroné...">
          <input type="text" class="input" id="correct-word-input" placeholder="Correction proposée...">
        </div>
        
        <div id="answer-feedback"></div>
      </div>
    `;
  }

  attachEventListeners() {
    // Option selection
    this.container.addEventListener('click', (e) => {
      const option = e.target.closest('.quiz-option');
      if (option && !option.classList.contains('correct') && !option.classList.contains('incorrect')) {
        // Deselect others
        this.container.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');

        // Enable submit button
        document.getElementById('submit-answer').disabled = false;
      }
    });

    // Professor inverse inputs
    const errorInput = document.getElementById('error-word-input');
    const correctInput = document.getElementById('correct-word-input');
    const dictationInput = document.getElementById('dictation-input');
    const openInput = document.getElementById('open-input');

    const checkInputs = () => {
      let isValid = false;
      if (errorInput && correctInput) {
        isValid = errorInput.value.trim().length > 0 && correctInput.value.trim().length > 0;
      } else if (dictationInput) {
        isValid = dictationInput.value.trim().length > 0;
      } else if (openInput) {
        isValid = openInput.value.trim().length > 0;
      }
      document.getElementById('submit-answer').disabled = !isValid;
    };

    if (errorInput) errorInput.addEventListener('input', checkInputs);
    if (correctInput) correctInput.addEventListener('input', checkInputs);
    if (dictationInput) dictationInput.addEventListener('input', checkInputs);
    if (openInput) openInput.addEventListener('input', checkInputs);

    // Audio controls for dictation
    const btnListen = document.getElementById('btn-listen');
    if (btnListen) {
      // Stop any previous audio when entering new question
      audioService.stop();

      btnListen.addEventListener('click', () => {
        const question = this.allQuestions[this.currentQuestionIndex];
        // Check if already loaded
        const state = audioService.getState();
        if (state.currentText !== question.text) {
          // Load text as one big segment (max 100 words to ensure no split)
          audioService.loadText(question.text, null, 100);
        }
        audioService.togglePlayPause();
        this.updateAudioButtonState();
      });

      // Listen for state changes to update button icon
      audioService.onPlayStateChange = (state) => {
        this.updateAudioButtonState();
      };

      this.updateAudioButtonState = () => {
        const state = audioService.getState();
        const btn = document.getElementById('btn-listen');
        if (btn) {
          btn.textContent = state.isPlaying && !state.isPaused ? '⏸️ Pause' : '▶️ Écouter';
          btn.classList.toggle('btn-primary', !(state.isPlaying && !state.isPaused));
          btn.classList.toggle('btn-secondary', state.isPlaying && !state.isPaused);
        }
      };
    }

    document.getElementById('btn-replay')?.addEventListener('click', () => {
      const question = this.allQuestions[this.currentQuestionIndex];
      audioService.loadText(question.text, null, 100);
      audioService.playCurrentSegment();
    });

    // Submit answer
    document.getElementById('submit-answer')?.addEventListener('click', () => {
      this.submitAnswer();
    });

    // Skip question
    document.getElementById('skip-question')?.addEventListener('click', () => {
      this.nextQuestion();
    });
  }

  submitAnswer() {
    const question = this.allQuestions[this.currentQuestionIndex];
    let isCorrect = false;
    let points = 0;

    if (question.type === 'professor-inverse') {
      const errorWord = document.getElementById('error-word-input')?.value.trim().toLowerCase();
      const correctWord = document.getElementById('correct-word-input')?.value.trim().toLowerCase();

      // Check both error word and correction
      isCorrect = errorWord === question.errorWord.toLowerCase() &&
        correctWord === question.correctWord.toLowerCase();

      if (isCorrect) {
        points = SCORING.PROFESSOR_INVERSE;
      }

      // Show feedback
      this.showProfessorFeedback(isCorrect, question);

    } else if (question.type === 'dictation') {
      const userText = document.getElementById('dictation-input')?.value.trim();
      // Simple normalization for comparison (ignore case and basic punctuation)
      const normalize = (t) => t.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();

      // Exact match requires high precision, maybe fuzzy match later?
      // For now, let's keep it strict but lenient on case/punct
      isCorrect = normalize(userText) === normalize(question.text);

      if (isCorrect) points = SCORING.QUESTION_CORRECT * 2; // Bonus points for dictation

      this.showDictationFeedback(isCorrect, question, userText);

    } else if (question.type === 'question') {
      const userText = document.getElementById('open-input')?.value.trim();
      // Basic check against expected answer string
      // The prompt asks for "answer" field.
      const normalize = (t) => t.toLowerCase().trim();
      isCorrect = normalize(userText).includes(normalize(question.answer || ''));

      if (isCorrect) points = SCORING.QUESTION_CORRECT;

      this.showOpenQuestionFeedback(isCorrect, question);

    } else {
      const selected = this.container.querySelector('.quiz-option.selected');
      if (!selected) return;

      const selectedLetter = selected.dataset.letter;
      isCorrect = selectedLetter === question.correctAnswer;

      if (isCorrect) {
        points = SCORING.QUESTION_CORRECT;
      }

      // Show feedback
      this.showQCMFeedback(isCorrect, question, selectedLetter);
    }

    // Update score
    if (points > 0) {
      this.totalPoints += points;
      storageService.addPoints(points);
      this.container.querySelector('.quiz-score span').textContent = `+${this.totalPoints} pts`;
    }

    // REVIEW QUIZ LOGIC: Update SRS if 'impactSRS' is true
    if (this.quizData.isReviewQuiz && this.quizData.impactSRS && this.quizData.sourceErrors) {
      // Find which error this question relates to.
      // The prompt generator puts 'id' of question as 'ref_mot_concerne'?? 
      // No, in my prompt I used "id": "ref_mot_concerne". 
      // We should try to match the error ID or word. But prompt generation might not strictly keep ID.
      // Let's assume question.targetWord or question.errorWord matches the error word.

      let relatedError = this.quizData.sourceErrors.find(e =>
        e.word === question.targetWord || e.word === question.errorWord
      );

      if (relatedError) {
        // Quality: 5 for correct, 0 for incorrect (simplified)
        storageService.updateErrorSRS(relatedError.id, isCorrect ? 5 : 0);
        this.app.showToast(isCorrect ? 'Révision validée !' : 'À revoir...', isCorrect ? 'success' : 'info');
      }
    }

    // Store answer
    this.answers.push({
      questionId: question.id,
      correct: isCorrect,
      points
    });

    // Update button
    const submitBtn = document.getElementById('submit-answer');
    submitBtn.textContent = 'Suivant →';
    submitBtn.disabled = false;
    submitBtn.onclick = () => this.nextQuestion();

    // Hide skip button
    document.getElementById('skip-question').style.display = 'none';
  }

  showQCMFeedback(isCorrect, question, selectedLetter) {
    // Highlight correct/incorrect options
    this.container.querySelectorAll('.quiz-option').forEach(opt => {
      opt.disabled = true;
      if (opt.dataset.letter === question.correctAnswer) {
        opt.classList.add('correct');
      } else if (opt.dataset.letter === selectedLetter && !isCorrect) {
        opt.classList.add('incorrect');
      }
    });

    // Show explanation
    const feedback = document.getElementById('answer-feedback');
    feedback.innerHTML = `
      <div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <h4>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
        <p>${question.explanation || ''}</p>
        ${question.rule ? `<p class="text-muted"><strong>Règle:</strong> ${question.rule}</p>` : ''}
      </div>
    `;
  }

  showProfessorFeedback(isCorrect, question) {
    const feedback = document.getElementById('answer-feedback');

    feedback.innerHTML = `
      <div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <h4>${isCorrect ? '🎓 Bravo Professeur!' : '✗ Pas tout à fait...'}</h4>
        <p>
          L'erreur était "<strong>${question.errorWord}</strong>" → "<strong>${question.correctWord}</strong>"
        </p>
        <p>${question.explanation}</p>
        ${isCorrect ? `<p class="text-gradient">+${SCORING.PROFESSOR_INVERSE} points bonus!</p>` : ''}
      </div>
    `;

    // Disable inputs
    document.getElementById('error-word-input').disabled = true;
    document.getElementById('correct-word-input').disabled = true;
  }

  showDictationFeedback(isCorrect, question, userText) {
    const feedback = document.getElementById('answer-feedback');
    feedback.innerHTML = `
      <div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <h4>${isCorrect ? '✓ Parfait!' : '✗ Attention'}</h4>
        <p><strong>Votre réponse:</strong> ${userText}</p>
        <p><strong>Réponse attendue:</strong> ${question.text}</p>
        <p class="mt-2 text-sm text-secondary">${question.explanation || ''}</p>
      </div>
    `;
    document.getElementById('dictation-input').disabled = true;
  }

  showOpenQuestionFeedback(isCorrect, question) {
    const feedback = document.getElementById('answer-feedback');
    feedback.innerHTML = `
      <div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
        <h4>${isCorrect ? '✓ Correct!' : '✗ Incorrect'}</h4>
        <p><strong>Réponse attendue:</strong> ${question.answer}</p>
        <p class="mt-2 text-sm text-secondary">${question.explanation || ''}</p>
      </div>
    `;
    document.getElementById('open-input').disabled = true;
  }

  nextQuestion() {
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.allQuestions.length) {
      this.showResults();
    } else {
      // Re-render question
      const questionContainer = document.getElementById('question-container');
      questionContainer.innerHTML = this.renderQuestion(this.allQuestions[this.currentQuestionIndex]);

      // Update progress
      const progressBar = this.container.querySelector('.progress-bar');
      progressBar.style.width = `${(this.currentQuestionIndex / this.allQuestions.length) * 100}%`;

      const progressText = this.container.querySelector('.quiz-progress span');
      progressText.textContent = `Question ${this.currentQuestionIndex + 1} / ${this.allQuestions.length}`;

      // Reset submit button
      const submitBtn = document.getElementById('submit-answer');
      submitBtn.textContent = 'Valider';
      submitBtn.disabled = true;
      submitBtn.onclick = () => this.submitAnswer();

      // Show skip button
      document.getElementById('skip-question').style.display = '';

      // Persist progress
      storageService.saveSession({
        quizData: this.quizData,
        currentQuestionIndex: this.currentQuestionIndex,
        answers: this.answers,
        currentView: '/quiz'
      }); // NEW: Save current index.


      // Re-attach event listeners for new question
      this.attachEventListeners();
    }
  }

  showResults() {
    const correctCount = this.answers.filter(a => a.correct).length;
    const totalQuestions = this.allQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);


    // Calculate total points from dictation + quiz
    const dictationPoints = this.quizData.correctionData?.points || 0;
    const quizPoints = this.totalPoints;
    const totalSessionPoints = dictationPoints + quizPoints;

    this.container.innerHTML = `
      <div class="quiz-view animate-fadeIn">
        <div class="question-card results-card">
          <h1 class="text-gradient">Session Terminée!</h1>
          
          <div class="results-score text-gradient">${totalSessionPoints}</div>
          <p class="text-secondary">Points gagnés au total</p>
          
          <div class="results-breakdown">
            <div class="results-stat">
              <div class="value">+${dictationPoints}</div>
              <div class="label text-muted">Dictée</div>
            </div>
            <div class="results-stat">
              <div class="value">+${quizPoints}</div>
              <div class="label text-muted">Quiz</div>
            </div>
            <div class="results-stat">
              <div class="value correct">${correctCount}</div>
              <div class="label text-muted">Bonnes réponses</div>
            </div>
            <div class="results-stat">
              <div class="value incorrect">${totalQuestions - correctCount}</div>
              <div class="label text-muted">Erreurs</div>
            </div>
          </div>
          
          <div class="score-feedback">
            ${percentage >= 80 ? '🌟 Excellent travail!' :
        percentage >= 60 ? '👍 Bon travail, continuez!' :
          '💪 Continuez à vous entraîner!'}
          </div>

          <!-- QUESTION RECAP -->
          <div class="questions-recap" style="text-align: left; margin-top: 2rem; background: var(--color-bg-tertiary); padding: 1.5rem; border-radius: var(--radius-lg);">
             <h3 style="margin-bottom: 1rem;">Récapitulatif</h3>
             ${this.allQuestions.map((q, idx) => {
            const answer = this.answers.find(a => a.questionId === q.id);
            const isCorrect = answer?.correct;
            return `
                 <div class="recap-item" style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: bold;">Q${idx + 1}: ${q.type === 'professor-inverse' ? 'Professeur Inversé' : 'Grammaire'}</span>
                        <span style="color: ${isCorrect ? 'var(--color-success-500)' : 'var(--color-error-500)'}">${isCorrect ? '✓ Juste' : '✗ Faux'}</span>
                    </div>
                    <p style="margin: 0.5rem 0; font-size: 0.9em;">${q.question}</p>
                    ${!isCorrect ? `<p style="font-size: 0.8em; color: var(--color-text-muted);">Réponse attendue: ${q.correctAnswer || q.correctWord}</p>` : ''}
                 </div>
                 `;
          }).join('')}
          </div>

          <div class="results-actions">
            <button class="btn btn-primary btn-lg" id="new-dictation">
              📝 Nouvelle Dictée
            </button>
            <button class="btn btn-secondary" id="back-home">
              🏠 Tableau de bord
            </button>
          </div>
        </div>
      </div>
    `;

    // Check for new achievements
    const newAchievements = storageService.checkAchievements();
    if (newAchievements.length > 0) {
      setTimeout(() => {
        newAchievements.forEach(a => {
          this.app.showToast(`🏆 Nouvelle médaille: ${a.name}!`, 'success');
        });
      }, 500);
    }

    // Event listeners
    document.getElementById('new-dictation')?.addEventListener('click', () => {
      this.app.navigate('/dictation');
    });

    document.getElementById('back-home')?.addEventListener('click', () => {
      storageService.clearSession(); // Clear session on exit
      this.app.navigate('/');
    });
  }

  destroy() {
    // Cleanup if needed
  }
}
