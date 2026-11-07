
"use strict";

// Configuração do Supabase
const SUPABASE_URL = "https://obfjrrnrcagwjfgajyzy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_h8W5cAKJthJlTQz56Jlatw_-2u18MsV";

// Criar ligação ao Supabase
window.orcafacilSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Ligação ao Supabase preparada.");
