"use strict";

// ==========================================
// ORÇAFÁCIL - APLICAÇÃO PRINCIPAL
// ==========================================

console.log("OrçaFácil iniciado");

const form = document.getElementById("formOrcamento");
const linhas = document.getElementById("linhas");
const mensagem = document.getElementById("mensagem");

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function campo(id) {
    return document.getElementById(id);
}

function euros(valor) {
    return Number(valor).toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR"
    });
}

function mostrarMensagem(texto) {
    mensagem.textContent = texto;
}

// ==========================================
// LER E GUARDAR LOGÓTIPO
// ==========================================

function obterLogotipo() {
    return new Promise((resolve, reject) => {

        const input = campo("logotipo");
        const ficheiro = input && input.files
            ? input.files[0]
            : null;

        // Se não foi selecionado um novo ficheiro,
        // recuperar o logótipo guardado no navegador.
        if (!ficheiro) {
            try {
                const dados = JSON.parse(
                    localStorage.getItem(CHAVE_PROFISSIONAL) || "{}"
                );

                resolve(dados.logotipo || null);

            } catch (erro) {
                reject(erro);
            }

            return;
        }

        if (!["image/png", "image/jpeg"].includes(ficheiro.type)) {
            reject(new Error("Seleciona uma imagem PNG ou JPG."));
            return;
        }

        if (ficheiro.size > 3 * 1024 * 1024) {
            reject(new Error("O logótipo não pode ultrapassar 3 MB."));
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            try {
                const dados = JSON.parse(
                    localStorage.getItem(CHAVE_PROFISSIONAL) || "{}"
                );

                dados.logotipo = leitor.result;

                localStorage.setItem(
                    CHAVE_PROFISSIONAL,
                    JSON.stringify(dados)
                );

                resolve(leitor.result);

            } catch (erro) {
                reject(new Error(
                    "Não foi possível guardar o logótipo. " +
                    "O armazenamento do navegador pode estar cheio."
                ));
            }
        };

        leitor.onerror = () => {
            reject(new Error("Não foi possível ler o logótipo."));
        };

        leitor.readAsDataURL(ficheiro);
    });
}

// ==========================================
// INICIALIZAR DATAS
// ==========================================

function iniciarDatas() {

    const hoje = new Date();

    function formatarData(data) {
        const local = new Date(
            data.getTime() -
            data.getTimezoneOffset() * 60000
        );

        return local.toISOString().slice(0, 10);
    }

    campo("data").value = formatarData(hoje);

    const validade = new Date(hoje);
    validade.setDate(validade.getDate() + 30);

    campo("validade").value = formatarData(validade);
}

// ==========================================
// OBTER TRABALHOS
// ==========================================

function obterLinhas() {

    return [...linhas.querySelectorAll(".linha-trabalho")].map(linha => {

        const descricao = linha.querySelector(".desc").value.trim();

        const quantidade = Number(
            linha.querySelector(".qtd").value
        );

        const preco = Number(
            linha.querySelector(".preco-unit").value
        );

        const taxa = Number(
            linha.querySelector(".taxa").value
        );

        const base = quantidade * preco;

        return {
            descricao,
            quantidade,
            preco,
            taxa,
            base,
            iva: base * taxa / 100
        };
    });
}

// ==========================================
// CALCULAR TOTAIS
// ==========================================

function calcular() {

    const items = obterLinhas();

    const subtotal = items.reduce(
        (soma, item) => soma + item.base,
        0
    );

    const totalIva = items.reduce(
        (soma, item) => soma + item.iva,
        0
    );

    campo("subtotal").textContent = euros(subtotal);
    campo("totalIva").textContent = euros(totalIva);
    campo("total").textContent = euros(subtotal + totalIva);
}

// ==========================================
// VALIDAR TRABALHOS
// ==========================================

function validarLinhas() {

    const items = obterLinhas();

    if (items.length === 0) {
        mostrarMensagem("Adiciona pelo menos um trabalho.");
        return false;
    }

    for (const item of items) {

        if (!item.descricao) {
            mostrarMensagem(
                "Preenche a descrição de todos os trabalhos."
            );
            return false;
        }

        if (
            !Number.isFinite(item.quantidade) ||
            item.quantidade <= 0
        ) {
            mostrarMensagem("Verifica as quantidades.");
            return false;
        }

        if (
            !Number.isFinite(item.preco) ||
            item.preco < 0
        ) {
            mostrarMensagem("Verifica os preços.");
            return false;
        }
    }

    return true;
}

// ==========================================
// ADICIONAR LINHA
// ==========================================

