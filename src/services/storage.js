/**
 * Storage Service - Persistance localStorage
 * Gère toutes les données utilisateur avec schéma structuré
 */

const STORAGE_KEYS = {
    USER_PROFILE: 'dictee_user_profile',
    THEMES: 'dictee_themes',
    ERRORS: 'dictee_errors',
    VOCABULARY: 'dictee_vocabulary',
    ACHIEVEMENTS: 'dictee_achievements',
    SETTINGS: 'dictee_settings',
    SETTINGS: 'dictee_settings',
    HISTORY: 'dictee_history',
    DRAFTS: 'dictee_drafts'
};

const EXTRA_VOCABULARY = [
    { word: "Acerbe", definition: "Dur, blessant, agressif dans ses propos" },
    { word: "Emphatique", definition: "Qui exprime avec excès et grandiloquence" },
    { word: "Intarissable", definition: "Qui parle sans s'arrêter, inépuisable" },
    { word: "Taciturne", definition: "Qui parle peu, reste silencieux, renfermé" },
    { word: "Sibarite", definition: "Qui recherche les plaisirs raffinés, luxueux" },
    { word: "Condescendant", definition: "Qui manifeste une supériorité bienveillante méprisante" },
    { word: "Perspicace", definition: "Qui comprend rapidement, intelligence pénétrante" },
    { word: "Prolixe", definition: "Qui parle ou écrit trop longuement" },
    { word: "Pragmatique", definition: "Qui privilégie l'action concrète et efficace" },
    { word: "Péjoratif", definition: "Qui dévalorise, exprime un jugement négatif" },
    { word: "Subtil", definition: "Fin, délicat, difficile à percevoir" },
    { word: "Laudatif", definition: "Qui contient des éloges, des louanges" },
    { word: "Furtif", definition: "Qui se fait rapidement et discrètement" },
    { word: "Déroutant", definition: "Qui désarçonne, surprend, déstabilise complètement" },
    { word: "Énigmatique", definition: "Mystérieux, difficile à comprendre ou expliquer" },
    { word: "Équivoque", definition: "Ambigu, peut être interprété différemment" },
    { word: "Analogie", definition: "Ressemblance, rapport de similitude entre choses" },
    { word: "Antinomie", definition: "Contradiction entre deux idées ou principes" },
    { word: "Articulation", definition: "Manière dont les éléments s'organisent logiquement" },
    { word: "Assertion", definition: "Affirmation présentée comme vraie, proposition ferme" },
    { word: "Axiome", definition: "Vérité admise sans démonstration, principe fondamental" },
    { word: "Biais", definition: "Moyen détourné, distorsion dans le jugement" },
    { word: "Déductif", definition: "Qui va du général au particulier" },
    { word: "Dialectique", definition: "Art du dialogue, raisonnement par opposition" },
    { word: "Dichotomie", definition: "Division en deux parties distinctes et opposées" },
    { word: "Enthymème", definition: "Syllogisme dont une prémisse est sous-entendue" },
    { word: "Extrapoler", definition: "Prolonger une tendance au-delà des données" },
    { word: "Fallacieux", definition: "Trompeur, qui induit en erreur par raisonnement" },
    { word: "Réfutation", definition: "Action de prouver qu'une affirmation est fausse" },
    { word: "Abstrait", definition: "Qui n'a pas de réalité concrète" },
    { word: "Ambigu", definition: "Qui peut avoir plusieurs sens différents" },
    { word: "Connotation", definition: "Sens secondaire, nuance affective d'un mot" },
    { word: "Empirique", definition: "Qui se fonde sur l'expérience pratique" },
    { word: "Épistémologie", definition: "Étude de la nature de la connaissance" },
    { word: "Hypothétique", definition: "Qui repose sur une hypothèse, incertain" },
    { word: "Immanent", definition: "Qui est contenu dans la nature même" },
    { word: "Indubitable", definition: "Dont on ne peut douter, certain" },
    { word: "Inéluctable", definition: "Qu'on ne peut éviter, absolument inévitable" },
    { word: "Ineffable", definition: "Qu'on ne peut exprimer par des mots" },
    { word: "Interprétatif", definition: "Qui relève de l'interprétation personnelle" },
    { word: "Intrinsèque", definition: "Qui appartient à l'essence même" },
    { word: "Ontologie", definition: "Étude philosophique de l'être et l'existence" },
    { word: "Paradigme", definition: "Modèle de pensée, ensemble de croyances" },
    { word: "Paradoxe", definition: "Affirmation contraire à l'opinion mais vraie" },
    { word: "Quintessence", definition: "Ce qu'il y a de plus pur" },
    { word: "Juxtaposition", definition: "Action de placer côte à côte" },
    { word: "Métaphore", definition: "Comparaison sans outil de comparaison explicite" },
    { word: "Nuance", definition: "Différence délicate, subtile distinction entre choses" },
    { word: "Lacunaire", definition: "Qui présente des lacunes, des manques" },
    { word: "Hétérogène", definition: "Composé d'éléments de nature très différente" },
    { word: "Disparité", definition: "Différence, inégalité, manque d'harmonie évident" },
    { word: "Tautologique", definition: "Qui répète la même idée différemment" },
    { word: "Lapsus", definition: "Erreur involontaire révélant une pensée cachée" },
    { word: "Superfétatoire", definition: "Qui est en trop, inutile, superflu" },
    { word: "Sempiternel", definition: "Qui se répète sans cesse, éternellement" },
    { word: "Craquelé", definition: "Qui présente de petites fissures superficielles" },
    { word: "Thésauriser", definition: "Accumuler de l'argent, amasser des richesses" },
    { word: "Élucider", definition: "Rendre clair, expliquer ce qui est obscur" },
    { word: "Pléthore", definition: "Surabondance, excès, trop grande quantité" },
    { word: "Velléitaire", definition: "Qui a des intentions faibles sans agir" },
    { word: "Amène", definition: "Qui est agréable, plaisant et courtois" },
    { word: "Courroucé", definition: "Qui est en colère, irrité, furieux" },
    { word: "Laconique", definition: "Qui s'exprime en peu de mots" },
    { word: "Sinueux", definition: "Qui fait des courbes, qui serpente" },
    { word: "Intègre", definition: "D'une honnêteté absolue, totalement incorruptible" },
    { word: "Volubile", definition: "Qui parle avec abondance et rapidité" },
    { word: "Frugal", definition: "Qui se contente de peu, simple" },
    { word: "Pléthorique", definition: "Qui est en excès, trop nombreux" },
    { word: "Saillant", definition: "Qui ressort, se détache, est remarquable" },
    { word: "Cinglant", definition: "Qui blesse moralement, dur et blessant" },
    { word: "Corrompu", definition: "Altéré moralement, malhonnête, vénal" },
    { word: "Inopinément", definition: "De façon soudaine et totalement inattendue" },
    { word: "Subrepticement", definition: "De manière furtive, discrète, en cachette" },
    { word: "Dithyrambique", definition: "Excessivement élogieux, louangeur à l'excès" },
    { word: "Égrener", definition: "Détacher les grains, énumérer un à un" }
];

