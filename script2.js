let tasksArray = JSON.parse(localStorage.getItem('clearview_tasks')) || [];
let currentEditingTaskTimestamp = null;
let taskToDeleteTimestamp = null;

function toggleMinimize() {
    const card = document.getElementById('main-card');
    const btn = document.getElementById('minimize-btn');
    
    if (card) {
        card.classList.toggle('card-minimized');
        if (card.classList.contains('card-minimized')) {
            btn.textContent = '＋';
            btn.title = "Expand Workspace";
        } else {
            btn.textContent = '−';
            btn.title = "Minimise Workspace";
        }
    }
}

function saveToLocalStorage() {
    localStorage.setItem('clearview_tasks', JSON.stringify(tasksArray));
    updateProgressBarAndTotals();
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("active");
    }
    tablinks = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
    }
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function openTaskModal() {
    document.getElementById('modal-title').textContent = "📝 Configure New Task";
    document.getElementById('task-modal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('active');
    clearForm();
    currentEditingTaskTimestamp = null;
}

function clearForm() {
    document.getElementById('form-task-name').value = '';
    document.getElementById('form-subject-name').value = '';
    document.getElementById('form-due-date').value = '';
    document.getElementById('form-hours').value = '0';
    document.getElementById('form-minutes').value = '0';
    document.getElementById('form-priority').value = 'medium';
    document.getElementById('form-notes').value = '';
}

function triggerDeleteConfirmation(timestamp) {
    taskToDeleteTimestamp = timestamp;
    const targetObject = tasksArray.find(t => t.id === timestamp);
    if (!targetObject) return;
    
    document.getElementById('delete-modal-text').textContent = `Are you absolutely sure you want to obliterate "${targetObject.name}"?`;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    taskToDeleteTimestamp = null;
}

const confirmDeleteBtn = document.getElementById('confirm-delete-action-btn');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (taskToDeleteTimestamp !== null) {
            tasksArray = tasksArray.filter(t => t.id !== taskToDeleteTimestamp);
            saveToLocalStorage();
            renderTasks();
        }
        closeDeleteModal();
    });
}

function editTask(timestamp) {
    const targetObject = tasksArray.find(t => t.id === timestamp);
    if (!targetObject) return;

    currentEditingTaskTimestamp = timestamp;
    
    document.getElementById('form-task-name').value = targetObject.name;
    document.getElementById('form-subject-name').value = targetObject.subject || '';
    document.getElementById('form-due-date').value = targetObject.date || '';
    
    // Convert duration back into hours and minutes
    const totalMins = targetObject.duration || 0;
    document.getElementById('form-hours').value = Math.floor(totalMins / 60);
    document.getElementById('form-minutes').value = totalMins % 60;
    
    document.getElementById('form-priority').value = targetObject.priority;
    document.getElementById('form-notes').value = targetObject.notes || '';

    document.getElementById('modal-title').textContent = "✏️ Edit Task Properties";
    document.getElementById('task-modal').classList.add('active');
}

function toggleComplete(timestamp) {
    const targetObject = tasksArray.find(t => t.id === timestamp);
    if (targetObject) {
        targetObject.completed = !targetObject.completed;
        saveToLocalStorage();
        renderTasks();
    }
}