function adicionarLinha(
    descricao = "",
    quantidade = 1,
    preco = 0,
    taxa = 23
) {

    const linha = document.createElement("div");
    linha.className = "linha-trabalho";

    const descLabel = document.createElement("label");
    descLabel.className = "descricao";
    descLabel.append("Descrição");

    const desc = document.createElement("input");
    desc.className = "desc";
    desc.type = "text";
    desc.required = true;
    desc.placeholder = "Ex.: Instalação de tomadas";
    desc.value = descricao;

    descLabel.append(desc);

    const qtdLabel = document.createElement("label");
    qtdLabel.append("Quantidade");

    const qtd = document.createElement("input");
    qtd.className = "qtd";
    qtd.type = "number";
    qtd.min = "0.01";
    qtd.step = "0.01";
    qtd.required = true;
    qtd.value = quantidade;

    qtdLabel.append(qtd);

    const precoLabel = document.createElement("label");
    precoLabel.append("Preço unit. (€)");

    const precoInput = document.createElement("input");
    precoInput.className = "preco-unit";
    precoInput.type = "number";
    precoInput.min = "0";
    precoInput.step = "0.01";
    precoInput.required = true;
    precoInput.value = preco;

    precoLabel.append(precoInput);

    const ivaLabel = document.createElement("label");
    ivaLabel.append("IVA");

    const select = document.createElement("select");
    select.className = "taxa";

    for (const percentagem of [23, 13, 6, 0]) {

        const option = document.createElement("option");

        option.value = percentagem;
        option.textContent = percentagem + "%";

        if (percentagem === Number(taxa)) {
            option.selected = true;
        }

        select.append(option);
    }

    ivaLabel.append(select);

    const remover = document.createElement("button");

    remover.type = "button";
    remover.className = "remover";
    remover.textContent = "×";
    remover.setAttribute("aria-label", "Remover linha");

    linha.append(
        descLabel,
        qtdLabel,
        precoLabel,
        ivaLabel,
        remover
    );

    linhas.append(linha);

    calcular();
}

// ==========================================
// EVENTOS DAS LINHAS
// ==========================================

campo("adicionar").addEventListener("click", () => {
    adicionarLinha();
    guardarRascunho();
});

linhas.addEventListener("input", () => {
    calcular();
    guardarRascunho();
});

linhas.addEventListener("change", () => {
    calcular();
    guardarRascunho();
});

linhas.addEventListener("click", event => {

    const botao = event.target.closest(".remover");

    if (botao) {
        botao.closest(".linha-trabalho").remove();
        calcular();
        guardarRascunho();
    }
});

// ==========================================
// RECOLHER DADOS DO ORÇAMENTO
// ==========================================

function dadosOrcamento() {

    return {
        empresa: campo("empresa").value.trim(),
        nif: campo("nifEmpresa").value.trim(),
        contacto: campo("contacto").value.trim(),
        moradaEmpresa: campo("moradaEmpresa").value.trim(),
        cliente: campo("cliente").value.trim(),
        moradaObra: campo("moradaObra").value.trim(),
        numero: campo("numero").value.trim(),
        data: campo("data").value,
        validade: campo("validade").value,
        notas: campo("notas").value.trim(),
        items: obterLinhas()
    };
}

// ==========================================
// GUARDAR DADOS NO NAVEGADOR
// ==========================================

const CHAVE_PROFISSIONAL = "orcafacil_profissional";
const CHAVE_RASCUNHO = "orcafacil_rascunho";
const CHAVE_HISTORICO = "orcafacil_historico";
const CHAVE_CONTADOR = "orcafacil_contador";

let aRestaurarDados = false;
let orcamentoAtualId = null;

// ==========================================
// NUMERAÇÃO AUTOMÁTICA
// ==========================================

function gerarNumeroOrcamento() {

    const ano = new Date().getFullYear();
    let contadores = {};

    try {
        contadores = JSON.parse(
            localStorage.getItem(CHAVE_CONTADOR) || "{}"
        );
    } catch (erro) {
        contadores = {};
    }

    const historico = obterHistorico();

    let maiorNumero = Number(contadores[ano] || 0);

    historico.forEach(orcamento => {
        const correspondencia = String(orcamento.numero || "")
            .match(new RegExp("^ORC-" + ano + "-(\\d+)$"));

        if (correspondencia) {
            maiorNumero = Math.max(
                maiorNumero,
                Number(correspondencia[1])
            );
        }
    });

    maiorNumero++;

    contadores[ano] = maiorNumero;

    localStorage.setItem(
        CHAVE_CONTADOR,
        JSON.stringify(contadores)
    );

    return "ORC-" + ano + "-" +
        String(maiorNumero).padStart(4, "0");
}

