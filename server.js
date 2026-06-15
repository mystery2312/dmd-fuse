const net = require('net');
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');

// ==========================================
//   AJOUT DATE ET HEURE DANS LA CONSOLE
// ==========================================
const originalLog = console.log;
const originalError = console.error;

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
}

console.log = function(...args) {
    originalLog(getTimestamp(), ...args);
};

console.error = function(...args) {
    originalError(getTimestamp(), ...args);
};

// ==========================================
//   RÉGLAGES D'ALIGNEMENT DU DMD (CHIRURGICAL)
// ==========================================
// -> Règlages pour DMD Standard (128x32)
const pixels_h_sd = 59; 
const lignes_v_sd = 1;  

// -> Règlages pour DMD HD (256x64) - Modifiables indépendamment !
const pixels_h_hd = 188; // Le double de la SD pour garder la même proportion visuelle
const lignes_v_hd = 0;   // Le double de la SD

const HEADER = Buffer.from('DMDStream');
let buffer = Buffer.alloc(0);

// NOUVEAU: Variables dynamiques contrôlées par l'application
let currentWidth = 128;
let currentFrameSize = 12288;

// ==========================================
//   CHARGEMENT DE LA CONFIGURATION DYNAMIQUE
// ==========================================
let tcpPort = 6789;
let wsPort = 8080;

try {
    if (fs.existsSync('./config.json')) {
        const configData = fs.readFileSync('./config.json', 'utf8');
        const config = JSON.parse(configData);
        if (config.tcp_port) tcpPort = config.tcp_port;
        if (config.ws_port) wsPort = config.ws_port;
    } else {
        fs.writeFileSync('./config.json', JSON.stringify({ tcp_port: 6789, ws_port: 8080 }, null, 2));
    }
} catch (err) {
    console.log("⚠️ Failed to read config.json, using default values.");
}

const interfaces = os.networkInterfaces();
let localIP = "127.0.0.1";
for (let interfaceName in interfaces) {
    for (let iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
            break;
        }
    }
}

// ==========================================
//   LANCEMENT DU SERVEUR DMD FUSE
// ==========================================
const wss = new WebSocket.Server({ port: wsPort });

// Logs de statut et écoute du mode HD
wss.on('connection', (ws) => {
    console.log("📱 Android APK connected successfully.");

    // Le serveur écoute l'application pour changer de résolution en direct
    ws.on('message', (message) => {
        const msg = message.toString();
        if (msg === "SET_HD") {
            currentWidth = 256;
            currentFrameSize = 49152;
            console.log("📺 Switched to HD Mode (256x64)");
        } else if (msg === "SET_SD") {
            currentWidth = 128;
            currentFrameSize = 12288;
            console.log("📺 Switched to Standard Mode (128x32)");
        }
    });

    ws.on('close', () => {
        console.log("❌ Android APK disconnected.");
    });
});

// ==========================================
//   LANCEMENT DU SERVEUR TCP (VPX)
// ==========================================
const tcpServer = net.createServer((socket) => {
    
    socket.on('error', (err) => {
        console.log("⚠️ TCP Warning (VPX disconnected?) :", err.message);
    });

    socket.on('close', () => {
        console.log("🔌 TCP Connection (VPX) closed.");
        buffer = Buffer.alloc(0); 
    });

    socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        
        let start = buffer.indexOf(HEADER);
        
        // RETOUR À TON ALGORITHME D'ORIGINE (Sécurisé avec Double Offset)
        while (start !== -1) {
            
            // On applique l'offset correspondant au mode actuel
            let currentPixelsH = (currentWidth === 256) ? pixels_h_hd : pixels_h_sd;
            let currentLignesV = (currentWidth === 256) ? lignes_v_hd : lignes_v_sd;
            
            const dynamicOffset = (currentLignesV * currentWidth * 3) + (currentPixelsH * 3);

            if (buffer.length < start + HEADER.length + dynamicOffset + currentFrameSize) {
                break;
            }

            const startOfFrame = start + HEADER.length + dynamicOffset;
            const frame = buffer.slice(startOfFrame, startOfFrame + currentFrameSize);
            
            wss.clients.forEach(c => { 
                if (c.readyState === WebSocket.OPEN) c.send(frame); 
            });

            buffer = buffer.slice(start + HEADER.length + currentFrameSize);
            start = buffer.indexOf(HEADER);
        }
    });
});

tcpServer.on('error', (err) => {
    console.error("🔥 Critical TCP Server Error :", err.message);
});

tcpServer.listen(tcpPort);

console.log("=================================================");
console.log("            DMD FUSE ACTIVATED             ");
console.log(` -> Listen VPX (TCP)   : Port ${tcpPort}`);
console.log(` -> Send to APK (WS)  : Port ${wsPort}`);
console.log(` -> IP of the server      : ${localIP}`);
console.log("=================================================");
console.log("Enter this ip address in DMD FUSE App and in VPX settings.\n");

process.on('uncaughtException', (err) => {
    console.error("💥 Crash prevented:", err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("💥 Crash prevented:", reason);
});