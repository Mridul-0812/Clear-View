// Forgot password

// =========================================================================
// PASSWORD RESET CONFIGURATION & STATE
// =========================================================================
// 🛠️ ASSIGN YOUR NEW EMAILJS TEMPLATE ID HERE:
const EMAILJS_RESET_TEMPLATE_ID = "template_evlky34_reset"; // Update this with your actual new template ID

let resetTargetEmail = ""; // Tracks which email is being updated during a link reset

// =========================================================================
// FORGOT PASSWORD VIA EMAIL LINK SYSTEM
// =========================================================================
async function triggerForgotPasswordFlow() {
    const emailEl = document.getElementById("user-email");
    const errorEl = document.getElementById("error");
    
    if (!emailEl || !errorEl) return;
    const email = emailEl.value.trim().toLowerCase();
    
    // Guard 1: Verify the input email text isn't blank
    if (!email) {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Please type your Email Address first to request a reset link.";
        return;
    }
    
    // Guard 2: Confirm account profile actually exists in storage database
    const accountExists = localStorage.getItem(email);
    if (accountExists === null) {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "No account found with this email address.";
        return;
    }
    
    // Success: Generate a unique link using the current website URL
    const basePageUrl = window.location.origin + window.location.pathname;
    const uniqueResetLink = `${basePageUrl}?action=reset&email=${encodeURIComponent(email)}`;
    
    // Set up parameters matching your new EmailJS Template
    const templateParams = {
        email: email,
        reset_link: uniqueResetLink
    };
    
    errorEl.style.color = "#2563eb"; // Blueprint blue status text
    errorEl.innerText = "Sending secure password reset link...";
    
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_RESET_TEMPLATE_ID, templateParams);
        errorEl.style.color = "#10b981"; // Success green text
        errorEl.innerText = "Reset link sent! Please check your email inbox.";
    } catch (error) {
        console.error("Link Delivery Error via EmailJS:", error);
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Failed to send reset link. Please check your network link.";
    }
}

// Handler when the user clicks "Save Password" on the link form
function submitNewPassword() {
    const newPass = document.getElementById("new-user-pass").value;
    const confirmPass = document.getElementById("new-user-confirm-pass").value;
    const errorEl = document.getElementById("error");
    
    if (!newPass || !confirmPass) {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Please fill in all security fields.";
        return;
    }
    
    if (newPass !== confirmPass) {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Passwords do not match. Please re-enter.";
        return;
    }
    
    // Overwrite the password directly in local storage for this email
    localStorage.setItem(resetTargetEmail, newPass);
    alert("Password successfully updated! You can now log in with your new password.");
    
    cleanResetUrlState();
}

function cancelPasswordReset() {
    cleanResetUrlState();
}

// Clears forms and safely clears URL variables from the address bar
function cleanResetUrlState() {
    document.getElementById("new-user-pass").value = "";
    document.getElementById("new-user-confirm-pass").value = "";
    document.getElementById("error").innerText = "";
    
    // Switch forms back
    document.getElementById("password-reset-panel").style.display = "none";
    document.getElementById("auth-inputs-form").style.display = "flex";
    document.getElementById("form-title").innerText = "ClearView Login";
    
    // Scrub the ?action=reset query strings completely from the browser bar
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Reset standard toggle view state
    isSignUpMode = true;
    toggleAuth(); 
}

// =========================================================================
// URL LINK PARSER AT PAGE LOAD
// =========================================================================
// Append this routing gate code inside your existing DOMContentLoaded listener!
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Intercept incoming users who clicked their email password reset link
    if (urlParams.get('action') === 'reset' && urlParams.get('email')) {
        resetTargetEmail = urlParams.get('email').toLowerCase();
        
        // Hide standard inputs form card
        document.getElementById("auth-inputs-form").style.display = "none";
        
        // Reveal password updates module
        const resetPanel = document.getElementById("password-reset-panel");
        if (resetPanel) resetPanel.style.display = "flex";
        
        document.getElementById("form-title").innerText = "Reset Password";
        
        const subtitle = document.getElementById("reset-panel-subtitle");
        if (subtitle) subtitle.innerText = `Updating credentials for: ${resetTargetEmail}`;
    }
});

// =========================================================================
// 1. CONFIGURATION & CONFIG SECURITY GATEWAY
// =========================================================================
const EMAILJS_PUBLIC_KEY = "mww_8eK7ey642rjGI"; 
const EMAILJS_SERVICE_ID = "service_4jmmcow";
const EMAILJS_TEMPLATE_ID = "template_evlky34";

// Immediately Invoked Function Expression (IIFE) to safely init EmailJS
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    } else {
        console.warn("EmailJS SDK script was not detected. Ensure the script tag is added to index.html.");
    }
})();

let isSignUpMode = false;
let currentGeneratedCode = null; // Holds the 4-digit code in memory
let pendingEmail = "";
let pendingPass = "";

