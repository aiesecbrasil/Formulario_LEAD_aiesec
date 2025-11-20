const containerTelefone = document.getElementById('telefones-container');
const containerEmail = document.getElementById('emails-container');
const escritorios = [
    "AB",  // ABC
    "AJ",  // ARACAJU
    "BA",  // Bauru
    "BH",  // BELO HORIZONTE
    "BS",  // BRASÍLIA
    "CT",  // CURITIBA
    "FL",  // FLORIANÓPOLIS
    "FR",  // FRANCA
    "FO",  // FORTALEZA
    "JP",  // JOÃO PESSOA
    "LM",  // LIMEIRA
    "MZ",  // MACEIÓ
    "MN",  // MANAUS
    "MA",  // MARINGÁ
    "PA",  // PORTO ALEGRE
    "RC",  // RECIFE
    "RJ",  // RIO DE JANEIRO
    "SS",  // SALVADOR
    "SM",  // SANTA MARIA
    "GV",  // SÃO PAULO UNIDADE GETÚLIO VARGAS
    "MK",  // SÃO PAULO UNIDADE MACKENZIE
    "US",  // SÃO PAULO UNIDADE USP
    "SO",  // SOROCABA
    "UB",  // UBERLÂNDIA
    "VT",  // VITÓRIA
    "MC" // BRASIL (NACIONAL)
];
const idCL = [];
const camposErro = [];
let campos;
let indiceSiglaCL;
let parametros;
let aiesecProxima;
let todasAiesecs;

containerEmail.innerHTML = '';
containerTelefone.innerHTML = '';

/**
 * Exibe um modal padronizado.
 * - Centraliza em um único ponto a criação/atualização do conteúdo e botões do modal
 * - Permite tratar mensagens vindas do backend (ex: {"error": "Nome inválido"}, status 400)
 * - Mantém compatibilidade com os usos anteriores no código
 *
 * @param {Object} options Configurações do modal
 * @param {string} options.title Título do modal
 * @param {string|string[]} options.message Conteúdo do modal (string ou lista de mensagens). Arrays são unidos com \n
 * @param {('info'|'success'|'error')} [options.type='info'] Tipo semântico do modal (pode ser usado para estilizar)
 * @param {boolean} [options.showConfirm=true] Exibir botão Confirmar
 * @param {string} [options.confirmText='Confirmar'] Texto do botão Confirmar
 * @param {Function} [options.onConfirm] Callback executado ao confirmar
 * @param {boolean} [options.showCancel=true] Exibir botão Cancelar
 * @param {string} [options.cancelText='Cancelar'] Texto do botão Cancelar
 * @param {Function} [options.onCancel] Callback executado ao cancelar
 * @param {Object|string} [options.backendError] Objeto/JSON de erro do backend ou string de erro
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

document.addEventListener("DOMContentLoaded", async () => {
    parametros = await ParamentroURL(); // aguarda a função assíncrona
    const url = 'https://baziaiesec.pythonanywhere.com/metadados-card-psel';

    try {

        const response = await fetch(url);
        const data = await response.json();

        // Verificação de segurança mais completa
        campos = data?.data?.fields;
        console.log(campos)
        //Verfica se o dado campos é não nulo
        if (!campos) {
            // 🔻 Modal de erro (agora via função reutilizável)
            showModal({
                title: "Erro de conexão",
                message: "Por favor, Recarregue a Pagina e tente novamente.\nCaso o erro persista contate o email: contato@aiesec.org.br",
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
        // 🔻 Modal de erro (via função reutilizável)
        showModal({
            title: "Erro de conexão",
            message: "Por favor, Recarregue a Pagina e tente novamente.\nCaso o erro persista contate o email: contato@aiesec.org.br",
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
//---------------------Criar campo se não vinher parâmtro------------------
function criarCampos(cl) {
    const aiesec = document.getElementById("aiesecs");

    if (!cl) {
        aiesec.innerHTML = `
        <label for="aiesec">Qual é a AIESEC mais próxima de você?
                    *</label>
                <select id="aiesec" name="aiesec" required>
                    <option value>Carregando...</option>
                </select>
                <div class="error-msg" id="erro-aiesec"></div>
        `
        //__________________________________BOTÃO AIESEC MAIS PRÓXIMA_______________________________________

        // Cria o menu suspenso
        const dropdown_AiesecProx = document.getElementById('aiesec');
        dropdown_AiesecProx.innerHTML = '';
        dropdown_AiesecProx.setAttribute("disabled", "")

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

                return [...prev]

            },
            []
        )

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

// Função para remover a máscara e deixar só números
function limparTelefoneFormatado(valorFormatado) {
    return valorFormatado.replace(/\D/g, ''); // remove tudo que não for número
}

// Exemplo de uso no envio do formulário
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



function aplicarValidacaoTelefone(input) {
    input.addEventListener('blur', function (e) {
        const valor = e.target.value.trim();
        const erro = document.getElementById('erro-telefone');
        const regex = /^\(\d{2}\)\s9\s\d{4}-\d{4}$/;

        if (!regex.test(valor)) {
            erro.textContent = "Telefone inválido. Use o formato (DD) 9 XXXX-XXXX";
            camposErro.push("Telefone Inválido")
        } else {
            erro.textContent = "";
        }
    });
}


// -------------------- Validação de e-mail --------------------
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

        /*// Lista de provedores conhecidos
        const provedores = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
        const dominio = valor.split('@')[1].toLowerCase();

        if (!provedores.includes(dominio)) {
            erro.textContent = "Por favor, use um e-mail de provedor comum (ex: gmail.com, hotmail.com, icloud.com, outlook.com)";
            camposErro.push("Use um e-mail de provedor comum \n (ex: gmail.com, hotmail.com, icloud.com, hotmail.com)")
        } else {
            erro.textContent = ""; // Tudo certo
        }*/
    });
}
// -------------------- Validação de nome/sobrenome --------------------
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

