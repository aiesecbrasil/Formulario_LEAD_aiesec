/*
 * ----------------------------------------------------------------------------
 * Arquivo: assets/js/script.js
 * Objetivo: Lógica de UI e validação do formulário do LEAD AIESEC.
 * Descrição:
 *  - Renderização dinâmica de campos (e-mail/telefone) com tradução de tipos
 *  - Validações de campos (nome, e-mail, telefone, data)
 *  - Integração com serviço externo para metadados e envio de dados
 *  - Interações de UI: Modal padronizado, spinner de carregamento, calendário (Pikaday)
 *  - Suporte a parâmetros de URL (campanha e CL)
 * Convenções de documentação:
 *  - Docstrings em JSDoc (/** ... *\/*) para funções com @param, @returns, @throws quando aplicável
 *  - Comentários adicionais de contexto em blocos e linhas
 * Observações importantes:
*  - Lógica original preservada. Apenas comentários/docstrings foram adicionados.
*  - Este arquivo assume que os elementos de UI (modal, inputs, etc.) existem no HTML.
*  - Requer Bootstrap (modal), Pikaday (calendário) e um ambiente de navegador.
*  - Ambiente: executa no browser; depende de elementos: #meuForm, modal #exampleModalLong e campos referenciados.
* ----------------------------------------------------------------------------
*/

// Containers dos campos dinâmicos de contato (presentes no HTML)
// Side effect: acessa o DOM na carga do script.
const containerTelefone = document.getElementById('telefones-container');
const containerEmail = document.getElementById('emails-container');

// Lista de siglas dos escritórios (comitês locais) na ordem usada pelo backend
// Importante: a posição na lista é usada para mapear com a lista de AIESECs ativa do backend.
const escritorios = [
    "AB",  // ABC
    "GV",  // SÃO PAULO UNIDADE GETÚLIO VARGAS
    "MK",  // SÃO PAULO UNIDADE MACKENZIE
    "US",  // SÃO PAULO UNIDADE USP
    "AJ",  // ARACAJU
    "BH",  // BELO HORIZONTE
    "BS",  // BRASÍLIA
    "CT",  // CURITIBA
    "FL",  // FLORIANÓPOLIS
    "FO",  // FORTALEZA
    "JP",  // JOÃO PESSOA
    "LM",  // LIMEIRA
    "MZ",  // MACEIÓ
    "MA",  // MARINGÁ
    "PA",  // PORTO ALEGRE
    "RC",  // RECIFE
    "RJ",  // RIO DE JANEIRO
    "SS",  // SALVADOR
    "SM",  // SANTA MARIA
    "SO",  // SOROCABA
    "UB",  // UBERLÂNDIA
    "VT",  // VITÓRIA
    "MN",  // MANAUS
];

// Armazena o id do comitê local selecionado para envio
let idCL = [];
let idCanal = [];
let idTipoAnuncio = [];

// Repositório de nomes de campos com erro na validação final
const camposErro = [];

// Metadados de campos recebidos do backend (preenchidos após o fetch)
let campos;

// Índice do CL dentro de 'escritorios' (calculado por parâmetro de URL)
let indiceSiglaCL;


// Parâmetros de URL processados em objeto ({ cl, campanha })
let parametros;

// Referência ao select de "AIESEC mais próxima" quando existente
let aiesecProxima;

// Lista de AIESECs ativas trazidas do backend
let todasAiesecs;

// Inicializa os containers vazios
containerEmail.innerHTML = '';
containerTelefone.innerHTML = '';

/**
 * Exibe um modal padronizado.
 * - Centraliza em um único ponto a criação/atualização do conteúdo e botões do modal
 * - Permite tratar mensagens vindas do backend (ex: {"error": "Nome inválido"}, status 400)
 * - Mantém compatibilidade com os usos anteriores no código
 *
 * @param {Object} options Configurações do modal
 * @param {string} [options.title] Título do modal
 * @param {string|string[]} [options.message] Conteúdo do modal (string ou lista de mensagens). Arrays são unidos com \n
 * @param {('info'|'success'|'error')} [options.type='info'] Tipo semântico do modal (pode ser usado para estilizar)
 * @param {boolean} [options.showConfirm=true] Exibir botão Confirmar
 * @param {string} [options.confirmText='Confirmar'] Texto do botão Confirmar
 * @param {Function} [options.onConfirm] Callback executado ao confirmar
 * @param {boolean} [options.showCancel=true] Exibir botão Cancelar
 * @param {string} [options.cancelText='Cancelar'] Texto do botão Cancelar
 * @param {Function} [options.onCancel] Callback executado ao cancelar
 * @param {Object|string} [options.backendError] Objeto/JSON de erro do backend ou string de erro
 * @returns {void}
 */
/**
 * Exibe um modal padronizado de acordo com elementos Bootstrap existentes no DOM.
 * Efeitos colaterais: altera conteúdo/estado de #exampleModalLong e exibe o modal, substitui listeners dos botões.
 * Dependências: window.bootstrap.Modal, elementos com ids exampleModalLong, exampleModalLongTitle, botaoConfirmar, botaoCancelar, DadosAqui.
 */