function determineMatrixClass(priority, dueDateString) {
    if (!dueDateString) {
        if (priority === 'high') return 'matrix-critical';
        if (priority === 'medium') return 'matrix-warning';
        return 'matrix-safe';
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const targetDate = new Date(dueDateString);
    targetDate.setHours(0,0,0,0);
    
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (priority === 'high') {
        return (daysRemaining <= 3) ? 'matrix-critical' : 'matrix-warning';
    } else if (priority === 'medium') {
        if (daysRemaining <= 2) return 'matrix-critical';
        return (daysRemaining <= 7) ? 'matrix-warning' : 'matrix-info';
    } else {
        if (daysRemaining <= 1) return 'matrix-warning';
        return (daysRemaining <= 5) ? 'matrix-info' : 'matrix-safe';
    }
}

function filterAndSortTasks() {
    renderTasks();
}

// Formats total minutes into a human-readable string (e.g., "2h 30m" or "45m")
function formatDuration(totalMinutes) {
    if (!totalMinutes || totalMinutes === 0) return 'No time specified';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
}

function updateProgressBarAndTotals() {
    const totalTasks = tasksArray.length;
    const completedTasks = tasksArray.filter(t => t.completed).length;
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    
    // Calculate total estimated study time
    const totalMinutesCombined = tasksArray.reduce((acc, t) => acc + (t.duration || 0), 0);
    
    // Update progress bar UI elements if present
    const fillElement = document.getElementById('progress-bar-fill-element');
    const labelElement = document.getElementById('progress-percent-label');
    
    if (fillElement && labelElement) {
        fillElement.style.width = `${percentage}%`;
        labelElement.textContent = `${percentage}%`;
    }

    // Update Totals Summary Container (if present in HTML)
    const taskCountLabel = document.getElementById('total-tasks-counter');
    const totalTimeLabel = document.getElementById('total-time-counter');

    if (taskCountLabel) {
        taskCountLabel.textContent = `Tasks: ${completedTasks}/${totalTasks}`;
    }
    if (totalTimeLabel) {
        totalTimeLabel.textContent = `Total Time: ${formatDuration(totalMinutesCombined)}`;
    }
}

function renderTasks() {
    const listContainer = document.getElementById('task-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    // Recalibrate mastery bar and total counters
    updateProgressBarAndTotals();

    const searchInput = document.getElementById('task-search-input');
    const sortSelect = document.getElementById('task-sort-select');

    const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const sortBy = sortSelect ? sortSelect.value : 'date';

    // Filter tasks by name, subject, or date
    let processedTasks = tasksArray.filter(task => {
        const matchesName = task.name.toLowerCase().includes(searchQuery);
        const matchesSubject = (task.subject || '').toLowerCase().includes(searchQuery);
        const matchesDate = (task.date || '').toLowerCase().includes(searchQuery);
        return matchesName || matchesSubject || matchesDate;
    });

    // Sorting Modes
    if (sortBy === 'alpha') {
        processedTasks.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'subject') {
        processedTasks.sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
    } else if (sortBy === 'duration-asc') {
        processedTasks.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    } else if (sortBy === 'duration-desc') {
        processedTasks.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    } else if (sortBy === 'priority') {
        const weight = { high: 3, medium: 2, low: 1 };
        processedTasks.sort((a, b) => weight[b.priority] - weight[a.priority]);
    } else if (sortBy === 'date') {
        processedTasks.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        });
    }

    processedTasks.forEach(task => {
        const matrixClass = determineMatrixClass(task.priority, task.date);
        const subjectTag = task.subject ? `📚 <b>${task.subject}</b>` : '📚 General';
        const durationString = `⏱️ ${formatDuration(task.duration)}`;
        const metaString = `📅 Due: ${task.date ? task.date : 'No Date'}`;
        const notesBlock = task.notes ? `<div class="task-notes">📝 ${task.notes}</div>` : '';
        
        const li = document.createElement('li');
        li.className = `task-item ${matrixClass} ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="task-main">
                <div class="task-interactive-title-group">
                    <input type="checkbox" class="task-checkbox-input" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})">
                    <span class="task-title">${task.name}</span>
                </div>
                <div class="task-actions">
                    <button class="action-icon-btn edit-btn" onclick="editTask(${task.id})" title="Edit properties">✏️</button>
                    <button class="action-icon-btn delete-btn" onclick="triggerDeleteConfirmation(${task.id})" title="Obliterate milestone">🗑️</button>
                </div>
            </div>
            <div class="task-meta">
                <span>${subjectTag}</span>
                <span>•</span>
                <span>${durationString}</span>
                <span>•</span>
                <span>${metaString}</span>
                <span>•</span>
                <span style="text-transform: capitalize;">⚠️ ${task.priority}</span>
            </div>
            ${notesBlock}
        `;
        listContainer.appendChild(li);
    });
}

function saveTask() {
    const name = document.getElementById('form-task-name').value.trim();
    const subject = document.getElementById('form-subject-name').value.trim();
    const date = document.getElementById('form-due-date').value;
    const hours = parseInt(document.getElementById('form-hours').value, 10) || 0;
    const minutes = parseInt(document.getElementById('form-minutes').value, 10) || 0;
    const priority = document.getElementById('form-priority').value;
    const notes = document.getElementById('form-notes').value.trim();

    if (name === '') {
        alert('Please input a task description!');
        return;
    }

    // Total duration converted to total minutes
    const totalDurationMinutes = (hours * 60) + minutes;

    if (currentEditingTaskTimestamp !== null) {
        const taskObj = tasksArray.find(t => t.id === currentEditingTaskTimestamp);
        if (taskObj) {
            taskObj.name = name;
            taskObj.subject = subject;
            taskObj.date = date;
            taskObj.duration = totalDurationMinutes;
            taskObj.priority = priority;
            taskObj.notes = notes;
        }
    } else {
        const newTask = {
            id: Date.now(),
            name: name,
            subject: subject,
            date: date,
            duration: totalDurationMinutes,
            priority: priority,
            notes: notes,
            completed: false
        };
        tasksArray.push(newTask);
    }

    closeTaskModal();
    saveToLocalStorage();
    renderTasks();
}

// Wallpaper Switcher 
const bgButton = document.getElementById('bg-btn');

if (bgButton) {
    bgButton.addEventListener('click', () => {
        const randomId = Date.now(); 
        const newBgUrl = `https://picsum.photos/1920/1080?random=${randomId}`;
        
        console.log("Fetching new wallpaper from Picsum...", newBgUrl);
        
        const img = new Image();
        img.src = newBgUrl;
        
        img.onload = () => {
            document.body.style.backgroundImage = `url('${newBgUrl}')`;
            console.log("Wallpaper updated successfully!");
        };

        img.onerror = () => {
            console.error("Picsum image failed to load.");
        };
    });
}

// Initial Layout Initialization
renderTasks();