// ==========================================
// DADOS DO PROFISSIONAL
// ==========================================

function guardarDadosProfissional() {

    if (aRestaurarDados) return;

    let dadosAnteriores = {};

    try {
        dadosAnteriores = JSON.parse(
            localStorage.getItem(CHAVE_PROFISSIONAL) || "{}"
        );
    } catch (erro) {
        console.error("Erro ao ler dados anteriores:", erro);
    }

    const dados = {
        empresa: campo("empresa").value,
        nifEmpresa: campo("nifEmpresa").value,
        contacto: campo("contacto").value,
        moradaEmpresa: campo("moradaEmpresa").value,
        logotipo: dadosAnteriores.logotipo || null
    };

    try {
        localStorage.setItem(
            CHAVE_PROFISSIONAL,
            JSON.stringify(dados)
        );
    } catch (erro) {
        console.error("Erro ao guardar dados profissionais:", erro);
        mostrarMensagem("Não foi possível guardar os dados da empresa.");
    }
}

function carregarDadosProfissional() {

    try {
        const guardados = localStorage.getItem(CHAVE_PROFISSIONAL);
        if (!guardados) return;

        const dados = JSON.parse(guardados);

        campo("empresa").value = dados.empresa || "";
        campo("nifEmpresa").value = dados.nifEmpresa || "";
        campo("contacto").value = dados.contacto || "";
        campo("moradaEmpresa").value = dados.moradaEmpresa || "";

    } catch (erro) {
        console.error("Erro ao carregar dados profissionais:", erro);
    }
}

// ==========================================
// HISTÓRICO DE ORÇAMENTOS
// ==========================================

function obterHistorico() {

    try {
        const guardado = localStorage.getItem(CHAVE_HISTORICO);
        const historico = guardado ? JSON.parse(guardado) : [];

        return Array.isArray(historico) ? historico : [];

    } catch (erro) {
        console.error("Erro ao ler histórico:", erro);
        return [];
    }
}

function guardarHistorico(historico) {

    try {
        localStorage.setItem(
            CHAVE_HISTORICO,
            JSON.stringify(historico)
        );

        return true;

    } catch (erro) {
        console.error("Erro ao guardar histórico:", erro);
        mostrarMensagem(
            "Não foi possível guardar o histórico. O armazenamento pode estar cheio."
        );

        return false;
    }
}

// Guarda ou atualiza o orçamento atual no histórico.
function guardarNoHistorico() {

    const dados = dadosOrcamento();

    if (!dados.numero) {
        mostrarMensagem("O orçamento não tem número.");
        return false;
    }

    const historico = obterHistorico();

    const id = orcamentoAtualId || dados.numero;

    const indice = historico.findIndex(
        item => item.id === id || item.numero === dados.numero
    );

    const registo = {
        ...dados,
        id,
        atualizadoEm: new Date().toISOString()
    };

    if (indice >= 0) {
        historico[indice] = registo;
    } else {
        historico.push(registo);
    }

    if (!guardarHistorico(historico)) {
        return false;
    }

    orcamentoAtualId = id;
    return true;
}

// ==========================================
// GUARDAR RASCUNHO AUTOMATICAMENTE
// ==========================================

function guardarRascunho() {

    if (aRestaurarDados) return;

    const rascunho = {
        ...dadosOrcamento(),
        id: orcamentoAtualId
    };

    try {
        localStorage.setItem(
            CHAVE_RASCUNHO,
            JSON.stringify(rascunho)
        );
    } catch (erro) {
        console.error("Erro ao guardar o rascunho:", erro);
        mostrarMensagem(
            "Não foi possível guardar o orçamento neste navegador."
        );
    }
}
// ==========================================
// RESTAURAR UM ORÇAMENTO NO FORMULÁRIO
// ==========================================