validarNome('nome', 'erro-nome');

// -------------------- Aplicar validações iniciais --------------------
document.querySelectorAll('input[name="email[]"]').forEach(input => {
    validarEmailComProvedor(input)
});
document.querySelectorAll('input[name="telefone[]"]').forEach(input => {
    aplicarMascaraTelefone(input);
    aplicarValidacaoTelefone(input);
});

// -------------------- Adicionar/Remover campos --------------------
async function addEmail() {

    const div = document.createElement('div');

    const tipoEmail = campos.find(field => field.label === "E-mail");
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


async function addTelefone() {

    const div = document.createElement('div');

    // Pega o campo "Telefone" dentro do array 'campos'
    const tipoTelefone = campos.find(field => field.label === "Telefone/Celular");
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
            camposErro.push(`${id} Inválido`)
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
            camposErro.push("Telefone Inválido")
        } else {
            erro.textContent = "";
        }
    });

    // Data
    if (!inputISO.value) {
        document.getElementById('erro-nascimento').textContent = "Data inválida.";
        valido = false;
        camposErro.push("Data Inválida")
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
        camposErro.push("você de aceitas o termo")
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


        let dados = `
Nome: ${nome}\n
Emails: ${emails.map(email => `${email.email} (${email.tipoTraduzido})`).join('\t\t')}\n
Telefones: ${telefones.map(telefone => `${telefone.numero} (${telefone.tipoTraduzido})`).join('\t\t')}\n
Data de Nascimento: ${inputVisivel.value}`;

        if (aiesecProxima) {
            dados += `

AIESEC: ${aiesecProxima.options[aiesecProxima.selectedIndex].textContent}`;
        }

        // Sempre presente
        dados += `

Aceitou Política: Sim`;


        // Mostra os dados no Modal (via função reutilizável)
        showModal({
            title: "Confirmar dados",
            message: dados,
            type: "info",
            showConfirm: true,
            confirmText: "Confirmar",
            showCancel: true,
            cancelText: "Cancelar",
            onConfirm: async () => {
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
                            tag: slugify(parametros.campanha)
                        }),
                    });
                    if (!response.ok) {
                        let backend = null;
                        try { backend = await response.json(); } catch (_) { backend = null; }
                        throw { status: response.status, backend };
                    }

                    esconderSpinner();

                    // Modal de sucesso
                    showModal({
                        title: "Dados enviados com sucesso!",
                        message: "Em alguns instantes chegará em no e-mail informado nosso fit cultural",
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

                    // Fecha modal de confirmação atual antes de abrir modal de erro
                    const modalEl = document.getElementById('exampleModalLong');
                    const myModal = bootstrap.Modal.getInstance(modalEl);
                    if (myModal) myModal.hide();

                    // Modal de erro separado
                    showModal({
                        title: err?.status && err.status === 400 ? "Erro de Validação" : "Falha ao Enviar",
                        message: !(err?.status && err.status === 400) ? "Por favor, tente novamente.\nCaso o erro persista, contate o email: contato@aiesec.org.br" : "",
                        type: "error",
                        showConfirm: false,
                        showCancel: true,
                        cancelText: err?.status && err.status === 400 ? "Corrigir" : "Recarregar",
                        backendError: err?.backend,
                        onCancel: !(err?.status && err.status === 400) ? () => {
                            document.getElementById("meuForm").reset();
                            location.reload();
                        } : undefined
                    });
                }
            }
        })
    } else {
        // 🔻 Modal de erro (via função reutilizável)
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

// ============================================================================
// -------------------- FUNÇÕES DE CONTROLE DO SPINNER ------------------------
// ============================================================================

/**
 * Exibe um spinner de carregamento centralizado na tela.
 * 
 * - Cria dinamicamente o elemento HTML do spinner (não precisa existir no HTML).
 * - Bloqueia a interação com o fundo (usando overlay sem interferir no Bootstrap).
 * - Pode ser reutilizado em qualquer parte do código.
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
 */
function esconderSpinner() {
    const overlay = document.getElementById('spinner-overlay');
    if (overlay) overlay.remove();
}


// Função genérica para traduzir palavras usando LibreTranslate
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



async function preencherDropdown(parametros) {
    if (parametros.cl) {
        indiceSiglaCL = escritorios.indexOf(parametros.cl);


        todasAiesecs = campos.find(field => field.label === "AIESEC mais próxima").config.settings.options.filter(opcoes => opcoes.status == "active");
        idCL = todasAiesecs.filter((_, index) => index === indiceSiglaCL).map(i => i.id);
    }

    addEmail();
    addTelefone();
}

async function ParamentroURL() {
    const params = new URLSearchParams(window.location.search);
    const cl = (params.get("utm_term") || "").toUpperCase();
    const campanha = decodeURIComponent(params.get("utm_campaign") || "");
    return {
        cl,
        campanha
    };
}
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