function showModal(options) {
    const {
        title,
        message,
        type = 'info',
        showConfirm = true,
        confirmText = 'Confirmar',
        onConfirm,
        showCancel = true,
        cancelText = 'Cancelar',
        onCancel,
        backendError
    } = options || {};

    // Elementos do modal (estrutura já existente no HTML)
    const modalEl = document.getElementById('exampleModalLong');
    const myModal = new bootstrap.Modal(modalEl);
    const tituloModal = document.getElementById('exampleModalLongTitle');
    const botaoConfirmar = document.getElementById('botaoConfirmar');
    const botaoCancelar = document.getElementById('botaoCancelar');
    const corpo = document.getElementById('DadosAqui');

    // Converte lista de mensagens para texto
    const normalizedMessage = Array.isArray(message) ? message.join('\n') : (message || '');

    // Se veio erro do backend, prioriza sua renderização no corpo
    let backendMsg = '';
    if (backendError) {
        try {
            if (typeof backendError === 'string') {
                backendMsg = backendError;
            } else if (backendError.error) {
                backendMsg = backendError.error;
            } else if (backendError.message) {
                backendMsg = backendError.message;
            } else {
                backendMsg = JSON.stringify(backendError);
            }
        } catch (_) {
            backendMsg = '';
        }
    }

    // Título
    tituloModal.textContent = title || '';

    // Corpo do modal: mensagem principal ou possível mensagem do backend
    corpo.textContent = backendMsg || normalizedMessage;

    // Estado e rótulos dos botões
    botaoConfirmar.style.display = showConfirm ? 'inline-block' : 'none';
    botaoConfirmar.disabled = !showConfirm;
    botaoConfirmar.textContent = confirmText;

    botaoCancelar.style.display = showCancel ? 'inline-block' : 'none';
    botaoCancelar.disabled = !showCancel;
    botaoCancelar.textContent = cancelText;

    // Remove listeners anteriores para evitar múltiplos disparos
    botaoConfirmar.replaceWith(botaoConfirmar.cloneNode(true));
    botaoCancelar.replaceWith(botaoCancelar.cloneNode(true));
    const novoConfirmar = document.getElementById('botaoConfirmar');
    const novoCancelar = document.getElementById('botaoCancelar');

    if (showConfirm && typeof onConfirm === 'function') {
        novoConfirmar.addEventListener('click', onConfirm, { once: true });
    }
    if (showCancel && typeof onCancel === 'function') {
        novoCancelar.addEventListener('click', onCancel, { once: true });
    }

    // Exibe o modal
    myModal.show();
}

// ---------------------------------------------------------------------------
// Bootstrap de página: carrega metadados e prepara UI após DOM pronto
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
    // Aguarda leitura de parâmetros de URL
    parametros = await ParamentroURL();
    const url = 'https://baziaiesec.pythonanywhere.com/metadados-card-psel';

    try {
        // Busca metadados para construção dinâmica de campos
        const response = await fetch(url);
        const data = await response.json();

        // Verificação de segurança mais completa
        // Campos dinamicamente configuráveis vindos do backend (formio like)
        campos = data?.data?.fields;

        // Verfica se o dado campos é não nulo
        if (!campos) {
            // Modal de erro (centralizado via função reutilizável)
            showModal({
                title: "Erro de conexão",
                message: "Por favor, Recarregue a Pagina e tente novamente.\nCaso o erro persista contate o email: processo.seletivo@aiesec.org.br",
                type: "error",
                showConfirm: false,
                showCancel: true,
                cancelText: "Recarregar",
                onCancel: () => {
                    document.getElementById("meuForm").reset();
                    location.reload();
                }
            });

            console.error("A comunicação não foi corretamente estabelecida. Recarregue a página");
        }
        // aqui você já pode chamar funções que dependem dos parâmetros
        criarCampos(parametros.cl);
        preencherDropdown(parametros);
    } catch (error) {
        // Modal de erro em caso de falha de rede/parse
        showModal({
            title: "Erro de conexão",
            message: "Por favor, Recarregue a Pagina e tente novamente.\nCaso o erro persista contate o email: processo.seletivo@aiesec.org.br",
            type: "error",
            showConfirm: false,
            showCancel: true,
            cancelText: "Recarregar",
            onCancel: () => {
                document.getElementById("meuForm").reset();
                location.reload();
            }
        });
        console.error("A comunicação não foi corretamente estabelecida. Recarregue a página");
        console.error('Erro ao buscar dados:', error);
    }
});

// ---------------------Criar campo se não vinher parâmtro------------------
/**
 * Cria o campo de seleção de "AIESEC mais próxima" quando nenhum CL é informado via URL.
 * - Constrói o select desabilitado enquanto carrega
 * - Popula as opções com base nos metadados de "AIESEC mais próxima"
 * - Seleciona automaticamente a opção conforme o índice do CL (quando aplicável)
 *
 * Observação: Esta função depende de 'campos' já populado via fetch.
 *
 * @param {string} cl Sigla do comitê local (por exemplo: "RJ"). Se ausente, cria o select na página.
 * @returns {void}
 */
/**
 * Cria o bloco de seleção de AIESEC mais próxima se não houver CL pré-definido.
 * Side effects:
 *  - Escreve em #aiesecs o HTML do label/select/erro
 *  - Popula opções a partir de campos (metadados) e habilita o select
 *  - Atualiza variáveis globais todasAiesecs e indiceSiglaCL
 */