function preencherFormulario(orcamento) {

    aRestaurarDados = true;

    campo("empresa").value = orcamento.empresa || "";
    campo("nifEmpresa").value = orcamento.nif || "";
    campo("contacto").value = orcamento.contacto || "";
    campo("moradaEmpresa").value = orcamento.moradaEmpresa || "";

    campo("cliente").value = orcamento.cliente || "";
    campo("moradaObra").value = orcamento.moradaObra || "";
    campo("numero").value = orcamento.numero || "";
    campo("data").value = orcamento.data || "";
    campo("validade").value = orcamento.validade || "";
    campo("notas").value = orcamento.notas || "";

    linhas.innerHTML = "";

    if (Array.isArray(orcamento.items) && orcamento.items.length > 0) {

        orcamento.items.forEach(item => {
            adicionarLinha(
                item.descricao || "",
                item.quantidade ?? 1,
                item.preco ?? 0,
                Number(item.taxa ?? 23)
            );
        });

    } else {
        adicionarLinha();
    }

    orcamentoAtualId = orcamento.id || orcamento.numero;

    calcular();

    aRestaurarDados = false;

    guardarDadosProfissional();
    guardarRascunho();
}

// ==========================================
// CARREGAR RASCUNHO EXISTENTE
// ==========================================

function carregarRascunho() {

    try {
        const guardado = localStorage.getItem(CHAVE_RASCUNHO);

        if (!guardado) return false;

        const rascunho = JSON.parse(guardado);

        if (!rascunho.numero) {
            rascunho.numero = gerarNumeroOrcamento();
        }

        preencherFormulario(rascunho);

        return true;

    } catch (erro) {
        console.error("Erro ao recuperar o rascunho:", erro);
        return false;
    }
}

// ==========================================
// MOSTRAR HISTÓRICO
// ==========================================

function mostrarHistorico() {

    const secao = campo("historicoOrcamentos");
    const lista = campo("listaOrcamentos");

    const historico = obterHistorico();

    secao.hidden = false;
    lista.innerHTML = "";

    if (historico.length === 0) {
        lista.textContent = "Ainda não existem orçamentos guardados.";
        return;
    }

    historico.sort((a, b) =>
        String(b.atualizadoEm || "").localeCompare(
            String(a.atualizadoEm || "")
        )
    );

    historico.forEach(orcamento => {

        const elemento = document.createElement("div");
        elemento.className = "item-historico";

        const titulo = document.createElement("h3");
        titulo.textContent = orcamento.numero || "Sem número";

        const cliente = document.createElement("p");
        cliente.textContent = "Cliente: " + (orcamento.cliente || "-");

        const data = document.createElement("p");
        data.textContent = "Data: " + (orcamento.data || "-");

        const total = (orcamento.items || []).reduce(
            (soma, item) => {
                const base = Number(item.quantidade || 0) *
                    Number(item.preco || 0);

                return soma + base + base * Number(item.taxa || 0) / 100;
            },
            0
        );

        const valor = document.createElement("p");
        valor.textContent = "Total: " + euros(total);

        const botoes = document.createElement("div");
        botoes.className = "acoes";

        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.className = "secundario";
        abrir.textContent = "Abrir / Editar";
        abrir.dataset.acao = "abrir";
        abrir.dataset.id = orcamento.id;

        const duplicar = document.createElement("button");
        duplicar.type = "button";
        duplicar.className = "secundario";
        duplicar.textContent = "Duplicar";
        duplicar.dataset.acao = "duplicar";
        duplicar.dataset.id = orcamento.id;

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "remover";
        eliminar.textContent = "Eliminar";
        eliminar.dataset.acao = "eliminar";
        eliminar.dataset.id = orcamento.id;

        botoes.append(abrir, duplicar, eliminar);

        elemento.append(titulo, cliente, data, valor, botoes);
        lista.append(elemento);
    });
}

// ==========================================
// AÇÕES DO HISTÓRICO
// ==========================================

