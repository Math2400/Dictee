/**
 * Multiplayer View
 * Gère les sessions de jeu temps réel
 */

import { multiplayerService } from '../services/multiplayer.js';
import { storageService } from '../services/storage.js';
import { geminiService } from '../services/gemini.js';

export class MultiplayerView {
    constructor(container, app) {
        this.container = container;
        this.app = app;

        const inActiveRoom = !!multiplayerService.roomCode;

        this.state = {
            view: inActiveRoom ? 'room' : 'lobby',
            playerName: multiplayerService.playerName || storageService.getSettings().playerName || `Joueur_${Math.floor(Math.random() * 1000)}`,
            roomCode: multiplayerService.roomCode || '',
            players: multiplayerService.players || [],
            pendingDictation: null
        };

        this.setupServiceListeners();
        this.render();
    }

    render() {
        if (this.state.view === 'lobby') {
            this.renderLobby();
        } else {
            this.renderRoom();
        }
    }

    renderLobby() {
        this.container.innerHTML = `
            <div class="multiplayer-view animate-fadeIn">
                <header class="page-header">
                    <h1 class="text-gradient">Mode Multijoueur</h1>
                    <p class="text-secondary">Défiez vos amis en temps réel</p>
                </header>

                <div class="card mb-6">
                    <div class="input-group">
                        <label class="input-label">Votre pseudonyme</label>
                        <input type="text" class="input" id="player-name" value="${this.state.playerName}">
                    </div>
                </div>

                <div class="multi-grid">
                    <section class="card host-section">
                        <h2>🎮 Héberger une partie</h2>
                        <p class="text-secondary mb-4">Créez une session sur votre propre instance Cloud.</p>
                        <button class="btn btn-primary" id="create-room">🚀 Créer une salle</button>
                    </section>

                    <section class="card join-section">
                        <h2>🤝 Rejoindre une partie</h2>
                        <p class="text-secondary mb-4">Entrez le code partagé par votre ami.</p>
                        <div class="input-group">
                            <input type="text" class="input" id="join-room-code" placeholder="Code (ex: ABCD)">
                        </div>
                        <button class="btn btn-secondary mt-2" id="join-btn">Rejoindre</button>
                    </section>
                </div>

                <div class="alert alert-info mt-6">
                    💡 <strong>Note :</strong> L'hébergement nécessite un compte Supabase configuré dans les paramètres.
                </div>
            </div>

            <style>
                .multi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: var(--space-6);
                }
                .host-section, .join-section {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 220px;
                }
            </style>
        `;
        this.attachLobbyEvents();
    }

