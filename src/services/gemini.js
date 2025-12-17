/**
 * Gemini API Service
 * Wrapper pour l'API Google Gemini avec prompts optimisés pour la génération
 * de dictées, l'analyse d'erreurs, et les questions de grammaire.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPTS } from '../utils/prompts.js';
import { storageService } from './storage.js';
import { LEVELS } from '../utils/constants.js';

class GeminiService {
    constructor() {
        this.apiKeys = [];
        this.currentKeyIndex = 0;
        this.selectedModel = 'gemini-2.5-flash';
    }

    /**
     * Initialise le service avec les clés API et le modèle
     * @param {string[]|string} apiKeys - Liste des clés API
     * @param {string} modelId - ID du modèle à utiliser
     */
    initialize(apiKeys, modelId = 'gemini-2.5-flash') {
        if (!apiKeys || (Array.isArray(apiKeys) && apiKeys.length === 0)) {
            console.warn('Aucune clé API Gemini fournie');
            this.apiKeys = [];
        } else {
            this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
        }
        this.currentKeyIndex = 0;
        this.selectedModel = modelId;
        console.log(`GeminiService initialisé avec modèle: ${this.selectedModel}`);
    }

    isInitialized() {
        return this.apiKeys.length > 0;
    }

    /**
     * Obtient une instance du modèle avec la clé courante
     */
    _getModelInstance() {
        if (!this.isInitialized()) return null;

        const apiKey = this.apiKeys[this.currentKeyIndex] || this.apiKeys[0];
        const client = new GoogleGenerativeAI(apiKey);

        return client.getGenerativeModel({
            model: this.selectedModel,
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json'
            }
        });
    }

    /**
     * Change de clé API (rotation)
     */
    _rotateKey() {
        if (this.apiKeys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
            console.log(`Rotation de clé API effectuée. Nouvelle clé index: ${this.currentKeyIndex}`);
        }
    }

    _getMaskedKey(key) {
        if (!key || key.length < 10) return '******';
        return `${key.slice(0, 5)}...${key.slice(-4)}`;
    }

    /**
     * Exécute une requête avec gestion des erreurs et rotation des clés
     */
    async _executeRequest(prompt, forceRotate = true, parseResponse = true) {
        if (!this.isInitialized()) {
            throw new Error('Service Gemini non initialisé (aucune clé valide)');
        }

        let attempts = 0;
        const maxAttempts = Math.max(1, this.apiKeys.length) * 2;
        let lastError = null;

        while (attempts < maxAttempts) {
            // Identifier la clé utilisée pour cette tentative
            const currentKey = this.apiKeys[this.currentKeyIndex] || this.apiKeys[0];
            const maskedKey = this._getMaskedKey(currentKey);
            const keyInfo = `Clé ${this.currentKeyIndex + 1}/${this.apiKeys.length} (${maskedKey})`;

            try {
                const model = this._getModelInstance();
                console.log(`[Gemini] Tentative ${attempts + 1} avec ${keyInfo}`);

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // SUCCÈS : Rotation systématique pour le prochain appel (Load Balancing)
                this._rotateKey();

                return parseResponse ? this.parseJSON(text) : text;

            } catch (error) {
                console.error(`[Gemini] Échec avec ${keyInfo}:`, error.message);

                // Rotation immédiate pour la prochaine tentative
                this._rotateKey();

                lastError = new Error(`Échec API (${keyInfo}): ${error.message}`);
                attempts++;

                const isRetryable = error.message?.includes('429') ||
                    error.message?.includes('500') ||
                    error.message?.includes('503') ||
                    error.message?.includes('quota') ||
                    error.message?.includes('fetch failed') ||
                    error.message?.includes('network') ||
                    error.message?.includes('overloaded');

                if (isRetryable && attempts < maxAttempts) {
                    console.warn(`[Gemini] Erreur récupérable, nouvel essai avec la clé suivante...`);
                    await new Promise(r => setTimeout(r, 500));
                } else {
                    // Si erreur fatale non-récupérable ou max tentatives, on throw
                    // Mais on veut continuer la boucle si on a d'autres clés pour les erreurs quotas/réseau
                    if (!isRetryable) throw lastError;
                }
            }
        }

        throw lastError || new Error('Toutes les tentatives sur les clés API ont échoué.');
    }

    /**
     * Parse la réponse JSON de Gemini
     * @param {string} text - Texte de réponse
     * @returns {Object} - Objet JSON parsé
     */
    parseJSON(text) {
        if (!text) throw new Error('Réponse vide');

        console.log('=== PARSING JSON ===');
        let cleaned = text.trim();
        // Nettoyage Markdown (juste au cas où le modèle ignorerait le mode JSON)
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        // Tentative parsing direct
        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.warn('Parsing direct échoué, tentative nettoyage avancé...', e.message);
        }

        // Nettoyage avancé (virgules trailing, crochets manquants...)
        // Si le mode JSON est actif, cela devrait rarement arriver
        try {
            // Extraction objet/array
            const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (!match) throw new Error('Aucun objet JSON trouvé');

            let jsonStr = match[0];
            // Supprimer virgules trailing
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

            return JSON.parse(jsonStr);
        } catch (finalError) {
            console.error('ÉCHEC TOTAL du parsing:', finalError);
            console.error('Texte brut:', text.substring(0, 200));
            throw new Error('Format de réponse invalide');
        }
    }

    /**
     * Génère une dictée basée sur le thème et le profil utilisateur
     * @param {Object} options - Options de génération
     * @param {string} options.theme - Thème narratif
     * @param {Object} options.userProfile - Profil utilisateur avec erreurs passées
     * @param {Array} options.vocabulary - Vocabulaire personnalisé à intégrer
     * @param {Object} options.narrativeState - État de l'histoire en cours
     * @returns {Promise<Object>} - Dictée générée
     */
    async generateDictation({ theme, userProfile, vocabulary = [], narrativeState = null, minWords = 20, maxWords = 40 }) {
        const userLevel = userProfile?.level || 'B2';
        const filteredVocabulary = vocabulary.filter(v => {
            if (!v.level) return true;
            return v.level <= userLevel;
        });

        const prompt = PROMPTS.generateDictation({
            theme,
            userProfile,
            vocabulary: filteredVocabulary,
            narrativeState,
            minWords,
            maxWords
        });

        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur génération dictée:', error);
            throw new Error('Impossible de générer la dictée. Vérifiez vos clés API et quotas.');
        }
    }

    async analyzeErrors(original, userText) {
        const cleanUserText = userText.trim();
        if (cleanUserText.length < 5) return {
            score: 0,
            totalWords: original.split(' ').length,
            correctWords: 0,
            errors: [],
            feedback: "Texte insuffisant."
        };

        const prompt = PROMPTS.analyzeErrors(original, cleanUserText);

        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur analyse erreurs:', error);
            // Fallback SAFE en cas d'erreur de parsing/réseau
            return {
                score: 0,
                totalWords: original.split(' ').length,
                correctWords: 0,
                errors: [],
                feedback: "L'analyse n'a pas pu être effectuée (Erreur IA).",
                _error: error.message
            };
        }
    }

    async generateQuestions(dictationText, errors = [], optionsOverride = {}) {
        const settings = storageService.getSettings();
        const options = {
            count: (optionsOverride.count !== undefined) ? optionsOverride.count : (settings.questionCount || 3),
            optionsCount: optionsOverride.optionsCount || settings.questionOptions || 4,
            types: optionsOverride.types || settings.questionTypes || ['grammar', 'vocabulary']
        };

        const prompt = PROMPTS.generateQuestions(dictationText, errors, options);

        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur génération questions:', error);
            // Fallback SAFE pour ne pas crasher la vue Quiz
            return { questions: [] };
        }
    }

    async generateMnemonic(rule, word) {
        const prompt = PROMPTS.generateMnemonic(rule, word);
        try {
            // Pas de parsing JSON pour celui-ci (retourne texte brut)
            const result = await this._executeRequest(prompt, true, false);
            return result.trim();
        } catch (error) {
            console.error('Erreur génération mnémotechnique:', error);
            return 'Astuce indisponible.';
        }
    }

    async getEtymology(word) {
        const prompt = PROMPTS.getEtymology(word);
        try {
            const result = await this._executeRequest(prompt, true, false);
            return result.trim();
        } catch (error) {
            console.error('Erreur obtention étymologie:', error);
            return 'Étymologie non disponible.';
        }
    }

    async analyzeGrammar(text) {
        const prompt = PROMPTS.analyzeGrammar(text);
        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur analyse grammaticale:', error);
            return { words: [], sentences: [] };
        }
    }

    async generateHiddenErrorChallenge(topic = 'général') {
        const prompt = PROMPTS.generateHiddenError(topic);
        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur génération défi erreur cachée:', error);
            return null;
        }
    }

    async generateVocabularyQuestions(vocabularyItems) {
        const prompt = PROMPTS.generateVocabularyQuestions(vocabularyItems);
        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur génération questions vocabulaire:', error);
            return { questions: [] };
        }
    }

    async generateReviewQuiz(errors, options = {}) {
        const prompt = PROMPTS.generateReviewQuiz(errors, options);
        try {
            return await this._executeRequest(prompt);
        } catch (error) {
            console.error('Erreur génération quiz révision:', error);
            return { questions: [] };
        }
    }
}

// Instance singleton
export const geminiService = new GeminiService();