// Schéma par défaut pour un nouveau profil
const DEFAULT_USER_PROFILE = {
    level: 'B2',
    totalPoints: 0,
    totalDictations: 0,
    perfectDictations: 0,
    streakDays: 0,
    lastPlayDate: null,
    createdAt: new Date().toISOString()
};

// Thèmes disponibles par défaut
const DEFAULT_THEMES = [
    {
        id: 'polar',
        name: 'Polar Noir',
        description: 'Plongez dans une enquête mystérieuse et sombre',
        icon: '🕵️',
        progress: 0,
        narrativeState: null,
        lastDictation: null
    },
    {
        id: 'conte',
        name: 'Conte Fantastique',
        description: 'Explorez un monde de magie et de merveilles',
        icon: '🧙',
        progress: 0,
        narrativeState: null,
        lastDictation: null
    },
    {
        id: 'philosophie',
        name: 'Analyse Philosophique',
        description: 'Réflexions profondes sur la condition humaine',
        icon: '🎭',
        progress: 0,
        narrativeState: null,
        lastDictation: null
    },
    {
        id: 'aventure',
        name: 'Aventure Épique',
        description: 'Voyagez à travers des contrées lointaines',
        icon: '⚔️',
        progress: 0,
        narrativeState: null,
        lastDictation: null
    },
    {
        id: 'romance',
        name: 'Romance Historique',
        description: 'Une histoire d\'amour à travers les âges',
        icon: '💝',
        progress: 0,
        narrativeState: null,
        lastDictation: null
    },
    {
        id: 'science',
        name: 'Science-Fiction',
        description: 'Découvrez les mystères de l\'univers',
        icon: '🚀',
        progress: 0,
        narrativeState: null,
        lastDictation: null
    }
];

