// ATENÇÃO: SUBSTITUA 'SUA_PROJECT_URL_AQUI' e 'SUA_ANON_PUBLIC_KEY_AQUI' pelas suas credenciais reais do Supabase!
// Você as encontra no Supabase Dashboard, em Project Settings > API.
const SUPABASE_URL = 'SUA_PROJECT_URL_AQUI'; // Ex: https://abcdefghijkl.supabase.co
const SUPABASE_ANON_KEY = 'SUA_ANON_PUBLIC_KEY_AQUI'; // Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Inicializa o cliente Supabase
const supabase = supabase_js.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Seleciona os elementos do DOM
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');
const roomInput = document.getElementById('room');
const registrationForm = document.getElementById('registrationForm');
const registeredChildrenDiv = document.getElementById('registeredChildren');
const noChildrenMessage = document.getElementById('noChildrenMessage');
const messageBox = document.getElementById('messageBox');
const childPhotoInput = document.getElementById('childPhoto');
const photoPreview = document.getElementById('photoPreview');

// Variável para armazenar a foto em Base64 temporariamente
let currentChildPhotoBase64 = '';

// Função para exibir mensagens (substitui alert())
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000); // Esconde a mensagem após 3 segundos
}

// Função para calcular a idade e atribuir a sala
function calculateAgeAndRoom() {
    const dob = new Date(dobInput.value);
    const today = new Date();

    if (isNaN(dob.getTime())) { // Verifica se a data é válida
        ageInput.value = '';
        roomInput.value = '';
        return;
    }

    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    const dayDifference = today.getDate() - dob.getDate();

    // Ajusta a idade se o aniversário ainda não ocorreu este ano
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    ageInput.value = age; // Atualiza o campo de idade

    // Atribui a sala com base na idade
    let room = '';
    if (age >= 0 && age <= 2) {
        room = 'BERÇÁRIO (0-2 Anos)';
    } else if (age >= 3 && age <= 4) {
        room = 'ALFA (3-4 Anos)';
    } else if (age >= 5 && age <= 6) {
        room = 'BETA (5-6 Anos)';
    } else if (age >= 7 && age <= 8) {
        room = 'GAMA (7-8 Anos)';
    } else if (age >= 9 && age <= 11) {
        room = 'ÔMEGA (9-11 Anos)';
    } else if (age > 11) {
        room = 'Adolescente/Jovem (Acima de 11 Anos)'; // Para idades fora do escopo do ministério infantil principal
    } else {
        room = 'Idade Inválida'; // Caso a idade seja negativa ou não se encaixe
    }
    roomInput.value = room; // Atualiza o campo de sala
}

// Adiciona um listener para o evento 'change' no campo de data de nascimento
dobInput.addEventListener('change', calculateAgeAndRoom);

// Lida com a seleção de arquivo de imagem
childPhotoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Limita o tamanho do arquivo para evitar problemas de desempenho/armazenamento
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showMessage('A imagem é muito grande! Por favor, selecione uma imagem de até 5MB.', 'error');
            childPhotoInput.value = ''; // Limpa o input do arquivo
            photoPreview.src = '';
            photoPreview.classList.add('hidden');
            currentChildPhotoBase64 = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.src = e.target.result;
            photoPreview.classList.remove('hidden');
            currentChildPhotoBase64 = e.target.result; // Armazena a imagem em Base64
        };
        reader.readAsDataURL(file); // Lê o arquivo como URL de dados (Base64)
    } else {
        photoPreview.src = '';
        photoPreview.classList.add('hidden');
        currentChildPhotoBase64 = '';
    }
});