campo("listaOrcamentos").addEventListener("click", event => {

    const botao = event.target.closest("button[data-acao]");

    if (!botao) return;

    const id = botao.dataset.id;
    const acao = botao.dataset.acao;

    const historico = obterHistorico();

    const orcamento = historico.find(item => item.id === id);

    if (!orcamento) {
        mostrarMensagem("Não foi possível encontrar esse orçamento.");
        return;
    }

    if (acao === "abrir") {

        preencherFormulario(orcamento);

        campo("historicoOrcamentos").hidden = true;

        mostrarMensagem("Orçamento carregado para edição.");

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (acao === "duplicar") {

        const copia = {
            ...orcamento,
            numero: gerarNumeroOrcamento(),
            data: campo("data").value,
            id: null
        };

        preencherFormulario(copia);

        orcamentoAtualId = null;
        guardarRascunho();

        campo("numero").value = copia.numero;

        mostrarMensagem("Cópia criada com um novo número.");

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (acao === "eliminar") {

        if (!confirm("Tens a certeza de que queres eliminar este orçamento?")) {
            return;
        }

        const novoHistorico = historico.filter(
            item => item.id !== id
        );

        if (!guardarHistorico(novoHistorico)) {
            return;
        }

        if (orcamentoAtualId === id) {
            orcamentoAtualId = null;
        }

        mostrarHistorico();
        mostrarMensagem("Orçamento eliminado.");
    }
});

// ==========================================
// BOTÃO ABRIR HISTÓRICO
// ==========================================

campo("abrirHistorico").addEventListener("click", () => {
    mostrarHistorico();
    campo("historicoOrcamentos").scrollIntoView({
        behavior: "smooth"
    });
});

// ==========================================
// BOTÃO NOVO ORÇAMENTO
// ==========================================

campo("novoOrcamento").addEventListener("click", () => {

    if (!confirm("Queres guardar o orçamento atual e começar um novo?")) {
        return;
    }

    const temConteudo =
        campo("cliente").value.trim() ||
        obterLinhas().some(item => item.descricao.trim());

    if (temConteudo) {
        if (!guardarNoHistorico()) return;
    }

    const dadosEmpresa = {
        empresa: campo("empresa").value,
        nifEmpresa: campo("nifEmpresa").value,
        contacto: campo("contacto").value,
        moradaEmpresa: campo("moradaEmpresa").value
    };

    aRestaurarDados = true;

    form.reset();
    linhas.innerHTML = "";

    campo("empresa").value = dadosEmpresa.empresa;
    campo("nifEmpresa").value = dadosEmpresa.nifEmpresa;
    campo("contacto").value = dadosEmpresa.contacto;
    campo("moradaEmpresa").value = dadosEmpresa.moradaEmpresa;

    iniciarDatas();
    adicionarLinha();

    campo("numero").value = gerarNumeroOrcamento();

    orcamentoAtualId = null;

    aRestaurarDados = false;

    guardarDadosProfissional();
    calcular();
    guardarRascunho();

    campo("historicoOrcamentos").hidden = true;

    mostrarMensagem("Novo orçamento criado: " + campo("numero").value);

    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ==========================================
// EVENTOS DE GRAVAÇÃO AUTOMÁTICA
// ==========================================

["empresa", "nifEmpresa", "contacto", "moradaEmpresa"].forEach(id => {
    campo(id).addEventListener("input", guardarDadosProfissional);
    campo(id).addEventListener("change", guardarDadosProfissional);
});

// Guardar o logótipo quando é selecionado.
campo("logotipo").addEventListener("change", async () => {
    try {
        await obterLogotipo();
        mostrarMensagem("Logótipo guardado com sucesso.");
    } catch (erro) {
        mostrarMensagem(erro.message);
        campo("logotipo").value = "";
    }
});

["cliente", "moradaObra", "numero", "data", "validade", "notas"].forEach(id => {
    campo(id).addEventListener("input", guardarRascunho);
    campo(id).addEventListener("change", guardarRascunho);
});

// ==========================================
// ESCREVER TEXTO NO PDF
// ==========================================

function escreverTextoPDF(doc, texto, x, y, largura = 174) {

    const partes = doc.splitTextToSize(
        String(texto || ""),
        largura
    );

    const altura = partes.length * 5;

    if (y + altura > 275) {
        doc.addPage();
        y = 20;
    }

    doc.text(partes, x, y);

    return y + altura;
}

// ==========================================
// GERAR PDF PROFISSIONAL
// ==========================================

async function gerarPDF() {

    console.log("A iniciar geração do PDF");

    if (!window.jspdf || !window.jspdf.jsPDF) {

        mostrarMensagem(
            "Biblioteca PDF não carregada. Atualiza a página."
        );

        console.error("jsPDF não está disponível.");

        return;
    }

    try {

        const d = dadosOrcamento();

        // Recuperar o logótipo selecionado ou guardado.
        const logotipo = await obterLogotipo();

        const doc = new window.jspdf.jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        // Cores
        const azul = [36, 86, 179];
        const azulClaro = [235, 242, 252];
        const cinza = [90, 100, 115];
        const escuro = [35, 45, 60];

        const margem = 18;
        const largura = 174;

        let y = 20;

        // CABEÇALHO

        doc.setFillColor(...azul);
        doc.rect(0, 0, 210, 43, "F");

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);

        doc.roundedRect(
            18, 10, 25, 23, 2, 2, "S"
        );

        if (logotipo) {

            const propriedades = doc.getImageProperties(logotipo);

            const larguraMaxima = 22;
            const alturaMaxima = 20;

            const proporcao = Math.min(
                larguraMaxima / propriedades.width,
                alturaMaxima / propriedades.height
            );

            const larguraImagem =
                propriedades.width * proporcao;

            const alturaImagem =
                propriedades.height * proporcao;

            const xImagem =
                18 + (25 - larguraImagem) / 2;

            const yImagem =
                10 + (23 - alturaImagem) / 2;

            const formato = logotipo.startsWith("data:image/png")
                ? "PNG"
                : "JPEG";

            doc.addImage(
                logotipo,
                formato,
                xImagem,
                yImagem,
                larguraImagem,
                alturaImagem
            );

        } else {

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);

            doc.text("LOGÓTIPO", 30.5, 23, {
                align: "center"
            });
        }

        doc.setFontSize(21);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);

        doc.text("ORÇAMENTO", 52, 19);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        doc.text("PROPOSTA COMERCIAL", 52, 27);

        doc.setFontSize(10);

        doc.text("N.º " + d.numero, 192, 19, {
            align: "right"
        });

        y = 55;

        // PRESTADOR E CLIENTE

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...azul);

        doc.text("PRESTADOR DE SERVIÇOS", margem, y);
        doc.text("CLIENTE", 112, y);

        y += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...escuro);

        doc.text(d.empresa || "-", margem, y);
        doc.text(d.cliente || "-", 112, y);

        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...cinza);

        let yEmpresa = y;
        let yCliente = y;

        if (d.nif) {
            yEmpresa = escreverTextoPDF(
                doc, "NIF: " + d.nif, margem, yEmpresa, 80
            );
        }

        if (d.contacto) {
            yEmpresa = escreverTextoPDF(
                doc, "Contacto: " + d.contacto, margem, yEmpresa, 80
            );
        }

        if (d.moradaEmpresa) {
            yEmpresa = escreverTextoPDF(
                doc, "Morada: " + d.moradaEmpresa,
                margem, yEmpresa, 80
            );
        }

        if (d.moradaObra) {
            yCliente = escreverTextoPDF(
                doc, "Local da obra: " + d.moradaObra,
                112, yCliente, 80
            );
        }

        y = Math.max(yEmpresa, yCliente) + 8;

        // DATA E VALIDADE

        doc.setFillColor(...azulClaro);

        doc.roundedRect(
            margem, y - 5, largura, 17, 2, 2, "F"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...azul);

        doc.text("DATA", margem + 5, y + 1);

        doc.text(
            "VALIDADE DA PROPOSTA",
            100,
            y + 1
        );

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...escuro);

        doc.text(d.data || "-", margem + 5, y + 7);
        doc.text(d.validade || "-", 100, y + 7);

        y += 25;
                // TÍTULO DOS TRABALHOS

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...azul);

        doc.text("TRABALHOS E MATERIAIS", margem, y);

        y += 7;

        // CABEÇALHO DA TABELA

        function cabecalhoTabela() {

            doc.setFillColor(...azul);

            doc.rect(
                margem, y - 5, largura, 10, "F"
            );

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);

            doc.text("DESCRIÇÃO", 21, y + 1);

            doc.text("QTD.", 105, y + 1, {
                align: "right"
            });

            doc.text("PREÇO UNIT.", 143, y + 1, {
                align: "right"
            });

            doc.text("IVA", 166, y + 1, {
                align: "right"
            });

            doc.text("TOTAL", 190, y + 1, {
                align: "right"
            });

            y += 11;
        }

        cabecalhoTabela();

        // LINHAS DOS TRABALHOS

        d.items.forEach((item, indice) => {

            const descricao = doc.splitTextToSize(
                item.descricao, 70
            );

            const altura = Math.max(
                9,
                descricao.length * 4.5
            );

            if (y + altura > 260) {
                doc.addPage();
                y = 20;
                cabecalhoTabela();
            }

            if (indice % 2 === 0) {

                doc.setFillColor(248, 250, 253);

                doc.rect(
                    margem,
                    y - 5,
                    largura,
                    altura + 2,
                    "F"
                );
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...escuro);

            doc.text(descricao, 21, y);

            doc.text(
                String(item.quantidade),
                105,
                y,
                { align: "right" }
            );

            doc.text(
                euros(item.preco),
                143,
                y,
                { align: "right" }
            );

            doc.text(
                Number(item.taxa).toLocaleString("pt-PT") + "%",
                166,
                y,
                { align: "right" }
            );

            doc.text(
                euros(item.base),
                190,
                y,
                { align: "right" }
            );

            y += altura + 3;

            doc.setDrawColor(225, 231, 240);

            doc.line(
                margem, y - 2, 192, y - 2
            );
        });

        // TOTAIS

        const subtotal = d.items.reduce(
            (soma, item) => soma + item.base,
            0
        );

        const ivaTotal = d.items.reduce(
            (soma, item) => soma + item.iva,
            0
        );

        const total = subtotal + ivaTotal;

        if (y + 48 > 270) {
            doc.addPage();
            y = 25;
        }

        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...escuro);

        doc.text("Subtotal:", 135, y);

        doc.text(
            euros(subtotal),
            190,
            y,
            { align: "right" }
        );

        y += 7;

        doc.text("IVA total:", 135, y);

        doc.text(
            euros(ivaTotal),
            190,
            y,
            { align: "right" }
        );

        y += 7;

        // TOTAL DESTACADO

        doc.setFillColor(...azulClaro);

        doc.roundedRect(
            112, y - 5, 80, 18, 2, 2, "F"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...azul);

        doc.text("TOTAL", 117, y + 5);

        doc.setFontSize(12);

        doc.text(
            euros(total),
            187,
            y + 5,
            { align: "right" }
        );

        y += 25;

        // CONDIÇÕES E OBSERVAÇÕES

        if (d.notas) {

            if (y + 30 > 270) {
                doc.addPage();
                y = 25;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(...azul);

            doc.text(
                "CONDIÇÕES E OBSERVAÇÕES",
                margem,
                y
            );

            y += 7;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...escuro);

            y = escreverTextoPDF(
                doc,
                d.notas,
                margem,
                y,
                largura
            );

            y += 12;
        }

        // ASSINATURAS

        if (y + 30 > 270) {
            doc.addPage();
            y = 30;
        }

        doc.setDrawColor(160, 170, 185);
        doc.setLineWidth(0.3);

        doc.line(
            margem, y + 12, 85, y + 12
        );

        doc.line(
            125, y + 12, 192, y + 12
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...cinza);

        doc.text(
            "Assinatura do profissional",
            margem,
            y + 18
        );

        doc.text(
            "Assinatura do cliente",
            125,
            y + 18
        );

        // RODAPÉ E PAGINAÇÃO

        const paginas = doc.getNumberOfPages();

        for (let pagina = 1; pagina <= paginas; pagina++) {

            doc.setPage(pagina);

            doc.setDrawColor(220, 225, 232);

            doc.line(18, 282, 192, 282);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...cinza);

            doc.text(
                "OrçaFácil | Proposta comercial — não constitui fatura",
                18,
                288
            );

            doc.text(
                "Página " + pagina + " de " + paginas,
                192,
                288,
                { align: "right" }
            );
        }

        // DESCARREGAR PDF

        const nomeSeguro = d.numero.replace(
            /[^a-zA-Z0-9_-]/g,
            "_"
        );

        doc.save(
            "Orcamento_" + (nomeSeguro || "novo") + ".pdf"
        );

        mostrarMensagem(
            "PDF profissional gerado com sucesso!"
        );

    } catch (erro) {

        console.error("Erro ao gerar PDF:", erro);

        mostrarMensagem(
            erro.message ||
            "Não foi possível gerar o PDF. Consulta o Console."
        );
    }
}

