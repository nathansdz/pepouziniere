// Configuration Supabase (partagée entre tous les internes).
// 1. Crée un projet sur https://supabase.com (gratuit)
// 2. Exécute supabase/schema.sql dans le SQL Editor du projet
// 3. Copie l'URL du projet et la clé "anon" (Settings -> API)
// 4. Colle-les ci-dessous et committe : les données seront partagées.

const SUPABASE_URL = "https://ysrxxwtidkvzertkfhbk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gADPBp4iSCBU-F6w7z6gtw_WAJdL6Pa";

const SUPABASE_CONFIGURED = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
