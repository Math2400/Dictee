/**
 * Main Application Entry Point
 * Initializes services and handles routing
 */

import './styles/index.css';
import './styles/components.css';

import { geminiService } from './services/gemini.js';
import { storageService } from './services/storage.js';
import { audioService } from './services/audio.js';
import { Dashboard } from './components/Dashboard.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { DictationView } from './components/DictationView.js';
import { CorrectionView } from './components/CorrectionView.js';
import { QuizView } from './components/QuizView.js';
import { VocabularyManager } from './components/VocabularyManager.js';
import { ErrorsManager } from './components/ErrorsManager.js';
import { TrainingView } from './components/TrainingView.js';
import { SettingsView } from './components/SettingsView.js';
import { MultiplayerView } from './components/MultiplayerView.js';
import { ROUTES } from './utils/constants.js';

class App {
    constructor() {
        this.currentView = null;
        this.currentRoute = '';
        this.state = {
            currentDictation: null,
            currentTheme: null,
            correctionData: null,
            quizData: null
        };

        this.init();
    }

    async init() {
        // Initialiser les services
        // Initialiser les services
        const storedKey = storageService.getApiKey();
        const apiKey = storedKey;

        if (apiKey) {
            try {
                geminiService.initialize(apiKey);
            } catch (e) {
                console.warn('Erreur initialisation Gemini:', e);
            }
        }

        // Configurer le routage
        this.setupRouting();

        // Écouter les changements d'URL
        window.addEventListener('hashchange', () => this.handleRoute());

        // Route initiale
        this.handleRoute();

        // Vérifier les achievements au démarrage
        const newAchievements = storageService.checkAchievements();
        if (newAchievements.length > 0) {
            newAchievements.forEach(a => this.showToast(`🏆 Nouvelle médaille : ${a.name}!`, 'success'));
        }

        // Enregistrer le Service Worker pour le mode PWA
        this.registerServiceWorker();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(reg => console.log('Service Worker enregistré !', reg.scope))
                    .catch(err => console.warn('Échec enregistrement SW:', err));
            });
        }
    }

    setupRouting() {
        // Mettre à jour les liens de navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.getAttribute('href');
                window.location.hash = route;
            });
        });
    }

    handleRoute() {
        const hash = window.location.hash || '#/';
        const route = hash.slice(1); // Enlever le #

        // Mettre à jour le lien actif
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkRoute = link.getAttribute('href').slice(1);
            link.classList.toggle('active', linkRoute === route ||
                (route.startsWith(linkRoute) && linkRoute !== '/'));
        });

        this.currentRoute = route;
        this.renderView(route);
    }

    renderView(route) {
        const container = document.getElementById('main-content');

        // Nettoyer l'ancienne vue
        if (this.currentView && typeof this.currentView.destroy === 'function') {
            this.currentView.destroy();
        }

        container.innerHTML = '';

        // Router vers la bonne vue
        switch (true) {
            case route === '/' || route === '':
                this.currentView = new Dashboard(container, this);
                break;

            case route === '/dictation':
                const pendingRedo = storageService.getPendingRedo();
                if (pendingRedo) {
                    this.state.currentTheme = pendingRedo.theme || { name: 'Dictée', icon: '📝', id: 'redo' };
                    this.currentView = new DictationView(container, this);
                } else {
                    this.currentView = new ThemeSelector(container, this);
                }
                break;

            case route.startsWith('/dictation/'):
                const themeId = route.split('/')[2];
                this.state.currentTheme = storageService.getTheme(themeId);
                this.currentView = new DictationView(container, this);
                break;

            case route === '/correction':
                if (this.state.correctionData) {
                    this.currentView = new CorrectionView(container, this);
                } else {
                    this.navigate('/');
                }
                break;

            case route === '/quiz':
                if (this.state.quizData) {
                    this.currentView = new QuizView(container, this);
                } else {
                    this.navigate('/');
                }
                break;

            case route === '/vocabulary':
                this.currentView = new VocabularyManager(container, this);
                break;

            case route === '/errors':
                this.currentView = new ErrorsManager(container, this);
                break;

            case route === '/settings':
                this.currentView = new SettingsView(container, this);
                break;

            case route === '/training':
                this.currentView = new TrainingView(container, this);
                break;

            case route === '/multiplayer':
                this.currentView = new MultiplayerView(container, this);
                break;

            default:
                this.navigate('/');
        }
    }

    navigate(route) {
        window.location.hash = route;
    }

    setState(updates) {
        this.state = { ...this.state, ...updates };
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Supprimer après 3 secondes
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading(message = 'Chargement...') {
        const container = document.getElementById('main-content');
        const existingLoader = container.querySelector('.loading-overlay');
        if (existingLoader) return;

        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
        loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 13, 26, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1rem;
      z-index: 1000;
    `;
        container.appendChild(loader);
    }

    hideLoading() {
        const loader = document.querySelector('.loading-overlay');
        if (loader) {
            loader.remove();
        }
    }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
