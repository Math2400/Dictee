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
        this.onPlayerUpdate = null;
        this.onGameStart = null;
        this.onScoreUpdate = null;
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
                if (this.onGameStart) this.onGameStart(payload);
            })
            .on('broadcast', { event: 'score_update' }, ({ payload }) => {
                this.updateLocalPlayerScore(payload);
            })
            .on('presence', { event: 'sync' }, () => {
                const newState = this.channel.presenceState();
                this.players = Object.entries(newState).map(([key, value]) => ({
                    name: key,
                    ...value[0]
                }));
                if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Joueur rejoint:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Joueur parti:', key, leftPresences);
            });

        // S'abonner
        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await this.channel.track({
                    online_at: new Date().toISOString(),
                    is_host: isHost,
                    score: 0
                });
            }
        });

        return true;
    }

    sendGameStart(dictationData) {
        if (!this.isHost || !this.channel) return;
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
        const player = this.players.find(p => p.name === playerName);
        if (player) {
            player.score = score;
            if (this.onScoreUpdate) this.onScoreUpdate(this.players);
        }
    }

    leaveRoom() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
        this.roomCode = null;
        this.players = [];
    }
}

export const multiplayerService = new MultiplayerService();
