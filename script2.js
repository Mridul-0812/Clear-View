let tasksArray = JSON.parse(localStorage.getItem('clearview_tasks')) || [];
        let currentEditingTaskTimestamp = null;
        let taskToDeleteTimestamp = null;

        function toggleMinimize() {
            const card = document.getElementById('main-card');
            const btn = document.getElementById('minimize-btn');
            
            // Toggle the minimized utility styling class
            card.classList.toggle('card-minimized');
            
            // Switch the text symbol between minus (collapse) and plus (expand)
            if (card.classList.contains('card-minimized')) {
                btn.textContent = '＋';
                btn.title = "Expand Workspace";
            } else {
                btn.textContent = '−';
                btn.title = "Minimise Workspace";
            }
        }

        function saveToLocalStorage() {
            localStorage.setItem('clearview_tasks', JSON.stringify(tasksArray));
            updateProgressBar();
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
            document.getElementById('form-due-date').value = '';
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

        document.getElementById('confirm-delete-action-btn').addEventListener('click', () => {
            if (taskToDeleteTimestamp !== null) {
                tasksArray = tasksArray.filter(t => t.id !== taskToDeleteTimestamp);
                saveToLocalStorage();
                renderTasks();
            }
            closeDeleteModal();
        });

        function editTask(timestamp) {
            const targetObject = tasksArray.find(t => t.id === timestamp);
            if (!targetObject) return;

            currentEditingTaskTimestamp = timestamp;
            
            document.getElementById('form-task-name').value = targetObject.name;
            document.getElementById('form-due-date').value = targetObject.date;
            document.getElementById('form-priority').value = targetObject.priority;
            document.getElementById('form-notes').value = targetObject.notes;

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

        function updateProgressBar() {
            const totalTasks = tasksArray.length;
            const completedTasks = tasksArray.filter(t => t.completed).length;
            const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
            
            const fillElement = document.getElementById('progress-bar-fill-element');
            const labelElement = document.getElementById('progress-percent-label');
            
            if (fillElement && labelElement) {
                fillElement.style.width = `${percentage}%`;
                labelElement.textContent = `${percentage}%`;
            }
        }

        function renderTasks() {
            const listContainer = document.getElementById('task-list');
            if (!listContainer) return;
            listContainer.innerHTML = '';

            // Recalibrate mastery bar metrics
            updateProgressBar();

            const searchQuery = document.getElementById('task-search-input').value.toLowerCase().trim();
            const sortBy = document.getElementById('task-sort-select').value;

            let processedTasks = tasksArray.filter(task => {
                const matchesName = task.name.toLowerCase().includes(searchQuery);
                const matchesDate = task.date.toLowerCase().includes(searchQuery);
                return matchesName || matchesDate;
            });

            if (sortBy === 'alpha') {
                processedTasks.sort((a, b) => a.name.localeCompare(b.name));
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
                let metaString = `📅 Due: ${task.date ? task.date : 'No Date Defined'}`;
                let notesBlock = task.notes ? `<div class="task-notes">📝 ${task.notes}</div>` : '';
                
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
                        <span>${metaString}</span>
                        <span>•</span>
                        <span style="text-transform: capitalize;">⚠️ ${task.priority} Priority</span>
                    </div>
                    ${notesBlock}
                `;
                listContainer.appendChild(li);
            });
        }

        function saveTask() {
            const name = document.getElementById('form-task-name').value.trim();
            const date = document.getElementById('form-due-date').value;
            const priority = document.getElementById('form-priority').value;
            const notes = document.getElementById('form-notes').value.trim();

            if (name === '') {
                alert('Please input a task description!');
                return;
            }

            if (currentEditingTaskTimestamp !== null) {
                const taskObj = tasksArray.find(t => t.id === currentEditingTaskTimestamp);
                if (taskObj) {
                    taskObj.name = name;
                    taskObj.date = date;
                    taskObj.priority = priority;
                    taskObj.notes = notes;
                }
            } else {
                const newTask = {
                    id: Date.now(),
                    name: name,
                    date: date,
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
                // Generates a completely unique timestamp to force a brand new image on every click
                const randomId = Date.now(); 
                
                // Using Picsum for ultra-reliable, high-res background photography
                const newBgUrl = `https://picsum.photos/1920/1080?random=${randomId}`;
                
                console.log("Fetching new wallpaper from Picsum...", newBgUrl);
                
                const img = new Image();
                img.src = newBgUrl;
                
                img.onload = () => {
                    // Only changes the background once the image has completely downloaded in the background
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