function criarCampos(cl) {
    const aiesec = document.getElementById("aiesecs");

    if (!cl) {
        aiesec.innerHTML = `
        <label for="aiesec">Qual é a AIESEC mais próxima de você?
                    <p class="obrigatorio">*</p></label>
                <select id="aiesec" name="aiesec" required>
                    <option value>Carregando...</option>
                </select>
                <div class="error-msg" id="erro-aiesec"></div>
        `;
        //__________________________________BOTÃO AIESEC MAIS PRÓXIMA_______________________________________

        // Cria o menu suspenso
        const dropdown_AiesecProx = document.getElementById('aiesec');
        dropdown_AiesecProx.innerHTML = '';
        dropdown_AiesecProx.setAttribute("disabled", "");

        // Cria um botão com a frase "Carregando" enquanto o Menu Suspenso está desativado
        const defaultOption_AiesecProx = document.createElement('option');
        defaultOption_AiesecProx.value = '';
        defaultOption_AiesecProx.textContent = 'Carregando';
        dropdown_AiesecProx.appendChild(defaultOption_AiesecProx);

        defaultOption_AiesecProx.setAttribute('disabled', '');
        defaultOption_AiesecProx.setAttribute('selected', '');

        //________________________________________________________________________________________________

        //____________________________Lógica Aiesec Mais Próxima__________________________________________

        const aiesecProx = campos.find(field => field.label === "AIESEC mais próxima");
        const aiesecs = aiesecProx.config.settings.options;

        todasAiesecs = aiesecs.reduce(
            function (prev, curr) {

                if (curr.status == "active") {
                    return [...prev, { id: curr.id, text: curr.text }];
                }

                return [...prev];

            },
            []
        );

        indiceSiglaCL = escritorios.indexOf(cl);

        todasAiesecs.forEach((aiesec, index) => {
            const newOption = document.createElement('option');
            newOption.value = aiesec.id;
            newOption.textContent = aiesec.text;
            // Se o índice da sigla for igual ao índice do produto
            if (index === indiceSiglaCL) {
                newOption.selected = true;
            }
            dropdown_AiesecProx.appendChild(newOption);
        });

        // Quando todas as opções estiverem prontas o botão se tranforma em "Selecione" e 
        // ativa o Menu Suspenso novamente
        defaultOption_AiesecProx.textContent = "Selecione";
        dropdown_AiesecProx.removeAttribute("disabled");

        //________________________________________________________________________________________________
    }
}

// -------------------- Máscara e validação de telefone --------------------
/**
 * Aplica máscara de telefone ao input no padrão brasileiro: (DD) 9 XXXX-XXXX.
 * - Impede entrada de caracteres não numéricos
 * - Formata dinamicamente conforme o usuário digita
 *
 * @param {HTMLInputElement} input Campo de input (type="tel") ao qual a máscara será aplicada
 * @returns {void}
 */
/**
 * Adiciona listener de input para formatar telefone brasileiro no campo fornecido.
 * Não altera valor inicial; apenas formata conforme digitação.
 */
function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function (e) {
        let valor = e.target.value.replace(/\D/g, ''); // remove tudo que não for número
        if (valor.length > 11) valor = valor.substring(0, 11); // limita a 11 dígitos (DDD + 9 + 8 números)

        // Coloca o DDD entre parênteses
        if (valor.length > 2) {
            valor = '(' + valor.substring(0, 2) + ') ' + valor.substring(2);
        }

        // Adiciona o espaço após o 9
        if (valor.length > 6) {
            valor = valor.substring(0, 6) + ' ' + valor.substring(6);
        }

        // Adiciona o traço antes dos últimos 4 números
        if (valor.length > 11) {
            valor = valor.substring(0, 11) + '-' + valor.substring(11);
        }

        e.target.value = valor;
    });
}

/**
 * Remove a máscara do telefone, retornando apenas dígitos.
 *
 * @param {string} valorFormatado Telefone possivelmente formatado como (DD) 9 XXXX-XXXX
 * @returns {string} Apenas números (ex.: "11987654321")
 */
/**
 * Remove todos caracteres não numéricos de um telefone formatado.
 */
function limparTelefoneFormatado(valorFormatado) {
    return valorFormatado.replace(/\D/g, ''); // remove tudo que não for número
}

// Exemplo de uso no envio do formulário (listener preliminar)
document.getElementById('meuForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // Antes de enviar, pegar todos os campos de telefone e limpar a formatação
    const telefones = document.querySelectorAll('input[name="telefone[]"]');
    telefones.forEach(input => {
        input.value = input.value;
    });

    // Se fosse enviar de verdade:
    // this.submit();
});

/**
 * Aplica validação de telefone ao perder foco (blur) no padrão (DD) 9 XXXX-XXXX.
 * - Exibe mensagem de erro no elemento #erro-telefone
 *
 * @param {HTMLInputElement} input Campo de telefone a ser validado
 * @returns {void}
 */
/**
 * Anexa validação por regex ao blur do campo de telefone.
 * Exige formato (DD) 9 XXXX-XXXX e escreve mensagens em #erro-telefone.
 */
