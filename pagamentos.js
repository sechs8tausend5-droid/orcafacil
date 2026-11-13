
"use strict";

// ==========================================
// ORÇAFÁCIL - PAGAMENTOS STRIPE
// ==========================================

async function carregarEstadoSubscricao() {
    const supabase = window.orcafacilSupabase;

    const estadoElemento = document.getElementById("estadoSubscricao");
    const fimTrialElemento = document.getElementById("fimTrial");
    const botaoAderir = document.getElementById("aderirSubscricao");

    if (!supabase || !estadoElemento) return;

    try {
        const { data, error } = await supabase
            .from("orcafacil_subscricoes")
            .select("estado, trial_fim, periodo_pago_ate, cancelamento_agendado")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            estadoElemento.textContent = "Sem subscrição";
            fimTrialElemento.textContent =
                "Ainda não existe uma subscrição associada a esta conta.";
            botaoAderir.textContent = "Aderir ao OrçaFácil";
            return;
        }

        const dataFim = data.trial_fim
            ? new Date(data.trial_fim).toLocaleDateString("pt-PT")
            : "";

        switch (data.estado) {
            case "trialing":
                if (data.cancelamento_agendado) {
                    estadoElemento.textContent = "Cancelamento agendado";
                    fimTrialElemento.textContent =
                        "O teu período experimental termina em " + dataFim +
                        ". Não será efetuada a cobrança mensal.";
                } else {
                    estadoElemento.textContent = "Período experimental";
                    fimTrialElemento.textContent =
                        "O período gratuito termina em " + dataFim + ".";
                }

                botaoAderir.textContent = "Gerir subscrição";
                break;

            case "active":
                estadoElemento.textContent = "Subscrição ativa";
                fimTrialElemento.textContent = data.periodo_pago_ate
                    ? "Período pago até " +
                    new Date(data.periodo_pago_ate).toLocaleDateString("pt-PT") + "."
                    : "";
                botaoAderir.textContent = "Gerir subscrição";
                break;

            case "past_due":
                estadoElemento.textContent = "Pagamento pendente";
                fimTrialElemento.textContent =
                    "Verifica os dados do teu método de pagamento.";
                break;

            case "canceled":
                estadoElemento.textContent = "Subscrição cancelada";
                fimTrialElemento.textContent = "";
                botaoAderir.textContent = "Aderir novamente";
                break;

            case "expired":
                estadoElemento.textContent = "Período experimental terminado";
                fimTrialElemento.textContent = "";
                botaoAderir.textContent = "Aderir ao OrçaFácil";
                break;

            default:
                estadoElemento.textContent = data.estado;
                fimTrialElemento.textContent = "";
        }

    } catch (erro) {
        console.error("Erro ao carregar subscrição:", erro);
        estadoElemento.textContent = "Não foi possível consultar a subscrição.";
        fimTrialElemento.textContent = "";
    }
}

// ==========================================
// INICIAR PAGAMENTO STRIPE
// ==========================================


async function iniciarPagamentoStripe() {
    const supabase = window.orcafacilSupabase;

    if (!supabase) {
        alert("Não foi possível ligar ao servidor.");
        return;
    }

    try {
        // Verificar se já existe um cliente Stripe associado
        const { data: subscricao, error: erroSubscricao } =
            await supabase
                .from("orcafacil_subscricoes")
                .select("stripe_customer_id")
                .maybeSingle();

        if (erroSubscricao) throw erroSubscricao;

        let funcao;

        if (subscricao?.stripe_customer_id) {
            // Cliente existente: abrir o portal de gestão
            funcao = "create-portal-session";
        } else {
            // Sem cliente Stripe: iniciar o Checkout
            funcao = "create-checkout-session";
        }

        const { data, error } = await supabase.functions.invoke(
            funcao,
            { body: {} }
        );

        if (error) throw error;

        if (!data || !data.url) {
            throw new Error("O Stripe não devolveu um endereço válido.");
        }

        window.location.href = data.url;

    } catch (erro) {
        console.error("Erro ao abrir o Stripe:", erro);
        alert("Não foi possível abrir a gestão da subscrição. Tenta novamente.");
    }
}


window.carregarEstadoSubscricao = carregarEstadoSubscricao;
window.iniciarPagamentoStripe = iniciarPagamentoStripe;