// Médailles disponibles
const ACHIEVEMENTS_CONFIG = [
    {
        id: 'first_dictation',
        name: 'Premier Pas',
        description: 'Complétez votre première dictée',
        icon: '🎯',
        condition: (profile) => profile.totalDictations >= 1,
        points: 50
    },
    {
        id: 'perfect_5',
        name: 'Sans Faute',
        description: '5 dictées parfaites',
        icon: '🏅',
        condition: (profile) => profile.perfectDictations >= 5,
        points: 200
    },
    {
        id: 'perfect_20',
        name: 'Perfection Absolue',
        description: '20 dictées parfaites',
        icon: '🏆',
        condition: (profile) => profile.perfectDictations >= 20,
        points: 500
    },
    {
        id: 'streak_7',
        name: 'Série de 7',
        description: '7 jours consécutifs de pratique',
        icon: '🔥',
        condition: (profile) => profile.streakDays >= 7,
        points: 150
    },
    {
        id: 'streak_30',
        name: 'Mois Complet',
        description: '30 jours consécutifs de pratique',
        icon: '📆',
        condition: (profile) => profile.streakDays >= 30,
        points: 500
    },
    {
        id: 'vocabulary_50',
        name: 'Grand Vocabuliste',
        description: '50 mots de vocabulaire ajoutés',
        icon: '📚',
        condition: (_, __, vocab) => vocab.length >= 50,
        points: 200
    },
    {
        id: 'dictations_100',
        name: 'Centurion',
        description: '100 dictées complétées',
        icon: '💯',
        condition: (profile) => profile.totalDictations >= 100,
        points: 1000
    },
    {
        id: 'points_1000',
        name: 'Millénaire',
        description: 'Atteindre 1000 points',
        icon: '⭐',
        condition: (profile) => profile.totalPoints >= 1000,
        points: 0
    },
    {
        id: 'points_10000',
        name: 'Légende',
        description: 'Atteindre 10000 points',
        icon: '👑',
        condition: (profile) => profile.totalPoints >= 10000,
        points: 0
    }
];

class StorageService {
    constructor() {
        this.init();
    }

    /**
     * Initialise le stockage avec les valeurs par défaut
     */
    init() {
        if (!this.getUserProfile()) {
            this.setUserProfile(DEFAULT_USER_PROFILE);
        }
        if (!this.getThemes()) {
            this.setThemes(DEFAULT_THEMES);
        }
        if (!this.getErrors()) {
            this.setErrors([]);
        }
        if (!this.getVocabulary()) {
            this.setVocabulary([]);
        }
        if (!this.getAchievements()) {
            this.setAchievements([]);
        }
        if (!this.getSettings()) {
            this.setSettings({
                apiKey: '',
                speechRate: 0.9,
                showKeyboardHints: true,
                showKeyboardHints: true,
                enableTimer: true,
                shortDictationQuestions: false, // Default: no extra questions for short dictations
                postDictationQuestionCount: 3, // Default: 3 questions after dictation
                autoGrammarAnalysis: true, // Default: Enable auto grammar analysis
                keyBindings: {
                    PLAY_PAUSE: ['Space'],
                    PREVIOUS: ['ArrowLeft'],
                    NEXT: ['ArrowRight'],
                    REPLAY: ['ControlRight']
                }
            });
        }
        if (!this.getHistory()) {
            this.setHistory([]);
        }

        // Injecter le vocabulaire supplémentaire
        this.injectDefaultVocabulary();
    }

    injectDefaultVocabulary() {
        const currentVocab = this.getVocabulary() || [];
        // Filtrer pour ne pas ajouter les doublons
        const newWords = EXTRA_VOCABULARY.filter(newW =>
            !currentVocab.some(currW => currW.word.toLowerCase() === newW.word.toLowerCase())
        );

        if (newWords.length > 0) {
            console.log(`Injection de ${newWords.length} mots de vocabulaire C1...`);
            const timestamp = Date.now();

            const formattedWords = newWords.map((word, index) => ({
                ...word,
                id: `injected_${timestamp}_${index}`,
                createdAt: new Date().toISOString(),
                level: 'C1', // Forcé à C1 selon la demande
                srsData: {
                    interval: 1,
                    easeFactor: 2.5,
                    repetitions: 0,
                    nextReview: new Date().toISOString()
                }
            }));

            this.setVocabulary([...currentVocab, ...formattedWords]);
        }
    }

