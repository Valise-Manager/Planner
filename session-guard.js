/**
 * session-guard.js
 * -----------------
 * Cole este bloco (dentro de uma tag <script type="module">) em CADA página
 * protegida do app (versao-mobile-turista/index.html e
 * versao-desktop-turista/index.html), logo após o <body> ou antes do </body>.
 *
 * O que ele faz:
 * 1. Confirma que o usuário está autenticado (senão, manda de volta pro login).
 * 2. Fica "ouvindo" o Firestore em tempo real. Se o sessionId salvo lá mudar
 *    (ou seja, alguém logou de novo em outro lugar com a mesma conta),
 *    desloga esta aba/dispositivo automaticamente.
 *
 * IMPORTANTE: ajuste "CAMINHO_PARA_O_LOGIN" para o caminho relativo correto
 * de volta até o seu index.html de login.
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyALCBUJ-9nKAz19LNVWe4qWbZNcBHq7cqU",
    authDomain: "valise-concierge.firebaseapp.com",
    projectId: "valise-concierge",
    storageBucket: "valise-concierge.firebasestorage.app",
    messagingSenderId: "312930931756",
    appId: "1:312930931756:web:f8cf24760d1343dd4f2d89"
};

const CAMINHO_PARA_O_LOGIN = "../index.html"; // ajuste conforme a pasta real

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let unsubscribeSessionListener = null;

function forcarLogout(mensagem) {
    if (unsubscribeSessionListener) unsubscribeSessionListener();
    signOut(auth).finally(() => {
        localStorage.removeItem('valise_session_id');
        localStorage.removeItem('valise_uid');
        alert(mensagem);
        window.location.href = CAMINHO_PARA_O_LOGIN;
    });
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Ninguém logado -> volta pro login
        window.location.href = CAMINHO_PARA_O_LOGIN;
        return;
    }

    const localSessionId = localStorage.getItem('valise_session_id');
    const localUid = localStorage.getItem('valise_uid');

    // Se não existe sessionId local para este usuário, esta aba não veio
    // do fluxo normal de login (ex: token antigo persistido) -> desloga.
    if (!localSessionId || localUid !== user.uid) {
        forcarLogout('Sua sessão expirou. Faça login novamente.');
        return;
    }

    // Escuta em tempo real o documento de sessão deste usuário
    unsubscribeSessionListener = onSnapshot(doc(db, 'sessions', user.uid), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.sessionId !== localSessionId) {
            forcarLogout('Sua conta foi acessada em outro dispositivo. Você foi desconectado por segurança.');
        }
    });
});