// =========================================================================
// 2. UI AUTHENTICATION TOGGLE ROUTINES
// =========================================================================
function toggleAuth() {
    isSignUpMode = !isSignUpMode;
    
    const errorEl = document.getElementById("error");
    const formTitleEl = document.getElementById("form-title");
    const mainAuthBtnEl = document.getElementById("main-auth-btn");
    const toggleTextEl = document.getElementById("toggle-text");
    const confirmPassContainer = document.getElementById("confirm-pass-container");
    const forgotWrapper = document.getElementById("forgot-link-wrapper");

    if (errorEl) errorEl.innerText = "";
    
    // Updates title and buttons based on state
    if (formTitleEl) {
        formTitleEl.innerText = isSignUpMode ? "Create Account" : "ClearView Login";
    }
    if (mainAuthBtnEl) {
        mainAuthBtnEl.innerText = isSignUpMode ? "Sign Up" : "Login";
    }
    
    // Smoothly hide/show the Confirm Password field
    if (confirmPassContainer) {
        confirmPassContainer.style.display = isSignUpMode ? "flex" : "none";
    }
    
    // NEW: Toggles the Forgot Password link visibility dynamically!
    if (forgotWrapper) {
        forgotWrapper.style.display = isSignUpMode ? "none" : "block";
    }
    
    // Updates the bottom toggle helper navigation link
    if (toggleTextEl) {
        toggleTextEl.innerHTML = isSignUpMode ?
            'Already have an account? <a href="#" onclick="toggleAuth()" class="auth-link">Login</a>' :
            'Don\'t have an account? <a href="#" onclick="toggleAuth()" class="auth-link">Sign Up</a>';
    }
}

// =========================================================================
// 3. CORE GATEWAY AUTHENTICATION & VERIFICATION LOGIC
// =========================================================================
async function handleAuth() {
    const emailEl = document.getElementById("user-email");
    const passEl = document.getElementById("user-pass");
    const confirmPassEl = document.getElementById("user-confirm-pass");
    const errorEl = document.getElementById("error");

    if (!emailEl || !passEl || !errorEl) return;

    const email = emailEl.value.trim().toLowerCase();
    const pass = passEl.value;

    // Validate empty input elements
    if (!email || !pass) {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Please fill in all fields.";
        return;
    }

    if (isSignUpMode) {
        // --- STAGE 1: SIGN UP & SECURITY GUARDS ---
        const confirmPass = confirmPassEl ? confirmPassEl.value : "";

        // Guard 1: Verify Confirm Password Matches
        if (pass !== confirmPass) {
            errorEl.style.color = "#ef4444";
            errorEl.innerText = "Passwords do not match. Please re-enter.";
            return;
        }

        // Guard 2: Strict Duplicate Account Registry Prevention Check 🛑
        const accountExists = localStorage.getItem(email);
        if (accountExists !== null) {
            errorEl.style.color = "#ef4444";
            errorEl.innerText = "An account with this email already exists!";
            return; // Terminate execution immediately. EmailJS will NOT trigger.
        }

        // Setup verification code allocation payload
        currentGeneratedCode = Math.floor(1000 + Math.random() * 9000);
        pendingEmail = email;
        pendingPass = pass;

        const templateParams = {
            email: email,
            verification_code: currentGeneratedCode
        };

        errorEl.style.color = "#2563eb"; // Blueprint blue text
        errorEl.innerText = "Sending secure decryption key...";

        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            
            // Swap display states within the web layout
            document.getElementById("auth-inputs-form").style.display = "none";
            document.getElementById("verification-panel").style.display = "flex";
            
            // Adjust headings for context
            document.getElementById("form-title").innerText = "Verify Access";
            document.getElementById("portal-subtitle").innerText = "SECURITY STEP REQUIREMENT";
            
            errorEl.innerText = ""; // Clear out status text
        } catch (error) {
            console.error("EmailJS execution exception error:", error);
            errorEl.style.color = "#ef4444";
            errorEl.innerText = "Failed to send email. Please check your network connection.";
        }

    } else {
        // --- STAGE 2: LOGIN CHECK ---
        const savedPass = localStorage.getItem(email);
        
        if (savedPass && savedPass === pass) {
            // Hide the login screen container completely
            const loginScreenEl = document.getElementById("login-screen");
            if (loginScreenEl) loginScreenEl.style.display = "none";
            
            // Reveal the primary workspace element wrapper using flex alignment
            const mainContentContainer = document.getElementById("main-content");
            if (mainContentContainer) {
                mainContentContainer.style.display = "flex"; 
            }
            
            // Fire your standard original app render logic layout initializations
            if (typeof renderTasks === "function") {
                renderTasks(); 
            }
        } else {
            errorEl.style.color = "#ef4444";
            errorEl.innerText = "Invalid email or password.";
        }
    }
}

// =========================================================================
// 4. ON-PAGE INDEPENDENT BOX HANDLERS
// =========================================================================
function submitVerificationCode() {
    const userCodeInput = document.getElementById("verification-user-code").value.trim();
    const errorEl = document.getElementById("error");

    if (!userCodeInput) {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Please enter the verification code.";
        return;
    }

    if (userCodeInput == currentGeneratedCode) {
        // Code passes! Commit credentials securely
        localStorage.setItem(pendingEmail, pendingPass);
        alert("Account Verified! Welcome to the Algebro Team.");
        
        // Return visibility cleanly to initial login layouts
        resetAuthUIPanels();
        toggleAuth(); // Switches form style variant text variables cleanly back to login
    } else {
        errorEl.style.color = "#ef4444";
        errorEl.innerText = "Incorrect code. Please try again.";
    }
}

function cancelVerification() {
    const errorEl = document.getElementById("error");
    resetAuthUIPanels();
    errorEl.style.color = "#ef4444";
    errorEl.innerText = "Verification cancelled by user.";
}

function resetAuthUIPanels() {
    currentGeneratedCode = null;
    
    // Reset value parameters
    document.getElementById("verification-user-code").value = "";
    
    // Revert styling display blocks
    document.getElementById("verification-panel").style.display = "none";
    document.getElementById("auth-inputs-form").style.display = "flex";
    
    // Revert heading texts
    document.getElementById("form-title").innerText = "Create Account";
    document.getElementById("portal-subtitle").innerText = "SECURE PORTAL SYSTEM";
}

