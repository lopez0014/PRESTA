// CLAVE MAESTRA DE ENCRIPTACIÓN MILITAR
// Edwin, esta es una frase secreta tuya para cifrar los datos. Cámbiala por la que quieras, pero que sea segura.
const CLAVE_SECRETA_AES = "MiFraseSuperSecretaDePréstamosHonduras123!";

/**
 * Función para cifrar el DNI o la cuenta bancaria antes de mandarla a Supabase
 * @param {string} textoPlano - El dato real (ej: "0501-1995-12345")
 * @returns {object} Un objeto con el texto cifrado y su vector de inicialización (IV)
 */
function encriptarDato(textoPlano) {
    // Generamos un Vector de Inicialización (IV) único y aleatorio de 16 bytes para este cifrado
    const iv = CryptoJS.lib.WordArray.random(16);
    
    // Ciframos el dato usando AES-256 en modo CBC con relleno PKCS7
    const cifrado = CryptoJS.AES.encrypt(textoPlano, CryptoJS.enc.Utf8.parse(CLAVE_SECRETA_AES), {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Devolvemos el texto cifrado en formato Hexadecimal o Base64 y el IV en Hexadecimal
    // Esto es justo lo que vas a guardar en las columnas "cifrado" y "vector_ib" de tu tabla
    return {
        textoCifrado: cifrado.toString(),
        vectorIB: iv.toString(CryptoJS.enc.Hex)
    };
}

/**
 * Función para descifrar los datos cuando tu hermana los revise en el panel de administración
 * @param {string} textoCifrado - El chorizo de texto guardado en Supabase
 * @param {string} vectorIB - El IV en Hexadecimal guardado en la base de datos
 * @returns {string} El DNI o cuenta original en texto limpio
 */
function desencriptarDato(textoCifrado, vectorIB) {
    const iv = CryptoJS.enc.Hex.parse(vectorIB);
    
    const bytes = CryptoJS.AES.decrypt(textoCifrado, CryptoJS.enc.Utf8.parse(CLAVE_SECRETA_AES), {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return bytes.toString(CryptoJS.enc.Utf8);
}

console.log("🛡️ Sistema de encriptación militar AES-256 cargado en el búnker.");