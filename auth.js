
"use strict";

// ==========================================
// ORÇAFÁCIL - AUTENTICAÇÃO SUPABASE
// ==========================================

const supabaseAuth = window.orcafacilSupabase;

// Elementos HTML
const areaAutenticacao =
    document.getElementById("areaAutenticacao");

const areaAplicacao =
    document.getElementById("areaAplicacao");

const mensagemAuth =
    document.getElementById("mensagemAutenticacao");

// Botões
const botaoRegistar =
    document.getElementById("registarConta");

const botaoIniciar =
    document.getElementById("iniciarSessao");

const botaoRecuperar =
    document.getElementById("recuperarPassword");

const botaoTerminar =
    document.getElementById("terminarSessao");

// Campos
const campoEmail =
    document.getElementById("emailAcesso");

const campoPassword =
    document.getElementById("passwordAcesso");

// Estado da aplicação
let aplicacaoIniciada = false;
let inicializacaoEmCurso = null;

// ==========================================
// VERIFICAR CONFIGURAÇÃO
// ==========================================

if (!supabaseAuth) {
    throw new Error(
        "A ligação ao Supabase não foi encontrada. " +
        "Verifica o supabase-config.js."
    );
}

if (
    !areaAutenticacao ||
    !areaAplicacao ||
    !mensagemAuth ||
    !campoEmail ||
    !campoPassword
) {
    throw new Error(
        "Não foram encontrados todos os elementos de autenticação."
    );
}

// ==========================================
// MENSAGENS
// ==========================================

function mostrarMensagemAuth(texto) {
    mensagemAuth.textContent = texto;
}

// ==========================================
// LIMPAR DADOS TEMPORÁRIOS
// ==========================================

function limparDadosLocais() {

    const chaves = [
        "orcafacil_profissional",
        "orcafacil_rascunho",
        "orcafacil_historico",
        "orcafacil_contador"
    ];

    chaves.forEach(chave => {
        localStorage.removeItem(chave);
    });

    console.log(
        "Dados temporários do utilizador removidos do navegador."
    );
}

// ==========================================
// MOSTRAR ECRÃ DE AUTENTICAÇÃO
// ==========================================

function mostrarEcranAutenticacao() {

    areaAutenticacao.hidden = false;
    areaAplicacao.hidden = true;

    aplicacaoIniciada = false;
    inicializacaoEmCurso = null;
}

// ==========================================
// INICIALIZAR APLICAÇÃO APÓS LOGIN
// ==========================================

async function mostrarAcesso(autenticado) {

    if (!autenticado) {
        mostrarEcranAutenticacao();
        return;
    }

    // Já está inicializada
    if (aplicacaoIniciada) {
        areaAutenticacao.hidden = true;
        areaAplicacao.hidden = false;
        return;
    }

    // Evitar duas inicializações simultâneas
    if (inicializacaoEmCurso) {
        return inicializacaoEmCurso;
    }

    areaAutenticacao.hidden = false;
    areaAplicacao.hidden = true;

    mostrarMensagemAuth(
        "A carregar os teus dados..."
    );

    if (
        typeof window.iniciarAplicacaoOrcaFacil !== "function"
    ) {
        mostrarMensagemAuth(
            "Erro: não foi possível encontrar a aplicação."
        );

        return;
    }

    inicializacaoEmCurso = (async () => {

        try {

            await window.iniciarAplicacaoOrcaFacil();

            aplicacaoIniciada = true;

            areaAutenticacao.hidden = true;
            areaAplicacao.hidden = false;

            mostrarMensagemAuth("");

            console.log(
                "Autenticação e inicialização concluídas."
            );

        } catch (erro) {

            console.error(
                "Erro ao inicializar o OrçaFácil:",
                erro
            );

            aplicacaoIniciada = false;

            areaAutenticacao.hidden = false;
            areaAplicacao.hidden = true;

            mostrarMensagemAuth(
                "Não foi possível carregar os dados: " +
                erro.message
            );

            throw erro;

        } finally {

            inicializacaoEmCurso = null;
        }

    })();

    return inicializacaoEmCurso;
}

// ==========================================
// CRIAR CONTA
// ==========================================

botaoRegistar.addEventListener("click", async () => {

    const email = campoEmail.value.trim();
    const password = campoPassword.value;

    if (!email || password.length < 6) {

        mostrarMensagemAuth(
            "Introduz um email válido e uma palavra-passe " +
            "com pelo menos 6 caracteres."
        );

        return;
    }

    botaoRegistar.disabled = true;

    mostrarMensagemAuth(
        "A criar a conta..."
    );

    try {

        const { data, error } =
            await supabaseAuth.auth.signUp({
                email,
                password
            });

        if (error) {
            throw error;
        }

        if (data.session) {

            mostrarMensagemAuth(
                "Conta criada com sucesso!"
            );

            await mostrarAcesso(true);

        } else {

            mostrarMensagemAuth(
                "Conta criada. Consulta o teu email " +
                "para confirmares o registo."
            );
        }

    } catch (erro) {

        console.error(
            "Erro ao criar conta:",
            erro
        );

        mostrarMensagemAuth(
            "Erro ao criar conta: " + erro.message
        );

    } finally {

        botaoRegistar.disabled = false;
    }
});