function aplicarValidacaoTelefone(input) {
    input.addEventListener('blur', function (e) {
        const valor = e.target.value.trim();
        const erro = document.getElementById('erro-telefone');
        const regex = /^\(\d{2}\)\s9\s\d{4}-\d{4}$/;

        if (!regex.test(valor)) {
            erro.textContent = "Telefone inválido. Use o formato (DD) 9 XXXX-XXXX";
            camposErro.push("Telefone Inválido");
        } else {
            erro.textContent = "";
        }
    });
}

// -------------------- Validação de e-mail --------------------
/**
 * Valida formato de e-mail ao perder foco, exibindo mensagem em #erro-email.
 * - Formato: local@dominio.tld (com tld >= 2)
 * - Não valida domínio/provedores específicos (ver trecho comentado para provedores comuns)
 *
 * @param {HTMLInputElement} input Campo de e-mail (type="email")
 * @returns {void}
 */
/**
 * Adiciona validação básica de e-mail (formato geral) no evento blur do campo informado.
 * Mensagens são exibidas em #erro-email.
 */
function validarEmailComProvedor(input) {
    input.addEventListener('blur', function (e) {
        const valor = e.target.value.trim();
        const erro = document.getElementById('erro-email');

        // Regex para verificar formato de e-mail
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;
        if (!regex.test(valor)) {
            erro.textContent = "E-mail inválido.";
            return;
        }

        /* // Lista de provedores conhecidos
        const provedores = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
        const dominio = valor.split('@')[1].toLowerCase();

        if (!provedores.includes(dominio)) {
            erro.textContent = "Por favor, use um e-mail de provedor comum (ex: gmail.com, hotmail.com, icloud.com, outlook.com)";
            camposErro.push("Use um e-mail de provedor comum \n (ex: gmail.com, hotmail.com, icloud.com, hotmail.com)");
        } else {
            erro.textContent = ""; // Tudo certo
        } */
    });
}

// -------------------- Validação de nome/sobrenome --------------------
/**
 * Anexa validação por regex ao input especificado, exibindo a mensagem no elemento de erro indicado.
 * - Aceita apenas letras (incluindo acentuadas) e espaços
 *
 * @param {string} id ID do input de texto a validar (ex.: 'nome')
 * @param {string} erroId ID do elemento onde mensagens de erro serão exibidas
 * @returns {void}
 */
/**
 * Aplica validação alfabética (com acentos) ao campo identificado por id.
 * Mensagens são escritas no elemento de erro indicado por erroId.
 */
function validarNome(id, erroId) {
    const input = document.getElementById(id);
    const erro = document.getElementById(erroId);
    input.addEventListener('blur', function () {
        const regex = /^[A-Za-zÀ-ÿ\s]+$/;
        if (!regex.test(input.value.trim())) {
            erro.textContent = "Use apenas letras e espaços.";
        } else {
            erro.textContent = "";
        }
    });
}

// Validação inicial do campo nome
validarNome('nome', 'erro-nome');

// -------------------- Aplicar validações iniciais --------------------
// Varrendo inputs iniciais renderizados no HTML para aplicar validadores
// (Em campos adicionados dinamicamente, as funções são chamadas nos adders)
document.querySelectorAll('input[name="email[]"]').forEach(input => {
    validarEmailComProvedor(input);
});
document.querySelectorAll('input[name="telefone[]"]').forEach(input => {
    aplicarMascaraTelefone(input);
    aplicarValidacaoTelefone(input);
});

// -------------------- Adicionar/Remover campos --------------------
/**
 * Cria dinamicamente um grupo de campos de e-mail (tipo + e-mail) e o adiciona ao container.
 * - Traduz os tipos via dicionário local
 * - Anexa validação de e-mail no input criado
 * - Gerencia o estado dos botões de remoção
 * - Emite postMessage para o parent (ajuste de iframe, se existir)
 *
 * Dependências: 'campos' populado com metadados do backend.
 *
 * @returns {Promise<void>} Promessa resolvida após inserir e preparar o campo
 */
/**
 * Adiciona dinamicamente um grupo de campos de e-mail ao container.
 * Side effects:
 *  - Insere elementos no DOM
 *  - Habilita/desabilita botões de remoção
 *  - Emite postMessage para parent (ajuste de iframe)
 */
async function addEmail() {

    const div = document.createElement('div');

    const tipoEmail = campos.find(field => field.label === "E-mail pessoal");
    const opcoesDeTipoEmail = tipoEmail.config.settings.possible_types;

    div.className = 'campo-multiplo';

    // Traduz cada tipo
    const traducoes = await Promise.all(opcoesDeTipoEmail.map(tipo => traduzirPalavras([tipo])));

    let optionsHTML = '';
    traducoes.forEach(trad => {
        const t = trad[0]; // traduzirPalavras retorna array de objetos
        if (t.original === "other") {
            optionsHTML += `<option value="${t.original.toLowerCase()}" selected>${t.traduzido}</option>`;
        } else {
            optionsHTML += `<option value="${t.original.toLowerCase()}">${t.traduzido}</option>`;
        }
    });

    // Monta o HTML do campo
    div.innerHTML = `
                <select name="emailTipo[]">
                    ${optionsHTML}
                </select>
                <input type="email" name="email[]" placeholder="Email" />
                <button type="button" id="remove-email" class="remove-btn" onclick="removeCampo(this, 'email')">✖</button>
            `;

    containerEmail.appendChild(div);
    validarEmailComProvedor(div.querySelector('input'));
    // Atualiza botões de remoção
    const botoes = containerEmail.querySelectorAll('.remove-btn');
    botoes.forEach(btn => (btn.disabled = botoes.length === 1));
    window.parent.postMessage('campoAdicionado', 'https://aiesec.org.br/');
}

