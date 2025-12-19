/**
 * Multiplayer Service - Gestion des sessions en temps réel via Supabase
 */

import { cloudService } from './cloud.js';

class MultiplayerService {
    constructor() {
        this.channel = null;
        this.roomCode = null;
        this.players = [];
        this.isHost = false;
        this.roomState = 'lobby'; // 'lobby', 'generating', 'ready', 'dictating'
        this.knownPlayers = new Map(); // Store all players ever seen in this session
        this.onPlayerUpdate = null;
        this.onGameStart = null;
        this.onScoreUpdate = null;
        this.onStateUpdate = null;
        this.onResultsUpdate = null;
        this.onPlayAgainRequest = null;
    }

    /**
     * Rejoint ou crée une salle via un canal de diffusion (Broadcast)
     */
    async joinRoom(roomCode, playerName, isHost = false) {
        if (!cloudService.enabled || !cloudService.supabase) {
            throw new Error('Cloud non configuré. Veuillez activer le cloud dans les paramètres.');
        }

        this.roomCode = roomCode;
        this.playerName = playerName;
        this.isHost = isHost;
        this.roomState = 'lobby';

        // Créer un canal Realtime
        this.channel = cloudService.supabase.channel(`room:${roomCode}`, {
            config: {
                broadcast: { self: true },
                presence: { key: playerName }
            }
        });

        // Écouter les événements
        this.channel
            .on('broadcast', { event: 'game_start' }, ({ payload }) => {
                this.roomState = 'dictating';
                if (this.onGameStart) this.onGameStart(payload);
            })
            .on('broadcast', { event: 'state_update' }, ({ payload }) => {
                this.roomState = payload.state;
                if (this.onStateUpdate) this.onStateUpdate(payload);
            })
            .on('broadcast', { event: 'score_update' }, ({ payload }) => {
                this.updateLocalPlayerScore(payload);
            })
            .on('broadcast', { event: 'results_update' }, ({ payload }) => {
                if (this.onResultsUpdate) this.onResultsUpdate(payload);
            })
            .on('broadcast', { event: 'play_again' }, ({ payload }) => {
                if (this.onPlayAgainRequest) this.onPlayAgainRequest(payload);
            })
            .on('presence', { event: 'sync' }, () => {
                const newState = this.channel.presenceState();
                console.log('Realtime Presence Sync:', newState);

                // Reset online status for all known players
                for (let player of this.knownPlayers.values()) {
                    player.online = false;
                }

                Object.entries(newState).forEach(([key, value]) => {
                    const presence = value[0];
                    const playerData = {
                        name: key,
                        is_host: presence.is_host,
                        score: presence.score || 0,
                        online_at: presence.online_at,
                        online: true
                    };

                    // Update or add to known players
                    const existing = this.knownPlayers.get(key);
                    if (existing) {
                        Object.assign(existing, playerData);
                    } else {
                        this.knownPlayers.set(key, playerData);
                    }
                });

                this.players = Array.from(this.knownPlayers.values());

                // Sort to keep host first or alphabetical
                this.players.sort((a, b) => b.is_host - a.is_host || a.name.localeCompare(b.name));

                if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Joueur rejoint (Presence):', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Joueur parti (Presence):', key, leftPresences);
            });

        // S'abonner
        await this.channel.subscribe(async (status) => {
            console.log('Connection status:', status);
            if (status === 'SUBSCRIBED') {
                const presenceData = {
                    online_at: new Date().toISOString(),
                    is_host: isHost,
                    score: 0
                };
                console.log('Tracking presence:', presenceData);
                await this.channel.track(presenceData);
            }
        });

        // Sauvegarder la session pour reconnexion
        this.saveSession();

        return true;
    }

    saveSession(extraData = {}) {
        if (!this.roomCode) return;
        const existing = this.getPersistedSession() || {};
        const session = {
            roomCode: this.roomCode,
            playerName: this.playerName,
            isHost: this.isHost,
            timestamp: Date.now(),
            ...existing,
            ...extraData
        };
        localStorage.setItem('dictee_multiplayer_session', JSON.stringify(session));
    }

    getPersistedSession() {
        const sessionStr = localStorage.getItem('dictee_multiplayer_session');
        if (!sessionStr) return null;

        try {
            const session = JSON.parse(sessionStr);
            // Vérifier le timeout de 10 minutes
            const tenMinutes = 10 * 60 * 1000;
            if (Date.now() - session.timestamp > tenMinutes) {
                this.clearPersistedSession();
                return null;
            }
            return session;
        } catch (e) {
            return null;
        }
    }

    clearPersistedSession() {
        localStorage.removeItem('dictee_multiplayer_session');
    }

    sendRoomState(state, extraData = {}) {
        if (!this.isHost || !this.channel) return;
        this.roomState = state;
        this.channel.send({
            type: 'broadcast',
            event: 'state_update',
            payload: { state, ...extraData }
        });
    }

    sendGameStart(dictationData) {
        if (!this.isHost || !this.channel) return;
        this.roomState = 'dictating';
        this.channel.send({
            type: 'broadcast',
            event: 'game_start',
            payload: dictationData
        });
    }

    sendScore(playerName, score) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'score_update',
            payload: { playerName, score }
        });
    }

    updateLocalPlayerScore({ playerName, score }) {
        const player = this.knownPlayers.get(playerName);
        if (player) {
            player.score = score;
            this.players = Array.from(this.knownPlayers.values());
            this.players.sort((a, b) => b.is_host - a.is_host || a.name.localeCompare(b.name));
            if (this.onScoreUpdate) this.onScoreUpdate(this.players);
        }
    }

    sendResults(results) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'results_update',
            payload: { playerName: this.playerName, ...results }
        });
    }

    requestPlayAgain() {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'play_again',
            payload: { playerName: this.playerName, isHost: this.isHost }
        });
    }

    leaveRoom() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.roomCode = null;
        this.players = [];
        this.knownPlayers.clear();
        this.clearPersistedSession();
    }
}

export const multiplayerService = new MultiplayerService();
