import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dyixnrwrnaxhdtwofbhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aXhucndybmF4aGR0d29mYmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjA2NDM4NCwiZXhwIjoyMDgxNjQwMzg0fQ.vM8C-7pmZCTgT7xyeeuQyWBr7hLeF45wD1ErhOtT7ys';

async function test() {
    console.log('🚀 Démarrage du test de connexion Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const tables = ['profiles', 'vocabulary', 'errors', 'history', 'achievements', 'themes'];

    for (const table of tables) {
        console.log(`\n🔍 Test de la table : ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`❌ Erreur sur ${table} :`, error.message);
            if (error.message.includes('relation') && error.message.includes('does not exist')) {
                console.error(`👉 La table "${table}" n'existe pas encore dans votre base de données.`);
            }
        } else {
            console.log(`✅ Table ${table} OK (accessible). Contenu :`, data.length > 0 ? 'Données présentes' : 'Table vide');
        }
    }

    console.log('\n--- Fin du test ---');
}

test().catch(err => {
    console.error('💥 Erreur fatale pendant le test :', err);
});