/**
 * Cria dinamicamente um grupo de telefone (tipo + número), aplicando máscara e validação.
 * - Traduz os tipos via dicionário local
 * - Aplica máscara/validação ao input criado
 * - Gerencia o estado dos botões de remoção
 * - Emite postMessage ao parent
 *
 * Dependências: 'campos' populado com metadados do backend.
 *
 * @returns {Promise<void>} Promessa resolvida após inserir e preparar o campo
 */
/**
 * Adiciona dinamicamente um grupo de campos de telefone ao container.
 * Side effects: idem addEmail(), além de aplicar máscara/validação.
 */
async function addTelefone() {

    const div = document.createElement('div');

    // Pega o campo "Telefone" dentro do array 'campos'
    const tipoTelefone = campos.find(field => field.label === "Celular (WhatsApp)");
    const opcoesDeTipoTelefone = tipoTelefone.config.settings.possible_types;

    div.className = 'campo-multiplo';

    // Traduz cada tipo
    const traducoes = await Promise.all(opcoesDeTipoTelefone.map(tipo => traduzirPalavras([tipo])));

    let optionsHTML = '';
    traducoes.forEach(trad => {
        const t = trad[0]; // traduzirPalavras retorna array de objetos
        if (t.original === "other") {
            optionsHTML += `<option value="${t.original.toLowerCase()}" selected>${t.traduzido}</option>`;
        } else {
            optionsHTML += `<option value="${t.original.toLowerCase()}">${t.traduzido}</option>`;
        }
    });

    // Monta o HTML do campo de telefone
    div.innerHTML = `
                <select name="telefoneTipo[]">
                    ${optionsHTML}
                </select>
                <input type="tel" name="telefone[]" placeholder="Telefone" />
                <button type="button" id="remove-telefone" class="remove-btn" onclick="removeCampo(this, 'telefone')">✖</button>
            `;

    containerTelefone.appendChild(div);

    // Aplica as funções utilitárias
    aplicarMascaraTelefone(div.querySelector('input'));
    aplicarValidacaoTelefone(div.querySelector('input'));

    // Atualiza botões de remoção
    const botoes = containerTelefone.querySelectorAll('.remove-btn');
    botoes.forEach(btn => (btn.disabled = botoes.length === 1));
    window.parent.postMessage('campoAdicionado', 'https://aiesec.org.br/');
}

/**
 * Remove um grupo de campo (e-mail/telefone) do container respectivo.
 * - Mantém sempre pelo menos um campo no container
 * - Desabilita o botão de remoção quando resta apenas um
 * - Emite postMessage ao parent para ajuste (se necessário)
 *
 * @param {HTMLButtonElement} botao Botão "✖" clicado
 * @param {('email'|'telefone')} tipo Tipo de campo a remover
 * @returns {void}
 */
/**
 * Remove um grupo de campo do tipo especificado mantendo pelo menos um.
 * Reatribui estado de desabilitado no último botão quando aplicável.
 */
function removeCampo(botao, tipo) {
    const container = tipo === 'email'
        ? document.getElementById('emails-container')
        : document.getElementById('telefones-container');

    // Remove o campo
    if (container.children.length > 1) {
        container.removeChild(botao.parentNode);
        window.parent.postMessage('campoRemovido', 'https://aiesec.org.br/');
    }

    // Se sobrou apenas 1 campo, desabilita o botão de remoção dele
    if (container.children.length === 1) {
        const ultimoBotao = container.querySelector('.remove-btn');
        if (ultimoBotao) {
            ultimoBotao.disabled = true;
        }
    }
}

// -------------------- Pikaday - Data de nascimento --------------------
// Inputs da data
const inputVisivel = document.getElementById('nascimento'); // mostra DD/MM/YYYY
const inputISO = document.getElementById('nascimento-iso'); // armazena YYYY-MM-DD 00:00:00

/**
 * Define a data escolhida nos inputs de data (visível e oculto) e sincroniza o calendário.
 * - Formata o input visível como DD/MM/YYYY
 * - Formata o input oculto como YYYY-MM-DD 00:00:00
 * - Atualiza o Pikaday sem disparar loops
 *
 * @param {Date} date Instância de Date válida
 * @returns {void}
 */
/**
 * Sincroniza a data selecionada entre input visível, input ISO oculto e o Pikaday.
 */
function setDate(date) {
    if (date instanceof Date && !isNaN(date)) {
        // Formato brasileiro no input visível
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        inputVisivel.value = `${day}/${month}/${year}`;

        // Formato americano no campo oculto
        inputISO.value = `${year}-${month}-${day} 00:00:00`;

        // Atualiza a marcação do calendário
        picker.setDate(date, true); // true = evita loop de eventos
    }
}

// Inicializa Pikaday
/**
 * Instância do Pikaday para o campo de nascimento.
 * - Localização PT-BR
 * - Intervalo de anos [1900, ano atual]
 * - Conversão toString/parse compatível com DD/MM/YYYY
 */
