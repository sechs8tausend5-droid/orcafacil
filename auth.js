
"use strict";

const supabaseAuth = window.orcafacilSupabase;

const areaAutenticacao = document.getElementById("areaAutenticacao");
const areaAplicacao = document.getElementById("areaAplicacao");
const mensagemAuth = document.getElementById("mensagemAutenticacao");

function mostrarMensagemAuth(texto) {
    mensagemAuth.textContent = texto;
}

function mostrarAcesso(autenticado) {
    areaAutenticacao.hidden = autenticado;
    areaAplicacao.hidden = !autenticado;
}

// Criar conta
document.getElementById("registarConta").addEventListener("click", async () => {
    const email = document.getElementById("emailAcesso").value.trim();
    const password = document.getElementById("passwordAcesso").value;

    if (!email || password.length < 6) {
        mostrarMensagemAuth("Introduz um email válido e uma palavra-passe com pelo menos 6 caracteres.");
        return;
    }

    mostrarMensagemAuth("A criar a conta...");

    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password
    });

    if (error) {
        mostrarMensagemAuth("Erro: " + error.message);
        return;
    }

    if (data.session) {
        mostrarMensagemAuth("Conta criada com sucesso!");
        mostrarAcesso(true);
    } else {
        mostrarMensagemAuth("Conta criada. Consulta o teu email para confirmares o registo.");
    }
});

// Iniciar sessão
document.getElementById("iniciarSessao").addEventListener("click", async () => {
    const email = document.getElementById("emailAcesso").value.trim();
    const password = document.getElementById("passwordAcesso").value;

    if (!email || !password) {
        mostrarMensagemAuth("Preenche o email e a palavra-passe.");
        return;
    }

    mostrarMensagemAuth("A iniciar sessão...");

    const { error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        mostrarMensagemAuth("Erro: " + error.message);
        return;
    }

    mostrarMensagemAuth("Sessão iniciada com sucesso!");
    mostrarAcesso(true);
});

// Recuperar palavra-passe
document.getElementById("recuperarPassword").addEventListener("click", async () => {
    const email = document.getElementById("emailAcesso").value.trim();

    if (!email) {
        mostrarMensagemAuth("Introduz primeiro o teu email.");
        return;
    }

    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    });

    if (error) {
        mostrarMensagemAuth("Erro: " + error.message);
        return;
    }

    mostrarMensagemAuth("Se a conta existir, receberás um email para recuperar a palavra-passe.");
});

// Atualizar o ecrã quando o estado da sessão muda
supabaseAuth.auth.onAuthStateChange((event, session) => {
    mostrarAcesso(!!session);
});

// Verificar se já existe uma sessão
async function verificarSessao() {
    const { data, error } = await supabaseAuth.auth.getSession();

    if (error) {
        mostrarMensagemAuth("Não foi possível verificar a sessão.");
        mostrarAcesso(false);
        return;
    }

    mostrarAcesso(!!data.session);
}

verificarSessao();