// Função para buscar e exibir as crianças cadastradas do backend (Supabase)
async function fetchAndRenderChildren() {
    try {
        const { data: children, error } = await supabase
            .from('children') // 'children' é o nome da sua tabela no Supabase
            .select('*'); // Seleciona todas as colunas

        if (error) {
            throw new Error(error.message);
        }
        
        registeredChildrenDiv.innerHTML = ''; // Limpa a lista existente
        if (children.length === 0) {
            noChildrenMessage.style.display = 'block'; // Mostra a mensagem se não houver crianças
        } else {
            noChildrenMessage.style.display = 'none'; // Esconde a mensagem se houver crianças
            children.forEach((child) => {
                const childCard = document.createElement('div');
                childCard.className = 'bg-gradient-to-br from-blue-100 to-purple-100 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center transition duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl border-2 border-blue-300';

                // Adiciona a imagem de perfil se existir
                const photoHtml = child.photo ?
                    `<img src="${child.photo}" alt="Foto de ${child.childName}" class="w-20 h-20 rounded-full object-cover border-2 border-purple-400 mr-4 shadow-md flex-shrink-0">` :
                    `<div class="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-3xl font-bold mr-4 flex-shrink-0">👶</div>`; // Placeholder se não houver foto

                childCard.innerHTML = `
                    <div class="flex items-center mb-3 md:mb-0 w-full md:w-auto">
                        ${photoHtml}
                        <div>
                            <p class="text-2xl font-bold text-purple-800">${child.childName} ✨</p>
                            <p class="text-base text-gray-700 mt-1">Idade: <span class="font-semibold text-blue-700">${child.age} anos</span> | Sala: <span class="font-semibold text-green-700">${child.room}</span></p>
                            <p class="text-sm text-gray-600">Responsável: <span class="font-semibold text-pink-700">${child.guardianName}</span> (<span class="font-semibold text-orange-700">${child.guardianPhone}</span>)</p>
                        </div>
                    </div>
                    <button data-id="${child.id}" class="delete-btn bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-5 py-2 rounded-full text-base font-semibold transition duration-200 ease-in-out transform hover:scale-105 active:scale-95 shadow-md mt-4 md:mt-0">
                        Remover 🗑️
                    </button>
                `;
                registeredChildrenDiv.appendChild(childCard);
            });

            // Adiciona listeners para os botões de exclusão
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const idToDelete = parseInt(event.target.dataset.id);
                    deleteChild(idToDelete);
                });
            });
        }
    } catch (error) {
        console.error('Erro ao carregar crianças:', error);
        showMessage(`Erro ao carregar os dados das crianças: ${error.message}`, 'error');
    }
}

// Função para excluir uma criança via API (Supabase)
async function deleteChild(id) {
    try {
        const { error } = await supabase
            .from('children') // Nome da sua tabela
            .delete()
            .eq('id', id); // O 'id' é a chave primária da sua tabela no Supabase

        if (error) {
            throw new Error(error.message);
        }

        showMessage('Criança removida com sucesso! 👋', 'success');
        fetchAndRenderChildren(); // Recarrega a lista após a exclusão
    } catch (error) {
        console.error('Erro ao remover criança:', error);
        showMessage(`Erro ao remover criança: ${error.message}`, 'error');
    }
}

// Lida com o envio do formulário
registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Validação simples
    const childName = document.getElementById('childName').value.trim();
    const dob = document.getElementById('dob').value;
    const age = document.getElementById('age').value;
    const room = document.getElementById('room').value;
    const guardianName = document.getElementById('guardianName').value.trim();
    const guardianPhone = document.getElementById('guardianPhone').value.trim();

    if (!childName || !dob || !age || !room || !guardianName || !guardianPhone) {
        showMessage('Ops! Por favor, preencha todos os campos obrigatórios para cadastrar o(a) pequeno(a). 📝', 'error');
        return;
    }

    // Cria um objeto com os dados da criança
    const newChild = {
        childName,
        dob,
        age: parseInt(age), // Converte a idade para número
        room,
        guardianName,
        guardianPhone,
        photo: currentChildPhotoBase64 // Adiciona a foto em Base64
    };

    try {
        const { data, error } = await supabase
            .from('children') // Nome da sua tabela
            .insert([newChild]) // Insere o novo objeto
            .select(); // Retorna o dado inserido (útil para depuração, mas não obrigatório aqui)

        if (error) {
            throw new Error(error.message);
        }

        showMessage('Criança cadastrada com sucesso! Bem-vindo(a)! 🎉', 'success');
        registrationForm.reset(); // Limpa o formulário
        ageInput.value = ''; // Limpa o campo de idade
        roomInput.value = ''; // Limpa o campo de sala
        photoPreview.src = '';
        photoPreview.classList.add('hidden');
        currentChildPhotoBase64 = ''; // Limpa a variável da foto
        fetchAndRenderChildren(); // Recarrega a lista após o cadastro
    } catch (error) {
        console.error('Erro ao cadastrar criança:', error);
        showMessage(`Erro ao cadastrar criança: ${error.message}`, 'error');
    }
});

// Carrega os dados ao carregar a página
window.onload = fetchAndRenderChildren;