// Instancia e configura o calendário de data de nascimento (Pikaday)
const picker = new Pikaday({
    field: inputVisivel,
    format: 'DD/MM/YYYY',
    i18n: {
        previousMonth: 'Mês Anterior',
        nextMonth: 'Próximo Mês',
        months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        weekdays: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
        weekdaysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    },
    yearRange: [1900, new Date().getFullYear()],
    toString(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },
    parse(dateString) {
        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
    },
    onSelect: setDate
});

// Atualização manual pelo input
// - Mantém a máscara de data enquanto o usuário digita
// - Quando completo, sincroniza com o calendário e o campo ISO
// Máscara simples de data no input visível e sincronização com o calendário
inputVisivel.addEventListener('input', () => {
    let valor = inputVisivel.value.replace(/\D/g, ''); // remove tudo que não for número

    if (valor.length > 2 && valor.length <= 4) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    } else if (valor.length > 4) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4, 8);
    }

    inputVisivel.value = valor;

    // Atualiza a marcação no calendário conforme digita
    if (valor.length === 10) { // formato completo DD/MM/YYYY
        const [day, month, year] = valor.split('/').map(Number);
        const date = new Date(year, month - 1, day);

        if (!isNaN(date)) {
            setDate(date); // atualiza os campos e o calendário
        }
    }
});


// -------------------- Validação geral no envio --------------------
/**
 * Handler principal de envio do formulário com validações encadeadas.
 * - Valida nome, e-mails, telefones, data, AIESEC (quando presente) e aceite de política
 * - Em caso de sucesso, mostra um modal para confirmação e, se confirmado, envia os dados ao backend
 * - Em caso de erro, exibe modal com lista de campos incorretos
 */
document.getElementById('meuForm').addEventListener('submit', function (e) {
    e.preventDefault();
    let valido = true;
    const camposErro = [];

    // Nome e sobrenome
    ['nome'].forEach(id => {
        const input = document.getElementById(id);
        const regex = /^[A-Za-zÀ-ÿ\s]+$/;
        if (!regex.test(input.value.trim())) {
            document.getElementById('erro-' + id).textContent = "Campo inválido.";
            valido = false;
            camposErro.push(`${id} Inválido`);
        } else {
            document.getElementById('erro-' + id).textContent = "";
        }
    });

    // Email
    document.querySelectorAll('input[name="email[]"]').forEach(input => {
        const valor = input.value.trim();
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}$/;

        if (!regex.test(valor)) {
            document.getElementById('erro-email').textContent = "E-mail inválido.";
            valido = false;
            camposErro.push("E-mail Inválido");
        } /*else {
            // Checa provedor
            const provedores = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
            const dominio = valor.split('@')[1].toLowerCase();
            if (!provedores.includes(dominio)) {
                document.getElementById('erro-email').textContent = "Use um e-mail de provedor comum (ex: gmail.com, hotmail.com, icloud.com, outlook.com)";
                valido = false;
                camposErro.push("Use um e-mail de provedor comum \n (ex: gmail.com, hotmail.com, icloud.com, hotmail.com)");
            } else {
                document.getElementById('erro-email').textContent = "";
            }
        }*/
    });


    // Telefone
    document.querySelectorAll('input[name="telefone[]"]').forEach(input => {
        const valor = input.value.trim();
        const erro = document.getElementById('erro-telefone');
        const regex = /^\(\d{2}\)\s9\s\d{4}-\d{4}$/;

        if (!regex.test(valor)) {
            erro.textContent = "Telefone inválido. Use o formato (DD) 9 XXXX-XXXX";
            valido = false;
            camposErro.push("Telefone Inválido");
        } else {
            erro.textContent = "";
        }
    });

    // Data
    if (!inputISO.value) {
        document.getElementById('erro-nascimento').textContent = "Data inválida.";
        valido = false;
        camposErro.push("Data Inválida");
    } else {
        document.getElementById('erro-nascimento').textContent = "";
    }

    ['aiesec'].forEach(id => {
        const campo = document.getElementById(id);

        // Se o campo não existe, consideramos "válido"
        if (!campo) return;

        if (campo.value === "") {
            document.getElementById('erro-' + id).textContent = "Selecione uma opção.";
            valido = false;
            camposErro.push(`Selecione uma opção de ${id}.`);
        } else {
            document.getElementById('erro-' + id).textContent = "";
        }
        if (campo && campo.value !== "" && id === "aiesec") {
            aiesecProxima = document.getElementById('aiesec');
            idCL.push(aiesecProxima.options[aiesecProxima.selectedIndex].value);
        }
    });

    // Checkbox
    if (!document.getElementById('politica').checked) {
        document.getElementById('erro-politica').textContent = "Você deve aceitar.";
        valido = false;
        camposErro.push("você de aceitas o termo");
    } else {
        document.getElementById('erro-politica').textContent = "";
    }

    // -------------------- Mostrar dados no alerta --------------------
    if (valido) {
        const nome = document.getElementById('nome').value;

        const emails = Array.from(document.querySelectorAll('input[name="email[]"]')).map((el, i) => {
            const select = document.querySelectorAll('select[name="emailTipo[]"]')[i];
            const textoTipoOriginal = select.value;
            const textoTipoTraduzido = select.selectedOptions[0].text;
            return {
                email: el.value,
                tipo: textoTipoOriginal,
                tipoTraduzido: textoTipoTraduzido
            };
        });

        const telefones = Array.from(document.querySelectorAll('input[name="telefone[]"]')).map((el, i) => {
            const select = document.querySelectorAll('select[name="telefoneTipo[]"]')[i];
            const textoTipoOriginal = select.value;
            const textoTipoTraduzido = select.selectedOptions[0].text;

            return {
                numero: el.value,
                tipo: textoTipoOriginal,
                tipoTraduzido: textoTipoTraduzido
            };
        });

        const telefonesEnvio = telefones.map(t => ({
            numero: limparTelefoneFormatado(t.numero),
            tipo: t.tipo
        }));

        const emailsEnvio = emails.map(e => ({
            email: e.email,
            tipo: e.tipo
        }));
        enviarDados(nome, emailsEnvio, telefonesEnvio);

    } else {
        // Modal de erro (via função reutilizável)
        showModal({
            title: "Dados incorretos.",
            message: `Por favor, corrija os erros e tente novamente.\n\n${camposErro.map(campo => `- ${campo}`).join('\n')}`,
            type: "error",
            showConfirm: false,
            showCancel: true,
            cancelText: "Corrigir"
        });
    }

});

