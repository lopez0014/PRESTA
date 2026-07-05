// CONFIGURACIÓN DEL BÚNKER DE SUPABASE CON TUS LLAVES REALES
const SUPABASE_URL = "https://wudmepzjugiqaduvbmkr.supabase.co";
const SUPABASE_KEY = "sb_publishable_FeTysAKR6oCmdYdjOoo7mw_B3zkHa5p";

// Inicializar el cliente global accediendo correctamente al paquete web de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🔒 Conexión búnker con Supabase establecida con éxito.");