// ==========================================
// VALIDAR NIF PORTUGUÊS
// ==========================================

function validarNIFPortugal(nif) {

    nif = String(nif || "").replace(/\s/g, "");

    if (!/^\d{9}$/.test(nif)) {
        return false;
    }

    const numeros = nif.split("").map(Number);

    let soma = 0;

    for (let i = 0; i < 8; i++) {
        soma += numeros[i] * (9 - i);
    }

    const resto = soma % 11;

    const digitoControlo = resto < 2 ? 0 : 11 - resto;

    return digitoControlo === numeros[8];
}


// ==========================================
// VALIDAR FORMULÁRIO
// ==========================================

function formularioValido() {

    if (!form.reportValidity()) {
        return false;
    }

    const nif = campo("nifEmpresa").value.trim();

    if (nif && !validarNIFPortugal(nif)) {
        mostrarMensagem(
            "O NIF da empresa não é válido. Verifica os 9 algarismos."
        );

        campo("nifEmpresa").focus();

        return false;
    }

    if (
        campo("data").value >
        campo("validade").value
    ) {
        mostrarMensagem(
            "A validade não pode ser anterior à data do orçamento."
        );

        return false;
    }

    return validarLinhas();
}

// ==========================================
// EVENTO: GERAR PDF
// ==========================================

