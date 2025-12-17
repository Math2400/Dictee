/**
 * Prompts Templates pour Gemini API
 * Collection de prompts optimisés pour chaque fonctionnalité
 */

// Directives de difficulté par niveau
const LEVEL_GUIDELINES = {
  'A1': 'Phrases simples, présent/passé composé, vocabulaire quotidien basique. Pas de pièges.',
  'A2': 'Phrases courtes, imparfait/futur simple, vocabulaire courant. Structures directes.',
  'B1': 'Phrases composées, conditionnel, vocabulaire varié. Textes structurés.',
  'B2': 'Vocabulaire riche et précis, subjonctif, tournures passives. Argumentation et nuances.',
  'C1': 'Niveau EXIGÉANT: Vocabulaire littéraire/soutenu, structures complexes, concordance des temps stricte, idiomes, subjonctif imparfait si pertinent. Ton formel.',
  'C2': 'Niveau EXPERT/NATIF CULTIVÉ: Vocabulaire rare et archaïque (ex: pleutre, obséquieux), style académique ou littéraire très dense, figures de style, structures alambiquées. Aucune concession sur la difficulté.'
};

export const PROMPTS = {
  /**
   * Génère le prompt pour créer une dictée
   */
  generateDictation({ theme, userProfile, vocabulary, narrativeState, minWords, maxWords }) {
    const level = userProfile?.level || 'B2';
    const complexityInstruction = LEVEL_GUIDELINES[level] || LEVEL_GUIDELINES['B2'];

    const vocabList = vocabulary.length > 0
      ? `\n\nVocabulaire à intégrer obligatoirement dans la dictée:\n${vocabulary.map(v => `- ${v.word}: ${v.definition}`).join('\n')}`
      : '';

    const errorsToReview = userProfile?.errorsToReview || [];
    const errorsList = errorsToReview.length > 0
      ? `\n\nMots/règles à réviser (inclure dans la dictée):\n${errorsToReview.map(e => `- "${e.word}" (${e.type})`).join('\n')}`
      : '';

    const narrativeContext = narrativeState
      ? `\n\nContexte narratif précédent:\n${narrativeState.summary}\nDernier passage: "${narrativeState.lastExcerpt}"\nÉpisode actuel: ${narrativeState.episode}`
      : '\n\nCommencer une nouvelle histoire dans ce thème.';

    return `Tu es un professeur de français expert et INTRANSIGEANT sur le niveau de langue. Génère une dictée éducative de exactement 3 phrases.

THÈME: ${theme.name}
Description du thème: ${theme.description}
${theme.context ? `CONTEXTE SPÉCIFIQUE (Instruction Utilisateur): ${theme.context}` : ''}
${narrativeContext}

Niveau cible: ${level} (${complexityInstruction})
${vocabList}
${errorsList}

RÈGLES IMPORTANTES STICTES:
1. NIVEAU ${level}: Tu DOIS utiliser un vocabulaire et une syntaxe correspondant scrupuleusement à ce niveau (voir directives ci-dessus).
   - Pour C1/C2: INTERDICTION d'utiliser un langage courant ou simple. Utilise des tournures littéraires, du vocabulaire rare, des temps complexes (passé simple, subjonctif imparfait).
2. La dictée doit faire entre ${minWords} et ${maxWords} mots.
3. Le texte doit s'inscrire dans une continuité narrative
4. Varier les structures grammaticales (relatives, subordonnées, inversions)
4. Inclure des difficultés orthographiques variées
5. Si du vocabulaire est fourni, l'intégrer naturellement
6. Si des erreurs passées sont fournies, inclure ces mots/règles

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après:
{
  "text": "Le texte complet de la dictée (3 phrases)",
  "sentences": ["Phrase 1", "Phrase 2", "Phrase 3"],
  "difficulty": "B1|B2|C1|C2",
  "keyWords": ["mot1", "mot2", "mot3"],
  "grammarPoints": ["point grammatical 1", "point grammatical 2"],
  "narrativeSummary": "Résumé bref de l'histoire jusqu'ici",
  "narrativeExcerpt": "Extrait accrocheur de cette dictée"
}`;
  },

  /**
   * Génère le prompt pour analyser les erreurs
   */
  analyzeErrors(original, userText) {
    return `Tu es un correcteur de français expert. Compare le texte original avec le texte saisi par l'utilisateur.

TEXTE ORIGINAL (CORRECT):
"${original}"

TEXTE SAISI PAR L'UTILISATEUR:
"${userText}"

Analyse chaque différence et classe-la dans une des catégories suivantes:
- grammaire: Accord sujet-verbe, genre, nombre, etc.
- orthographe: Faute d'orthographe lexicale
- conjugaison: Erreur de temps, mode ou terminaison verbale
- ponctuation: Virgule, point, apostrophe manquants ou erronés
- inattention: Mot oublié, lettre inversée, doublon évident
- manquant: Partie de texte manquante (ne pas inventer d'erreurs sur ce qui n'est pas là)

RÈGLES DE NOTATION:
1. Si l'utilisateur a oublié une phrase entière, ne compte pas tout faux. Baisse le score proportionnellement mais corrige le reste normalement.
2. Le score doit refléter la QUALITÉ de ce qui est écrit.
3. Si le texte est très incomplet mais sans faute d'orthographe sur ce qui est présent, le score doit être correct (ex: 50% pour la moitié du texte sans faute).

Pour chaque erreur, fournis:
1. La correction
2. La règle grammaticale/orthographique précise (style Bescherelle)
3. Une explication claire et pédagogique

Réponds UNIQUEMENT avec un JSON valide:
{
  "score": 85,
  "totalWords": 45,
  "correctWords": 42,
  "errors": [
    {
      "original": "mot correct",
      "user": "mot erroné",
      "type": "grammaire|orthographe|conjugaison|ponctuation|inattention",
      "rule": "Règle précise du Bescherelle ou référence grammaticale",
      "explanation": "Explication pédagogique claire",
      "position": 5
    }
  ],
  "feedback": "Commentaire général encourageant et constructif"
}`;
  },

  /**
   * Génère le prompt pour créer des questions QCM
   */
  generateQuestions(dictationText, errors, { count = 3, optionsCount = 4, types = ['grammar', 'vocabulary'] } = {}) {
    const errorContext = errors.length > 0
      ? `\n\nErreurs commises par l'utilisateur (cible ces points):\n${errors.map(e => `- ${e.type}: "${e.original}" → "${e.user}"`).join('\n')}`
      : '';

    const typesMap = {
      'grammar': 'Grammaire et conjugaison',
      'vocabulary': 'Vocabulaire (sens et définition)',
      'professor': 'Analyse syntaxique'
    };
    const selectedTypes = types.map(t => typesMap[t]).filter(Boolean).join(', ');

    return `Tu es un professeur de français expert. Crée ${count} questions à choix multiples (QCM) basées sur cette dictée.

DICTÉE:
"${dictationText}"
${errorContext}

CONFIGURATION:
- Nombre de questions: ${count}
- Nombre de choix par question: ${optionsCount} (Une seule bonne réponse)
- Types de questions autorisés: ${selectedTypes || 'Grammaire variée'}

RÈGLES POUR LES QUESTIONS:
1. Questions difficiles nécessitant réflexion
2. Exactement ${optionsCount} choix de réponse par question (lettres a, b, c...)
3. Tous les choix doivent être plausibles et subtils
4. Une seule réponse correcte
5. Si des erreurs sont listées, créer au moins une question sur ces points

Réponds UNIQUEMENT avec un JSON valide:
{
  "questions": [
    {
      "id": 1,
      "question": "L'intitulé de la question",
      "type": "grammar|vocabulary|professor-inverse",
      "context": "Citation ou contexte si nécessaire",
      "options": [
        {"letter": "a", "text": "Option A"},
        // ... jusqu'à ${optionsCount} options
      ],
      "correctAnswer": "c",
      "explanation": "Explication détaillée",
      "rule": "Règle associée"
    }
  ]
}`;
  },

  /**
   * Génère une astuce mnémotechnique
   */
  generateMnemonic(rule, word) {
    return `Tu es un expert en mémorisation et pédagogie. Crée une astuce mnémotechnique courte, amusante et efficace pour retenir cette règle.

RÈGLE: ${rule}
MOT CONCERNÉ: ${word}

L'astuce doit être:
- Courte (1-2 phrases maximum)
- Mémorable et imagée
- Créative (rime, acronyme, histoire courte, association visuelle)

Réponds uniquement avec l'astuce, sans introduction.`;
  },

  /**
   * Obtient l'étymologie d'un mot
   */
  getEtymology(word) {
    return `Tu es un linguiste expert en étymologie française. Explique l'origine du mot suivant de manière concise et mémorable.

MOT: "${word}"

Fournis:
1. L'origine (latin, grec, germanique, etc.)
2. L'évolution du sens
3. Un lien mnémotechnique avec l'orthographe si possible

Limite ta réponse à 2-3 phrases maximum. Sois précis et pédagogique.`;
  },

  /**
   * Analyse grammaticale complète
   */
  analyzeGrammar(text) {
    return `Tu es un grammairien expert. Analyse chaque mot de ce texte.

TEXTE:
"${text}"

Pour chaque mot, fournis:
1. Sa nature (classe grammaticale): nom, verbe, adjectif, adverbe, pronom, préposition, conjonction, déterminant, interjection
2. Sa fonction dans la phrase: sujet, verbe, COD, COI, complément circonstanciel, attribut, épithète, apposition, etc.
3. Ses liens de dépendance avec les autres mots (pour visualiser les accords)

Réponds UNIQUEMENT avec un JSON valide:
{
  "words": [
    {
      "word": "mot",
      "nature": "nom|verbe|adjectif|adverbe|pronom|préposition|conjonction|déterminant|interjection",
      "natureDetail": "détail (ex: nom commun masculin singulier)",
      "function": "sujet|verbe|COD|COI|CC|attribut|épithète|etc",
      "functionDetail": "détail de la fonction",
      "linkedTo": [
        {
          "word": "autre mot",
          "linkType": "accord|dépendance|modification",
          "description": "Le verbe s'accorde avec le sujet"
        }
      ]
    }
  ],
  "sentences": [
    {
      "text": "Phrase complète",
      "structure": "Description de la structure syntaxique"
    }
  ]
}`;
  },

  /**
   * Génère un défi avec erreur cachée (Professeur Inversé)
   */
  generateHiddenError(topic) {
    return `Tu es un professeur malicieux. Crée une phrase contenant UNE erreur subtile que l'élève devra identifier.

THÈME/CONTEXTE: ${topic}

RÈGLES:
1. La phrase doit être élégante et littéraire (15-25 mots)
2. L'erreur doit être subtile mais identifiable
3. Types d'erreurs possibles: accord, conjugaison, homophone, orthographe d'usage
4. La phrase doit avoir du sens même avec l'erreur

Réponds UNIQUEMENT avec un JSON valide:
{
  "sentenceWithError": "La phrase avec l'erreur subtile",
  "errorWord": "mot erroné",
  "correctWord": "mot correct",
  "errorType": "accord|conjugaison|homophone|orthographe",
  "position": 8,
  "explanation": "Explication de l'erreur et de la règle",
  "hint": "Indice subtil sans donner la réponse"
}`;
  },

  /**
   * Génère des questions de vocabulaire
   */
  generateVocabularyQuestions(vocabularyItems) {
    const vocabList = vocabularyItems.map(v => `- ${v.word}: ${v.definition}`).join('\n');

    return `Tu es un professeur de vocabulaire expert. Crée des exercices de vocabulaire basés sur ces mots.

VOCABULAIRE:
${vocabList}

Crée 2 types d'exercices:
1. DEVINETTE: Donne la définition, l'élève doit trouver le mot
2. CONTEXTE: L'élève doit compléter une phrase avec le bon mot

Réponds UNIQUEMENT avec un JSON valide:
{
  "questions": [
    {
      "type": "devinette|contexte",
      "targetWord": "mot à deviner",
      "prompt": "La définition ou la phrase à trous",
      "options": ["option1", "option2", "option3", "option4"],
      "correctAnswer": "option1",
      "explanation": "Explication du mot et usage"
    }
  ]
}`;
  },
  /**
   * Génère un quiz de révision basé sur des erreurs spécifiques
   */
  generateReviewQuiz(errors, options = {}) {
    const errorList = errors.map(e => `- ${e.word} (${e.type}): ${e.rule}`).join('\n');

    // Pour la révision, on vise le niveau C1/C2 par défaut si on veut du dur,
    // ou alors on devine via les erreurs. Ici on force l'exigence.
    const strictComplexity = LEVEL_GUIDELINES['C1'];

    const typesMap = {
      'grammar': 'Grammaire (QCM classique)',
      'vocabulary': 'Vocabulaire (Définition/Synonyme)',
      'professor': 'Professeur Inversé (Trouver l\'erreur dans une phrase)'
    };
    const selectedTypes = options.types ? options.types.map(t => typesMap[t] || t).join(', ') : 'Varié';

    return `Tu es un professeur de français expert et impitoyable sur la précision. Crée un quiz de révision pour travailler ces erreurs spécifiques.
    
    NIVEAU EXIGÉ: C1/C2 (${strictComplexity}).
    Attention: Même si les erreurs à réviser semblent simples, le CONTEXTE (phrases, définitions) doit être de niveau C1/C2 (Vocabulaire soutenu, tournures académiques).
    
    LISTE DES ERREURS/MOTS À RÉVISER (${errors.length} éléments):
    ${errorList}

    Tu dois générer un mix de 4 types d'exercices:
    1. "dictation": Une très courte dictée (1 seule phrase simple, 5 à 10 mots maximum) contenant le mot corrigé.
    2. "professor-inverse": Une phrase complexe et littéraire avec une erreur cachée subtile (liée au mot ou à la règle).
    3. "qcm": Question pointue sur la règle ou une nuance de sens.
    4. "question": Question ouverte exigeante.

    RÈGLES IMPORTANTES:
    - Tu DOIS générer EXACTEMENT ${errors.length} questions (une pour chaque erreur).
    - L'ordre des questions doit suivre l'ordre de la liste.
    - Pour les niveaux C1/C2: Utilise un vocabulaire riche, académique, et des structures de phrases élaborées pour le contexte. Ne pose pas de questions "faciles".

Réponds UNIQUEMENT avec un JSON valide:
{
  "questions": [
    {
      "id": "ref_mot_concerne",
      "targetWord": "le mot concerné",
      "type": "dictation|professor-inverse|qcm|question",
      
      // Pour tous les types
      "question": "Instruction ou question...",
      "explanation": "Explication pédagogique...",
      
      // Spécifique 'dictation' - L'utilisateur doit écrire cette phrase
      "text": "La phrase à dicter contenant le mot corrigé",
      
      // Spécifique 'professor-inverse'
      "sentenceWithError": "Phrase avec l'erreur...",
      "errorWord": "mot faux",
      "correctWord": "mot juste",
      
      // Spécifique 'qcm'
      "options": [
        {"letter": "a", "text": "..."},
        {"letter": "b", "text": "..."} // 4 options
      ],
      "correctAnswer": "a",
      
      // Spécifique 'question' (réponse libre ou courte)
      "answer": "La réponse attendue" 
    }
  ]
}`;
  }
};