    renderRoom() {
        const isHost = multiplayerService.isHost;
        const roomState = multiplayerService.roomState;

        this.container.innerHTML = `
            <div class="room-view animate-fadeIn">
                <header class="page-header flex justify-between items-center">
                    <div>
                        <h1 class="text-gradient">Salle : ${this.state.roomCode}</h1>
                        <p class="text-secondary">${this.getRoomStatusText()}</p>
                    </div>
                    <button class="btn btn-ghost text-error" id="leave-room">Quitter</button>
                </header>

                <div class="room-content grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card">
                        <h3>Joueurs (${this.state.players.length})</h3>
                        <div class="player-list mt-4">
                            ${this.state.players.map(p => `
                                <div class="player-item flex justify-between items-center p-3 mb-2 glass rounded-lg ${p.online ? '' : 'opacity-50'}">
                                    <div class="flex items-center gap-2">
                                        <span>${p.is_host ? '👑' : '👤'} ${p.name}</span>
                                        ${p.online ? '<span class="status-dot dot-success" title="En ligne"></span>' : '<span class="status-dot dot-error" title="Déconnecté"></span>'}
                                    </div>
                                    <span class="badge ${p.score > 0 ? 'badge-success' : 'badge-ghost'}">${p.score} pts</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card flex flex-col justify-center items-center text-center">
                        ${isHost ? this.renderHostControls(roomState) : this.renderGuestStatus(roomState)}
                    </div>
                </div>
            </div>
        `;
        this.attachRoomEvents();
    }

    getRoomStatusText() {
        switch (multiplayerService.roomState) {
            case 'lobby': return 'En attente des participants...';
            case 'generating': return 'Génération de la dictée en cours...';
            case 'ready': return 'La dictée est prête !';
            case 'dictating': return 'Partie en cours';
            default: return 'Connecté';
        }
    }

    renderHostControls(state) {
        if (state === 'lobby') {
            return `
                <h3 class="mb-4">Configuration de la partie</h3>
                <div class="settings-grid w-full text-left mb-6">
                    <div class="input-group mb-4">
                        <label class="input-label">Longueur de la dictée (mots)</label>
                        <input type="number" class="input" id="multi-word-count" value="50" min="10" max="500">
                    </div>
                    <div class="flex items-center gap-3 mb-4">
                        <input type="checkbox" id="multi-include-errors" class="checkbox">
                        <label for="multi-include-errors">Inclure mes erreurs & vocabulaire</label>
                    </div>
                </div>
                <button class="btn btn-primary btn-lg w-full" id="btn-generate">🎲 Générer la dictée</button>
            `;
        } else if (state === 'generating') {
            return `
                <div class="animate-pulse">
                    <div class="loading-spinner mb-4"></div>
                    <p class="text-xl">L'IA compose...</p>
                </div>
            `;
        } else if (state === 'ready') {
            return `
                <div class="alert alert-success mb-6">
                    ✨ Dictée générée avec succès !
                </div>
                <div class="preview-box glass p-4 rounded-lg mb-6 text-left max-h-40 overflow-y-auto italic text-sm">
                    ${this.state.pendingDictation ? this.state.pendingDictation.text : 'Aperçu indisponible'}
                </div>
                <div class="flex gap-4 w-full">
                    <button class="btn btn-ghost flex-1" id="btn-regenerate">🔄 Refaire</button>
                    <button class="btn btn-primary flex-1" id="btn-start-now">🚀 Lancer pour tous</button>
                </div>
            `;
        }
        return ``;
    }

    renderGuestStatus(state) {
        if (state === 'lobby') {
            return `
                <div class="animate-pulse">
                    <p class="text-xl">En attente de l'hôte...</p>
                    <p class="text-sm text-muted">L'hôte configure la partie</p>
                </div>
            `;
        } else if (state === 'generating') {
            return `
                <div class="animate-pulse">
                    <div class="loading-spinner mb-4"></div>
                    <p class="text-xl">Hôte en train de générer...</p>
                    <p class="text-sm text-muted">Préparez vos stylos !</p>
                </div>
            `;
        } else if (state === 'ready') {
            return `
                <div class="alert alert-info">
                    ✨ La dictée est prête !
                </div>
                <p class="mt-4">L'hôte va lancer la partie d'un instant à l'autre.</p>
            `;
        }
        return ``;
    }

    attachLobbyEvents() {
        const nameInput = document.getElementById('player-name');
        nameInput.addEventListener('input', (e) => {
            this.state.playerName = e.target.value.trim();
            storageService.updateSettings({ playerName: this.state.playerName });
        });

        document.getElementById('create-room')?.addEventListener('click', async () => {
            const code = Math.random().toString(36).substring(2, 6).toUpperCase();
            try {
                this.app.showLoading('Création de la salle...');
                await multiplayerService.joinRoom(code, this.state.playerName, true);
                this.state.roomCode = code;
                this.state.view = 'room';
                this.setupServiceListeners();
                this.render();
            } catch (e) {
                this.app.showToast(e.message, 'error');
            } finally {
                this.app.hideLoading();
            }
        });

        document.getElementById('join-btn')?.addEventListener('click', async () => {
            const code = document.getElementById('join-room-code').value.trim().toUpperCase();
            if (!code) return this.app.showToast('Entrez un code de salle', 'warning');

            try {
                this.app.showLoading('Connexion à la salle...');
                await multiplayerService.joinRoom(code, this.state.playerName, false);
                this.state.roomCode = code;
                this.state.view = 'room';
                this.setupServiceListeners();
                this.render();
            } catch (e) {
                this.app.showToast(e.message, 'error');
            } finally {
                this.app.hideLoading();
            }
        });
    }

    attachRoomEvents() {
        document.getElementById('leave-room')?.addEventListener('click', () => {
            multiplayerService.leaveRoom();
            this.app.setState({ multiplayerDictation: null }); // Clear on explicit leave
            this.state.view = 'lobby';
            this.render();
        });

        // Host: Generate
        document.getElementById('btn-generate')?.addEventListener('click', () => this.handleGenerate());
        document.getElementById('btn-regenerate')?.addEventListener('click', () => this.handleGenerate());

        // Host: Start
        document.getElementById('btn-start-now')?.addEventListener('click', () => {
            if (!this.state.pendingDictation) return;
            multiplayerService.sendGameStart({
                dictation: this.state.pendingDictation,
                theme: { name: 'Compétition Multijoueur', icon: '⚔️' }
            });

            this.app.setState({
                currentTheme: { name: 'Compétition Multijoueur', icon: '⚔️' },
                multiplayerDictation: this.state.pendingDictation
            });
            this.app.navigate('/dictation');
        });
    }

    async handleGenerate() {
        const wordCount = parseInt(document.getElementById('multi-word-count')?.value || 50);
        const includeErrors = document.getElementById('multi-include-errors')?.checked;

        multiplayerService.sendRoomState('generating');
        this.renderRoom();

        try {
            const profile = storageService.getUserProfile();
            const dictation = await geminiService.generateDictation({
                theme: { name: 'Compétition Multijoueur', icon: '⚔️' },
                userProfile: {
                    level: profile.level,
                    errorsToReview: includeErrors ? profile.errorsToReview : []
                },
                vocabulary: includeErrors ? storageService.getVocabularyToReview(5) : [],
                minWords: wordCount - 5,
                maxWords: wordCount + 5
            });

            this.state.pendingDictation = dictation;
            multiplayerService.sendRoomState('ready');
            this.renderRoom();
        } catch (e) {
            this.app.showToast('Erreur génération : ' + e.message, 'error');
            multiplayerService.sendRoomState('lobby');
            this.renderRoom();
        }
    }

    setupServiceListeners() {
        multiplayerService.onPlayerUpdate = (players) => {
            console.log('Players update in view:', players);
            this.state.players = players;
            if (this.state.view === 'room') {
                this.render(); // Re-render to show players
            }
        };

        multiplayerService.onStateUpdate = (payload) => {
            console.log('State update in view:', payload);
            if (this.state.view === 'room') {
                this.render(); // Re-render to show new status
            }
        };

        multiplayerService.onGameStart = (payload) => {
            this.app.showToast('L\'hôte a lancé la dictée !', 'success');
            this.app.setState({
                currentTheme: payload.theme,
                multiplayerDictation: payload.dictation
            });
            this.app.navigate('/dictation');
        };
    }

    destroy() {
        // Ne pas quitter la salle automatiquement
    }
}