form.addEventListener("submit", async event => {

    event.preventDefault();
    event.stopPropagation();

    mostrarMensagem("");

    if (!formularioValido()) {
        return;
    }

    if (!guardarNoHistorico()) {
        return;
    }

    guardarRascunho();

    await gerarPDF();

    mostrarHistorico();
});

// ==========================================
// EVENTO: IMPRIMIR
// ==========================================

campo("imprimir").addEventListener("click", () => {

    mostrarMensagem("");

    if (!formularioValido()) {
        return;
    }

    if (!guardarNoHistorico()) {
        return;
    }

    guardarRascunho();

    mostrarMensagem("Orçamento guardado no histórico.");

    window.print();

    mostrarHistorico();
});

// ==========================================
// INICIALIZAR A APLICAÇÃO
// ==========================================

aRestaurarDados = true;

iniciarDatas();
carregarDadosProfissional();

const existeRascunho = carregarRascunho();

if (!existeRascunho) {

    adicionarLinha(
        "Trabalhos de pintura",
        1,
        100,
        23
    );

    campo("numero").value = gerarNumeroOrcamento();

    orcamentoAtualId = null;
}

calcular();

aRestaurarDados = false;

// Guardar o estado inicial.
guardarDadosProfissional();
guardarRascunho();

console.log("OrçaFácil pronto");