// =========================================================================
// PASSWORD VISIBILITY TOGGLE ENGINE
// =========================================================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById("user-pass");
    const toggleBtn = document.getElementById("toggle-password-btn");
    
    if (!passwordInput || !toggleBtn) return;
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtn.textContent = "🙈"; // Icon when password is visible
    } else {
        passwordInput.type = "password";
        toggleBtn.textContent = "👁️"; // Icon when password is hidden
    }
}

// =========================================================================
// 5. SECURE WORKSPACE TERMINATION (LOGOUT ROUTINE - CLEANED & DE-DUPLICATED)
// =========================================================================
function handleLogout() {
    // 1. Hide the workspace panel module wrapper completely
    const mainContentContainer = document.getElementById("main-content");
    if (mainContentContainer) {
        mainContentContainer.style.setProperty('display', 'none', 'important');
    }

    // 2. Reveal the pristine login application gate card layout interface
    const loginScreenEl = document.getElementById("login-screen");
    if (loginScreenEl) {
        loginScreenEl.style.display = "block";
    }

    // 3. Clear sensitive active credential parameters from your screen inputs cleanly
    const emailEl = document.getElementById("user-email");
    const passEl = document.getElementById("user-pass");
    const confirmPassEl = document.getElementById("user-confirm-pass");
    
    if (emailEl) emailEl.value = "";
    if (passEl) passEl.value = "";
    if (confirmPassEl) confirmPassEl.value = "";

    // 4. Force default view context back to basic clean login system
    isSignUpMode = true; 
    toggleAuth(); 
}