/**
 * Envia dados do formulário ao backend e apresenta feedback com modais.
 *
 * @param {string} nome
 * @param {{email: string, tipo: string}[]} emailsEnvio
 * @param {{numero: string, tipo: string}[]} telefonesEnvio
 * @throws Exibe modal de erro em quaisquer falhas de rede ou validação (HTTP 4xx/5xx)
 */
async function enviarDados(nome, emailsEnvio, telefonesEnvio) {
    mostrarSpinner();
    try {
        const response = await fetch("https://baziAiesec.pythonanywhere.com/adicionar-card-psel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                emails: emailsEnvio,
                telefones: telefonesEnvio,
                dataNascimento: inputISO.value,
                idComite: idCL[0],
                idAutorizacao: "1",
                idCanal:idCanal[0],
                idTipoAnuncio:idTipoAnuncio[0],
                tag: slugify(parametros.campanha)
            }),
        });

        if (!response.ok) {
            let backend = null;
            try { backend = await response.json(); } catch (_) { backend = null; }
            throw { status: response.status, backend };
        }

        esconderSpinner();

        showModal({
            title: "Dados enviados com sucesso!",
            message:
                "Em breve você receberá uma confirmação por email.\nCaso não receba, verifique sua caixa de spam ou\nentre em contato com o email: processo.seletivo@aiesec.org.br",
            type: "success",
            showCancel: false,
            confirmText: "Ok",
            onConfirm: () => {
                document.getElementById("meuForm").reset();
                location.reload();
            }
        });

    } catch (err) {
        esconderSpinner();

        showModal({
            title: err?.status === 400 ? "Erro de Validação" : "Falha ao Enviar",
            message:
                err?.status === 400
                    ? ""
                    : "Por favor, tente novamente.\nCaso o erro persista, contate o email: processo.seletivo@aiesec.org.br",
            type: "error",
            showConfirm: false,
            showCancel: true,
            cancelText: err?.status === 400 ? "Corrigir" : "Recarregar",
            backendError: err?.backend,
            onCancel:
                err?.status === 400
                    ? undefined
                    : () => {
                          document.getElementById("meuForm").reset();
                          location.reload();
                      }
        });
    }
}


// ============================================================================
// -------------------- FUNÇÕES DE CONTROLE DO SPINNER ------------------------
// ============================================================================

/**
 * Exibe um spinner de carregamento centralizado na tela.
 * 
 * - Cria dinamicamente o elemento HTML do spinner (não precisa existir no HTML).
 * - Bloqueia a interação com o fundo (usando overlay sem interferir no Bootstrap).
 * - Pode ser reutilizado em qualquer parte do código.
 *
 * @returns {void}
 */
/**
 * Cria um overlay com spinner para bloquear a interface durante operações assíncronas.
 */
function mostrarSpinner() {
    // Verifica se já existe um spinner ativo para evitar duplicação
    if (document.getElementById('spinner-overlay')) return;

    // Cria o overlay escuro
    const overlay = document.createElement('div');
    overlay.id = 'spinner-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = '#ffffff';
    overlay.style.opacity = '0.5';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '2000'; // acima do modal

    // Cria o spinner em si
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border';
    spinner.role = 'status';

    // Cria o texto de carregamento
    const texto = document.createElement('p');
    texto.textContent = 'Enviando dados, aguarde um instante...';
    texto.style.color = '#000';
    texto.style.marginTop = '15px';
    texto.style.fontSize = '1.1rem';
    texto.style.fontWeight = '500';

    // Adiciona ao overlay
    overlay.appendChild(spinner);
    overlay.appendChild(texto);

    // Insere o overlay no body
    document.body.appendChild(overlay);
}

/**
 * Remove o spinner da tela, caso esteja visível.
 * 
 * - É seguro chamar várias vezes (faz checagem antes de remover).
 *
 * @returns {void}
 */
/**
 * Remove o overlay de spinner se existir.
 */