// ==========================================
// CÓPIAS DE SEGURANÇA - ORÇAFÁCIL
// ==========================================

const CHAVES_BACKUP = [
    "orcafacil_profissional",
    "orcafacil_rascunho",
    "orcafacil_historico",
    "orcafacil_contador"
];

// EXPORTAR CÓPIA DE SEGURANÇA

const botaoExportar = document.getElementById("exportarBackup");

if (botaoExportar) {
    botaoExportar.addEventListener("click", function () {
        try {
            const dados = {};

            CHAVES_BACKUP.forEach(function (chave) {
                dados[chave] = localStorage.getItem(chave);
            });

            const backup = {
                versao: 1,
                dataCriacao: new Date().toISOString(),
                dados: dados
            };

            const ficheiro = new Blob(
                [JSON.stringify(backup, null, 2)],
                { type: "application/json" }
            );

            const url = URL.createObjectURL(ficheiro);
            const link = document.createElement("a");

            link.href = url;
            link.download = "orcafacil-backup-" +
                new Date().toISOString().slice(0, 10) + ".json";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            alert("Cópia de segurança criada com sucesso!");

        } catch (erro) {
            console.error(erro);
            alert("Não foi possível criar a cópia de segurança.");
        }
    });
}

// IMPORTAR CÓPIA DE SEGURANÇA

const botaoImportar = document.getElementById("importarBackup");
const campoFicheiroBackup = document.getElementById("ficheiroBackup");

if (botaoImportar && campoFicheiroBackup) {

    botaoImportar.addEventListener("click", function () {
        campoFicheiroBackup.click();
    });

    campoFicheiroBackup.addEventListener("change", async function () {

        const ficheiro = campoFicheiroBackup.files[0];

        if (!ficheiro) return;

        try {
            const texto = await ficheiro.text();
            const backup = JSON.parse(texto);

            if (
                backup.versao !== 1 ||
                !backup.dados ||
                typeof backup.dados !== "object"
            ) {
                throw new Error("Formato de cópia inválido.");
            }

            const valido = CHAVES_BACKUP.every(function (chave) {
                return Object.prototype.hasOwnProperty.call(
                    backup.dados,
                    chave
                );
            });

            if (!valido) {
                throw new Error("Faltam dados na cópia de segurança.");
            }

            const confirmar = confirm(
                "Atenção: esta operação vai substituir os dados atuais " +
                "do OrçaFácil pelos dados da cópia de segurança. " +
                "Queres continuar?"
            );

            if (!confirmar) {
                campoFicheiroBackup.value = "";
                return;
            }

            CHAVES_BACKUP.forEach(function (chave) {

                const valor = backup.dados[chave];

                if (valor === null) {
                    localStorage.removeItem(chave);

                } else if (typeof valor === "string") {
                    localStorage.setItem(chave, valor);

                } else {
                    throw new Error("Dados inválidos no ficheiro.");
                }
            });

            alert(
                "Cópia de segurança restaurada! " +
                "A página vai ser atualizada."
            );

            location.reload();

        } catch (erro) {
            console.error(erro);

            alert(
                "Não foi possível importar a cópia de segurança. " +
                "Verifica se selecionaste um ficheiro válido do OrçaFácil."
            );
        }

        campoFicheiroBackup.value = "";
    });
}