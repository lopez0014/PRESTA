let usuarioIdActual = null;
let usuarioTelefonoActual = null;

// DETECTOR DE 4 CLICS (PANEL OCULTO DIGITAL)
let contadorClicks = 0;
let ultimoClickTiempo = 0;

function detectarCuatroClicks() {
    const tiempoActual = new Date().getTime();
    
    if (tiempoActual - ultimoClickTiempo > 1500) {
        contadorClicks = 0;
    }
    
    contadorClicks++;
    ultimoClickTiempo = tiempoActual;
    
    if (contadorClicks === 4) {
        contadorClicks = 0; 
        alert("Módulo administrativo detectado. Proceda con la autenticación corporativa.");
        conmutarAuth('login'); 
    }
}

function conmutarAuth(pantalla) {
    if (pantalla === 'login') {
        document.getElementById('section-register').style.display = 'none';
        document.getElementById('section-login').style.display = 'block';
    } else {
        document.getElementById('section-login').style.display = 'none';
        document.getElementById('section-register').style.display = 'block';
    }
    document.getElementById('status-msg').innerText = "";
}

function mostrarSeccion(seccionId) {
    document.getElementById('section-loan').style.display = 'none';
    document.getElementById('section-my-profile').style.display = 'none';
    document.getElementById('section-about').style.display = 'none';
    document.getElementById('section-admin-panel').style.display = 'none';
    document.getElementById(seccionId).style.display = 'block';

    if (seccionId === 'section-my-profile') cargarHistorialPrestamos();
}

function ajustarLimiteMonto() {
    const garantia = document.getElementById('l-garantia').value;
    const montoInput = document.getElementById('l-monto');
    if (garantia === 'ninguna') {
        montoInput.placeholder = "Monto Máximo: L. 2,000";
    } else {
        montoInput.placeholder = "Monto Máximo: L. 10,000";
    }
}

// 1. REGISTRO DE USUARIOS
async function guardarPerfil() {
    const nombre = document.getElementById('p-nombre').value;
    const telefono = document.getElementById('p-telefono').value;
    const password = document.getElementById('p-password').value;

    if (!nombre || !telefono || !password) {
        alert("Por favor, llene todos los campos del perfil.");
        return;
    }

    document.getElementById('status-msg').innerText = "Guardando perfil de forma segura...";

    const passwordHashed = CryptoJS.SHA256(password).toString();

    try {
        const { data, error } = await supabase
            .from('perfiles')
            .insert([{ 
                nombre_completo: nombre, 
                telefono: telefono,
                password: passwordHashed,
                rol: 'cliente' 
            }])
            .select();

        if (error) {
            alert("Error al registrar: " + error.message);
            return;
        }

        usuarioIdActual = data[0].id; 
        usuarioTelefonoActual = telefono;
        loguearUsuario(nombre);

    } catch (err) {
        alert("Error crítico: " + err.message);
    }
}