    // ===== HELPERS =====

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Erreur lecture ${key}:`, e);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Erreur écriture ${key}:`, e);
            return false;
        }
    }

    // ===== USER PROFILE =====

    getUserProfile() {
        return this.get(STORAGE_KEYS.USER_PROFILE);
    }

    setUserProfile(profile) {
        return this.set(STORAGE_KEYS.USER_PROFILE, profile);
    }

    updateUserProfile(updates) {
        const profile = this.getUserProfile();
        const updated = { ...profile, ...updates };
        return this.setUserProfile(updated);
    }

    addPoints(points) {
        const profile = this.getUserProfile();
        profile.totalPoints += points;
        this.setUserProfile(profile);
        this.checkAchievements();
        return profile.totalPoints;
    }

    incrementDictations(isPerfect = false) {
        const profile = this.getUserProfile();
        profile.totalDictations++;
        if (isPerfect) {
            profile.perfectDictations++;
        }

        // Update streak on the SAME profile object before saving
        this.updateStreak(profile);

        this.setUserProfile(profile);
        this.checkAchievements();
    }

    updateStreak(profileToUpdate = null) {
        // If profile provided, use it and DO NOT save (caller handles saving)
        // If no profile, fetch it and SAVE at the end
        const profile = profileToUpdate || this.getUserProfile();
        const saveResult = !profileToUpdate;

        const today = new Date().toDateString();
        const lastPlay = profile.lastPlayDate ? new Date(profile.lastPlayDate).toDateString() : null;

        if (lastPlay === today) {
            // Déjà joué aujourd'hui
            return profile;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastPlay === yesterday.toDateString()) {
            // Continuation de la série
            profile.streakDays++;
        } else if (lastPlay !== today) {
            // Série cassée (ou première fois)
            profile.streakDays = 1;
        }

        profile.lastPlayDate = new Date().toISOString();

        if (saveResult) {
            this.setUserProfile(profile);
        }

        return profile;
    }

    // ===== THEMES =====

    getThemes() {
        return this.get(STORAGE_KEYS.THEMES);
    }

    setThemes(themes) {
        return this.set(STORAGE_KEYS.THEMES, themes);
    }

    getTheme(themeId) {
        const themes = this.getThemes();
        return themes.find(t => t.id === themeId);
    }

    updateTheme(themeId, updates) {
        const themes = this.getThemes();
        const index = themes.findIndex(t => t.id === themeId);
        if (index !== -1) {
            themes[index] = { ...themes[index], ...updates };
            this.setThemes(themes);
        }
        return themes[index];
    }

    addTheme(theme) {
        const themes = this.getThemes();
        const newTheme = {
            ...theme,
            id: theme.id || `custom_${Date.now()}`,
            progress: 0,
            isCustom: true,
            icon: theme.icon || '✨'
        };
        themes.push(newTheme);
        this.setThemes(themes);
        return newTheme;
    }

    deleteTheme(themeId) {
        let themes = this.getThemes();
        // Only allow deleting custom themes
        const theme = themes.find(t => t.id === themeId);
        if (theme && theme.isCustom) {
            themes = themes.filter(t => t.id !== themeId);
            this.setThemes(themes);
            return true;
        }
        return false;
    }

    updateThemeProgress(themeId, narrativeState, dictationExcerpt) {
        const theme = this.getTheme(themeId);
        if (theme) {
            this.updateTheme(themeId, {
                progress: theme.progress + 1,
                narrativeState: narrativeState,
                lastDictation: dictationExcerpt
            });
        }
    }

    // ===== ERRORS (SRS) =====

    getErrors() {
        return this.get(STORAGE_KEYS.ERRORS);
    }

    setErrors(errors) {
        return this.set(STORAGE_KEYS.ERRORS, errors);
    }

    addError(error) {
        const errors = this.getErrors();
        const existingIndex = errors.findIndex(e =>
            e.word === error.word && e.type === error.type
        );

        if (existingIndex !== -1) {
            // Erreur déjà connue - réinitialiser SRS
            errors[existingIndex].srsData = {
                interval: 1,
                easeFactor: 2.5,
                repetitions: 0,
                nextReview: new Date().toISOString()
            };
            errors[existingIndex].occurrences = (errors[existingIndex].occurrences || 1) + 1;
        } else {
            // Nouvelle erreur
            errors.push({
                ...error,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                occurrences: 1,
                srsData: {
                    interval: 1,
                    easeFactor: 2.5,
                    repetitions: 0,
                    nextReview: new Date().toISOString()
                }
            });
        }

        this.setErrors(errors);
    }

    getErrorsToReview(limit = 5) {
        const errors = this.getErrors();
        const now = new Date();

        return errors
            .filter(e => new Date(e.srsData.nextReview) <= now)
            .sort((a, b) => new Date(a.srsData.nextReview) - new Date(b.srsData.nextReview))
            .slice(0, limit);
    }

    updateErrorSRS(errorId, quality) {
        const errors = this.getErrors();
        const error = errors.find(e => e.id === errorId);

        if (error) {
            const { interval, easeFactor, repetitions, step } = this.calculateSRS(
                error.srsData,
                quality
            );

            error.srsData = {
                interval,
                easeFactor,
                repetitions,
                step, // Save current step
                nextReview: this.calculateNextReview(interval)
            };

            this.setErrors(errors);
        }
    }

    removeError(errorId) {
        let errors = this.getErrors();
        // Ensure ID is treated as string comparison to avoid type mismatches
        errors = errors.filter(e => String(e.id) !== String(errorId));
        this.setErrors(errors);
    }

    removeAllErrors() {
        this.setErrors([]);
    }

    // ===== IMPORT / EXPORT =====

    exportErrors() {
        const errors = this.getErrors();
        return JSON.stringify(errors, null, 2);
    }

    importErrors(jsonString) {
        try {
            const newErrors = JSON.parse(jsonString);
            if (!Array.isArray(newErrors)) {
                throw new Error('Format invalide: Doit être une liste.');
            }

            const currentErrors = this.getErrors();
            let addedCount = 0;

            newErrors.forEach(newErr => {
                // Validation simple
                if (!newErr.word || !newErr.type) return;

                // Check duplicate (by word)
                const exists = currentErrors.some(e => e.word.toLowerCase() === newErr.word.toLowerCase());

                if (!exists) {
                    // Sanitize / Reset vital fields if importing from others
                    // Generates new ID to avoid collisions
                    const cleanError = {
                        ...newErr,
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        srsData: newErr.srsData || {
                            interval: 0,
                            easeFactor: 2.5,
                            repetitions: 0,
                            nextReview: new Date().toISOString()
                        }
                    };
                    currentErrors.push(cleanError);
                    addedCount++;
                }
            });

            this.setErrors(currentErrors);
            return { success: true, count: addedCount };
        } catch (e) {
            console.error('Import failed:', e);
            return { success: false, message: e.message };
        }
    }

    exportVocabulary() {
        const vocab = this.getVocabulary();
        return JSON.stringify(vocab, null, 2);
    }

    importVocabulary(jsonString) {
        try {
            const newVocab = JSON.parse(jsonString);
            if (!Array.isArray(newVocab)) {
                throw new Error('Format invalide: Doit être une liste.');
            }

            const currentVocab = this.getVocabulary();
            let addedCount = 0;

            newVocab.forEach(newWord => {
                if (!newWord.word || !newWord.definition) return;

                // Check duplicate (by word)
                const exists = currentVocab.some(v => v.word.toLowerCase() === newWord.word.toLowerCase());

                if (!exists) {
                    const cleanWord = {
                        ...newWord,
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        srsData: newWord.srsData || {
                            interval: 0,
                            easeFactor: 2.5,
                            repetitions: 0,
                            nextReview: new Date().toISOString()
                        }
                    };
                    currentVocab.push(cleanWord);
                    addedCount++;
                }
            });

            this.setVocabulary(currentVocab);
            return { success: true, count: addedCount };
        } catch (e) {
            console.error('Import vocab failed:', e);
            return { success: false, message: e.message };
        }
    }

    exportHistoryItem(historyId) {
        const history = this.getHistory();
        const item = history.find(h => h.id === historyId);
        if (!item) throw new Error('Dictée introuvable');
        return JSON.stringify(item, null, 2);
    }

    importHistoryItem(jsonString) {
        try {
            const newItem = JSON.parse(jsonString);
            if (!newItem.themeName || !newItem.score) {
                throw new Error('Format invalide: Données de dictée manquantes.');
            }

            const history = this.getHistory();
            // Force new ID to allow re-importing same dictation as a copy if desired, 
            // BUT user might want to restore.
            // Let's generate a new ID to avoid collisions unless it's a strict restore.
            // Better safe: New ID.
            newItem.id = Date.now() + Math.random().toString(36).substr(2, 9);
            // Update date to now? Or keep original? Keep original date for history accuracy.

            history.unshift(newItem); // Add to top
            this.setHistory(history);

            return { success: true, id: newItem.id };
        } catch (e) {
            console.error('Import history failed:', e);
            return { success: false, message: e.message };
        }
    }

    deleteHistoryItem(id) {
        let history = this.getHistory();
        history = history.filter(h => h.id !== id);
        this.setHistory(history);
    }

    // ===== PENDING REDO (Robustness Fix) =====

    setPendingRedo(dictation) {
        localStorage.setItem('pending_redo_dictation', JSON.stringify(dictation));
    }

    getPendingRedo() {
        const item = localStorage.getItem('pending_redo_dictation');
        return item ? JSON.parse(item) : null;
    }

    clearPendingRedo() {
        localStorage.removeItem('pending_redo_dictation');
    }

    // ===== VOCABULARY =====

    getVocabulary() {
        return this.get(STORAGE_KEYS.VOCABULARY);
    }

    setVocabulary(vocabulary) {
        return this.set(STORAGE_KEYS.VOCABULARY, vocabulary);
    }

    addVocabularyWord(word) {
        const vocabulary = this.getVocabulary();

        if (vocabulary.find(v => v.word.toLowerCase() === word.word.toLowerCase())) {
            return false; // Mot déjà présent
        }

        vocabulary.push({
            ...word,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            level: word.level || 'B2',
            srsData: {
                interval: 1,
                easeFactor: 2.5,
                repetitions: 0,
                nextReview: new Date().toISOString()
            }
        });

        this.setVocabulary(vocabulary);
        this.checkAchievements();
        return true;
    }

    updateVocabularyWord(wordId, updates) {
        const vocabulary = this.getVocabulary();
        const index = vocabulary.findIndex(v => v.id === wordId);

        if (index !== -1) {
            vocabulary[index] = { ...vocabulary[index], ...updates };
            this.setVocabulary(vocabulary);
        }
    }

    deleteVocabularyWord(wordId) {
        const vocabulary = this.getVocabulary();
        const filtered = vocabulary.filter(v => v.id !== wordId);
        this.setVocabulary(filtered);
    }

    getVocabularyToReview(limit = 5) {
        const vocabulary = this.getVocabulary();
        const now = new Date();

        return vocabulary
            .filter(v => new Date(v.srsData.nextReview) <= now)
            .sort((a, b) => new Date(a.srsData.nextReview) - new Date(b.srsData.nextReview))
            .slice(0, limit);
    }

    // ===== SRS ALGORITHM (SM-2) =====

    // ===== SRS ALGORITHM (Stepped Logic) =====

    calculateSRS(srsData, quality) {
        // quality: 0-6 (Direct mapping to steps requested by user)
        // 0: Aujourd'hui (ASAP)
        // 1: Demain (1j)
        // 2: 3 jours
        // 3: 7 jours
        // 4: 1 mois (30j)
        // 5: 3 mois (90j)
        // 6: Validé (Jamais / 9999j)

        let { interval, easeFactor, repetitions, step } = srsData;

        // Custom user-defined steps
        // Index corresponds to quality level 0-5. 6 is special case.
        const STEPS = [0, 1, 3, 7, 30, 90];

        // Initialize step if missing
        if (typeof step === 'undefined') step = 0;

        if (quality === 6) {
            // Validé / Learned
            interval = 9999;
            step = 6;
        } else if (quality >= 0 && quality <= 5) {
            // Direct mapping requested: "quality" IS the level index
            // e.g. User selects "2" -> 3 days interval
            step = quality;
            interval = STEPS[step];
        } else {
            // Fallback or "Standard Increment" logic (e.g. from dictations)
            // Use current logic: if quality >= 3 (Good), step++
            // But we need to map old quality (0-5 rating) to new steps?
            // Let's keep it simple: if called with undefined quality or internal logic:
            // We assume internal calls pass '3' or '4' for success, '0' for fail.

            // If this comes from standard dictation flow (not manual set)
            // We need to decide if we keep the "Step++" logic.
            // Yes, "Good" = next step. "Fail" = reset to 0.

            // Check if it's a specific "rating" or a "manual set"
            // For now, let's treat quality as "target step" if it comes from the modal (0-6)
            // But wait, dictation sends 0 (Fail) or 4 (Good).

            if (quality >= 3) {
                // Success implementation (Step UP)
                if (step < STEPS.length - 1) {
                    step++;
                    interval = STEPS[step];
                } else {
                    // Maxed out -> Mark as learned (Step 6)
                    step = 6;
                    interval = 9999;
                }
                repetitions++;
            } else {
                // Failure (Reset to 0)
                step = 0;
                interval = STEPS[0]; // 0 days (ASAP)
                repetitions = 0;
            }
        }

        return { interval, easeFactor, repetitions, step };
    }

    calculateNextReview(intervalDays) {
        if (intervalDays >= 9999) {
            // Far future date for "Learned" items
            const date = new Date();
            date.setFullYear(date.getFullYear() + 100);
            return date.toISOString();
        }
        const date = new Date();
        date.setDate(date.getDate() + intervalDays);
        return date.toISOString();
    }

    // ===== ACHIEVEMENTS =====

    getAchievements() {
        return this.get(STORAGE_KEYS.ACHIEVEMENTS);
    }

    setAchievements(achievements) {
        return this.set(STORAGE_KEYS.ACHIEVEMENTS, achievements);
    }

    getAchievementsConfig() {
        return ACHIEVEMENTS_CONFIG;
    }

    checkAchievements() {
        const profile = this.getUserProfile();
        const vocabulary = this.getVocabulary();
        const errors = this.getErrors();
        const unlockedIds = this.getAchievements();
        const newlyUnlocked = [];

        for (const achievement of ACHIEVEMENTS_CONFIG) {
            if (!unlockedIds.includes(achievement.id)) {
                if (achievement.condition(profile, errors, vocabulary)) {
                    unlockedIds.push(achievement.id);
                    newlyUnlocked.push(achievement);

                    // Ajouter les points de la médaille
                    if (achievement.points > 0) {
                        profile.totalPoints += achievement.points;
                    }
                }
            }
        }

        if (newlyUnlocked.length > 0) {
            this.setAchievements(unlockedIds);
            this.setUserProfile(profile);
        }

        return newlyUnlocked;
    }

    // ===== SETTINGS =====

    getSettings() {
        const settings = this.get(STORAGE_KEYS.SETTINGS) || {};

        // Migration: si apiKey existe en string, la convertir en tableau
        if (settings.apiKey && !Array.isArray(settings.apiKeys)) {
            settings.apiKeys = [settings.apiKey];
            delete settings.apiKey;
            this.set(STORAGE_KEYS.SETTINGS, settings);
        }

        // Valeurs par défaut
        if (!settings.apiKeys) settings.apiKeys = [];
        if (!settings.selectedModel) settings.selectedModel = 'gemini-2.5-flash';

        // Ensure default keyBindings exist
        if (!settings.keyBindings || Object.keys(settings.keyBindings).length === 0) {
            settings.keyBindings = {
                PLAY_PAUSE: ['Space'],
                PREVIOUS: ['ArrowLeft'],
                NEXT: ['ArrowRight'],
                REPLAY: ['ControlRight']
            };
            this.set(STORAGE_KEYS.SETTINGS, settings);
        }

        return settings;
    }

    setSettings(settings) {
        return this.set(STORAGE_KEYS.SETTINGS, settings);
    }

    updateSettings(updates) {
        const settings = this.getSettings();
        return this.setSettings({ ...settings, ...updates });
    }

    getApiKeys() {
        const settings = this.getSettings();
        return settings.apiKeys || [];
    }

    addApiKey(key) {
        if (!key) return false;
        const settings = this.getSettings();
        if (!settings.apiKeys.includes(key)) {
            settings.apiKeys.push(key);
            this.setSettings(settings);
            return true;
        }
        return false;
    }

    removeApiKey(key) {
        const settings = this.getSettings();
        settings.apiKeys = (settings.apiKeys || []).filter(k => k !== key);
        this.setSettings(settings);
    }

    getSelectedModel() {
        return this.getSettings().selectedModel || 'gemini-2.5-flash';
    }

    setSelectedModel(model) {
        return this.updateSettings({ selectedModel: model });
    }

    // Compatibilité
    getApiKey() {
        const keys = this.getApiKeys();
        return keys.length > 0 ? keys[0] : '';
    }

    // ===== DRAFTS (AUTO-SAVE) =====

    getDrafts() {
        return this.get(STORAGE_KEYS.DRAFTS) || {};
    }

    saveDraft(text, dictationData, elapsedTime) {
        if (!dictationData) return;

        const drafts = this.getDrafts();
        // Use a consistent ID (e.g., 'active_draft') or specific ID if handling multiple
        drafts['active_draft'] = {
            userText: text,
            dictation: dictationData,
            elapsedTime: elapsedTime,
            lastSaved: new Date().toISOString()
        };
        this.set(STORAGE_KEYS.DRAFTS, drafts);
    }

    getDraft() {
        const drafts = this.getDrafts();
        return drafts['active_draft'] || null;
    }

    clearDraft() {
        const drafts = this.getDrafts();
        delete drafts['active_draft'];
        this.set(STORAGE_KEYS.DRAFTS, drafts);
    }

    // ===== SESSION PERSISTENCE =====

    saveSession(sessionData) {
        return this.set('dictee_session_state', sessionData);
    }

    restoreSession() {
        return this.get('dictee_session_state');
    }

    clearSession() {
        localStorage.removeItem('dictee_session_state');
    }

    // ===== KEY BINDINGS =====

    getKeyBindings() {
        const settings = this.getSettings();
        let bindings = settings.keyBindings;

        // Default bindings (as arrays)
        const defaults = {
            PLAY_PAUSE: ['Space'],
            PREVIOUS: ['ArrowLeft'],
            NEXT: ['ArrowRight'],
            REPLAY: ['ControlRight']
        };

        if (!bindings) {
            return defaults;
        }

        // Migration: Convert legacy string bindings to arrays
        let hasMigrated = false;
        const migratedBindings = { ...bindings };

        for (const [action, keys] of Object.entries(migratedBindings)) {
            if (typeof keys === 'string') {
                migratedBindings[action] = [keys];
                hasMigrated = true;
            } else if (!Array.isArray(keys)) {
                // Fallback for invalid data
                migratedBindings[action] = defaults[action] || [];
                hasMigrated = true;
            }
        }

        if (hasMigrated) {
            console.log('Migrating key bindings to arrays...');
            this.updateSettings({ keyBindings: migratedBindings });
            return migratedBindings;
        }

        return bindings;
    }

    setKeyBindings(bindings) {
        this.updateSettings({ keyBindings: bindings });
    }

    // ===== TEXT UTILS =====

    cleanAIResponse(text) {
        if (!text) return '';
        // Remove double dashes (used for pauses in some TTS engines but unwanted here)
        return text.replace(/--/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // ===== HISTORY =====

    getHistory() {
        return this.get(STORAGE_KEYS.HISTORY);
    }

    setHistory(history) {
        return this.set(STORAGE_KEYS.HISTORY, history);
    }

    addToHistory(entry) {
        const history = this.getHistory();
        const newId = Date.now().toString();

        history.unshift({
            ...entry,
            id: newId,
            date: new Date().toISOString()
        });

        // Garder seulement les 100 dernières entrées
        if (history.length > 100) {
            history.pop();
        }

        this.setHistory(history);
        return newId; // Return ID for future updates
    }

    updateHistoryItem(id, updates) {
        const history = this.getHistory();
        const index = history.findIndex(item => item.id === id);

        if (index !== -1) {
            history[index] = { ...history[index], ...updates };
            this.setHistory(history);
            return true;
        }
        return false;
    }

    // ===== STATISTICS =====

    getStatistics() {
        const profile = this.getUserProfile();
        const errors = this.getErrors();
        const vocabulary = this.getVocabulary();
        const history = this.getHistory();

        // Calculer les stats par type d'erreur
        const errorsByType = {
            grammaire: 0,
            orthographe: 0,
            conjugaison: 0,
            ponctuation: 0,
            inattention: 0
        };

        errors.forEach(e => {
            if (errorsByType[e.type] !== undefined) {
                errorsByType[e.type] += e.occurrences || 1;
            }
        });

        const totalErrors = Object.values(errorsByType).reduce((a, b) => a + b, 0);

        // Calculer les forces (100 - pourcentage d'erreurs)
        const strengths = {};
        for (const type in errorsByType) {
            strengths[type] = totalErrors > 0
                ? Math.round(100 - (errorsByType[type] / totalErrors * 100))
                : 100;
        }

        return {
            profile,
            errorsByType,
            strengths,
            totalErrors,
            totalVocabulary: vocabulary.length,
            recentHistory: history.slice(0, 10)
        };
    }

    // ===== EXPORT / IMPORT =====

    exportData() {
        return {
            userProfile: this.getUserProfile(),
            themes: this.getThemes(),
            errors: this.getErrors(),
            vocabulary: this.getVocabulary(),
            achievements: this.getAchievements(),
            settings: this.getSettings(),
            history: this.getHistory(),
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.userProfile) this.setUserProfile(data.userProfile);
            if (data.themes) this.setThemes(data.themes);
            if (data.errors) this.setErrors(data.errors);
            if (data.vocabulary) this.setVocabulary(data.vocabulary);
            if (data.achievements) this.setAchievements(data.achievements);
            if (data.settings) this.setSettings(data.settings);
            if (data.history) this.setHistory(data.history);
            return true;
        } catch (e) {
            console.error('Erreur import:', e);
            return false;
        }
    }

    resetAllData() {
        localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        localStorage.removeItem(STORAGE_KEYS.THEMES);
        localStorage.removeItem(STORAGE_KEYS.ERRORS);
        localStorage.removeItem(STORAGE_KEYS.VOCABULARY);
        localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        // Garder les settings (notamment la clé API)
        this.init();
    }
}

// Instance singleton
export const storageService = new StorageService();
