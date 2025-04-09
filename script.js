// Gestion des données
let guests = [];
let todos = [];

// Vérifier le stockage local au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Charger les données depuis localStorage s'il en existe
    if (localStorage.getItem('guests')) {
        guests = JSON.parse(localStorage.getItem('guests'));
    }
    if (localStorage.getItem('todos')) {
        todos = JSON.parse(localStorage.getItem('todos'));
    }

    // Initialiser la navigation
    initNavigation();
    
    // Initialiser les composants
    initGuestForm();
    initGuestFilters();
    initTodoForm();
    initTodoFilters();
    
    // Initialiser les boutons d'import/export
    initDataControls();
    
    // Mettre à jour l'affichage
    updateGuestList();
    updateTodoList();
    updateStats();
});

// Sauvegarde des données
function saveData() {
    localStorage.setItem('guests', JSON.stringify(guests));
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Initialisation des contrôles d'import/export
function initDataControls() {
    // Bouton d'exportation
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // Bouton d'importation
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    
    // Input de fichier caché
    document.getElementById('importFile').addEventListener('change', importData);
}

// Exportation des données
function exportData() {
    // Créer l'objet de données
    const data = {
        guests: guests,
        todos: todos,
        exportDate: new Date().toISOString(),
        appVersion: '1.1'
    };
    
    // Convertir en JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Créer un blob
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Créer un URL pour le blob
    const url = URL.createObjectURL(blob);
    
    // Créer un lien et déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `anniversaire-mamie-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    showNotification('Données exportées avec succès');
}

// Importation des données
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Vérifier la structure des données
            if (data.guests && Array.isArray(data.guests)) {
                // Vérifier si les todos existent dans le fichier
                if (!data.todos) {
                    data.todos = [];
                }
                
                // Confirmer l'importation
                showImportConfirmation(data);
            } else {
                throw new Error('Structure de fichier invalide');
            }
        } catch (error) {
            showNotification('Erreur: Fichier invalide', true);
            console.error(error);
        }
        
        // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Afficher une confirmation avant d'importer
function showImportConfirmation(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmer l'importation</h3>
            <p>Cette action remplacera toutes vos données actuelles.</p>
            <p>Exportées le: ${new Date(data.exportDate || Date.now()).toLocaleString()}</p>
            <p>Invités: ${data.guests.length}</p>
            <p>Tâches: ${data.todos ? data.todos.length : 0}</p>
            
            <div class="modal-actions">
                <button id="cancelImport">Annuler</button>
                <button id="confirmImport" class="primary">Importer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer les actions
    document.getElementById('cancelImport').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('confirmImport').addEventListener('click', () => {
        // Remplacer les données
        guests = data.guests;
        todos = data.todos || [];
        
        // Sauvegarder et mettre à jour l'affichage
        saveData();
        updateGuestList();
        updateTodoList();
        updateStats();
        
        modal.remove();
        showNotification('Données importées avec succès');
    });
}

// Afficher une notification avec option d'erreur
function showNotification(message, isError = false) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Afficher avec animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Gestion de la navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Activer la première section par défaut
    navButtons[0].click();
}

// Gestion des invités
function initGuestForm() {
    const form = document.getElementById('guestForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('guestName').value.trim();
        const status = document.getElementById('guestStatus').value;
        
        if (name) {
            // Ajouter à la liste
            guests.push({
                id: Date.now(), // ID unique basé sur l'horodatage
                name,
                status
            });
            
            // Sauvegarder, mettre à jour et réinitialiser
            saveData();
            updateGuestList();
            updateStats();
            form.reset();
            document.getElementById('guestName').focus();
        }
    });
}

function updateGuestList(filter = 'all') {
    const guestsList = document.getElementById('guestsList');
    guestsList.innerHTML = '';
    
    const filteredGuests = guests.filter(guest => {
        if (filter === 'all') return true;
        return guest.status === filter;
    });
    
    if (filteredGuests.length === 0) {
        guestsList.innerHTML = '<p class="empty-list">Aucun invité dans cette catégorie</p>';
        return;
    }
    
    filteredGuests.forEach(guest => {
        const guestCard = document.createElement('div');
        guestCard.className = 'guest-card';
        guestCard.innerHTML = `
            <div class="guest-info">
                <h3>${guest.name}</h3>
                <span class="status ${guest.status}">${getStatusLabel(guest.status)}</span>
            </div>
            <div class="guest-actions">
                <button class="edit-btn" data-id="${guest.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${guest.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Ajouter les événements
        guestCard.querySelector('.edit-btn').addEventListener('click', () => editGuest(guest.id));
        guestCard.querySelector('.delete-btn').addEventListener('click', () => deleteGuest(guest.id));
        
        guestsList.appendChild(guestCard);
    });
}

function initGuestFilters() {
    const filterButtons = document.querySelectorAll('#guests .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Mettre à jour l'UI
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filtrer la liste
            updateGuestList(filter);
        });
    });
}

function getStatusLabel(status) {
    switch(status) {
        case 'confirmed': return 'Confirmé';
        case 'pending': return 'En attente';
        case 'declined': return 'Ne vient pas';
        default: return status;
    }
}

function editGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    
    // Créer un formulaire modal pour l'édition
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Modifier l'invité</h3>
            <form id="editGuestForm">
                <input type="text" id="editName" value="${guest.name}" required>
                <select id="editStatus">
                    <option value="pending" ${guest.status === 'pending' ? 'selected' : ''}>En attente</option>
                    <option value="confirmed" ${guest.status === 'confirmed' ? 'selected' : ''}>Confirmé</option>
                    <option value="declined" ${guest.status === 'declined' ? 'selected' : ''}>Ne vient pas</option>
                </select>
                <div class="modal-actions">
                    <button type="button" id="cancelEdit">Annuler</button>
                    <button type="submit" class="primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer l'annulation
    document.getElementById('cancelEdit').addEventListener('click', () => {
        modal.remove();
    });
    
    // Gérer la soumission
    document.getElementById('editGuestForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('editName').value.trim();
        const newStatus = document.getElementById('editStatus').value;
        
        if (newName) {
            // Mettre à jour l'invité
            guest.name = newName;
            guest.status = newStatus;
            
            // Sauvegarder et mettre à jour l'affichage
            saveData();
            updateGuestList();
            updateStats();
            modal.remove();
        }
    });
}

function deleteGuest(id) {
    const index = guests.findIndex(g => g.id === id);
    if (index === -1) return;
    
    // Confirmation de suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet invité ?`)) {
        guests.splice(index, 1);
        saveData();
        updateGuestList();
        updateStats();
    }
}