// ==========================================
// INICIAR SESSÃO
// ==========================================

botaoIniciar.addEventListener("click", async () => {

    const email = campoEmail.value.trim();
    const password = campoPassword.value;

    if (!email || !password) {

        mostrarMensagemAuth(
            "Preenche o email e a palavra-passe."
        );

        return;
    }

    botaoIniciar.disabled = true;

    mostrarMensagemAuth(
        "A iniciar sessão..."
    );

    try {

        const { data, error } =
            await supabaseAuth.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            throw error;
        }

        if (!data.session) {
            throw new Error(
                "Não foi possível iniciar uma sessão."
            );
        }

        mostrarMensagemAuth(
            "Sessão iniciada com sucesso!"
        );

        await mostrarAcesso(true);

    } catch (erro) {

        console.error(
            "Erro ao iniciar sessão:",
            erro
        );

        mostrarMensagemAuth(
            "Erro ao iniciar sessão: " + erro.message
        );

    } finally {

        botaoIniciar.disabled = false;
    }
});

// ==========================================
// RECUPERAR PALAVRA-PASSE
// ==========================================

botaoRecuperar.addEventListener("click", async () => {

    const email = campoEmail.value.trim();

    if (!email) {

        mostrarMensagemAuth(
            "Introduz primeiro o teu email."
        );

        return;
    }

    botaoRecuperar.disabled = true;

    mostrarMensagemAuth(
        "A preparar recuperação da palavra-passe..."
    );

    try {

        const { error } =
            await supabaseAuth.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        window.location.origin +
                        window.location.pathname
                }
            );

        if (error) {
            throw error;
        }

        mostrarMensagemAuth(
            "Se a conta existir, receberás um email " +
            "para recuperar a palavra-passe."
        );

    } catch (erro) {

        console.error(
            "Erro na recuperação:",
            erro
        );

        mostrarMensagemAuth(
            "Erro: " + erro.message
        );

    } finally {

        botaoRecuperar.disabled = false;
    }
});

// ==========================================
// TERMINAR SESSÃO
// ==========================================

if (botaoTerminar) {

    botaoTerminar.addEventListener(
        "click",
        async () => {

            botaoTerminar.disabled = true;

            mostrarMensagemAuth(
                "A guardar dados e a terminar sessão..."
            );

            try {

                // Garantir que todas as gravações pendentes
                // são enviadas para o Supabase antes de sair.

                if (
                    typeof window.prepararTerminarSessao !==
                    "function"
                ) {
                    throw new Error(
                        "A função de sincronização antes de sair " +
                        "não está disponível no app.js."
                    );
                }

                await window.prepararTerminarSessao();

                // Terminar sessão no Supabase

                const { error } =
                    await supabaseAuth.auth.signOut();

                if (error) {
                    throw error;
                }

                // Remover dados temporários locais

                limparDadosLocais();

                // Voltar ao ecrã de autenticação

                mostrarEcranAutenticacao();

                campoPassword.value = "";

                mostrarMensagemAuth(
                    "Sessão terminada com sucesso."
                );

                console.log(
                    "Sessão terminada e dados locais limpos."
                );

            } catch (erro) {

                console.error(
                    "Erro ao terminar sessão:",
                    erro
                );

                mostrarMensagemAuth(
                    "Não foi possível terminar a sessão: " +
                    erro.message
                );

            } finally {

                botaoTerminar.disabled = false;
            }
        }
    );

} else {

    console.error(
        "O botão terminarSessao não foi encontrado no index.html."
    );
}

// ==========================================
// OBSERVAR ALTERAÇÕES DA SESSÃO
// ==========================================

supabaseAuth.auth.onAuthStateChange(
    (evento, session) => {

        // Quando a sessão termina, esconder a aplicação
        // e limpar os dados temporários do navegador.

        if (evento === "SIGNED_OUT" || !session) {

            limparDadosLocais();

            mostrarEcranAutenticacao();
        }
    }
);

// ==========================================
// VERIFICAR SESSÃO EXISTENTE
// ==========================================

async function verificarSessao() {

    try {

        const { data, error } =
            await supabaseAuth.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session) {

            await mostrarAcesso(true);

        } else {

            limparDadosLocais();

            mostrarEcranAutenticacao();

            mostrarMensagemAuth(
                "Inicia sessão para aceder ao OrçaFácil."
            );
        }

    } catch (erro) {

        console.error(
            "Erro ao verificar sessão:",
            erro
        );

        mostrarEcranAutenticacao();

        mostrarMensagemAuth(
            "Não foi possível verificar a sessão: " +
            erro.message
        );
    }
}

// ==========================================
// INICIAR VERIFICAÇÃO
// ==========================================

verificarSessao();
