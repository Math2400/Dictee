/**
 * Constants - Application constants and configuration
 */

export const LEVELS = {
    A1: { name: 'A1 - Débutant', multiplier: 0.5 },
    A2: { name: 'A2 - Élémentaire', multiplier: 0.75 },
    B1: { name: 'B1 - Intermédiaire', multiplier: 1.0 },
    B2: { name: 'B2 - Intermédiaire avancé', multiplier: 1.25 },
    C1: { name: 'C1 - Avancé', multiplier: 1.5 },
    C2: { name: 'C2 - Maîtrise', multiplier: 2.0 }
};

export const ERROR_TYPES = {
    grammaire: {
        label: 'Grammaire',
        color: '#f472b6',
        bgColor: 'rgba(244, 114, 182, 0.15)',
        icon: '📐'
    },
    orthographe: {
        label: 'Orthographe',
        color: '#fb923c',
        bgColor: 'rgba(251, 146, 60, 0.15)',
        icon: '✏️'
    },
    conjugaison: {
        label: 'Conjugaison',
        color: '#a78bfa',
        bgColor: 'rgba(167, 139, 250, 0.15)',
        icon: '🔄'
    },
    ponctuation: {
        label: 'Ponctuation',
        color: '#60a5fa',
        bgColor: 'rgba(96, 165, 250, 0.15)',
        icon: '❗'
    },
    inattention: {
        label: 'Inattention',
        color: '#facc15',
        bgColor: 'rgba(250, 204, 21, 0.15)',
        icon: '👁️'
    }
};

export const GRAMMAR_NATURES = {
    nom: { label: 'Nom', color: '#60a5fa', class: 'nature-noun' },
    verbe: { label: 'Verbe', color: '#34d399', class: 'nature-verb' },
    adjectif: { label: 'Adjectif', color: '#818cf8', class: 'nature-adjective' },
    adverbe: { label: 'Adverbe', color: '#a78bfa', class: 'nature-adverb' },
    pronom: { label: 'Pronom', color: '#22d3ee', class: 'nature-pronoun' },
    préposition: { label: 'Préposition', color: '#67e8f9', class: 'nature-preposition' },
    conjonction: { label: 'Conjonction', color: '#5eead4', class: 'nature-conjunction' },
    déterminant: { label: 'Déterminant', color: '#93c5fd', class: 'nature-determiner' },
    interjection: { label: 'Interjection', color: '#c4b5fd', class: 'nature-interjection' }
};

export const GRAMMAR_FUNCTIONS = {
    sujet: { label: 'Sujet', color: '#f87171', class: 'function-subject' },
    verbe: { label: 'Verbe', color: '#fb923c', class: 'function-verb' },
    COD: { label: 'COD', color: '#fbbf24', class: 'function-object' },
    COI: { label: 'COI', color: '#fbbf24', class: 'function-object' },
    complément: { label: 'Complément', color: '#f472b6', class: 'function-complement' },
    attribut: { label: 'Attribut', color: '#fdba74', class: 'function-attribute' },
    épithète: { label: 'Épithète', color: '#fb7185', class: 'function-modifier' },
    CC: { label: 'CC', color: '#f472b6', class: 'function-complement' }
};

export const SCORING = {
    PERFECT_DICTATION: 100,
    CORRECT_WORD: 2,
    QUESTION_CORRECT: 15,
    PROFESSOR_INVERSE: 50,
    SPEED_MULTIPLIERS: {
        FAST: 2.0,    // < 2 minutes
        MEDIUM: 1.5,  // < 4 minutes
        NORMAL: 1.0   // > 4 minutes
    },
    LEVEL_MULTIPLIERS: LEVELS,
    REGRESSION_PENALTY: -10
};

export const TIMER_THRESHOLDS = {
    FAST: 120,    // 2 minutes en secondes
    MEDIUM: 240,  // 4 minutes en secondes
    WARNING: 300, // 5 minutes - warning
    DANGER: 420   // 7 minutes - danger
};

export const KEYBOARD_SHORTCUTS = {
    PLAY_PAUSE: { key: 'AltLeft', label: 'Alt', description: 'Lecture / Pause' },
    PREVIOUS: { key: 'Tab', shift: true, label: 'Shift + Tab', description: 'Segment précédent' },
    NEXT: { key: 'Tab', label: 'Tab', description: 'Segment suivant' },
    REPLAY: { key: 'ControlLeft', label: 'Ctrl', description: 'Répéter' },
    SUBMIT: { key: 'Enter', ctrl: true, label: 'Entrée', description: 'Valider (avec Ctrl)' }
};

export const ROUTES = {
    DASHBOARD: '/',
    DICTATION: '/dictation',
    CORRECTION: '/correction',
    QUIZ: '/quiz',
    VOCABULARY: '/vocabulary',
    ERRORS: '/errors',
    SETTINGS: '/settings',
    MULTIPLAYER: '/multiplayer'
};

// Modèles Gemini disponibles
export const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Performant)', description: 'Recommandé : Équilibré et performant' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Rapide)', description: 'Le plus rapide et économique' }
];

export const API_CONFIG = {
    // MODEL supprimé car dynamique
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};
