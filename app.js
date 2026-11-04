
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
// LER LOGÓTIPO
// ==========================================

function obterLogotipo() {
    return new Promise((resolve, reject) => {

        const input = campo("logotipo");
        const ficheiro = input && input.files
            ? input.files[0]
            : null;

        if (!ficheiro) {
            resolve(null);
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

        leitor.onload = () => resolve(leitor.result);

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
});

linhas.addEventListener("input", calcular);
linhas.addEventListener("change", calcular);

linhas.addEventListener("click", event => {

    const botao = event.target.closest(".remover");

    if (botao) {
        botao.closest(".linha-trabalho").remove();
        calcular();
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

        // Ler o logótipo selecionado
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

        // --------------------------------------
        // CABEÇALHO
        // --------------------------------------

        doc.setFillColor(...azul);
        doc.rect(0, 0, 210, 43, "F");

        // Espaço para logótipo
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

        // Título
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

        // --------------------------------------
        // PRESTADOR E CLIENTE
        // --------------------------------------

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

        // --------------------------------------
        // DATA E VALIDADE
        // --------------------------------------

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

        // --------------------------------------
        // TÍTULO DOS TRABALHOS
        // --------------------------------------

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...azul);

        doc.text("TRABALHOS E MATERIAIS", margem, y);

        y += 7;

        // --------------------------------------
        // CABEÇALHO DA TABELA
        // --------------------------------------

        function cabecalhoTabela() {

            doc.setFillColor(...azul);

            doc.rect(
                margem, y - 5, largura, 10, "F"
            );

            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);

            doc.text("DESCRIÇÃO", 21, y + 1);

            doc.text("QTD.", 116, y + 1, {
                align: "right"
            });

            doc.text("PREÇO UNIT.", 153, y + 1, {
                align: "right"
            });

            doc.text("TOTAL", 190, y + 1, {
                align: "right"
            });

            y += 11;
        }

        cabecalhoTabela();

        // --------------------------------------
        // LINHAS DOS TRABALHOS
        // --------------------------------------

        d.items.forEach((item, indice) => {

            const descricao = doc.splitTextToSize(
                item.descricao, 82
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
                116,
                y,
                { align: "right" }
            );

            doc.text(
                euros(item.preco),
                153,
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

        // --------------------------------------
        // TOTAIS
        // --------------------------------------

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

        // Total destacado
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

        // --------------------------------------
        // CONDIÇÕES E OBSERVAÇÕES
        // --------------------------------------

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

        // --------------------------------------
        // ASSINATURAS
        // --------------------------------------

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

        // --------------------------------------
        // RODAPÉ E PAGINAÇÃO
        // --------------------------------------

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

        // --------------------------------------
        // DESCARREGAR PDF
        // --------------------------------------

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
// VALIDAR FORMULÁRIO
// ==========================================

function formularioValido() {

    if (!form.reportValidity()) {
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

    await gerarPDF();
});

// ==========================================
// EVENTO: IMPRIMIR
// ==========================================

campo("imprimir").addEventListener("click", () => {

    mostrarMensagem("");

    if (!formularioValido()) {
        return;
    }

    window.print();
});

// ==========================================
// INICIALIZAR A APLICAÇÃO
// ==========================================

iniciarDatas();

adicionarLinha(
    "Trabalhos de pintura",
    1,
    100,
    23
);

calcular();

console.log("OrçaFácil pronto");