// =========================================================================
// AUTO-LOGIN RESTORATION GATEWAY
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if the URL tells us they are returning from the focus hub
    if (urlParams.get('session') === 'active') {
        
        // 1. Instantly hide the login container card
        const loginScreenEl = document.getElementById("login-screen");
        if (loginScreenEl) {
            loginScreenEl.style.display = "none";
        }
        
        // 2. Seamlessly restore the dashboard workspace display view
        const mainContentContainer = document.getElementById("main-content");
        if (mainContentContainer) {
            mainContentContainer.style.setProperty('display', 'flex', 'important');
        }
        
        // 3. Fire your interface rendering engines
        if (typeof renderTasks === "function") {
            renderTasks();
        }
        
        // Clean up the URL in the address bar so it looks nice and pristine
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// =========================================================================
// LOCAL STORAGE DATA CONTROLLERS & HOOKS
// =========================================================================
let tasksArray = JSON.parse(localStorage.getItem('clearview_tasks')) || [];
let currentEditingTaskTimestamp = null;
let taskToDeleteTimestamp = null;

function saveToLocalStorage() {
    localStorage.setItem('clearview_tasks', JSON.stringify(tasksArray));
    if (typeof updateProgressBar === "function") updateProgressBar();
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
    if (typeof clearForm === "function") clearForm();
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

function toggleMinimize() {
    const card = document.getElementById('main-card');
    const btn = document.getElementById('minimize-btn');
    
    card.classList.toggle('card-minimized');
    
    if (card.classList.contains('card-minimized')) {
        btn.textContent = '＋';
        btn.title = "Expand Workspace";
    } else {
        btn.textContent = '−';
        btn.title = "Minimise Workspace";
    }
}

// Wallpaper Switcher (Using Picsum engine from script2.js)
const bgButton = document.getElementById('bg-btn') || document.getElementById('bg-button');
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

// ==========================================================================
// ADDITIONAL FEATURES ENGINE (Retained from original tasks_app_script.js)
// ==========================================================================

// 1. ATAR MANIFESTATION ENGINE LOGIC
const manifestBtn = document.getElementById('manifest-btn');
const atarInput = document.getElementById('atar-input');
const manifestResult = document.getElementById('manifest-result');
const manifestationResponses = [
    " 🔮  The UAC scaling algorithms have received your request. They are currently weighing it against your trial marks... Looking promising!",
    " ✨  Manifestation successful! The ghosts of past NESA examiners are nodding in approval.",
    " 📈  Your prediction has been sent into the atmosphere. Remember: aligned marks are a mystery, but sleep is concrete.",
    " 🌟  Target locked. Now close TikTok and read that one syllabus dot point you've been avoiding all week.",
    " 🕯️  Lighting a candle for your internal rankings. May the scaling gods balance your cohort perfectly.",
    " 🧬  Scaling algorithms are running simulations. Your dedication is currently breaking the scale in a good way.",
    " 🎯  Your target score has been written into the cosmic ledger. Time to make the study match the manifestation.",
    " 🦉  The ghosts of 99.95 graduates past have looked upon your efforts and passed down their blessings.",
    " ✨  Manifestation locked in. Your trial marks are merely a baseline; your potential is exponential.",
    " 📊  The UAC mainframe just hiccuped because your manifestation is so high. Keep grinding.",
    " 🍀  Scaling luck activated. May your weak topics magically stay off the final paper.",
    " 🌠  Sent your dream score straight to the NESA cloud server. Now go make it a reality.",
    " 🔮  Calculating cohort synergy... Manifestation processed. Your rank is secure if you keep this up.",
    " 💎  Absolute diamond energy. This score is yours to claim. Step one: open the textbook.",
    " 🔥  The motivation is high, the target is set. Let’s turn this digital manifestation into actual marks.",
    "⚡ High-voltage manifestation complete. May your English thesis statement flow like water.",
    " 🎯  Target acquired. The universe says yes, but the syllabus says 'show your working'.",
    " 📝  Examiners are preparing their red pens, but your manifestation has pre-loaded a Band 6 into their minds.",
    " 🚀  Launching your ATAR trajectory into orbit. Avoid debris like doom-scrolling and procrastination.",
    " 🌌  Universal alignment achieved. Your chosen university course is already preparing your welcome email.",
    " 🧠  Your neurons are firing at optimal frequencies. The manifest engine has upgraded your luck profile.",
    " 🧘  Scaling zen achieved. The raw numbers look intimidating, but you are more than capable.",
    " 🧙‍♂️  NESA magic is erratic, but your clear focus today has stabilized your scaling predictions.",
    " 🏆  A premier's award is calling your name. Or at least a very comfortable round one offer.",
    "☀️ Morning sun energy. Your score has been beamed straight to the UAC calculations desk.",
    " 🦁  Fierce determination detected. The manifestation engine has approved your entry.",
    " 🎲  Don't leave it to a roll of the dice. Your manifestation is backed by your effort.",
    " 🪐  Saturn is in retrograde but your academic trajectory is strictly moving upwards.",
    " 💡  Brilliant mind alert. The target score matches your hidden operational capacity.",
    " 🛠️  Blueprint drawn. You've set the target structural integrity, now assemble the study notes.",
    " 🌈  Your academic future is looking incredibly bright. Scaling concerns are completely overridden.",
    " 🧩  The final pieces of your study schedule are clicking into place. Target acknowledged.",
    " 🪁  Flying high above the scaling stress. Your focus remains entirely on your personal best.",
    " 🛡️  Shielded from bad vibes and poor cohort performance. Your personal rank will carry you.",
    " 🌊  A wave of absolute clarity is heading your way for your next assessment task.",
    " 🔋  Energy cells full. The manifestation engine has cataloged your score with high probability.",
    " 🎯  Bullseye. The scaling algorithms just adjusted their parameters in your favor.",
    " 💎  Unbreakable focus. This dream score is completely within your operational limits.",
    " 🐾  One step at a time, but your final destination is exactly the number you just typed.",
    " 🌪️  A whirlwind of academic excellence is brewing. NESA isn't ready for your comeback arc.",
    " 👑  Crown-level dedication. Your dream course is practically reserving your seat right now.",
    " 🏹  Arrow pulled back, target set. The manifest engine confirms a straight trajectory.",
    " 🏰  Building your academic empire block by block. This target score is your flagship monument.",
    " 🌌  The cosmos has processed your request. Please confirm by completing one practice question.",
    "⚡ Shockingly good choices ahead. Your target score has been verified by the motivation module.",
    " 🕯️  The sacred texts of past syllabus updates have predicted your massive success.",
    " 🛰️  Satellite tracking confirms: you are currently on the most direct path to that score.",
    " 💎  Pure crystal clear intent. The scaling matrix has absorbed your positive numbers.",
    " 🧪  Chemistry, Biology, Physics or Humanities—whatever it is, the scaling is tilting in your direction.",
    " 🗝️  Unlock the vault. Your target ATAR is simply a key, and you already know the combination.",
    " 🏁  The finish line is visible in the distance. The manifest engine has clocked your projected speed.",
    "⚓ Anchored in supreme confidence. No sudden exam twist will throw you off this target.",
    " 🛹  Cruising smoothly toward your goals. Procrastination has been successfully dodged.",
    " 🎈  Light as air. Don't carry the weight of expectations, just carry the target score in your mind.",
    " 🦁  Courage under pressure. The scaling desk respects a student who aims high.",
    " 🌋  Explosive academic growth detected. This manifestation is perfectly timed.",
    " 🎚️  Turning the motivation dial all the way up to 11. Target score successfully registered.",
    " 🎭  The drama of the HSC is temporary, but the satisfaction of this score will be forever.",
    " 🧩  The scaling puzzle has resolved itself in your mind. Focus on consistency.",
    " 🗺️  Map generated. Your path to this exact ATAR is clear: consistent daily wins.",
    " 🦅  Soaring past your old internal benchmarks. This target is your new reality.",
    " 🥊  Fighting spirit active. You are boxing way above your weight class right now.",
    " 🏟️  The stadium is cheering for your comeback arc. Let's lock this score in with actions.",
    " 🧬  Your academic DNA is primed for efficiency. Manifestation fully acknowledged.",
    " 🏔️  The peak of the mountain is steep, but the manifest engine says your gear is ready.",
    " 🛸  Out of this world capability. Don't let local trial marks dictate your universal ceiling.",
    " 🎵  In perfect harmony with your study guides. The target score is echoing back beautifully.",
    " 🎨  Painting a masterpieces of an academic year. This number is your signature at the bottom.",
    " 🔮  Oracle mode: Activated. Your target score has been verified by our proprietary vibe check.",
    " 🎰  Jackpot energy. The scaling variables are spinning and landing precisely on your dream rank.",
    " 🧱  Brick by brick, summary by summary. Your target ATAR is structurally sound.",
    " 🪄  A touch of magic, a mountain of effort. The manifest engine loves this target for you.",
    " 🎡  Life has its ups and downs, but your ATAR trajectory is on a steady, locked climb.",
    " 🚦  Green lights across all your extension subjects. Proceed to study with maximum velocity.",
    " 🛰️  Transmission received by the scaling network. They have noted your supreme ambition.",
    " ⛺  Grounded, focused, and ready. This score is a natural byproduct of your future efforts.",
    "☄️ A shooting star just confirmed your calculation. Make a wish, then open your flashcards.",
    " 🛡️  Immune to the scaling panic of your classmates. Your path is uniquely your own.",
    " 🌊  The deep tides of scaling are shifting to push your subjects into premium bands.",
    " 🎪  No clowning around today. You’ve set a serious target, time for serious focus.",
    " 🚀  Escape velocity achieved. You are breaking free from the gravity of low expectations.",
    " 📣  The universe is shouting it back to you: This score is completely achievable.",
    " 👓  Perfect 20/20 vision on your goals. The manifest engine has recorded your input.",
    " 💎  Polishing your essay structures until they match the sparkle of this dream score.",
    " 🏹  Your academic arrows are hitting the mark. Keep your eyes on the prize.",
    " 🧩  Cross-referencing your target with your capacity... System says: Absolutely possible.",
    " 🦁  Stand tall. A high target requires a steady hand. The manifest engine backs you up.",
    " 🌴  Calm tropical breeze energy. Don't sweat the numbers, just execute the daily plan.",
    " 🪐  The gravitational pull of your dream career is pulling you toward this exact score.",
    "⚡ Electrifying focus detected. The manifest engine has authorized maximum scaling potential.",
    " 🏆  Champions don't wait for scaling luck, they manifest it through relentless daily consistency.",
    " ✨  Magic happens when preparation meets opportunity. Your preparation starts right now.",
    " 📈  The trajectory is clear. Even your worst subjects are looking at a massive value-add.",
    " 🌌  Stardust and syllabus points. You're crafting an incredible final result.",
    " 🔋  Maximum battery health for your brain tonight. The manifestation has been safely stored.",
    " 💎  Uncut diamond. A little pressure over the next few months is going to make you shine.",
    " 🚀  Final countdown initiated. The target ATAR is logged in the navigation computer.",
    " 🎯  Center mass. Your focus is sharp, your target is bold, your potential is unlimited.",
    " 🔮  The final verdict of the manifest engine: You have the tools. Now go build the mark.",
    " ✨  Task complete. Target permanently locked into your ClearView profile. Go get it!"
];

if (manifestBtn) {
    manifestBtn.addEventListener('click', () => {
        const val = parseFloat(atarInput.value);
        if (isNaN(val) || val < 0 || val > 99.95) {
            manifestResult.style.color = '#ef4444';
            manifestResult.textContent = " ❌  Please enter a valid ATAR between 0.00 and 99.95!";
            return;
        }
        const randomMsg = manifestationResponses[Math.floor(Math.random() * manifestationResponses.length)];
        manifestResult.style.color = 'var(--success-color, #10b981)';
        manifestResult.textContent = randomMsg;
    });
}

// 2. EMERGENCY PANIC BUTTON LOGIC
const panicBtn = document.getElementById('panic-btn');
const panicMessage = document.getElementById('panic-message');
const panicQuotes = [
   "🧘 Unclench your jaw. Drop your shoulders. Take a deep breath. NESA cannot hurt you right now.",
    "🥛 Go get a glass of water. Seriously. Hydrate before you evaporate over that module essay.",
    "🛑 Stop playing around on ATAR calculators. They are not your friends today.",
    "🍫 High Band 6 Tip: Take a 15-minute break. Eat a snack. Your brain needs fuel.",
    "🎵 Put on some lo-fi beats and step away from the practice papers for 5 minutes.",
    "🚶 Walk to the window. Look at something that isn't a glowing screen or a marking guideline.",
    "🛑 Absolute emergency protocol: Close all 47 open tabs. Your laptop and mind are both crying.",
    "💆 Press your palms together, take a deep breath, and remember: trials are just data, not destiny.",
    "🍎 Go eat a piece of fruit. Glucose levels are hitting rock bottom right now.",
    "🌿 Step outside for exactly 120 seconds. Breathe real air. The syllabus isn't oxygen.",
    "📱 Turn your phone off. Not silent—completely off. Put it in another room. Escape the text panic.",
    "☕ Make a warm drink that doesn't contain five shots of espresso. Chamomile is calling.",
    "🐈 If you have a pet, go annoy them for 10 minutes. They don't know what NESA is, and they are correct.",
    "🛌 Lie flat on the floor for 5 minutes. Feel the gravity. Let the panic drain into the floorboards.",
    "🙅 Drop the past paper. If you don't understand the question right now, staring at it angry won't fix it.",
    "🦓 Random thought: Zebras don't have to write multi-text comparative essays. Be glad you are human, mostly.",
    "🚿 Wash your face with freezing cold water. Reset your vagus nerve instantly. You got this.",
    "📝 Write down the ONE thing stressing you out most on a scrap piece of paper, then shred it.",
    "⏳ In the grand scheme of your entire life, this exam is a tiny blip. Breathe out the gravity.",
    "🎸 Put on your absolute favorite hype song and jump around your room like an idiot for 3 minutes.",
    "🧘 Roll your neck clockwise three times, then counter-clockwise. Your spine has become wood.",
    "🧸 Be kind to yourself. You are trying to cram years of human discovery into one brain. It’s hard.",
    "🍕 Food break. Real food, not just chips or energy drinks. Your prefrontal cortex requires proper fuel.",
    "⏳ Time out. No studying for the next 20 minutes. That is a mandatory operational order.",
    "🕯️ Light some incense or a candle. Change the sensory vibe of your study prison workspace.",
    "🔕 Put your group chat on mute. Their collective panic is contagious and you don't need it.",
    "🎈 Imagine your anxiety is a balloon. Pop it mentally. It's just air and noise.",
    "🧺 Go do a quick chore. Fold some laundry. Wash a plate. Real-world wins reset the brain.",
    "🌲 Visualise a calm forest. No examiners, no scaling, just trees. Hold that image for 30 seconds.",
    "🥛 Another reminder to hydrate. Your brain is 75% water, and currently, it's a desert.",
    "🥶 Put an ice cube in your hand and focus entirely on the sensation of it melting. True grounder.",
    "📖 Close the textbook. Open a fiction book, a comic, or something completely unrelated for a moment.",
    "🌬️ Breathwork check: Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat thrice.",
    "🛑 You don't need to know everything tonight. You just need to know enough for the next step.",
    "🛋️ Move your study spot. Go to the kitchen table, the floor, or the lounge. A change of scenery helps.",
    "🍫 Chocolate break. Specifically dark chocolate. Tell yourself it's for the antioxidants.",
    "🕊️ Forgive yourself for procrastinating earlier. It's done. Focus on the next 10 clean minutes.",
    "🥊 Shadow box the air for 30 seconds. Punch that difficult math formula into submission.",
    "🌱 Go water a plant. Connect with something living that isn't running on a lithium battery.",
    "🧼 Clean your desk space. A chaotic desk creates a chaotic mind. Clear the physical runway.",
    "🤫 Sit in absolute silence for two complete minutes. No audio, no scrolling, just quiet time.",
    "🦁 Remember that you have survived every single difficult academic hurdle in your life so far.",
    "🤸 Stretch your hamstrings and back. Sitting down for hours is turning your body into rust.",
    "🥣 Have a bowl of cereal. It's comfort food and it works at any hour of the day or night.",
    "🎭 Think about how funny it will be to look back on this level of panic in a year's time.",
    "📝 Stop trying to write the perfect essay sentence. Just write a terrible one and fix it later.",
    "📻 Put on some white noise or rain sounds. Block out the ambient stress of the household.",
    "👣 Take your shoes off. Walk barefoot on the grass or carpet. Get grounded immediately.",
    "🛑 If your eyes are blurry, your brain is full. Give it a rest cycle. Go to sleep early.",
    "🤝 Text a friend a joke. Break the hyper-focus on this academic pressure cooker.",
    "🍦 Go find a sweet treat. You've earned a little bit of dopamine that didn't come from a notification.",
    "🧠 Your value as a human being is not tied to a decimal point rank calculated by a computer.",
    "🖼️ Stare at the mountain background of this app for 1 minute. Imagine breathing that cold mountain air.",
    "💨 Let out a massive, dramatic sigh. Express the stress physically and clear your chest.",
    "📚 Stack your books neatly away for the night if it’s past 11 PM. Nothing good happens past 11 PM.",
    "🍊 Peel an orange. The citrus scent is scientifically proven to reduce stress levels.",
    "🎵 Whistle or hum your favorite tune. It relaxes your facial muscles and shifts your mood.",
    "🧗 The mountain seems high when you look at the top. Just look at your next step.",
    "🛑 Cancel your plans to stay up all night. Sleep is the ultimate performance enhancer.",
    "🧸 Wrap yourself in a heavy blanket for a minute. Deep pressure therapy works wonders.",
    "🌅 Remind yourself that the sun will still rise tomorrow regardless of how this summary goes.",
    "📝 Write a list of 3 things you are looking forward to doing once this entire exam block is over.",
    "🥤 Drink something ice-cold. The sudden temperature shift snaps your brain out of panic cycles.",
    "🧐 Real talk: Nobody has ever died from a bad trial exam result. It’s a fixable situation.",
    "🛑 Drop the highlighters. Your notes look like a neon crime scene. Less color, more breathing.",
    "🎈 Allow yourself to do a bad job on this practice run. Perfect is the enemy of completed.",
    "🧺 Go change into your most comfortable lounge clothes. Comfort is paramount right now.",
    "🕰️ Give yourself permission to waste the next 10 minutes guilt-free. Enjoy the pause.",
    "🦢 Imagine a peaceful swan gliding across smooth water. Try to match your breathing to that speed.",
    "🍿 Make some popcorn. The crunching sound is highly therapeutic for an overtaxed nervous system.",
    "🛑 Put down the past paper guidelines. Checking the answers every 2 seconds is ruining your flow.",
    "💪 You are strong, you are capable, and you are far more resilient than you give yourself credit for.",
    "🌌 Look up at the stars if it's night time. Remember how massive the universe is.",
    "🦥 Adopt the speed of a sloth for the next 5 minutes. Move slow, breathe slow, speak slow.",
    "🚿 Take a warm shower. Let the hot water wash away the literal and metaphorical academic sweat.",
    "📝 Break your massive study goal down into something absurdly small. Just read one paragraph.",
    "🛑 Stop comparing your study progress to that one person in your cohort who doesn't sleep.",
    "🎈 Tell yourself out loud: 'I am doing the best I can right now, and that is completely enough.'",
    "🥨 Have a quick snack. Low blood sugar mimics panic attack symptoms. Check your fuel levels.",
    "🦁 Channel your inner lion. You're entering the exam room to conquer, not to escape.",
    "🛋️ Lie upside down on your bed for 2 minutes. Get some blood flow back to that brilliant brain.",
    "🎸 Pluck a guitar string, press a piano key, or just listen to one pure instrument sound.",
    "🛑 Throw away the study schedule you made that requires you to study 14 hours a day. It’s unrealistic.",
    "🍀 Your hard work has created a reservoir of knowledge. Trust that it will appear when needed.",
    "🥛 Glass of milk or a dairy-free alternative. Classic comfort drink to settle the stomach.",
    "🧘 Posture check! You're currently slouching like a cooked shrimp. Sit up, open your chest.",
    "🎨 Doodle on a blank page for 3 minutes. Give your analytical brain a break, let the creative side take over.",
    "🛑 Don't try to memorize the whole syllabus today. Just get comfortable with one section.",
    "🧁 Treat yourself like a good friend. You wouldn't yell at your friend for being stressed, so don't yell at yourself.",
    "👟 Put on your sneakers and walk around the block once. Fresh air clears the cognitive cobwebs.",
    "🛑 Turn off your second screen. One monitor, one focus, one deep breath at a time.",
    "🌊 Imagine your thoughts are waves. Let them crash and roll away. You are the immovable shoreline.",
    "🍉 Eat something juicy and refreshing. Revitalize your sensory system instantly.",
    "🧘 Close your eyes and count backwards from 50. If you lose track, start over. Complete reset.",
    "🛑 Stop trying to predict the scaling. Focus on raw marks; the rest is out of your hands.",
    "📦 Pack your bag for tomorrow neatly. Knowing you're organized reduces baseline anxiety.",
    "🤝 Give someone in your house a quick hug, or hug a pillow. Physical touch drops cortisol levels.",
    "📝 Write down everything you know about your favorite topic just to remind yourself that you can learn things.",
    "🌙 If it's late, close the laptop right now. Sleep repairs neurons. Sleep is your secret weapon.",
    "✨ Panic sequence successfully intercepted. ClearView workspace has reset. You are completely safe and in control."
];

if (panicBtn && panicMessage) {
    panicBtn.addEventListener('click', () => {
        const randomPanic = panicQuotes[Math.floor(Math.random() * panicQuotes.length)];
        panicMessage.textContent = randomPanic;
    });
}

// 3. RAPID-FIRE MOTIVATION GENERATOR LOGIC
const quoteBtn = document.getElementById('quote-btn');
const quoteDisplay = document.getElementById('quote-display');
const quotes = [
   "\"Your ATAR does not define you, but a high Band 6 feels pretty nice.\"",
    "\"A syllabus dot point a day keeps the crippling panic away.\"",
    "\"You are significantly smarter than your trial exam scores think you are.\"",
    "\"Sleep is a valid study strategy. An exhausted brain retains absolutely nothing.\"",
    "\"In 5 years, you won't even remember the specific formulas, but you'll remember that you survived this. Keep going!\"",
    "\"The secret to getting ahead is simply getting started on that one ugly essay draft.\"",
    "\"Don't count the days left until graduation; make the days count toward your goal.\"",
    "\"Every practice paper you finish is an obstacle removed from your final exam path.\"",
    "\"Consistency beats brilliance every single day of the week. Just do the small blocks.\"",
    "\"Your future self is looking back right now, incredibly grateful that you didn't give up tonight.\"",
    "\"Action cures fear. Stop overthinking the scaling and just write the first summary paragraph.\"",
    "\"The HSC is a game of endurance, not a test of your ultimate human worth. Pace yourself.\"",
    "\"You don't need a perfect trial score to get a perfect final ATAR. The comeback arc is real.\"",
    "\"Focus on the process, and the numbers will take care of themselves. Trust the daily system.\"",
    "\"Small progress is still progress. One flashcard is infinitely better than zero flashcards.\"",
    "\"You did not come this far through school just to let NESA dictate your limits at the finish line.\"",
    "\"Believe you can pass the threshold, and you're already halfway across the line.\"",
    "\"Do it badly if you have to, just get it done. You can easily edit bad text; you can't edit blank pages.\"",
    "\"Your cohort rank is just a temporary number. Your internal work ethic is a permanent life skill.\"",
    "\"Excellence is not a single late-night cram session; it’s the habit of showing up every day.\"",
    "\"Stop looking at the mountain and start looking at your boots. Step by step gets you to the summit.\"",
    "\"An exam is just a chance to show off how hard you fought to understand something difficult.\"",
    "\"You are entirely capable of handling whatever curveball the examiners throw into Section II.\"",
    "\"The pain of discipline is temporary, but the pride of opening your dream offer is permanent.\"",
    "\"Great things are done by a series of tiny syllabus points brought together over time.\"",
    "\"Your potential is limited only by the excuses you choose to believe. Put the phone down.\"",
    "\"Study hard in silence, and let your final Band 6 results make the absolute noise.\"",
    "\"Difficult concepts take time to click. Don't mistake a slow start for a lack of intelligence.\"",
    "\"You are the author of your final marksheet. Don't let a bad week write the final chapter.\"",
    "\"The only way to fail your future is to stop trying in your present. Keep the engine running.\"",
    "\"Be stronger than your strongest procrastination excuse today. Just give it 25 solid minutes.\"",
    "\"Your brain expands every single time you struggle with a difficult practice question. Embrace the friction.\"",
    "\"An investment in your study notes pays the absolute best interest rate when November hits.\"",
    "\"The difference between an average rank and an elite rank is simply what you do when you're tired.\"",
    "\"You are building the foundation of your entire career right now. Make it structurally sound.\"",
    "\"Don't wish it were easier; wish you were more focused. Then turn that wish into an action.\"",
    "\"Energy flows where focus goes. Direct your current into your weakest module tonight.\"",
    "\"If you want to finish with pride, you have to start with purpose. Open the next tab with intent.\"",
    "\"You have the same number of hours in the day as every single 99.95 state-ranker past. Use them better.\"",
    "\"A year from now, you will wish you had started practicing your timing today.\"",
    "\"Doubt kills more academic dreams than a difficult marking guideline ever will.\"",
    "\"You don't need luck when you have an absolute mountain of comprehensive summaries behind you.\"",
    "\"The expert in any subject was once a beginner who refused to close the textbook when it got hard.\"",
    "\"Your determination is your currency. Spend it wisely on things that elevate your marks.\"",
    "\"One day of massive study won't save you, but one day of skipping study can break your momentum. Stay consistent.\"",
    "\"Set your goals high and don't stop until you see the confirmation letter in your portal.\"",
    "\"Push yourself because nobody else is going to walk into that exam room and write the response for you.\"",
    "\"Success isn't always about greatness; it's about consistency. Consistent hard work leads to high bands.\"",
    "\"Your minds is a muscle. Give it a heavy lifting session with a 4-mark question tonight.\"",
    "\"The best way to predict your final ATAR is to actively build it through your study schedule.\"",
    "\"Look back at how far you've come since Year 7. You are an academic veteran now. Act like it.\"",
    "\"Don't let what you cannot do interfere with what you can execute flawlessly right now.\"",
    "\"Opportunities don't just happen; you create them with every single practice essay draft.\"",
    "\"You don't have to love the subject; you just have to conquer the parameters of the test matrix.\"",
    "\"Your absolute best effort is always enough. Never walk away wondering 'what if I had studied?'\"",
    "\"The hard days are the most important days. Winning when it's easy is something anyone can do.\"",
    "\"A champion is defined by how they bounce back after a devastating feedback sheet from their teacher.\"",
    "\"Your dreams are worth more than a couple of hours of video game distractions. Prioritize.\"",
    "\"The only limit to your realization of tomorrow will be your doubts of your abilities today.\"",
    "\"Focus on making progress, not making things perfect. Get the rough notes down right now.\"",
    "\"If you are tired of starting over, stop giving up when the module gets complex.\"",
    "\"Work hard, stay humble, and let your final scaling score shock your entire school cohort.\"",
    "\"The path to university is paved with completed practice papers. Start laying the bricks.\"",
    "\"You are closer to the end than you are to the beginning. Give it one final, legendary push.\"",
    "\"Believe you can and you are already halfway to securing your preferred first-round offer.\"",
    "\"Your academic journey is a marathon, and you are currently entering the final stadium lap.\"",
    "\"Don't drop the ball when you're this close to the goal line. Keep sprinting.\"",
    "\"The key to success is focusing on goals, not obstacles. Forget the scaling graphs; focus on the data.\"",
    "\"Your focus is your superpower. Put the phone on do-not-disturb and unlock your true potential.\"",
    "\"There are no shortcuts to any place worth going. Band 6 requires the mileage.\"",
    "\"Every single master was once a disaster. Keep practicing your thesis statements.\"",
    "\"You are capable of geometric growth if you stop treating your limits as permanent.\"",
    "\"The only bad study session is the one that didn't happen because you were overthinking it.\"",
    "\"Be obsessed with your personal growth, and your marks will naturally follow the curve upward.\"",
    "\"Your persistence is the nightmare of every single difficult examiner at NESA.\"",
    "\"Make your study space a sanctuary of focus. Great results require clean execution spaces.\"",
    "\"You have the brains in your head and the feet in your shoes. You can steer your ATAR anywhere you choose.\"",
    "\"The harvest of your hard work will be sweet. Keep watering the seeds of knowledge tonight.\"",
    "\"Your willpower is stronger than any distractingly addictive app notification algorithm.\"",
    "\"Don't complain about the scaling if you haven't even memorized the foundational definitions yet.\"",
    "\"The countdown clock is a reminder of opportunity, not a source of fear. Use the time.\"",
    "\"You are the architect of your own future. Make sure your blueprints are thorough and detailed.\"",
    "\"Every minute of deep study is a direct investment in your long-term independence.\"",
    "\"Rise above the baseline stress of your classmates. A calm mind dominates an chaotic exam room.\"",
    "\"Your future career will thank you for the grit and determination you are showing right now.\"",
    "\"The standard you walk past is the standard you accept. Don't settle for a mediocre summary.\"",
    "\"Champions do extra work when nobody is watching. Finish that last dot point cleanly.\"",
    "\"You are not studying to pass a test; you are learning how to dominate complex intellectual fields.\"",
    "\"The finish line will feel incredibly sweet because you know exactly how hard you worked for it.\"",
    "\"Your academic threshold is far higher than your current comfort zone believes. Expand it.\"",
    "\"Do something today that your future self will look back on and celebrate with a smile.\"",
    "\"You have an incredible mind. Don't let a single bad test mark make you forget that fact.\"",
    "\"The secret to an elite performance is simply an unbroken string of boring, consistent study days.\"",
    "\"Your drive is your true differentiator. Turn the hunger for success into active practice.\"",
    "\"Don't let the fear of a bad result stop you from putting your absolute maximum effort into the ring.\"",
    "\"You are a powerhouse of potential. ClearView has logged your ambitions. Go execute the plan.\"",
    "\"One final push. One clean session. One more milestone completed. You are absolutely unstoppable.\"",
    "\"Your final ATAR is a statement of resilience. Show the system exactly what you are made of.\"",
    "\"The work is tough, but you are infinitely tougher. Close this popup and conquer the next task!\""
];

if (quoteBtn && quoteDisplay) {
    quoteBtn.addEventListener('click', () => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteDisplay.textContent = randomQuote;
    });
}

// Initial Layout Initialization
renderTasks();