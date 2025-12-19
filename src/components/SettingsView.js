import { storageService } from '../services/storage.js';
import { geminiService } from '../services/gemini.js';
import { audioService } from '../services/audio.js';
import { LEVELS, GEMINI_MODELS } from '../utils/constants.js';

export class SettingsView {
  constructor(container, app) {
    this.container = container;
    this.app = app;
    this.settings = storageService.getSettings();
    this.profile = storageService.getUserProfile();

    this.render();
  }

  render() {
    // RELOAD settings to ensure reactivity when updates occur
    this.settings = storageService.getSettings();

    const voices = audioService.getAvailableVoices();
    const apiKeys = storageService.getApiKeys() || [];
    const selectedModel = storageService.getSelectedModel();

    this.container.innerHTML = `
      <div class="settings-view animate-fadeIn">
        <header class="page-header">
          <h1 class="text-gradient">Paramètres</h1>
          <p class="text-secondary">Configurez votre expérience d'apprentissage</p>
        </header>

        <!-- API Configuration -->
        <section class="settings-section card">
          <h2>🔑 Configuration API & Modèle</h2>
          <p class="text-secondary mb-4">
            Gérez vos clés API Gemini pour contourner les limites de quota. L'application alternera automatiquement entre les clés.
            <a href="https://aistudio.google.com/apikey" target="_blank" class="text-gradient">Obtenir une clé API</a>
          </p>

          <!-- Model Selector -->
          <div class="input-group mb-6">
            <label class="input-label">Modèle d'IA</label>
            <select class="input" id="model-select">
                ${GEMINI_MODELS.map(model => `
                    <option value="${model.id}" ${selectedModel === model.id ? 'selected' : ''}>
                        ${model.name}
                    </option>
                `).join('')}
            </select>
            <p class="input-hint text-secondary" id="model-description">
                ${GEMINI_MODELS.find(m => m.id === selectedModel)?.description || ''}
            </p>
          </div>
          
          <!-- API Keys List -->
          <div class="api-keys-list mb-4">
            <label class="input-label">Vos clés API (${apiKeys.length})</label>
            ${apiKeys.length > 0 ? `
                <ul class="keys-list">
                    ${apiKeys.map((key, index) => `
                        <li class="key-item">
                            <span class="key-value">•••••••••••••${key.slice(-4)}</span>
                            <button class="btn btn-ghost btn-sm text-error remove-key" data-key="${key}">🗑️</button>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p class="text-muted italic">Aucune clé enregistrée.</p>'}
          </div>

          <!-- Add New Key -->
          <div class="input-group">
            <label class="input-label">Ajouter une clé API</label>
            <div class="api-input-row">
              <input 
                type="text" 
                class="input" 
                id="api-key-input" 
                placeholder="Collez votre clé ici (AIza...)"
                autocomplete="off"
              >
              <button class="btn btn-primary" id="add-api-key">Ajouter</button>
            </div>
            <div class="api-status-row">
                <p class="input-hint ${geminiService.isInitialized() ? 'success' : 'error'}">
                    ${geminiService.isInitialized() ? '✓ Service IA prêt' : '⚠️ Aucune clé configurée'}
                </p>
                <button class="btn btn-ghost btn-sm text-gradient" id="toggle-tutorial">❓ Besoin d'aide ? Voir le tutoriel</button>
            </div>
          </div>

          <!-- API Tutorial Section (Hidden by default) -->
          <div id="api-tutorial" class="api-tutorial card glass hide">
            <div class="tutorial-header">
                <h3>📖 Tutoriel : Configurer votre IA Gemini</h3>
                <span class="text-xs text-muted">Dernière mise à jour : 17/12/2025</span>
            </div>
            
            <div class="tutorial-body">
                <p>Pour faire fonctionner l'intelligence artificielle, vous avez besoin d'une "clé API" gratuite fournie par Google.</p>
                
                <ol class="tutorial-list">
                    <li>
                        <strong>Obtenir votre clé :</strong> Allez sur <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>. Connectez-vous avec votre compte Google et cliquez sur <em>"Create API key"</em>.
                    </li>
                    <li>
                        <strong>Comprendre les Quotas (Limites) :</strong>
                        <ul>
                            <li><strong>Version Gratuite :</strong> Limitée à environ 5 requêtes par minute et 20 par jour (limite officielle actuelle). Vos données peuvent être utilisées par Google pour améliorer leurs modèles.</li>
                            <li><strong>Version Payante :</strong> Pas de limite de quota stricte (payé à l'usage) et vos données restent **privées**.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Maximiser l'utilisation :</strong> Vous pouvez créer **jusqu'à 15 clés différentes** sur votre compte Google. Ajoutez-les toutes ici ! L'application passera automatiquement de l'une à l'autre quand une est saturée, multipliant ainsi votre capacité d'utilisation quotidienne.
                    </li>
                    <li>
                        <strong>Installation :</strong> Copiez la clé (elle commence par <code>AIza...</code>) et collez-la ci-dessus, puis validez avec "Ajouter".
                    </li>
                </ol>
                
                <div class="alert alert-info">
                    💡 <strong>Astuce :</strong> Si vous utilisez l'application intensément, avoir 3 ou 4 clés enregistrées vous garantit une expérience fluide toute la journée.
                </div>
            </div>
          </div>
        </section>

        <!-- User Profile -->
        <section class="settings-section card">
          <h2>👤 Profil</h2>
          
          <div class="input-group">
            <label class="input-label">Niveau de français</label>
            <select class="input" id="user-level">
              ${Object.entries(LEVELS).map(([key, val]) => `
                <option value="${key}" ${this.profile.level === key ? 'selected' : ''}>${val.name}</option>
              `).join('')}
            </select>
            <p class="input-hint">Votre niveau influence la difficulté des dictées et les points gagnés.</p>
          </div>
        </section>

        <!-- Audio Settings -->
        <section class="settings-section card">
          <h2>🔊 Audio</h2>
          
          <div class="input-group">
            <label class="input-label">Voix de synthèse</label>
            <select class="input" id="voice-select">
              ${voices.length > 0 ? voices.map(v => `
                <option value="${v.name}" ${audioService.voice?.name === v.name ? 'selected' : ''}>
                  ${v.name}
                </option>
              `).join('') : '<option>Aucune voix française disponible</option>'}
            </select>
          </div>
          
          <div class="input-group">
            <label class="input-label">Vitesse de lecture: <span id="rate-value">${this.settings.speechRate || 0.9}</span></label>
            <input 
              type="range" 
              class="range-input" 
              id="speech-rate" 
              min="0.5" 
              max="1.5" 
              step="0.1"
              value="${this.settings.speechRate || 0.9}"
            >
            <div class="range-labels">
              <span>Lent</span>
              <span>Normal</span>
              <span>Rapide</span>
            </div>
          </div>
          
          <button class="btn btn-secondary" id="test-voice">
            🔊 Tester la voix
          </button>
        </section>

        <!-- Question Settings -->
        <section class="settings-section card">
          <h2>📝 Configuration des Questions</h2>
          
          <div class="input-group">
             <label class="input-label">Nombre de questions (Entraînement) : <span id="q-count-val">${this.settings.questionCount || 3}</span></label>
             <div class="range-with-input">
               <input type="range" class="range-input" id="question-count" min="1" max="10" value="${this.settings.questionCount || 3}">
               <input type="number" class="number-input" id="question-count-num" min="1" max="10" value="${this.settings.questionCount || 3}">
             </div>
          </div>

          <div class="input-group">
             <label class="input-label">Nombre de questions (Après Dictée) : <span id="post-q-count-val">${this.settings.postDictationQuestionCount || 3}</span></label>
             <div class="range-with-input">
               <input type="range" class="range-input" id="post-question-count" min="0" max="10" value="${this.settings.postDictationQuestionCount ?? 3}">
               <input type="number" class="number-input" id="post-question-count-num" min="0" max="10" value="${this.settings.postDictationQuestionCount ?? 3}">
             </div>
             <p class="input-hint">0 pour désactiver les questions après une dictée.</p>
          </div>

          <div class="input-group">
             <label class="input-label">Nombre de choix (QCM) : <span id="q-options-val">${this.settings.questionOptions || 3}</span></label>
             <div class="range-with-input">
               <input type="range" class="range-input" id="question-options" min="2" max="5" value="${this.settings.questionOptions || 3}">
               <input type="number" class="number-input" id="question-options-num" min="2" max="5" value="${this.settings.questionOptions || 3}">
             </div>
          </div>

          <div class="checkbox-group">
             <label class="checkbox-label">
                <input type="checkbox" id="q-type-grammar" ${this.settings.questionTypes?.includes('grammar') !== false ? 'checked' : ''}>
                <span>Grammaire et Conjugaison</span>
             </label>
          </div>
          <div class="checkbox-group">
             <label class="checkbox-label">
                <input type="checkbox" id="q-type-vocab" ${this.settings.questionTypes?.includes('vocabulary') ? 'checked' : ''}>
                <span>Vocabulaire (Définitions)</span>
             </label>
          </div>
          <div class="checkbox-group">
             <label class="checkbox-label">
                <input type="checkbox" id="q-type-professor" ${this.settings.questionTypes?.includes('professor') !== false ? 'checked' : ''}>
                <span>Mode Professeur Inversé (Trouver l'erreur)</span>
             </label>
          </div>

          <div class="checkbox-group">
             <label class="checkbox-label">
                <input type="checkbox" id="short-dictation-questions" ${this.settings.shortDictationQuestions ? 'checked' : ''}>
                <span>Activer les questions pour les dictées courtes (< 30 mots)</span>
             </label>
          </div>
        </section>

        <!-- Keyboard Shortcuts -->
        <section class="settings-section card">
            <h2>⌨️ Raccourcis Clavier</h2>
            <div class="shortcuts-grid">
               ${Object.entries(this.settings.keyBindings || {}).map(([action, keys]) => {
      // Ensure keys is an array
      const keyList = Array.isArray(keys) ? keys : (keys ? [keys] : []);
      if (keyList.length === 0) return ''; // Skip empty bindings if any

      return `
                 <div class="shortcut-item">
                   <span class="shortcut-label">${action}</span>
                   <div class="shortcut-keys-container">
                       ${keyList.map(key => `
                           <span class="key-tag">
                               ${key}
                               <button class="remove-key-btn" data-action="${action}" data-key="${key}" title="Supprimer">×</button>
                           </span>
                       `).join('')}
                       <button class="add-key-btn btn btn-ghost btn-sm" data-action="${action}" title="Ajouter un raccourci">+</button>
                   </div>
                 </div>
               `}).join('')}
            </div>
            <p class="text-sm text-muted mt-4">Cliquez sur "+" pour ajouter une touche, sur "×" pour supprimer.</p>
        </section>

        <!-- Cloud Sync Configuration -->
        <section class="settings-section card">
          <h2>☁️ Stockage Cloud (Optionnel)</h2>
          <p class="text-secondary mb-4">
            Connectez votre propre compte <strong>Supabase</strong> pour synchroniser vos données entre vos appareils.
            C'est 100% gratuit et vous gardez le contrôle total de vos données.
          </p>

          <div class="checkbox-group mb-4">
            <label class="checkbox-label">
              <input type="checkbox" id="cloud-enabled" ${storageService.getCloudSettings().enabled ? 'checked' : ''}>
              <span>Activer la synchronisation Cloud</span>
            </label>
          </div>

          <div id="cloud-config-fields" class="${storageService.getCloudSettings().enabled ? '' : 'hide'}">
            <div class="input-group">
              <label class="input-label">URL Supabase</label>
              <input type="text" class="input" id="supabase-url" placeholder="https://xyz.supabase.co" value="${storageService.getCloudSettings().supabaseUrl || ''}">
            </div>

            <div class="input-group">
              <label class="input-label">Clé API Supabase (Anon Key)</label>
              <input type="password" class="input" id="supabase-key" placeholder="votre_anon_key_ici" value="${storageService.getCloudSettings().supabaseKey || ''}">
            </div>

            <div class="api-status-row">
                <p class="input-hint">
                    ${storageService.getCloudSettings().lastSync ? `✓ Dernière synchro : ${new Date(storageService.getCloudSettings().lastSync).toLocaleString()}` : 'ℹ️ Jamais synchronisé'}
                </p>
                <button class="btn btn-ghost btn-sm text-gradient" id="toggle-cloud-tutorial">❓ Aide configuration</button>
            </div>
            
            <div class="flex gap-2 mt-4">
              <button class="btn btn-primary flex-1" id="sync-now">
                  📤 Envoyer vers le Cloud
              </button>
              <button class="btn btn-secondary flex-1" id="download-cloud">
                  📥 Récupérer du Cloud
              </button>
            </div>
          </div>

          <!-- Cloud Tutorial Section (Hidden by default) -->
          <div id="cloud-tutorial" class="api-tutorial card glass hide">
            <div class="tutorial-header">
                <h3>☁️ Créer votre propre Cloud Gratuit</h3>
            </div>
            <div class="tutorial-body">
                <p>Suivez ces étapes pour obtenir vos propres clés de synchronisation :</p>
                <ol class="tutorial-list">
                    <li>Allez sur <a href="https://supabase.com/" target="_blank">Supabase.com</a> et créez un compte gratuit.</li>
                    <li>Créez un nouveau projet (ex: "Mes Dictées").</li>
                    <li>Dans les paramètres du projet (roue dentée) -> <strong>API</strong> :</li>
                    <ul>
                        <li>Copiez l'<strong>URL</strong> du projet.</li>
                        <li>Copiez la clé <strong>anon public</strong>.</li>
                    </ul>
                    <li>Collez-les ici et activez la synchronisation.</li>
                </ol>
                <div class="alert alert-info">
                    🛡️ <strong>Sécurité :</strong> Vos clés sont stockées localement sur cet appareil. Pour le multijoueur, si vous hébergez, les autres joueurs pourront interagir temporairement avec votre instance via une "salle" sécurisée, mais sans accéder à vos données personnelles.
                </div>
            </div>
          </div>
        </section>

        <!-- Preferences -->
        <section class="settings-section card">
          <h2>⚙️ Préférences</h2>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="show-keyboard-hints" ${this.settings.showKeyboardHints !== false ? 'checked' : ''}>
              <span>Afficher les raccourcis clavier</span>
            </label>
          </div>
          
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="enable-timer" ${this.settings.enableTimer !== false ? 'checked' : ''}>
              <span>Activer le chronomètre (mode vitesse)</span>
            </label>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="auto-grammar" ${this.settings.autoGrammarAnalysis !== false ? 'checked' : ''}>
              <span>Analyse grammaticale automatique (plus lent)</span>
            </label>
          </div>
        </section>

        <!-- Data Management -->
        <section class="settings-section card">
          <h2>💾 Données</h2>
          
          <div class="data-actions">
            <button class="btn btn-secondary" id="export-data">
              📤 Exporter mes données
            </button>
            <button class="btn btn-secondary" id="import-data">
              📥 Importer des données
            </button>
            <input type="file" id="import-file" accept=".json" style="display: none;">
          </div>
          
          <hr class="divider">
          
          <div class="danger-zone">
            <h3 class="text-error">Zone dangereuse</h3>
            <p class="text-muted">Ces actions sont irréversibles.</p>
            <button class="btn btn-ghost text-error" id="reset-progress">
              🔄 Réinitialiser ma progression
            </button>
            <button class="btn btn-ghost text-error" id="delete-all-data">
              🗑️ Supprimer toutes mes données
            </button>
          </div>
        </section>

        <!-- Back Button -->
        <div class="back-action">
          <button class="btn btn-ghost" id="back-to-dashboard">
            ← Retour au tableau de bord
          </button>
        </div>
      </div>

      <style>
        .settings-view {
          max-width: 700px;
          margin: 0 auto;
        }
        .page-header { text-align: center; margin-bottom: var(--space-8); }
        .settings-section { margin-bottom: var(--space-6); }
        .settings-section h2 { font-size: var(--text-xl); margin-bottom: var(--space-4); }
        .api-input-row { display: flex; gap: var(--space-2); }
        .api-input-row .input { flex: 1; }
        .input-hint { font-size: var(--text-sm); margin-top: var(--space-2); }
        .input-hint.success { color: var(--color-success-400); }
        .input-hint.error { color: var(--color-warning-400); }
        .range-input { width: 100%; height: 8px; -webkit-appearance: none; background: var(--color-bg-tertiary); border-radius: var(--radius-full); margin: var(--space-3) 0; }
        .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: var(--color-primary-500); border-radius: 50%; cursor: pointer; box-shadow: var(--shadow-glow); }
        .range-labels { display: flex; justify-content: space-between; font-size: var(--text-sm); color: var(--color-text-muted); }
        .checkbox-group { margin-bottom: var(--space-3); }
        .checkbox-label { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; }
        .checkbox-label input[type="checkbox"] { width: 20px; height: 20px; accent-color: var(--color-primary-500); }
        .data-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
        .divider { border: none; border-top: 1px solid var(--color-surface-glass-border); margin: var(--space-6) 0; }
        .danger-zone { padding: var(--space-4); background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-lg); }
        .danger-zone h3 { margin-bottom: var(--space-2); }
        .danger-zone p { margin-bottom: var(--space-4); }
        .danger-zone .btn { margin-right: var(--space-2); margin-bottom: var(--space-2); }
        .text-error { color: var(--color-error-400); }
        .back-action { margin-top: var(--space-8); text-align: center; }
        .keys-list { list-style: none; padding: 0; margin-bottom: var(--space-4); border: 1px solid var(--color-surface-glass-border); border-radius: var(--radius-md); overflow: hidden; }
        .key-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-surface-glass-border); }
        .key-item:last-child { border-bottom: none; }
        .key-value { font-family: monospace; color: var(--color-text-muted); }
        .btn-sm { padding: 4px 8px; font-size: 0.8rem; }
        .key-value { font-family: monospace; color: var(--color-text-muted); }
        .btn-sm { padding: 4px 8px; font-size: 0.8rem; }
        .shortcuts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
        .shortcut-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2); background: var(--color-bg-tertiary); border-radius: var(--radius-md); }
        .shortcut-key { font-family: monospace; background: var(--color-surface-glass); border: 1px solid var(--color-border); min-width: 60px; }
        .shortcut-key.listening { border-color: var(--color-primary-400); color: var(--color-primary-400); animation: pulse 1s infinite; }
        .range-with-input { display: flex; align-items: center; gap: var(--space-3); }
        .number-input { width: 60px; padding: var(--space-1); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-bg-tertiary); color: var(--color-text-primary); text-align: center; }
        .shortcut-keys-container { display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: flex-end; }
        .key-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--color-surface-glass); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-family: monospace; font-size: 0.85em; }
        .remove-key-btn { width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: var(--color-text-muted); cursor: pointer; padding: 0; font-size: 12px; line-height: 1; }
        .remove-key-btn:hover { background: var(--color-error-400); color: white; }
        .add-key-btn { width: 24px; height: 24px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; border: 1px dashed var(--color-border); }
        .add-key-btn:hover { border-color: var(--color-primary-400); color: var(--color-primary-400); }
        .add-key-btn.listening { border-color: var(--color-primary-400); color: var(--color-primary-400); animation: pulse 1s infinite; background: rgba(59, 130, 246, 0.1); }
        .api-status-row { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); }
        .api-tutorial { margin-top: var(--space-4); border: 1px solid var(--color-surface-glass-border); padding: var(--space-4); }
        .api-tutorial.hide { display: none; }
        .tutorial-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-surface-glass-border); padding-bottom: var(--space-2); }
        .tutorial-header h3 { font-size: 1.1rem; margin: 0; }
        .tutorial-list { padding-left: var(--space-6); }
        .tutorial-list li { margin-bottom: var(--space-3); line-height: 1.5; }
        .tutorial-list ul { margin-top: var(--space-2); padding-left: var(--space-5); list-style-type: disc; }
        .alert { padding: var(--space-3); border-radius: var(--radius-md); font-size: 0.9rem; }
        .alert-info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); }
        .text-xs { font-size: 0.7rem; }
        .text-gradient { background: linear-gradient(135deg, #8b80f9 0%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
      </style>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Model selection
    document.getElementById('model-select')?.addEventListener('change', (e) => {
      const modelId = e.target.value;
      storageService.setSelectedModel(modelId);
      geminiService.initialize(storageService.getApiKeys(), modelId);

      // Update description
      const desc = GEMINI_MODELS.find(m => m.id === modelId)?.description || '';
      document.getElementById('model-description').textContent = desc;

      this.app.showToast('Modèle IA mis à jour', 'success');
    });

    // Add API Key
    document.getElementById('add-api-key')?.addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      const newKey = input?.value.trim();

      if (!newKey) {
        this.app.showToast('Veuillez entrer une clé API.', 'warning');
        return;
      }

      if (storageService.addApiKey(newKey)) {
        // Re-initialize service with new list
        geminiService.initialize(storageService.getApiKeys(), storageService.getSelectedModel());
        this.app.showToast('Clé API ajoutée!', 'success');
        this.render(); // Re-render to show list
      }
    });

    // Toggle API Tutorial
    document.getElementById('toggle-tutorial')?.addEventListener('click', () => {
      const tutorial = document.getElementById('api-tutorial');
      const btn = document.getElementById('toggle-tutorial');
      const isHidden = tutorial.classList.toggle('hide');
      btn.textContent = isHidden ? "❓ Besoin d'aide ? Voir le tutoriel" : "✖️ Fermer le tutoriel";
    });

    // Remove API Key
    this.container.querySelectorAll('.remove-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        if (confirm('Supprimer cette clé API ?')) {
          storageService.removeApiKey(key);
          geminiService.initialize(storageService.getApiKeys(), storageService.getSelectedModel());
          this.app.showToast('Clé supprimée.', 'info');
          this.render();
        }
      });
    });

    // User level
    document.getElementById('user-level')?.addEventListener('change', (e) => {
      storageService.updateUserProfile({ level: e.target.value });
      this.app.showToast('Niveau mis à jour.', 'success');
    });

    // Voice selection
    document.getElementById('voice-select')?.addEventListener('change', (e) => {
      audioService.setVoice(e.target.value);
    });

    // Speech rate
    document.getElementById('speech-rate')?.addEventListener('input', (e) => {
      const rate = parseFloat(e.target.value);
      document.getElementById('rate-value').textContent = rate;
      storageService.updateSettings({ speechRate: rate });
    });

    // Test voice
    document.getElementById('test-voice')?.addEventListener('click', () => {
      audioService.speakOnce('Bonjour! Ceci est un test de la synthèse vocale.');
    });

    // Question Settings Sync (Slider <-> Number Input)
    const syncInputs = (sliderId, numId, settingKey) => {
      const slider = document.getElementById(sliderId);
      const numInput = document.getElementById(numId);
      const displayVal = document.getElementById(sliderId === 'question-count' ? 'q-count-val' : 'q-options-val');

      if (!slider || !numInput) return;

      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        numInput.value = val;
        if (displayVal) displayVal.textContent = val;
        storageService.updateSettings({ [settingKey]: val });
      });

      numInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        // Clamp value
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        if (val < min) val = min;
        if (val > max) val = max;
        if (isNaN(val)) val = min;

        slider.value = val;
        if (displayVal) displayVal.textContent = val;
        storageService.updateSettings({ [settingKey]: val });
      });
    };

    syncInputs('question-count', 'question-count-num', 'questionCount');
    syncInputs('post-question-count', 'post-question-count-num', 'postDictationQuestionCount');
    syncInputs('question-options', 'question-options-num', 'questionOptions');

    const updateTypes = () => {
      const types = [];
      if (document.getElementById('q-type-grammar').checked) types.push('grammar');
      if (document.getElementById('q-type-vocab').checked) types.push('vocabulary');
      if (document.getElementById('q-type-professor').checked) types.push('professor');
      storageService.updateSettings({ questionTypes: types });
    };

    document.getElementById('q-type-grammar')?.addEventListener('change', updateTypes);
    document.getElementById('q-type-vocab')?.addEventListener('change', updateTypes);
    document.getElementById('q-type-professor')?.addEventListener('change', updateTypes);

    // Short Dictation Questions Toggle
    document.getElementById('short-dictation-questions')?.addEventListener('change', (e) => {
      storageService.updateSettings({ shortDictationQuestions: e.target.checked });
    });


    // Preferences
    document.getElementById('show-keyboard-hints')?.addEventListener('change', (e) => {
      storageService.updateSettings({ showKeyboardHints: e.target.checked });
    });

    document.getElementById('enable-timer')?.addEventListener('change', (e) => {
      storageService.updateSettings({ enableTimer: e.target.checked });
    });

    document.getElementById('auto-grammar')?.addEventListener('change', (e) => {
      storageService.updateSettings({ autoGrammarAnalysis: e.target.checked });
    });

    // Cloud Sync Settings
    document.getElementById('cloud-enabled')?.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      storageService.updateCloudSettings({ enabled });
      document.getElementById('cloud-config-fields')?.classList.toggle('hide', !enabled);
      this.app.showToast(enabled ? 'Synchronisation activée' : 'Synchronisation désactivée', 'info');
    });

    document.getElementById('supabase-url')?.addEventListener('input', (e) => {
      storageService.updateCloudSettings({ supabaseUrl: e.target.value.trim() });
    });

    document.getElementById('supabase-key')?.addEventListener('input', (e) => {
      storageService.updateCloudSettings({ supabaseKey: e.target.value.trim() });
    });

    document.getElementById('toggle-cloud-tutorial')?.addEventListener('click', () => {
      document.getElementById('cloud-tutorial')?.classList.toggle('hide');
    });

    document.getElementById('sync-now')?.addEventListener('click', async () => {
      const btn = document.getElementById('sync-now');
      const originalText = btn.innerHTML;
      try {
        btn.disabled = true;
        btn.innerHTML = '⏳ Synchronisation...';
        const result = await storageService.performFullSync();
        if (result.success) {
          this.app.showToast('Données envoyées sur votre Supabase !', 'success');
          this.render();
        } else {
          this.app.showToast(`Échec : ${result.message}`, 'error');
        }
      } catch (e) {
        this.app.showToast('Erreur lors de l\'envoi', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });

    document.getElementById('download-cloud')?.addEventListener('click', async () => {
      if (!confirm('Cela remplacera vos données locales par celles du Cloud. Continuer ?')) return;
      const btn = document.getElementById('download-cloud');
      const originalText = btn.innerHTML;
      try {
        btn.disabled = true;
        btn.innerHTML = '⏳ Récupération...';
        const result = await storageService.downloadFromCloud();
        if (result.success) {
          alert('Données récupérées avec succès ! L\'application va redémarrer.');
          window.location.reload();
        } else {
          this.app.showToast(`Échec : ${result.message}`, 'error');
        }
      } catch (e) {
        this.app.showToast('Erreur lors de la récupération', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });

    // ... (Export/Import/Reset/Back - Unchanged) ...

    // Export data
    document.getElementById('export-data')?.addEventListener('click', () => {
      const data = storageService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dictee-intelligente-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.app.showToast('Données exportées!', 'success');
    });

    // Import data
    document.getElementById('import-data')?.addEventListener('click', () => {
      document.getElementById('import-file')?.click();
    });

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          storageService.importData(data);
          this.app.showToast('Données importées!', 'success');
          this.render();
        } catch (error) {
          this.app.showToast('Erreur lors de l\'import.', 'error');
        }
      };
      reader.readAsText(file);
    });

    // Reset progress
    document.getElementById('reset-progress')?.addEventListener('click', () => {
      if (confirm('Réinitialiser votre progression? Vos données de progression seront supprimées, mais vos paramètres et vocabulaire seront conservés.')) {
        storageService.updateUserProfile({
          totalPoints: 0,
          totalDictations: 0,
          perfectDictations: 0,
          streakDays: 0,
          lastPlayDate: null
        });
        storageService.setErrors([]);
        storageService.setAchievements([]);
        storageService.setHistory([]);
        this.app.showToast('Progression réinitialisée.', 'info');
      }
    });

    // Delete all data
    document.getElementById('delete-all-data')?.addEventListener('click', () => {
      if (confirm('⚠️ ATTENTION: Supprimer TOUTES vos données? Cette action est irréversible.')) {
        if (confirm('Êtes-vous vraiment sûr? Tapez "CONFIRMER" pour continuer.')) {
          storageService.resetAllData();
          this.app.showToast('Toutes les données ont été supprimées.', 'info');
          this.app.navigate('/');
        }
      }
    });

    // Back button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
      this.app.navigate('/');
    });

    // Multi-key binding listeners

    // Add Key
    this.container.querySelectorAll('.add-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        btn.classList.add('listening');

        const handleKey = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const code = e.code;
          const bindings = storageService.getKeyBindings();
          const currentKeys = Array.isArray(bindings[action]) ? bindings[action] : [bindings[action]];

          if (!currentKeys.includes(code)) {
            currentKeys.push(code);
            bindings[action] = currentKeys;
            storageService.setKeyBindings(bindings);

            // Force update local settings to ensure immediate render
            this.settings.keyBindings = bindings;

            this.app.showToast('Raccourci ajouté !', 'success');
          } else {
            this.app.showToast('Touche déjà assignée.', 'info');
          }

          btn.classList.remove('listening');
          this.render(); // Re-render to show new key
          this.attachEventListeners(); // Re-attach listeners after render
        };

        document.addEventListener('keydown', handleKey, { once: true });
      });
    });

    // Remove Key
    this.container.querySelectorAll('.remove-key-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const keyToRemove = btn.dataset.key;

        const bindings = storageService.getKeyBindings();
        let currentKeys = Array.isArray(bindings[action]) ? bindings[action] : [bindings[action]];

        if (currentKeys.length <= 1) {
          this.app.showToast('Il doit rester au moins une touche.', 'warning');
          return;
        }

        currentKeys = currentKeys.filter(k => k !== keyToRemove);
        bindings[action] = currentKeys;
        storageService.setKeyBindings(bindings);

        // Force update local settings to ensure immediate render
        this.settings.keyBindings = bindings;

        this.render();
        this.attachEventListeners(); // Re-attach listeners after render
        this.app.showToast('Raccourci supprimé.', 'info');
      });
    });
  }

  destroy() {
    // Cleanup if needed
  }
}