// 2. INICIAR SESIÓN INTELIGENTE (EVALÚA ROL DESDE BASE DE DATOS)
async function iniciarSesion() {
    const telefono = document.getElementById('login-telefono').value;
    const password = document.getElementById('login-password').value;

    if (!telefono || !password) {
        alert("Por favor, introduce tus credenciales.");
        return;
    }

    document.getElementById('status-msg').innerText = "Validando accesos bancarios...";

    const loginPasswordHashed = CryptoJS.SHA256(password).toString();

    try {
        const { data, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('telefono', telefono);

        if (error) {
            alert("Error de conexión: " + error.message);
            return;
        }

        if (data.length === 0) {
            alert("Las credenciales ingresadas no corresponden a ninguna cuenta.");
            return;
        }

        if (data[0].password !== loginPasswordHashed) {
            alert("Contraseña incorrecta. Acceso denegado.");
            return;
        }

        usuarioIdActual = data[0].id;
        usuarioTelefonoActual = data[0].telefono;

        if (data[0].rol === 'admin') {
            loguearAdmin();
        } else {
            loguearUsuario(data[0].nombre_completo);
        }

    } catch (err) {
        alert("Error crítico: " + err.message);
    }
}

function loguearAdmin() {
    document.getElementById('main-container').style.maxWidth = "700px";
    document.getElementById('section-register').style.display = 'none';
    document.getElementById('section-login').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'block';
    document.getElementById('section-admin-panel').style.display = 'block';
    document.getElementById('status-msg').innerText = "Panel administrativo global inicializado.";
    cargarPrestamosGlobales();
}

function loguearUsuario(nombre) {
    document.getElementById('main-container').style.maxWidth = "450px";
    const nameSpans = document.getElementsByClassName('user-name-span');
    for (let span of nameSpans) { span.innerText = nombre; }
    document.getElementById('user-phone-span').innerText = usuarioTelefonoActual;

    document.getElementById('section-register').style.display = 'none';
    document.getElementById('section-login').style.display = 'none';
    document.getElementById('app-nav').style.display = 'flex';
    document.getElementById('section-loan').style.display = 'block';
    document.getElementById('status-msg').innerText = "Sesión de usuario activa.";
    cargarHistorialPrestamos();
}

function cerrarSesion() {
    usuarioIdActual = null;
    usuarioTelefonoActual = null;
    document.getElementById('main-container').style.maxWidth = "450px";
    document.getElementById('app-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
    document.getElementById('section-loan').style.display = 'none';
    document.getElementById('section-my-profile').style.display = 'none';
    document.getElementById('section-about').style.display = 'none';
    document.getElementById('section-admin-panel').style.display = 'none';
    document.getElementById('section-login').style.display = 'block';
    document.getElementById('status-msg').innerText = "Sesión cerrada de forma segura.";
    
    if(document.getElementById('p-password')) document.getElementById('p-password').value = '';
    if(document.getElementById('login-password')) document.getElementById('login-password').value = '';
}

// 3. ENVIAR PRÉSTAMO Y DISPARAR ENLACE INVISIBLE NATIVO A WHATSAPP
async function solicitarPrestamo() {
    const monto = document.getElementById('l-monto').value;
    const dni = document.getElementById('l-dni').value;
    const garantia = document.getElementById('l-garantia').value;
    let banco = document.getElementById('l-banco').value || 'Efectivo';
    let cuenta = document.getElementById('l-cuenta').value || 'Retiro Presencial';

    if (!monto || !dni) {
        alert("Monto y DNI obligatorios.");
        return;
    }

    const montoNumerico = parseFloat(monto);

    if (garantia === 'ninguna' && montoNumerico > 2000) {
        alert("Los préstamos sin garantía están topados a un máximo de L. 2,000.");
        return;
    }
    if (montoNumerico > 10000) {
        alert("El sistema solo permite un máximo de L. 10,000 con garantía.");
        return;
    }

    if (garantia !== 'ninguna') {
        banco = `CON EMPEÑO DE: ${garantia.toUpperCase()} | ` + banco;
    }

    document.getElementById('status-msg').innerText = "Registrando solicitud contable...";

    const codigoUnico = Math.floor(100 + Math.random() * 900);

    try {
        const { data: cipherData, error: cipherError } = await encriptarDato(dni);
        let textCifrado = dni;
        let vecIB = "0000000000000000";
        if (!cipherError && cipherData) {
            textCifrado = cipherData.textoCifrado || dni;
            vecIB = cipherData.vectorIB || vecIB;
        }

        const { data, error } = await supabase
            .from('prestamos')
            .insert([{
                usuario_id: usuarioIdActual,
                monto: montoNumerico,
                dni: dni,                             
                cifrado: textCifrado,     
                vector_ib: vecIB,       
                banco_destino: banco,                 
                cuenta_bancaria: cuenta,              
                estado: `pendiente (Código: #${codigoUnico})` 
            }]);

        if (error) {
            alert("Error al guardar solicitud: " + error.message);
            return;
        }

        // Jalamos el teléfono del administrador dinámicamente de Supabase (el del perfil con rol admin)
        const { data: adminData } = await supabase.from('perfiles').select('telefono').eq('rol', 'admin').limit(1);
        const telefonoDestino = (adminData && adminData.length > 0) ? adminData[0].telefono : "5127508621"; 

        // Mensaje inteligente corporativo oficial bajo la marca Credi Honduras
        const textoMensaje = `Hola, solicité un préstamo de L. ${montoNumerico}.\nMi código de validación es el #${codigoUnico}.\n\nQuedo listo para enviarle la documentación de identidad a Credi Honduras.`;
        const textoEncriptadoURL = encodeURIComponent(textoMensaje);
        const urlWhatsApp = `https://wa.me/${telefonoDestino}?text=${textoEncriptadoURL}`;

        alert(`¡Solicitud registrada con éxito bajo el código #${codigoUnico}!\n\nPresiona Aceptar para transferir los datos y abrir WhatsApp.`);

        document.getElementById('l-monto').value = '';
        document.getElementById('l-dni').value = '';
        document.getElementById('l-banco').value = '';
        document.getElementById('l-cuenta').value = '';

        // 🔥 ENLACE INVISIBLE NATIVO: Simula una acción real del usuario en el DOM para forzar la apertura sin importar los filtros de Chrome
        const enlaceInvisible = document.createElement('a');
        enlaceInvisible.href = urlWhatsApp;
        enlaceInvisible.target = '_blank';
        enlaceInvisible.rel = 'noopener noreferrer';
        
        document.body.appendChild(enlaceInvisible);
        enlaceInvisible.click();
        document.body.removeChild(enlaceInvisible);

        // RESPALDO DE REDIRECCIÓN ABSOLUTA
        setTimeout(() => {
            window.location.href = urlWhatsApp;
        }, 300);

    } catch (err) {
        alert("Error crítico: " + err.message);
    }
}

// 4. HISTORIAL DE CUENTA CLIENTE
async function cargarHistorialPrestamos() {
    if (!usuarioIdActual) return;
    const container = document.getElementById('loans-history-container');
    container.innerHTML = `<p style="text-align:center;font-size:13px;color:#6c757d;">Cargando historial...</p>`;

    try {
        const { data, error } = await supabase
            .from('prestamos')
            .select('*')
            .eq('usuario_id', usuarioIdActual)
            .order('creado_en', { ascending: false });

        if (error) return;

        if (data.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:20px;color:#6c757d;font-size:13px;border:1px solid #dee2e6;">No registras préstamos activos.</div>`;
            return;
        }

        let html = "";
        data.forEach(prestamo => {
            let colorEstado = "#ffc107";
            if (prestamo.estado.includes('aprobado')) colorEstado = "#28a745";
            if (prestamo.estado.includes('rechazado')) colorEstado = "#dc3545";

            html += `
                <div style="background:#ffffff;padding:15px;border:1px solid #dee2e6;border-radius:4px;margin-bottom:10px;border-left:4px solid ${colorEstado};">
                    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-bottom:5px;">
                        <span>Monto: L. ${prestamo.monto}</span>
                        <span style="color:${colorEstado};text-transform:uppercase;font-size:12px;">${prestamo.estado.split(' ')[0]}</span>
                    </div>
                    <div style="color:#6c757d;font-size:12px;">
                        <p>Método: ${prestamo.banco_destino}</p>
                        <p>Fecha: ${new Date(prestamo.creado_en).toLocaleDateString()}</p>
                        <p style="margin-top:5px;color:#212529;"><strong>Total a Pagar:</strong> L. ${(prestamo.monto * 1.10).toFixed(2)}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {}
}

// 5. LISTA GLOBAL ADMINISTRADOR
async function cargarPrestamosGlobales() {
    const container = document.getElementById('admin-loans-container');
    container.innerHTML = `<p style="text-align:center;font-size:13px;color:#6c757d;">Cargando solicitudes globales...</p>`;

    try {
        const { data, error } = await supabase
            .from('prestamos')
            .select(`
                id, monto, dni, vector_ib, banco_destino, cuenta_bancaria, estado, creado_en,
                perfiles ( nombre_completo, telefono )
            `)
            .order('creado_en', { ascending: false });

        if (error) return;

        if (data.length === 0) {
            container.innerHTML = `<p style="text-align:center;font-size:13px;color:#6c757d;">No hay solicitudes registradas.</p>`;
            return;
        }

        let html = "";
        data.forEach(p => {
            let dniOriginal = "Fallo de descifrado";
            try {
                dniOriginal = desencriptarDato(p.dni, p.vector_ib);
            } catch(e) {
                dniOriginal = p.dni; 
            }

            let colorEstado = "#ffc107";
            if (p.estado.includes('aprobado')) colorEstado = "#28a745";
            if (p.estado.includes('rechazado')) colorEstado = "#dc3545";

            html += `
                <div style="background:#ffffff;padding:20px;border:1px solid #dee2e6;border-radius:4px;margin-bottom:15px;border-left:4px solid ${colorEstado};">
                    <p style="font-size:15px;font-weight:bold;color:#003366;">Cliente: ${p.perfiles ? p.perfiles.nombre_completo : 'Desconocido'}</p>
                    <p style="color:#6c757d;font-size:12px;">Teléfono: ${p.perfiles ? p.perfiles.telefono : 'N/A'}</p>
                    <hr style="margin:10px 0;border-color:#dee2e6;">
                    <p style="font-size:13px;"><strong>Monto:</strong> L. ${p.monto}</p>
                    <p style="font-size:13px;"><strong>DNI:</strong> ${dniOriginal}</p>
                    <p style="font-size:13px;"><strong>Desembolso:</strong> ${p.banco_destino} - ${p.cuenta_bancaria}</p>
                    <p style="font-size:13px;"><strong>Estado:</strong> <span style="color:${colorEstado};font-weight:bold;text-transform:uppercase;">${p.estado}</span></p>
                    
                    ${p.estado.includes('pendiente') ? `
                        <div style="display:flex;gap:10px;margin-top:15px;">
                            <button onclick="procesarSolicitud('${p.id}', 'aprobado')" style="background-color:#28a745;color:white;padding:10px;font-size:12px;margin-top:0;">Aprobar Crédito</button>
                            <button onclick="procesarSolicitud('${p.id}', 'rechazado')" style="background-color:#dc3545;color:white;padding:10px;font-size:12px;margin-top:0;">Rechazar</button>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {}
}

async function procesarSolicitud(prestamoId, nuevoEstado) {
    const confirmacion = confirm(`¿Cambiar estado a ${nuevoEstado.toUpperCase()}?`);
    if (!confirmacion) return;

    try {
        const { error } = await supabase
            .from('prestamos')
            .update({ estado: nuevoEstado })
            .eq('id', prestamoId);

        if (error) return;
        cargarPrestamosGlobales();
    } catch (err) {}
}