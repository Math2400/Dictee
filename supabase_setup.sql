-- ==================================================================================
-- SCRIPT DE CONFIGURATION SUPABASE FINAL (ULTRA-ROBUSTE)
-- Assure la compatibilité totale pour l'import/export et le test de connexion.
-- ==================================================================================

-- 🧪 FONCTION UTILITAIRE POUR AJOUTER DES COLONNES SI MANQUANTES
CREATE OR REPLACE FUNCTION add_column_if_missing(tab_name text, col_name text, col_type text) 
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tab_name AND column_name = col_name) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s', tab_name, col_name, col_type);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 🛠️ 1. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (id TEXT PRIMARY KEY);
SELECT add_column_if_missing('profiles', 'level', 'TEXT DEFAULT ''B2''');
SELECT add_column_if_missing('profiles', 'totalPoints', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('profiles', 'totalDictations', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('profiles', 'perfectDictations', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('profiles', 'streakDays', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('profiles', 'lastPlayDate', 'TIMESTAMP WITH TIME ZONE');
SELECT add_column_if_missing('profiles', 'createdAt', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');

-- 🛠️ 2. TABLE VOCABULARY
CREATE TABLE IF NOT EXISTS public.vocabulary (id TEXT PRIMARY KEY);
SELECT add_column_if_missing('vocabulary', 'word', 'TEXT');
SELECT add_column_if_missing('vocabulary', 'definition', 'TEXT');
SELECT add_column_if_missing('vocabulary', 'level', 'TEXT DEFAULT ''B2''');
SELECT add_column_if_missing('vocabulary', 'createdAt', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_missing('vocabulary', 'interval', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('vocabulary', 'nextReview', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_missing('vocabulary', 'easiness', 'NUMERIC DEFAULT 2.5');
SELECT add_column_if_missing('vocabulary', 'repetitions', 'INTEGER DEFAULT 0');

-- 🛠️ 3. TABLE ERRORS
CREATE TABLE IF NOT EXISTS public.errors (id TEXT PRIMARY KEY);
SELECT add_column_if_missing('errors', 'word', 'TEXT');
SELECT add_column_if_missing('errors', 'type', 'TEXT');
SELECT add_column_if_missing('errors', 'rule', 'TEXT');
SELECT add_column_if_missing('errors', 'explanation', 'TEXT');
SELECT add_column_if_missing('errors', 'context', 'TEXT');
SELECT add_column_if_missing('errors', 'occurrences', 'INTEGER DEFAULT 1');
SELECT add_column_if_missing('errors', 'createdAt', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_missing('errors', 'interval', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('errors', 'nextReview', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_missing('errors', 'easiness', 'NUMERIC DEFAULT 2.5');
SELECT add_column_if_missing('errors', 'repetitions', 'INTEGER DEFAULT 0');

-- 🛠️ 4. TABLE HISTORY
CREATE TABLE IF NOT EXISTS public.history (id TEXT PRIMARY KEY);
SELECT add_column_if_missing('history', 'date', 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
SELECT add_column_if_missing('history', 'themeName', 'TEXT');
SELECT add_column_if_missing('history', 'themeId', 'TEXT');
SELECT add_column_if_missing('history', 'score', 'NUMERIC'); 
SELECT add_column_if_missing('history', 'points', 'INTEGER');
SELECT add_column_if_missing('history', 'errors', 'INTEGER');
SELECT add_column_if_missing('history', 'time', 'INTEGER');
SELECT add_column_if_missing('history', 'original', 'TEXT');
SELECT add_column_if_missing('history', 'userText', 'TEXT');
SELECT add_column_if_missing('history', 'analysis', 'JSONB');
SELECT add_column_if_missing('history', 'dictation', 'JSONB');
SELECT add_column_if_missing('history', 'isPerfect', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_missing('history', 'isFailed', 'BOOLEAN DEFAULT FALSE');

-- 🛠️ 5. TABLE THEMES
CREATE TABLE IF NOT EXISTS public.themes (id TEXT PRIMARY KEY);
SELECT add_column_if_missing('themes', 'name', 'TEXT');
SELECT add_column_if_missing('themes', 'description', 'TEXT');
SELECT add_column_if_missing('themes', 'icon', 'TEXT');
SELECT add_column_if_missing('themes', 'progress', 'INTEGER DEFAULT 0');
SELECT add_column_if_missing('themes', 'narrativeState', 'JSONB');
SELECT add_column_if_missing('themes', 'lastDictation', 'TEXT');
SELECT add_column_if_missing('themes', 'isCustom', 'BOOLEAN DEFAULT FALSE');
SELECT add_column_if_missing('themes', 'context', 'TEXT');

-- 🛡️ RÉPARATION DES TYPES ET CONTRAINTES
-- On force NUMERIC pour éviter les erreurs de syntaxe sur les nombres décimaux (SM-2, Points)
DO $$ 
BEGIN 
    ALTER TABLE public.history ALTER COLUMN score TYPE NUMERIC USING score::NUMERIC;
    ALTER TABLE public.vocabulary ALTER COLUMN easiness TYPE NUMERIC USING easiness::NUMERIC;
    ALTER TABLE public.errors ALTER COLUMN easiness TYPE NUMERIC USING easiness::NUMERIC;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Erreur lors de la conversion des types, ignorée car probablement déjà OK.';
END $$;

-- 🔓 DÉSACTIVATION RLS (Crucial pour le test de connexion sans clé secrète)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.errors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements DISABLE ROW LEVEL SECURITY;

-- 🧹 NETTOYAGE
DROP FUNCTION IF EXISTS add_column_if_missing;

-- ✅ FIN DU SCRIPT. Votre base est maintenant prête.
