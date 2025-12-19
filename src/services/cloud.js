/**
 * Cloud Service - Synchronisation optionnelle avec Supabase
 * Permet aux utilisateurs d'utiliser leur propre instance Supabase
 */

import { createClient } from '@supabase/supabase-js';

class CloudService {
    constructor() {
        this.supabase = null;
        this.enabled = false;
    }

    /**
     * Initialise le client Supabase avec les clés de l'utilisateur
     */
    initialize(url, key) {
        if (!url || !key) {
            this.enabled = false;
            return false;
        }

        try {
            // Assainissement de l'URL et de la clé
            const cleanUrl = url.trim().replace(/\/$/, "");
            const cleanKey = key.trim();

            this.supabase = createClient(cleanUrl, cleanKey);
            this.enabled = true;
            console.log('☁️ Cloud Service initialisé avec :', cleanUrl);
            return true;
        } catch (e) {
            console.error('Erreur initialisation Supabase:', e);
            this.enabled = false;
            return false;
        }
    }

    async syncData(tableName, data) {
        if (!this.enabled || !this.supabase) {
            return { success: false, message: 'Cloud non initialisé' };
        }

        try {
            // Assainissement des données pour éviter les erreurs de contrainte
            let dataToSync = Array.isArray(data) ? data : [data];

            // Filtrer les objets invalides et s'assurer que l'ID est présent
            dataToSync = dataToSync
                .filter(item => item !== null && typeof item === 'object')
                .map(item => {
                    const cleanItem = { ...item };
                    // Forcer un ID s'il manque (critique pour upsert)
                    if (!cleanItem.id) {
                        console.warn(`⚠️ Item sans ID détecté dans ${tableName}, génération automatique...`);
                        cleanItem.id = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    }

                    // Conversion de type forcée pour les colonnes numériques sensibles
                    // Cela évite les erreurs "invalid input syntax for type integer"
                    const numericFields = ['score', 'points', 'errors', 'time', 'interval', 'easiness', 'repetitions', 'occurrences', 'totalPoints', 'totalDictations', 'perfectDictations', 'streakDays', 'progress'];
                    numericFields.forEach(field => {
                        if (cleanItem[field] !== undefined) {
                            if (cleanItem[field] === null || cleanItem[field] === '') {
                                cleanItem[field] = null;
                            } else {
                                const val = Number(cleanItem[field]);
                                cleanItem[field] = isNaN(val) ? null : val;
                            }
                        }
                    });

                    // S'assurer que les objets complexes sont bien envoyés
                    const jsonFields = ['analysis', 'dictation', 'narrativeState'];
                    jsonFields.forEach(field => {
                        if (cleanItem[field] && typeof cleanItem[field] === 'string') {
                            try {
                                cleanItem[field] = JSON.parse(cleanItem[field]);
                            } catch (e) { /* keep as is */ }
                        }
                    });

                    return cleanItem;
                });

            if (dataToSync.length === 0) return { success: true };

            const { error } = await this.supabase
                .from(tableName)
                .upsert(dataToSync, { onConflict: 'id' });

            if (error) {
                console.error(`❌ Erreur sync ${tableName}:`, error);
                // Message plus explicite pour l'utilisateur
                let userMessage = error.message;
                if (error.code === '42703') {
                    userMessage = `Colonne manquante dans la table '${tableName}'. Exécutez la V2 du script SQL.`;
                } else if (error.code === '22P02') {
                    userMessage = `Erreur de type de données dans '${tableName}'. Exécutez la V2 du script SQL (Mise à jour NUMERIC).`;
                } else if (error.code === '23502') {
                    userMessage = `Valeur requise manquante dans la table '${tableName}'.`;
                }

                return {
                    success: false,
                    message: userMessage,
                    details: error,
                    code: error.code
                };
            }
            return { success: true };
        } catch (e) {
            console.error(`💥 Exception sync ${tableName}:`, e);
            return { success: false, message: e.message };
        }
    }

    async fetchData(tableName) {
        if (!this.enabled || !this.supabase) {
            return { success: false, message: 'Cloud non initialisé', data: [] };
        }

        try {
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*');

            if (error) {
                console.error(`Erreur fetch ${tableName}:`, error);
                return { success: false, message: error.message, data: [] };
            }
            return { success: true, data };
        } catch (e) {
            console.error(`Exception fetch ${tableName}:`, e);
            return { success: false, message: e.message, data: [] };
        }
    }
}

export const cloudService = new CloudService();