function esconderSpinner() {
    const overlay = document.getElementById('spinner-overlay');
    if (overlay) overlay.remove();
}

// -------------------- Utilitário de tradução --------------------
/**
 * Traduz uma lista de palavras usando dicionário interno simples.
 * - Mantém fallback para termos desconhecidos (retorna o próprio termo)
 * - Faz pequenas heurísticas (fax, phone)
 *
 * @param {string[]} palavras Lista de palavras a traduzir
 * @returns {{ original: string, traduzido: string }[]} Mapeamento original/traduzido para cada palavra
 */
/**
 * Traduz identificadores de tipos de contato para PT-BR a partir de um dicionário interno.
 *
 * @param {string[]} palavras
 * @returns {{ original: string, traduzido: string }[]}
 */
async function traduzirPalavras(palavras) {
    // 1. Tabela interna de termos comuns (manual, sem JSON externo)
    const dicionarioBase = {
        home: "Casa",
        main: "Principal",
        mobile: "Celular",
        other: "Outro",
        private_fax: "Fax Privado",
        work: "Trabalho",
        work_fax: "Fax do Trabalho"
    };

    // 2. Traduz cada palavra
    const traducao = palavras.map(palavra => {
        const limpa = palavra.toLowerCase().trim();
        // tenta tradução direta
        if (dicionarioBase[limpa]) {
            return { original: palavra, traduzido: dicionarioBase[limpa] };
        }
        // caso não ache, tenta deduzir algo
        if (limpa.includes('fax')) return { original: palavra, traduzido: 'Fax' };
        if (limpa.includes('phone')) return { original: palavra, traduzido: 'Telefone' };
        // fallback
        return { original: palavra, traduzido: palavra };
    });

    return traducao;
}

/**
 * Preenche campos dinâmicos iniciais (e-mail/telefone) e resolve CL quando veio via URL.
 * - Quando 'parametros.cl' existe, calcula o índice e mapeia o id do comitê local ativo
 * - Em seguida, adiciona um campo de e-mail e um de telefone por padrão
 *
 * @param {{ cl?: string, campanha?: string }} parametros Objeto com parâmetros de URL processados
 * @returns {Promise<void>}
 */
/**
 * Configura contexto de CL a partir de parâmetros e injeta campos iniciais de email/telefone.
 * Side effects: altera variáveis globais indiceSiglaCL, todasAiesecs, idCL e manipula DOM.
 */
async function preencherDropdown(parametros) {
    if (parametros.cl) {
        indiceSiglaCL = escritorios.indexOf(parametros.cl);

        todasAiesecs = campos.find(field => field.label === "AIESEC mais próxima").config.settings.options.filter(opcoes => opcoes.status == "active");
        idCL = todasAiesecs.filter((_, index) => index === indiceSiglaCL).map(i => i.id);
    }
    if (parametros.canal) {
        idCanal = campos.find(field => field.label === "tag-origem").config.settings.options.filter(opcoes => opcoes.status == "active").filter(canal => slugify(canal.text) === parametros.canal).map(canal => canal.id); 
    }

    if (parametros.tipoAnuncio) {
        idTipoAnuncio = campos.find(field => field.label === "tag-meio").config.settings.options.filter(opcoes => opcoes.status == "active").filter(tipo => slugify(tipo.text) === parametros.tipoAnuncio).map(tipo => tipo.id);
    }

    addEmail();
    addTelefone();
}

/**
 * Lê parâmetros da URL relevantes para o formulário.
 * - utm_term -> CL (normalizado para maiúsculas)
 * - utm_campaign -> campanha (decodificada)
 *
 * @returns {Promise<{ cl: string, campanha: string }>} Objeto de parâmetros
 */
/**
 * Lê parâmetros de URL usados pelo formulário e normaliza valores.
 * @returns {{ cl: string, campanha: string }}
 */
async function ParamentroURL() {
    const params = new URLSearchParams(window.location.search);
    const cl = (params.get("utm_term") || "").toUpperCase();
    const canal = (params.get("utm_source")||"").toLowerCase();
    const tipoAnuncio = (params.get("utm_medium")||"").toLowerCase();
    const campanha = decodeURIComponent(params.get("utm_campaign") || "");
    return {
        cl,
        campanha,
        canal,
        tipoAnuncio
    };
}

/**
 * Converte um texto em um slug seguro para uso em tags ou URLs.
 * - Minúsculas, sem acentos, espaços viram hífens, mantém hífens e barras simples
 *
 * @param {string} texto Texto de entrada
 * @returns {string} Slug normalizado
 */
/**
 * Gera um slug URL-safe preservando hífens e barras simples.
 */
function slugify(texto) {
    return texto
        .toLowerCase()                       // tudo minúsculo
        .normalize("NFD")                    // separa letras dos acentos
        .replace(/[\u0300-\u036f]/g, "")     // remove acentos
        .replace(/\s+/g, "-")                // substitui espaços por hífen
        .replace(/[^a-z0-9-/]/g, "")         // mantém letras, números, hífen e barra
        .replace(/-+/g, "-")                 // evita múltiplos hífens
        .replace(/\/+/g, "/")                // evita múltiplas barras
        .replace(/^[-/]+|[-/]+$/g, "");      // remove hífens ou barras no início/fim
}
