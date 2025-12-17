/**
 * Audio Service - Text-to-Speech avec Web Speech API
 * Gère la synthèse vocale avec segmentation par phrase et contrôles clavier
 */

class AudioService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.segments = [];
        this.currentSegmentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.voice = null;
        this.onSegmentChange = null;
        this.onPlayStateChange = null;
        this.onComplete = null;

        this.initVoice();
        // Keyboard controls initialized later to access storage
    }

    init(keyBindings) {
        this.keyBindings = keyBindings || {
            PLAY_PAUSE: 'Space',
            PREVIOUS: 'ArrowLeft',
            NEXT: 'ArrowRight',
            REPLAY: 'ControlRight'
        };
        this.initKeyboardControls();
    }

    /**
     * Initialise la voix française de meilleure qualité
     */
    initVoice() {
        const loadVoices = () => {
            const voices = this.synth.getVoices();
            // Chercher une voix française de qualité
            const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));

            // Préférer les voix "premium" ou "enhanced"
            const premiumVoice = frenchVoices.find(v =>
                v.name.toLowerCase().includes('premium') ||
                v.name.toLowerCase().includes('enhanced') ||
                v.name.toLowerCase().includes('neural') ||
                v.name.toLowerCase().includes('natural')
            );

            // Sinon prendre la première voix française disponible
            this.voice = premiumVoice || frenchVoices[0] || voices[0];
            console.log('Voix sélectionnée:', this.voice?.name);
        };

        // Les voix peuvent se charger de manière asynchrone
        if (this.synth.getVoices().length > 0) {
            loadVoices();
        } else {
            this.synth.onvoiceschanged = loadVoices;
        }
    }

    /**
     * Initialise les contrôles clavier globaux
     */
    initKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            // Ne pas interférer avec les inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Normalize code checking
            // Note: simple check, ideally mapped perfectly to KeyboardEvent.code
            const code = e.code;
            const key = e.key;

            if (this.isKeyBound(e, this.keyBindings.PLAY_PAUSE)) {
                e.preventDefault();
                this.togglePlayPause();
            } else if (this.isKeyBound(e, this.keyBindings.PREVIOUS)) {
                e.preventDefault();
                this.previousSegment();
            } else if (this.isKeyBound(e, this.keyBindings.NEXT)) {
                e.preventDefault();
                this.nextSegment();
            }
        });
    }

    /**
     * Vérifie si une touche correspond à une action bindée
     * @param {KeyboardEvent} e - L'événement clavier
     * @param {string|string[]} binding - La ou les touches configurées
     */
    isKeyBound(e, binding) {
        const keys = Array.isArray(binding) ? binding : [binding];
        return keys.includes(e.code) || keys.includes(e.key);
    }

    /**
     * Charge un texte et le segmente en phrases
     * @param {string} text - Texte complet
     * @param {Array<string>} sentences - Phrases pré-découpées (optionnel)
     */
    /**
     * Charge un texte et le segmente
     * @param {string} text - Texte complet
     * @param {Array<string>} sentences - Phrases pré-découpées (ignoré si segmentLength est défini)
     * @param {number} segmentLength - Nombre moyen de mots par segment (défaut: 5)
     */
    loadText(text, sentences = null, segmentLength = 5) {
        this.stop();

        // Si segmentLength est spécifié, on l'utilise pour découper
        // Sinon on garde le comportement par défaut (phrases)
        if (segmentLength > 0) {
            this.segments = this.chunkText(text, segmentLength);
        } else if (sentences && sentences.length > 0) {
            this.segments = sentences;
        } else {
            // Fallback: ancien comportement par phrases
            this.segments = this.chunkText(text, 20); // Défaut large
        }

        this.currentSegmentIndex = 0;
        this.notifySegmentChange();
    }

    /**
     * Découpe le texte en segments d'environ N mots
     */
    chunkText(text, targetLength) {
        const words = text.split(/(\s+)/); // Garder les séparateurs
        const segments = [];
        let currentSegment = '';
        let wordCount = 0;

        for (let i = 0; i < words.length; i++) {
            const part = words[i];

            // Si c'est un mot (pas juste des espaces/ponctuation)
            if (part.trim().length > 0 && !/^[.,;?!:]+$/.test(part.trim())) {
                wordCount++;
            }

            currentSegment += part;

            // Condition de coupe:
            // 1. On a atteint la cible
            // 2. On est sur une ponctuation ou un espace qui termine un mot
            // 3. On évite de couper au milieu d'une liaison logique forte si possible (simple heuristique)

            const isEndPunctuation = /[.?!]$/.test(part.trim());
            const isPausePunctuation = /[,;:]$/.test(part.trim());

            if (wordCount >= targetLength || isEndPunctuation) {
                // Si on a un point, on coupe forcément
                if (isEndPunctuation) {
                    segments.push(currentSegment.trim());
                    currentSegment = '';
                    wordCount = 0;
                }
                // Sinon si on a atteint la longueur cible
                else if (wordCount >= targetLength) {
                    // On essaie de pousser un peu jusqu'à la prochaine ponctuation si elle est proche (max +3 mots)
                    // Mais pour l'instant on coupe simple pour respecter la demande "court"
                    segments.push(currentSegment.trim());
                    currentSegment = '';
                    wordCount = 0;
                }
            }
        }

        if (currentSegment.trim().length > 0) {
            segments.push(currentSegment.trim());
        }

        return segments;
    }

    /**
     * Retourne les informations sur les segments
     */
    getSegmentsInfo() {
        return {
            segments: this.segments,
            currentIndex: this.currentSegmentIndex,
            total: this.segments.length
        };
    }

    /**
     * Joue le segment actuel
     */
    /**
     * Transforme le texte pour prononcer la ponctuation
     * @param {string} text - Texte original
     */
    pronouncePunctuation(text) {
        return text
            .replace(/,/g, ' virgule, ')
            .replace(/\./g, ' point. ')
            .replace(/;/g, ' point-virgule, ')
            .replace(/:/g, ' deux-points, ')
            .replace(/!/g, ' point d\'exclamation. ')
            .replace(/\?/g, ' point d\'interrogation? ')
            .replace(/"/g, ' guillemet, ')
            .replace(/--/g, ' ') // Suppression explicite des double tirets
            .replace(/-/g, ' tiret ')
            .replace(/\s+/g, ' ') // Nettoyer les espaces doubles
            .trim();
    }

    /**
     * Joue le segment actuel en mode dictée (2x)
     */
    playCurrentSegment() {
        if (this.segments.length === 0) return;

        // Annuler toute lecture en cours
        this.synth.cancel();

        const originalText = this.segments[this.currentSegmentIndex];
        const textWithPunctuation = this.pronouncePunctuation(originalText);

        // 1ère lecture : Avec ponctuation aussi (Demandé par l'utilisateur)
        // L'utilisateur veut la ponctuation sur les DEUX écoutes
        const utter1 = new SpeechSynthesisUtterance(textWithPunctuation);
        // 2ème lecture : Avec ponctuation (Répétition)
        const utter2 = new SpeechSynthesisUtterance(textWithPunctuation);

        // Configuration commune
        [utter1, utter2].forEach((u, index) => {
            if (this.voice) u.voice = this.voice;
            u.lang = 'fr-FR';
            u.rate = index === 0 ? 0.9 : 0.8; // 2ème fois un peu plus lente
            u.pitch = 1;
            u.volume = 1;
        });

        // Gestion de la séquence
        utter1.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.notifyPlayStateChange();
        };

        utter1.onend = () => {
            // Pause de 2 secondes
            setTimeout(() => {
                if (this.isPlaying) {
                    this.synth.speak(utter2);
                }
            }, 2000);
        };

        utter2.onend = () => {
            this.isPlaying = false; // Fin de la séquence pour ce segment
            this.notifyPlayStateChange();
        };

        utter1.onerror = utter2.onerror = (e) => {
            console.error('Erreur TTS:', e);
            this.isPlaying = false;
            this.notifyPlayStateChange();
        };

        this.synth.speak(utter1);
    }

    /**
     * Bascule lecture/pause
     */
    togglePlayPause() {
        if (this.segments.length === 0) return;

        if (this.isPlaying && !this.isPaused) {
            // Mettre en pause
            this.synth.pause();
            this.isPaused = true;
            this.notifyPlayStateChange();
        } else if (this.isPaused) {
            // Reprendre
            this.synth.resume();
            this.isPaused = false;
            this.notifyPlayStateChange();
        } else {
            // Commencer la lecture
            this.playCurrentSegment();
        }
    }

    /**
     * Passe au segment suivant
     */
    nextSegment() {
        if (this.currentSegmentIndex < this.segments.length - 1) {
            this.synth.cancel();
            this.currentSegmentIndex++;
            this.notifySegmentChange();
            this.playCurrentSegment();
        } else {
            // Fin de la dictée
            this.synth.cancel();
            this.isPlaying = false;
            this.notifyPlayStateChange();
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    /**
     * Retourne au segment précédent
     */
    previousSegment() {
        if (this.currentSegmentIndex > 0) {
            this.synth.cancel();
            this.currentSegmentIndex--;
            this.notifySegmentChange();
            this.playCurrentSegment();
        } else {
            // Rejouer le premier segment
            this.synth.cancel();
            this.playCurrentSegment();
        }
    }

    /**
     * Va à un segment spécifique
     * @param {number} index - Index du segment
     */
    goToSegment(index) {
        if (index >= 0 && index < this.segments.length) {
            this.synth.cancel();
            this.currentSegmentIndex = index;
            this.notifySegmentChange();
            this.playCurrentSegment();
        }
    }

    /**
     * Réécoute le segment actuel
     */
    replayCurrentSegment() {
        this.synth.cancel();
        this.playCurrentSegment();
    }

    /**
     * Arrête la lecture
     */
    stop() {
        this.synth.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSegmentIndex = 0;
        this.notifyPlayStateChange();
    }

    /**
     * Pause la lecture
     */
    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
            this.notifyPlayStateChange();
        }
    }

    /**
     * Reprend la lecture
     */
    resume() {
        if (this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
            this.notifyPlayStateChange();
        }
    }

    /**
     * Notifie les changements de segment
     */
    notifySegmentChange() {
        if (this.onSegmentChange) {
            this.onSegmentChange({
                currentIndex: this.currentSegmentIndex,
                total: this.segments.length,
                currentText: this.segments[this.currentSegmentIndex]
            });
        }
    }

    /**
     * Notifie les changements d'état de lecture
     */
    notifyPlayStateChange() {
        if (this.onPlayStateChange) {
            this.onPlayStateChange({
                isPlaying: this.isPlaying,
                isPaused: this.isPaused
            });
        }
    }

    /**
     * Obtient l'état actuel
     */
    getState() {
        return {
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            currentSegmentIndex: this.currentSegmentIndex,
            totalSegments: this.segments.length,
            currentText: this.segments[this.currentSegmentIndex] || ''
        };
    }

    /**
     * Change la vitesse de lecture
     * @param {number} rate - Vitesse (0.5 à 2.0)
     */
    setRate(rate) {
        if (this.utterance) {
            this.utterance.rate = Math.max(0.5, Math.min(2.0, rate));
        }
    }

    /**
     * Lit un texte unique sans segmentation
     * @param {string} text - Texte à lire
     */
    speakOnce(text) {
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) {
            utterance.voice = this.voice;
        }
        utterance.lang = 'fr-FR';
        utterance.rate = 1;

        this.synth.speak(utterance);
    }

    /**
     * Vérifie si le TTS est supporté
     */
    isSupported() {
        return 'speechSynthesis' in window;
    }

    /**
     * Obtient la liste des voix disponibles
     */
    getAvailableVoices() {
        return this.synth.getVoices().filter(v => v.lang.startsWith('fr'));
    }

    /**
     * Change la voix
     * @param {string} voiceName - Nom de la voix
     */
    setVoice(voiceName) {
        const voices = this.synth.getVoices();
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
            this.voice = voice;
        }
    }
}

// Instance singleton
export const audioService = new AudioService();
