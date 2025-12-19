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
        this.state = {
            view: 'lobby', // 'lobby' or 'room'
            playerName: storageService.getSettings().playerName || `Joueur_${Math.floor(Math.random() * 1000)}`,
            roomCode: '',
            players: []
        };
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
        this.container.innerHTML = `
            <div class="room-view animate-fadeIn">
                <header class="page-header flex justify-between items-center">
                    <div>
                        <h1 class="text-gradient">Salle : ${this.state.roomCode}</h1>
                        <p class="text-secondary">En attente des participants...</p>
                    </div>
                    <button class="btn btn-ghost text-error" id="leave-room">Quitter</button>
                </header>

                <div class="room-content grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="card">
                        <h3>Joueurs (${this.state.players.length})</h3>
                        <div class="player-list mt-4">
                            ${this.state.players.map(p => `
                                <div class="player-item flex justify-between items-center p-3 mb-2 glass rounded-lg">
                                    <span>${p.is_host ? '👑' : '👤'} ${p.name}</span>
                                    <span class="badge ${p.score > 0 ? 'badge-success' : 'badge-ghost'}">${p.score} pts</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card flex flex-col justify-center items-center text-center">
                        ${multiplayerService.isHost ? `
                            <p class="mb-6">En tant qu'hôte, vous pouvez lancer la dictée pour tout le monde.</p>
                            <button class="btn btn-primary btn-lg" id="start-game">🚀 Lancer la dictée</button>
                        ` : `
                            <div class="animate-pulse">
                                <p class="text-xl">En attente de l'hôte...</p>
                                <p class="text-sm text-muted">La dictée commencera automatiquement</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        this.attachRoomEvents();
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
                await multiplayerService.joinRoom(code, this.state.playerName, true);
                this.state.roomCode = code;
                this.state.view = 'room';
                this.setupServiceListeners();
                this.render();
            } catch (e) {
                this.app.showToast(e.message, 'error');
            }
        });

        document.getElementById('join-btn')?.addEventListener('click', async () => {
            const code = document.getElementById('join-room-code').value.trim().toUpperCase();
            if (!code) return this.app.showToast('Entrez un code de salle', 'warning');

            try {
                await multiplayerService.joinRoom(code, this.state.playerName, false);
                this.state.roomCode = code;
                this.state.view = 'room';
                this.setupServiceListeners();
                this.render();
            } catch (e) {
                this.app.showToast(e.message, 'error');
            }
        });
    }

    attachRoomEvents() {
        document.getElementById('leave-room')?.addEventListener('click', () => {
            multiplayerService.leaveRoom();
            this.state.view = 'lobby';
            this.render();
        });

        document.getElementById('start-game')?.addEventListener('click', async () => {
            const btn = document.getElementById('start-game');
            btn.disabled = true;
            btn.textContent = '⏳ Génération...';

            try {
                this.app.showToast('Génération de la dictée multijoueur...', 'info');

                // 1. Générer la dictée (Hôte seulement)
                const profile = storageService.getUserProfile();
                const dictation = await geminiService.generateDictation({
                    theme: { name: 'Compétition Multijoueur', icon: '⚔️' },
                    userProfile: { level: profile.level, errorsToReview: [] },
                    vocabulary: [],
                    minWords: 30,
                    maxWords: 60
                });

                // 2. Diffuser la dictée à tous les joueurs
                multiplayerService.sendGameStart({
                    dictation,
                    theme: { name: 'Compétition Multijoueur', icon: '⚔️' }
                });

                // 3. L'hôte navigue aussi vers la dictée
                this.app.setState({
                    currentTheme: { name: 'Compétition Multijoueur', icon: '⚔️' },
                    multiplayerDictation: dictation
                });
                this.app.navigate('/dictation');
            } catch (e) {
                this.app.showToast('Erreur génération : ' + e.message, 'error');
                btn.disabled = false;
                btn.textContent = '🚀 Lancer la dictée';
            }
        });
    }

    setupServiceListeners() {
        multiplayerService.onPlayerUpdate = (players) => {
            this.state.players = players;
            if (this.state.view === 'room') this.renderRoom();
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
        // Ne pas quitter la salle automatiquement pour permettre de rester en jeu
        // sauf si on change radicalement de vue
    }
}