// Gestion des todos
function initTodoForm() {
    const form = document.getElementById('todoForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('todoTitle').value.trim();
        const priority = document.getElementById('todoPriority').value;
        
        if (title) {
            // Ajouter à la liste
            todos.push({
                id: Date.now(), // ID unique basé sur l'horodatage
                title,
                priority,
                completed: false,
                createdAt: new Date().toISOString()
            });
            
            // Sauvegarder, mettre à jour et réinitialiser
            saveData();
            updateTodoList();
            form.reset();
            document.getElementById('todoTitle').focus();
        }
    });
}

function updateTodoList(filter = 'all') {
    const todosList = document.getElementById('todosList');
    todosList.innerHTML = '';
    
    const filteredTodos = todos.filter(todo => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    });
    
    if (filteredTodos.length === 0) {
        todosList.innerHTML = '<p class="empty-list">Aucune tâche dans cette catégorie</p>';
        return;
    }
    
    // Trier par priorité et statut
    filteredTodos.sort((a, b) => {
        // D'abord les tâches non complétées
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        // Ensuite par priorité
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Enfin par date de création (plus récente en premier)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    filteredTodos.forEach(todo => {
        const todoCard = document.createElement('div');
        todoCard.className = `todo-card ${todo.completed ? 'completed' : ''} ${todo.priority}`;
        todoCard.innerHTML = `
            <div class="todo-checkbox">
                <input type="checkbox" id="todo-${todo.id}" ${todo.completed ? 'checked' : ''}>
                <label for="todo-${todo.id}" class="checkbox-label"></label>
            </div>
            <div class="todo-info">
                <h3>${todo.title}</h3>
                <span class="priority ${todo.priority}">${getPriorityLabel(todo.priority)}</span>
            </div>
            <div class="todo-actions">
                <button class="edit-btn" data-id="${todo.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${todo.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Ajouter les événements
        todoCard.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            toggleTodoCompleted(todo.id, e.target.checked);
        });
        todoCard.querySelector('.edit-btn').addEventListener('click', () => editTodo(todo.id));
        todoCard.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        
        todosList.appendChild(todoCard);
    });
}

function initTodoFilters() {
    const filterButtons = document.querySelectorAll('#todos .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Mettre à jour l'UI
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filtrer la liste
            updateTodoList(filter);
        });
    });
}

function getPriorityLabel(priority) {
    switch(priority) {
        case 'high': return 'Haute priorité';
        case 'medium': return 'Priorité moyenne';
        case 'low': return 'Faible priorité';
        default: return priority;
    }
}

function toggleTodoCompleted(id, completed) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    todo.completed = completed;
    saveData();
    updateTodoList();
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    // Créer un formulaire modal pour l'édition
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Modifier la tâche</h3>
            <form id="editTodoForm">
                <input type="text" id="editTitle" value="${todo.title}" required>
                <select id="editPriority">
                    <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Faible priorité</option>
                    <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Priorité moyenne</option>
                    <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>Haute priorité</option>
                </select>
                <div class="checkbox-container">
                    <input type="checkbox" id="editCompleted" ${todo.completed ? 'checked' : ''}>
                    <label for="editCompleted">Tâche terminée</label>
                </div>
                <div class="modal-actions">
                    <button type="button" id="cancelTodoEdit">Annuler</button>
                    <button type="submit" class="primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer l'annulation
    document.getElementById('cancelTodoEdit').addEventListener('click', () => {
        modal.remove();
    });
    
    // Gérer la soumission
    document.getElementById('editTodoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newTitle = document.getElementById('editTitle').value.trim();
        const newPriority = document.getElementById('editPriority').value;
        const newCompleted = document.getElementById('editCompleted').checked;
        
        if (newTitle) {
            // Mettre à jour la tâche
            todo.title = newTitle;
            todo.priority = newPriority;
            todo.completed = newCompleted;
            
            // Sauvegarder et mettre à jour l'affichage
            saveData();
            updateTodoList();
            modal.remove();
        }
    });
}

function deleteTodo(id) {
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) return;
    
    // Confirmation de suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette tâche ?`)) {
        todos.splice(index, 1);
        saveData();
        updateTodoList();
    }
}

// Mise à jour des statistiques
function updateStats() {
    document.getElementById('totalGuests').textContent = guests.length;
    document.getElementById('confirmedGuests').textContent = guests.filter(g => g.status === 'confirmed').length;
    document.getElementById('pendingGuests').textContent = guests.filter(g => g.status === 'pending').length;
    document.getElementById('declinedGuests').textContent = guests.filter(g => g.status === 'declined').length;
}