// ============== Toast Notification System ==============

function showToast(message, type = 'info', title = null, duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
            ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });

    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => hideToast(toast), duration);
    }

    return toast;
}

function hideToast(toast) {
    if (!toast || toast.classList.contains('toast-hiding')) return;
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
}

// Convenience functions
const toast = {
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title || 'Error', 6000),
    warning: (msg, title) => showToast(msg, 'warning', title),
    info: (msg, title) => showToast(msg, 'info', title)
};

// ============== Loading State Helpers ==============

function setButtonLoading(button, loading = true) {
    if (!button) return;
    if (loading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        button.dataset.originalText = button.textContent;
    } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

function showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner spinner-lg"></div>
            <div class="loading-overlay-text">${escapeHtml(message)}</div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-overlay-text').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ============== Unsaved Changes Warning ==============

let hasUnsavedChanges = false;

function setUnsavedChanges(unsaved) {
    hasUnsavedChanges = unsaved;
    const indicator = document.getElementById('unsaved-indicator');
    if (indicator) {
        indicator.style.display = unsaved ? 'inline-flex' : 'none';
    }
}

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// ============== Auth & UI Functions ==============

document.addEventListener('DOMContentLoaded', () => {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Modal handling
    document.querySelectorAll('[data-modal-target]').forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.dataset.modalTarget);
            openModal(modal);
        });
    });

    document.querySelectorAll('.modal-close, .modal-background').forEach(element => {
        element.addEventListener('click', () => {
            const modal = element.closest('.modal');
            closeModal(modal);
        });
    });
});

async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        if (response.ok) {
            window.location.href = '/login';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function openModal(modal) {
    if (modal == null) return;
    modal.classList.add('is-active');
}

function closeModal(modal) {
    if (modal == null) return;
    modal.classList.remove('is-active');
}

// ============== Project/Upload Functions ==============

let selectedFile = null;

function initProjectUpload(projectId) {
    const uploadBox = document.getElementById('uploadBox');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    
    if (!uploadBox) return;

    uploadBox.addEventListener('dragover', e => e.preventDefault());
    uploadBox.addEventListener('drop', e => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelect(files[0]);
    });
    uploadBox.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    });

    document.getElementById('removeFile').addEventListener('click', () => {
        selectedFile = null;
        uploadBox.style.display = 'block';
        uploadForm.style.display = 'none';
        fileInput.value = '';
    });

    document.getElementById('uploadBtn').addEventListener('click', () => uploadFile(projectId));
}


function handleFileSelect(file) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        alert('Please select an Excel or CSV file.');
        return;
    }
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('uploadBox').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'block';
    document.getElementById('sessionName').value = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
}

async function uploadFile(projectId) {
    if (!selectedFile || !projectId) return;

    const uploadForm = document.getElementById('uploadForm');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadError = document.getElementById('uploadError');
    const progressFill = document.getElementById('progressFill');

    uploadForm.style.display = 'none';
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('session_name', document.getElementById('sessionName').value);

    try {
        const response = await fetch(`/api/projects/${projectId}/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }
        
        progressFill.style.width = '100%';
        setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
        uploadProgress.style.display = 'none';
        uploadError.style.display = 'block';
        document.getElementById('errorText').textContent = error.message;
    }
}


// ============== Rating Page Functions ==============

let currentSession = null;
let currentRows = [];
let currentIndex = 0;
let currentFilter = 'all';
let currentPage = 1;
let totalRows = 0;
let selectedRating = 0;

// Evaluation state
let evaluationType = 'rating';
let evaluationConfig = null;
let currentResponse = null;  // Stores the current evaluation response

// Multi-question mode
let useMultiQuestions = false;
let projectQuestions = [];  // Array of question definitions
let questionResponses = {};  // Object mapping question key to response

function initRating(sessionId) {
    // Load session data (this will also render the evaluation form)
    loadSession(sessionId);

    // Set up filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            currentPage = 1;
            loadRows(sessionId);
        });
    });

    // Set up navigation
    document.getElementById('prevBtn').addEventListener('click', () => navigateRow(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigateRow(1));

    // Set up action buttons
    document.getElementById('skipBtn').addEventListener('click', () => navigateRow(1));
    document.getElementById('saveBtn').addEventListener('click', () => saveRating(false));
    document.getElementById('saveNextBtn').addEventListener('click', () => saveRating(true));

    // Set up export
    document.getElementById('exportBtn').addEventListener('click', () => exportSession(sessionId));

    // Track unsaved changes on comment input
    const commentField = document.getElementById('comment');
    if (commentField) {
        commentField.addEventListener('input', () => {
            setUnsavedChanges(true);
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

async function loadSession(sessionId) {
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, { credentials: 'same-origin' });
        if (!response.ok) {
            window.location.href = '/dashboard'; // Redirect to dashboard on error
            return;
        }
        currentSession = await response.json();
        document.getElementById('sessionName').textContent = currentSession.name;
        document.getElementById('projectName').textContent = currentSession.project.name;
        document.getElementById('projectName').href = `/projects/${currentSession.project.id}`;
        document.getElementById('backLink').href = `/projects/${currentSession.project.id}`;

        // Extract evaluation settings from project
        evaluationType = currentSession.project.evaluation_type || 'rating';
        evaluationConfig = currentSession.project.evaluation_config || {};

        // Check for multi-question mode
        useMultiQuestions = currentSession.project.use_multi_questions || false;
        projectQuestions = currentSession.project.questions || [];
        questionResponses = {};

        // Display instructions if available
        if (currentSession.project.instructions) {
            const instructionsSection = document.getElementById('instructionsSection');
            const instructionsContent = document.getElementById('instructionsContent');
            if (instructionsSection && instructionsContent) {
                instructionsSection.style.display = 'block';
                instructionsContent.innerHTML = escapeHtml(currentSession.project.instructions).replace(/\n/g, '<br>');
            }
        }

        // Load annotation examples (if function exists - defined in rating.html)
        if (typeof loadAnnotationExamples === 'function') {
            loadAnnotationExamples(currentSession.project.id);
        }

        // Render the appropriate evaluation form
        renderEvaluationForm();

        updateProgress();
        loadRows(sessionId);
    } catch (error) {
        console.error('Failed to load session:', error);
        window.location.href = '/dashboard';
    }
}

function toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const toggle = document.getElementById('instructionsToggle');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}

function renderEvaluationForm() {
    const formContainer = document.getElementById('evaluationForm');
    if (!formContainer) return;

    // Check for multi-question mode
    if (useMultiQuestions && projectQuestions.length > 0) {
        renderMultiQuestionForm(formContainer);
        updateKeyboardHints();
        return;
    }

    if (evaluationType === 'rating') {
        renderRatingForm(formContainer);
    } else if (evaluationType === 'binary') {
        renderBinaryForm(formContainer);
    } else if (evaluationType === 'multi_label') {
        renderMultiLabelForm(formContainer);
    } else if (evaluationType === 'multi_criteria') {
        renderMultiCriteriaForm(formContainer);
    } else if (evaluationType === 'pairwise') {
        renderPairwiseForm(formContainer);
    } else {
        // Default to rating
        renderRatingForm(formContainer);
    }

    // Update keyboard hints for the current evaluation type
    updateKeyboardHints();
}

function updateKeyboardHints() {
    const hintsEl = document.getElementById('keyboardHints');
    if (!hintsEl) return;

    let hintsText = '←/→ to navigate • Enter to save & next';

    if (evaluationType === 'rating') {
        const min = evaluationConfig.min || 1;
        const max = evaluationConfig.max || 5;
        hintsText = `${min}-${max} to rate • ` + hintsText;
    } else if (evaluationType === 'binary') {
        const options = evaluationConfig.options || [];
        const keys = options.map(o => o.label[0].toUpperCase()).join('/');
        hintsText = `${keys} to choose • ` + hintsText;
    } else if (evaluationType === 'pairwise') {
        const allowTie = evaluationConfig.allow_tie !== false;
        hintsText = `A/B${allowTie ? '/T' : ''} to choose • ` + hintsText;
    }

    hintsEl.innerHTML = `<span>Keyboard: ${hintsText}</span>`;
}

function renderRatingForm(container) {
    const min = evaluationConfig.min || 1;
    const max = evaluationConfig.max || 5;
    const labels = evaluationConfig.labels || {};

    let starsHtml = '';
    for (let i = min; i <= max; i++) {
        starsHtml += `<button class="star" data-value="${i}">★</button>`;
    }

    container.innerHTML = `
        <div class="star-rating" id="starRating">
            ${starsHtml}
        </div>
        <div class="rating-labels" id="ratingLabels">
            <span>${escapeHtml(labels[min] || 'Poor')}</span>
            <span>${escapeHtml(labels[max] || 'Excellent')}</span>
        </div>
    `;

    // Re-attach star event listeners
    setupStarListeners();
}

function renderBinaryForm(container) {
    const options = evaluationConfig.options || [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
    ];

    const buttonsHtml = options.map(opt => `
        <button class="binary-btn" data-value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</button>
    `).join('');

    container.innerHTML = `
        <div class="binary-buttons" id="binaryButtons">
            ${buttonsHtml}
        </div>
    `;

    // Attach event listeners
    document.querySelectorAll('.binary-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.binary-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            currentResponse = { value: btn.dataset.value };
            updateButtons();
        });
    });
}

function renderMultiLabelForm(container) {
    const options = evaluationConfig.options || [];
    const minSelect = evaluationConfig.min_select || 0;
    const maxSelect = evaluationConfig.max_select;

    const checkboxesHtml = options.map(opt => `
        <label class="multi-label-option">
            <input type="checkbox" value="${escapeHtml(opt.value)}" onchange="updateMultiLabelSelection()">
            ${escapeHtml(opt.label)}
        </label>
    `).join('');

    container.innerHTML = `
        <div class="multi-label-options" id="multiLabelOptions">
            ${checkboxesHtml}
        </div>
        ${maxSelect ? `<small>Select ${minSelect} to ${maxSelect} options</small>` : ''}
    `;
}

function updateMultiLabelSelection() {
    const checkboxes = document.querySelectorAll('#multiLabelOptions input[type="checkbox"]:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);
    currentResponse = { selected: selected };
    updateButtons();
}

function renderMultiCriteriaForm(container) {
    const criteria = evaluationConfig.criteria || [];

    const criteriaHtml = criteria.map(crit => {
        const min = crit.min || 1;
        const max = crit.max || 5;
        let starsHtml = '';
        for (let i = min; i <= max; i++) {
            starsHtml += `<button class="star criteria-star" data-criterion="${escapeHtml(crit.key)}" data-value="${i}">★</button>`;
        }
        return `
            <div class="criterion-row" data-key="${escapeHtml(crit.key)}">
                <label>${escapeHtml(crit.label)}</label>
                <div class="criterion-stars">
                    ${starsHtml}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="multi-criteria-form" id="multiCriteriaForm">
            ${criteriaHtml}
        </div>
    `;

    // Initialize response object
    currentResponse = { criteria: {} };

    // Attach event listeners
    document.querySelectorAll('.criteria-star').forEach(star => {
        star.addEventListener('click', () => {
            const key = star.dataset.criterion;
            const value = parseInt(star.dataset.value);

            // Update selection for this criterion
            document.querySelectorAll(`.criteria-star[data-criterion="${key}"]`).forEach(s => {
                const sValue = parseInt(s.dataset.value);
                s.classList.toggle('active', sValue <= value);
            });

            // Update response
            if (!currentResponse) currentResponse = { criteria: {} };
            currentResponse.criteria[key] = value;

            updateButtons();
        });

        star.addEventListener('mouseenter', () => {
            const key = star.dataset.criterion;
            const value = parseInt(star.dataset.value);
            document.querySelectorAll(`.criteria-star[data-criterion="${key}"]`).forEach(s => {
                s.classList.toggle('hover', parseInt(s.dataset.value) <= value);
            });
        });

        star.addEventListener('mouseleave', () => {
            document.querySelectorAll('.criteria-star').forEach(s => s.classList.remove('hover'));
        });
    });
}

function renderPairwiseForm(container) {
    const showConfidence = evaluationConfig.show_confidence !== false;
    const allowTie = evaluationConfig.allow_tie !== false;

    let buttonsHtml = '';

    if (showConfidence) {
        // With confidence levels
        buttonsHtml = `
            <div class="pairwise-buttons">
                <div class="pairwise-side pairwise-a">
                    <button class="pairwise-btn" data-winner="a" data-confidence="much">A is much better</button>
                    <button class="pairwise-btn" data-winner="a" data-confidence="clearly">A is clearly better</button>
                    <button class="pairwise-btn" data-winner="a" data-confidence="slightly">A is slightly better</button>
                </div>
                ${allowTie ? '<button class="pairwise-btn pairwise-tie" data-winner="tie" data-confidence="none">Tie</button>' : ''}
                <div class="pairwise-side pairwise-b">
                    <button class="pairwise-btn" data-winner="b" data-confidence="slightly">B is slightly better</button>
                    <button class="pairwise-btn" data-winner="b" data-confidence="clearly">B is clearly better</button>
                    <button class="pairwise-btn" data-winner="b" data-confidence="much">B is much better</button>
                </div>
            </div>
        `;
    } else {
        // Simple A/B/Tie buttons
        buttonsHtml = `
            <div class="pairwise-buttons pairwise-simple">
                <button class="pairwise-btn pairwise-btn-large" data-winner="a" data-confidence="none">A is better</button>
                ${allowTie ? '<button class="pairwise-btn pairwise-btn-large pairwise-tie" data-winner="tie" data-confidence="none">Tie</button>' : ''}
                <button class="pairwise-btn pairwise-btn-large" data-winner="b" data-confidence="none">B is better</button>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="pairwise-form" id="pairwiseForm">
            ${buttonsHtml}
        </div>
        <div class="pairwise-hint">
            <span>Keyboard: A = A wins, B = B wins${allowTie ? ', T = Tie' : ''}</span>
        </div>
    `;

    // Attach event listeners
    document.querySelectorAll('.pairwise-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pairwise-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            currentResponse = {
                winner: btn.dataset.winner,
                confidence: btn.dataset.confidence
            };
            updateButtons();
        });
    });
}

function renderMultiQuestionForm(container) {
    // Reset responses
    questionResponses = {};

    let questionsHtml = projectQuestions.map((q, index) => {
        const conditionalAttr = q.conditional ? `data-conditional='${JSON.stringify(q.conditional)}'` : '';
        const requiredLabel = q.required ? '<span class="required-indicator">*</span>' : '';

        return `
            <div class="question-block" data-question-key="${q.key}" data-question-type="${q.question_type}" ${conditionalAttr}>
                <div class="question-header">
                    <h4>${escapeHtml(q.label)} ${requiredLabel}</h4>
                    ${q.description ? `<p class="question-description">${escapeHtml(q.description)}</p>` : ''}
                </div>
                <div class="question-form" id="question-form-${q.key}">
                    ${renderQuestionInput(q)}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="multi-question-form" id="multiQuestionForm">
            ${questionsHtml}
        </div>
        <div class="question-progress" id="questionProgress">
            <span>0 / ${projectQuestions.filter(q => q.required).length} required questions answered</span>
        </div>
    `;

    // Setup event listeners for each question
    projectQuestions.forEach(q => {
        setupQuestionListeners(q);
    });

    // Initial conditional visibility check
    updateConditionalVisibility();
}

function renderQuestionInput(question) {
    const q = question;
    const config = q.config || {};

    if (q.question_type === 'rating') {
        const min = config.min || 1;
        const max = config.max || 5;
        const labels = config.labels || {};

        let starsHtml = '';
        for (let i = min; i <= max; i++) {
            starsHtml += `<button class="star mq-star" data-question="${q.key}" data-value="${i}">★</button>`;
        }

        return `
            <div class="mq-rating">
                <div class="mq-stars">${starsHtml}</div>
                <div class="mq-labels">
                    <span>${escapeHtml(labels[min] || 'Poor')}</span>
                    <span>${escapeHtml(labels[max] || 'Excellent')}</span>
                </div>
            </div>
        `;
    } else if (q.question_type === 'binary') {
        const options = config.options || [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
        ];

        const buttonsHtml = options.map(opt => `
            <button class="mq-btn mq-binary-btn" data-question="${q.key}" data-value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</button>
        `).join('');

        return `<div class="mq-binary">${buttonsHtml}</div>`;
    } else if (q.question_type === 'multi_label') {
        const options = config.options || [];

        const checkboxesHtml = options.map(opt => `
            <label class="mq-checkbox-label">
                <input type="checkbox" class="mq-checkbox" data-question="${q.key}" data-value="${escapeHtml(opt.value)}">
                <span>${escapeHtml(opt.label)}</span>
            </label>
        `).join('');

        return `<div class="mq-multi-label">${checkboxesHtml}</div>`;
    } else if (q.question_type === 'text') {
        return `<textarea class="mq-text" data-question="${q.key}" placeholder="Enter your response..." rows="3"></textarea>`;
    }

    return `<p class="error">Unknown question type: ${q.question_type}</p>`;
}

function setupQuestionListeners(question) {
    const q = question;
    const formContainer = document.getElementById(`question-form-${q.key}`);
    if (!formContainer) return;

    if (q.question_type === 'rating') {
        const stars = formContainer.querySelectorAll('.mq-star');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                questionResponses[q.key] = { value: value };

                // Update star visual
                stars.forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.value) <= value);
                });

                updateConditionalVisibility();
                updateQuestionProgress();
                updateButtons();
            });

            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                stars.forEach(s => {
                    s.classList.toggle('hover', parseInt(s.dataset.value) <= value);
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => s.classList.remove('hover'));
            });
        });
    } else if (q.question_type === 'binary') {
        const btns = formContainer.querySelectorAll('.mq-binary-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                questionResponses[q.key] = { value: btn.dataset.value };

                updateConditionalVisibility();
                updateQuestionProgress();
                updateButtons();
            });
        });
    } else if (q.question_type === 'multi_label') {
        const checkboxes = formContainer.querySelectorAll('.mq-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const selected = Array.from(checkboxes)
                    .filter(c => c.checked)
                    .map(c => c.dataset.value);
                questionResponses[q.key] = { selected: selected };

                updateConditionalVisibility();
                updateQuestionProgress();
                updateButtons();
            });
        });
    } else if (q.question_type === 'text') {
        const textarea = formContainer.querySelector('.mq-text');
        if (textarea) {
            textarea.addEventListener('input', () => {
                questionResponses[q.key] = { text: textarea.value };
                updateQuestionProgress();
                updateButtons();
            });
        }
    }
}

function updateConditionalVisibility() {
    projectQuestions.forEach(q => {
        if (!q.conditional) return;

        const block = document.querySelector(`.question-block[data-question-key="${q.key}"]`);
        if (!block) return;

        const cond = q.conditional;
        const targetResponse = questionResponses[cond.question];

        let visible = false;

        if (cond.equals !== null && cond.equals !== undefined) {
            visible = targetResponse && targetResponse.value === cond.equals;
        } else if (cond.not_equals !== null && cond.not_equals !== undefined) {
            visible = !targetResponse || targetResponse.value !== cond.not_equals;
        } else if (cond.contains !== null && cond.contains !== undefined) {
            visible = targetResponse && targetResponse.selected && targetResponse.selected.includes(cond.contains);
        }

        block.style.display = visible ? 'block' : 'none';
        block.dataset.conditionalVisible = visible ? 'true' : 'false';
    });
}

function updateQuestionProgress() {
    const progressEl = document.getElementById('questionProgress');
    if (!progressEl) return;

    const requiredQuestions = projectQuestions.filter(q => {
        if (!q.required) return false;

        // Check if conditionally hidden
        const block = document.querySelector(`.question-block[data-question-key="${q.key}"]`);
        if (block && block.dataset.conditionalVisible === 'false') return false;

        return true;
    });

    const answeredCount = requiredQuestions.filter(q => {
        const resp = questionResponses[q.key];
        return isQuestionAnswered(q, resp);
    }).length;

    progressEl.innerHTML = `<span>${answeredCount} / ${requiredQuestions.length} required questions answered</span>`;
}

function isQuestionAnswered(question, response) {
    if (!response) return false;

    if (question.question_type === 'rating') {
        return response.value !== undefined && response.value !== null;
    } else if (question.question_type === 'binary') {
        return response.value !== undefined && response.value !== null && response.value !== '';
    } else if (question.question_type === 'multi_label') {
        const minSelect = question.config?.min_select || 0;
        return (response.selected || []).length >= minSelect;
    } else if (question.question_type === 'text') {
        return response.text && response.text.trim().length > 0;
    }

    return false;
}

function restoreMultiQuestionForm() {
    projectQuestions.forEach(q => {
        const resp = questionResponses[q.key];
        if (!resp) return;

        const formContainer = document.getElementById(`question-form-${q.key}`);
        if (!formContainer) return;

        if (q.question_type === 'rating' && resp.value) {
            const stars = formContainer.querySelectorAll('.mq-star');
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.dataset.value) <= resp.value);
            });
        } else if (q.question_type === 'binary' && resp.value) {
            const btns = formContainer.querySelectorAll('.mq-binary-btn');
            btns.forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.value === resp.value);
            });
        } else if (q.question_type === 'multi_label' && resp.selected) {
            const checkboxes = formContainer.querySelectorAll('.mq-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = resp.selected.includes(cb.dataset.value);
            });
        } else if (q.question_type === 'text' && resp.text) {
            const textarea = formContainer.querySelector('.mq-text');
            if (textarea) textarea.value = resp.text;
        }
    });

    updateConditionalVisibility();
    updateQuestionProgress();
}

function clearMultiQuestionForm() {
    questionResponses = {};

    projectQuestions.forEach(q => {
        const formContainer = document.getElementById(`question-form-${q.key}`);
        if (!formContainer) return;

        if (q.question_type === 'rating') {
            formContainer.querySelectorAll('.mq-star').forEach(s => s.classList.remove('active'));
        } else if (q.question_type === 'binary') {
            formContainer.querySelectorAll('.mq-binary-btn').forEach(btn => btn.classList.remove('selected'));
        } else if (q.question_type === 'multi_label') {
            formContainer.querySelectorAll('.mq-checkbox').forEach(cb => cb.checked = false);
        } else if (q.question_type === 'text') {
            const textarea = formContainer.querySelector('.mq-text');
            if (textarea) textarea.value = '';
        }
    });

    updateConditionalVisibility();
    updateQuestionProgress();
}

function setupStarListeners() {
    const starContainer = document.getElementById('starRating');
    const stars = document.querySelectorAll('#starRating .star');

    // Add ARIA attributes for accessibility
    if (starContainer) {
        starContainer.setAttribute('role', 'radiogroup');
        starContainer.setAttribute('aria-label', 'Rating');
    }

    stars.forEach((star, index) => {
        const value = parseInt(star.dataset.value);

        // Add ARIA attributes
        star.setAttribute('role', 'radio');
        star.setAttribute('aria-checked', 'false');
        star.setAttribute('aria-label', `${value} star${value > 1 ? 's' : ''}`);
        star.setAttribute('tabindex', index === 0 ? '0' : '-1');

        star.addEventListener('click', () => {
            selectStar(value);
        });

        star.addEventListener('keydown', (e) => {
            handleStarKeydown(e, stars, index);
        });

        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            stars.forEach(s => {
                s.classList.toggle('hover', parseInt(s.dataset.value) <= value);
            });
        });

        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hover'));
        });
    });
}

function selectStar(value) {
    selectedRating = value;
    currentResponse = { value: selectedRating };
    setUnsavedChanges(true);
    updateStars();
    updateButtons();

    // Update ARIA checked state
    document.querySelectorAll('#starRating .star').forEach(s => {
        s.setAttribute('aria-checked', parseInt(s.dataset.value) === value ? 'true' : 'false');
    });
}

function handleStarKeydown(e, stars, currentIndex) {
    let newIndex = currentIndex;

    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
            e.preventDefault();
            newIndex = Math.min(currentIndex + 1, stars.length - 1);
            break;
        case 'ArrowLeft':
        case 'ArrowDown':
            e.preventDefault();
            newIndex = Math.max(currentIndex - 1, 0);
            break;
        case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
        case 'End':
            e.preventDefault();
            newIndex = stars.length - 1;
            break;
        case ' ':
        case 'Enter':
            e.preventDefault();
            selectStar(parseInt(stars[currentIndex].dataset.value));
            return;
        default:
            return;
    }

    // Move focus and update tabindex
    stars.forEach((s, i) => {
        s.setAttribute('tabindex', i === newIndex ? '0' : '-1');
    });
    stars[newIndex].focus();
}

async function loadRows(sessionId) {
    try {
        const url = `/api/sessions/${sessionId}/rows?page=${currentPage}&per_page=1&filter=${currentFilter}`;
        const response = await fetch(url, { credentials: 'same-origin' });
        const data = await response.json();

        currentRows = data.items;
        totalRows = data.total;
        currentSession.rated_count = data.rated_count;

        updateProgress();
        updateNavigation();

        if (currentRows.length > 0) {
            displayRow(currentRows[0]);
        } else {
            const emptyMessage = currentFilter === 'unrated' 
                ? 'All rows have been rated!'
                : 'No rows to display for this filter.';
            document.getElementById('rowContent').innerHTML = `<p class="no-rows">${emptyMessage}</p>`;
            document.getElementById('ratingControls').style.display = 'none';
            document.getElementById('ratingStatus').textContent = '';
        }
    } catch (error) {
        console.error('Failed to load rows:', error);
    }
}

function displayRow(row) {
    const content = row.content;
    let contentHtml;

    if (evaluationType === 'pairwise') {
        // For pairwise, show side-by-side comparison
        const prompt = content.prompt || '';
        const responseA = content.response_a || content.Response_A || content.a || '';
        const responseB = content.response_b || content.Response_B || content.b || '';

        // Show any other fields that aren't the main comparison fields
        const otherFields = Object.entries(content)
            .filter(([key]) => !['prompt', 'response_a', 'response_b', 'Response_A', 'Response_B', 'a', 'b'].includes(key))
            .map(([key, value]) => `
                <div class="content-field">
                    <div class="field-label">${escapeHtml(key)}</div>
                    <div class="field-value">${renderFieldValue(key, value)}</div>
                </div>
            `).join('');

        contentHtml = `
            ${prompt ? `
                <div class="content-field pairwise-prompt">
                    <div class="field-label">Prompt</div>
                    <div class="field-value">${renderFieldValue('prompt', prompt)}</div>
                </div>
            ` : ''}
            ${otherFields}
            <div class="pairwise-comparison">
                <div class="pairwise-response pairwise-response-a">
                    <div class="pairwise-label">Response A</div>
                    <div class="pairwise-content">${renderFieldValue('response_a', responseA)}</div>
                </div>
                <div class="pairwise-divider"></div>
                <div class="pairwise-response pairwise-response-b">
                    <div class="pairwise-label">Response B</div>
                    <div class="pairwise-content">${renderFieldValue('response_b', responseB)}</div>
                </div>
            </div>
        `;
    } else {
        // Standard display for other evaluation types
        contentHtml = Object.entries(content).map(([key, value]) => `
            <div class="content-field">
                <div class="field-label">${escapeHtml(key)}</div>
                <div class="field-value">${renderFieldValue(key, value)}</div>
            </div>
        `).join('');
    }

    document.getElementById('rowContent').innerHTML = contentHtml;

    // Initialize video players
    if (typeof initAllVideoPlayers === 'function') initAllVideoPlayers();

    // Load any media references asynchronously
    loadMediaReferences();
    document.getElementById('rowNumber').textContent = `Row #${row.row_index}`;
    document.getElementById('ratingControls').style.display = 'block';

    // Set rating status and populate form based on existing rating
    const statusEl = document.getElementById('ratingStatus');
    if (row.my_rating) {
        statusEl.className = 'rating-status rated';
        document.getElementById('comment').value = row.my_rating.comment || '';

        // Restore previous response
        if (row.my_rating.response) {
            currentResponse = row.my_rating.response;
        } else if (row.my_rating.rating_value) {
            currentResponse = { value: row.my_rating.rating_value };
        }

        // Set status text and restore form state based on evaluation type
        if (evaluationType === 'rating') {
            selectedRating = row.my_rating.rating_value || (currentResponse?.value) || 0;
            statusEl.textContent = `Your rating: ${selectedRating}/${evaluationConfig.max || 5}`;
        } else if (evaluationType === 'binary') {
            const value = currentResponse?.value || '';
            const option = (evaluationConfig.options || []).find(o => o.value === value);
            statusEl.textContent = `Your choice: ${option?.label || value}`;
            // Restore binary selection
            document.querySelectorAll('.binary-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.value === value);
            });
        } else if (evaluationType === 'multi_label') {
            const selected = currentResponse?.selected || [];
            statusEl.textContent = `Selected: ${selected.length} option(s)`;
            // Restore multi-label selection
            document.querySelectorAll('#multiLabelOptions input[type="checkbox"]').forEach(cb => {
                cb.checked = selected.includes(cb.value);
            });
        } else if (evaluationType === 'multi_criteria') {
            const criteria = currentResponse?.criteria || {};
            const count = Object.keys(criteria).length;
            statusEl.textContent = `Rated: ${count} criterion(s)`;
            // Restore multi-criteria selection
            Object.entries(criteria).forEach(([key, value]) => {
                document.querySelectorAll(`.criteria-star[data-criterion="${key}"]`).forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.value) <= value);
                });
            });
        } else if (evaluationType === 'pairwise') {
            const winner = currentResponse?.winner || '';
            const confidence = currentResponse?.confidence || '';
            let statusText = '';
            if (winner === 'a') statusText = 'A wins';
            else if (winner === 'b') statusText = 'B wins';
            else if (winner === 'tie') statusText = 'Tie';
            if (confidence && confidence !== 'none') statusText += ` (${confidence})`;
            statusEl.textContent = `Your choice: ${statusText}`;
            // Restore pairwise selection
            document.querySelectorAll('.pairwise-btn').forEach(btn => {
                btn.classList.toggle('selected',
                    btn.dataset.winner === winner && btn.dataset.confidence === confidence);
            });
        } else {
            statusEl.textContent = 'Rated';
        }

        // Restore multi-question responses
        if (useMultiQuestions && row.my_rating.response) {
            questionResponses = { ...row.my_rating.response };
            restoreMultiQuestionForm();
            const answeredCount = Object.keys(questionResponses).length;
            statusEl.textContent = `Rated: ${answeredCount} question(s) answered`;
        }
    } else {
        statusEl.textContent = 'Not rated by you';
        statusEl.className = 'rating-status unrated';
        selectedRating = 0;
        currentResponse = null;
        questionResponses = {};
        document.getElementById('comment').value = '';

        // Clear form state
        if (useMultiQuestions) {
            clearMultiQuestionForm();
        } else if (evaluationType === 'binary') {
            document.querySelectorAll('.binary-btn').forEach(btn => btn.classList.remove('selected'));
        } else if (evaluationType === 'multi_label') {
            document.querySelectorAll('#multiLabelOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
        } else if (evaluationType === 'multi_criteria') {
            document.querySelectorAll('.criteria-star').forEach(s => s.classList.remove('active'));
        } else if (evaluationType === 'pairwise') {
            document.querySelectorAll('.pairwise-btn').forEach(btn => btn.classList.remove('selected'));
        }
    }

    // Display other raters' ratings
    displayOtherRatings(row.ratings, row.my_rating);

    updateStars();
    updateButtons();
}

function displayOtherRatings(ratings, myRating) {
    const container = document.getElementById('otherRatings');
    if (!container) return;

    // Filter out current user's rating
    const otherRatings = ratings.filter(r => !myRating || r.id !== myRating.id);

    if (otherRatings.length === 0) {
        container.innerHTML = '<p class="no-other-ratings">No other ratings yet</p>';
        return;
    }

    container.innerHTML = otherRatings.map(rating => {
        let scoreHtml = '';

        if (evaluationType === 'rating') {
            const max = evaluationConfig.max || 5;
            const value = rating.rating_value || (rating.response?.value) || 0;
            scoreHtml = `<span class="rater-score">${'★'.repeat(value)}${'☆'.repeat(max - value)}</span>`;
        } else if (evaluationType === 'binary') {
            const value = rating.response?.value || '';
            const option = (evaluationConfig.options || []).find(o => o.value === value);
            scoreHtml = `<span class="rater-choice">${escapeHtml(option?.label || value)}</span>`;
        } else if (evaluationType === 'multi_label') {
            const selected = rating.response?.selected || [];
            const labels = selected.map(v => {
                const opt = (evaluationConfig.options || []).find(o => o.value === v);
                return opt?.label || v;
            });
            scoreHtml = `<span class="rater-labels">${escapeHtml(labels.join(', '))}</span>`;
        } else if (evaluationType === 'multi_criteria') {
            const criteria = rating.response?.criteria || {};
            const items = Object.entries(criteria).map(([key, value]) => {
                const crit = (evaluationConfig.criteria || []).find(c => c.key === key);
                return `${crit?.label || key}: ${value}`;
            });
            scoreHtml = `<span class="rater-criteria">${escapeHtml(items.join(' | '))}</span>`;
        } else if (evaluationType === 'pairwise') {
            const winner = rating.response?.winner || '';
            const confidence = rating.response?.confidence || '';
            let winnerText = winner === 'a' ? 'A' : winner === 'b' ? 'B' : winner === 'tie' ? 'Tie' : '-';
            if (confidence && confidence !== 'none') {
                winnerText += ` (${confidence})`;
            }
            scoreHtml = `<span class="rater-pairwise">${escapeHtml(winnerText)}</span>`;
        } else {
            scoreHtml = `<span class="rater-score">${rating.rating_value || '-'}</span>`;
        }

        return `
            <div class="other-rating">
                <span class="rater-name">${escapeHtml(rating.rater_username || 'Unknown')}</span>
                ${scoreHtml}
                ${rating.comment ? `<span class="rater-comment">"${escapeHtml(rating.comment)}"</span>` : ''}
            </div>
        `;
    }).join('');
}

function updateStars() {
    document.querySelectorAll('.star').forEach(star => {
        const value = parseInt(star.dataset.value);
        star.classList.toggle('active', value <= selectedRating);
    });
}

function updateButtons() {
    let hasValidResponse = false;

    // Multi-question mode validation
    if (useMultiQuestions && projectQuestions.length > 0) {
        const requiredQuestions = projectQuestions.filter(q => {
            if (!q.required) return false;

            // Check if conditionally hidden
            const block = document.querySelector(`.question-block[data-question-key="${q.key}"]`);
            if (block && block.dataset.conditionalVisible === 'false') return false;

            return true;
        });

        hasValidResponse = requiredQuestions.every(q => {
            const resp = questionResponses[q.key];
            return isQuestionAnswered(q, resp);
        });
    } else if (evaluationType === 'rating') {
        hasValidResponse = selectedRating > 0;
    } else if (evaluationType === 'binary') {
        hasValidResponse = currentResponse && currentResponse.value;
    } else if (evaluationType === 'multi_label') {
        const minSelect = evaluationConfig.min_select || 0;
        const selected = currentResponse?.selected || [];
        hasValidResponse = selected.length >= minSelect;
    } else if (evaluationType === 'multi_criteria') {
        const criteria = evaluationConfig.criteria || [];
        const responses = currentResponse?.criteria || {};
        // Require all criteria to be rated
        hasValidResponse = criteria.length > 0 && Object.keys(responses).length === criteria.length;
    } else if (evaluationType === 'pairwise') {
        hasValidResponse = currentResponse && currentResponse.winner;
    } else {
        hasValidResponse = selectedRating > 0 || currentResponse;
    }

    document.getElementById('saveBtn').disabled = !hasValidResponse;
    document.getElementById('saveNextBtn').disabled = !hasValidResponse;
}

function updateProgress() {
    if (!currentSession) return;

    const rated = currentSession.rated_count;
    const total = currentSession.row_count;
    const percent = total > 0 ? Math.round((rated / total) * 100) : 0;
    const isComplete = rated >= total && total > 0;

    document.getElementById('progressText').textContent = `${rated} / ${total} rated`;
    document.getElementById('progressPercent').textContent = isComplete ? 'Complete!' : `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;

    // Add completion class for styling
    const progressSection = document.querySelector('.progress-section');
    if (progressSection) {
        progressSection.classList.toggle('progress-complete', isComplete);
    }

    // Show completion message if all done
    const completionMsg = document.getElementById('completion-message');
    if (isComplete && !completionMsg) {
        const msg = document.createElement('div');
        msg.id = 'completion-message';
        msg.className = 'completion-message';
        msg.textContent = 'All items rated! Great work.';
        const progressEl = document.querySelector('.progress-section');
        if (progressEl) {
            progressEl.parentNode.insertBefore(msg, progressEl.nextSibling);
        }
    } else if (!isComplete && completionMsg) {
        completionMsg.remove();
    }
}

function updateNavigation() {
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalRows;
    document.getElementById('pageInfo').textContent = totalRows > 0
        ? `Row ${currentPage} of ${totalRows}`
        : 'No rows';
}

function navigateRow(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalRows) {
        currentPage = newPage;
        loadRows(currentSession.id);
    }
}

async function saveRating(goNext) {
    if (currentRows.length === 0) return;

    const row = currentRows[0];
    const comment = document.getElementById('comment').value.trim();

    // Build the request body
    const requestBody = {
        data_row_id: row.id,
        session_id: currentSession.id,
        comment: comment || null
    };

    // Multi-question mode
    if (useMultiQuestions && projectQuestions.length > 0) {
        // Build response object with all question responses
        requestBody.response = { ...questionResponses };
    } else if (evaluationType === 'rating') {
        // Validate that we have a response
        if (selectedRating === 0) return;
        requestBody.rating_value = selectedRating;
        requestBody.response = { value: selectedRating };
    } else {
        // Validate that we have a response
        if (!currentResponse) return;
        requestBody.response = currentResponse;
    }

    // Show loading state on save buttons
    const saveBtn = document.getElementById('saveBtn');
    const saveNextBtn = document.getElementById('saveNextBtn');
    setButtonLoading(saveBtn, true);
    setButtonLoading(saveNextBtn, true);

    try {
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error('Failed to save rating');

        const savedRating = await response.json();

        // Clear unsaved changes flag
        setUnsavedChanges(false);

        if (!row.my_rating) {
            currentSession.rated_count++;
        }
        row.my_rating = savedRating;

        // Update or add to ratings array
        const existingIdx = row.ratings.findIndex(r => r.rater_id === savedRating.rater_id);
        if (existingIdx >= 0) {
            row.ratings[existingIdx] = savedRating;
        } else {
            row.ratings.push(savedRating);
        }

        updateProgress();

        // Show success toast (only if not going next, otherwise it's implicit)
        if (!goNext) {
            toast.success('Rating saved successfully');
        }

        if (goNext && currentPage < totalRows) {
            navigateRow(1);
        } else if (goNext && currentFilter === 'unrated') {
            loadRows(currentSession.id); // Load next unrated
        }
        else {
            displayRow(row); // Re-display current row with updated status
        }

    } catch (error) {
        console.error('Failed to save rating:', error);
        toast.error('Failed to save rating. Please try again.');
    } finally {
        // Reset button loading states
        const saveBtn = document.getElementById('saveBtn');
        const saveNextBtn = document.getElementById('saveNextBtn');
        setButtonLoading(saveBtn, false);
        setButtonLoading(saveNextBtn, false);
    }
}

function exportSession(sessionId) {
    const format = document.getElementById('exportFormat').value;
    window.location.href = `/api/sessions/${sessionId}/export?format=${format}`;
}

function handleKeyboard(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

    // Handle number keys for rating type
    if (evaluationType === 'rating') {
        const max = evaluationConfig.max || 5;
        const min = evaluationConfig.min || 1;
        const keyNum = parseInt(e.key);
        if (!isNaN(keyNum) && keyNum >= min && keyNum <= max) {
            e.preventDefault();
            selectedRating = keyNum;
            currentResponse = { value: selectedRating };
            updateStars();
            updateButtons();
        }
    }

    // Handle Y/N keys for binary type
    if (evaluationType === 'binary') {
        const options = evaluationConfig.options || [];
        const key = e.key.toLowerCase();

        // Match by first letter of value or label
        const matchedOption = options.find(o =>
            o.value.toLowerCase().startsWith(key) ||
            o.label.toLowerCase().startsWith(key)
        );

        if (matchedOption) {
            e.preventDefault();
            currentResponse = { value: matchedOption.value };
            document.querySelectorAll('.binary-btn').forEach(btn => {
                btn.classList.toggle('selected', btn.dataset.value === matchedOption.value);
            });
            updateButtons();
        }
    }

    // Handle A/B/T keys for pairwise type
    if (evaluationType === 'pairwise') {
        const key = e.key.toLowerCase();
        const allowTie = evaluationConfig.allow_tie !== false;

        if (key === 'a' || key === 'b' || (key === 't' && allowTie)) {
            e.preventDefault();
            const winner = key === 't' ? 'tie' : key;
            currentResponse = { winner: winner, confidence: 'none' };

            // Update button states
            document.querySelectorAll('.pairwise-btn').forEach(btn => {
                const isSelected = btn.dataset.winner === winner && btn.dataset.confidence === 'none';
                btn.classList.toggle('selected', isSelected);
            });
            updateButtons();
        }
    }

    // Navigation
    if (e.key === 'ArrowLeft') navigateRow(-1);
    else if (e.key === 'ArrowRight' || e.key === ' ') navigateRow(1);

    // Save on Enter (if valid response)
    if (e.key === 'Enter') {
        const saveBtn = document.getElementById('saveBtn');
        if (!saveBtn.disabled) {
            e.preventDefault();
            saveRating(true);
        }
    }
}

// ============== Media Rendering Functions ==============

/**
 * Detect the type of content in a field value
 * @param {string} value - The field value
 * @returns {object} - { type, value, mediaId }
 */
function detectContentType(value) {
    if (!value || typeof value !== 'string') {
        return { type: 'text', value: value };
    }

    const trimmed = value.trim();

    // Check for internal media reference
    if (trimmed.startsWith('media://')) {
        const mediaId = trimmed.substring(8);
        return { type: 'media_ref', value: trimmed, mediaId: mediaId };
    }

    // Check for YouTube URLs
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
        return { type: 'youtube', value: trimmed };
    }

    // Check for Vimeo URLs
    if (trimmed.includes('vimeo.com')) {
        return { type: 'vimeo', value: trimmed };
    }

    // Check for URLs with media extensions
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const lower = trimmed.toLowerCase();
        if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(lower)) {
            return { type: 'image_url', value: trimmed };
        }
        if (/\.(mp4|webm|ogg)(\?|$)/i.test(lower)) {
            return { type: 'video_url', value: trimmed };
        }
        if (/\.(mp3|wav|ogg)(\?|$)/i.test(lower)) {
            return { type: 'audio_url', value: trimmed };
        }
        if (/\.pdf(\?|$)/i.test(lower)) {
            return { type: 'pdf_url', value: trimmed };
        }
        return { type: 'url', value: trimmed };
    }

    // Check for data URLs
    if (trimmed.startsWith('data:image/')) {
        return { type: 'image_data', value: trimmed };
    }
    if (trimmed.startsWith('data:video/')) {
        return { type: 'video_data', value: trimmed };
    }
    if (trimmed.startsWith('data:audio/')) {
        return { type: 'audio_data', value: trimmed };
    }

    // Default to text
    return { type: 'text', value: trimmed };
}

/**
 * Get YouTube video ID from URL
 */
function getYoutubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

/**
 * Get Vimeo video ID from URL
 */
function getVimeoId(url) {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
}

/**
 * Render media content based on detected type
 * @param {string} value - The field value
 * @param {string} fieldKey - The field key for labeling
 * @returns {string} - HTML string for the media content
 */
function renderMediaContent(value, fieldKey) {
    const content = detectContentType(value);

    switch (content.type) {
        case 'media_ref':
            // Internal media file - render based on what we know
            return renderMediaReference(content.mediaId, fieldKey);

        case 'image_url':
        case 'image_data':
            return `
                <div class="media-container media-image">
                    <img src="${escapeHtml(content.value)}"
                         alt="${escapeHtml(fieldKey)}"
                         onclick="openMediaViewer(this.src, 'image')"
                         loading="lazy">
                </div>`;

        case 'video_url':
        case 'video_data':
            return `
                <div class="media-container media-video">
                    <video playsinline controls>
                        <source src="${escapeHtml(content.value)}">
                        Your browser does not support video playback.
                    </video>
                </div>`;

        case 'audio_url':
        case 'audio_data':
            return `
                <div class="media-container media-audio">
                    <audio controls preload="metadata">
                        <source src="${escapeHtml(content.value)}">
                        Your browser does not support audio playback.
                    </audio>
                </div>`;

        case 'youtube':
            const ytId = getYoutubeId(content.value);
            if (ytId) {
                return `
                    <div class="media-container media-video media-embed">
                        <iframe src="https://www.youtube.com/embed/${ytId}"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>
                    </div>`;
            }
            return `<a href="${escapeHtml(content.value)}" target="_blank" class="media-link">YouTube Video</a>`;

        case 'vimeo':
            const vimeoId = getVimeoId(content.value);
            if (vimeoId) {
                return `
                    <div class="media-container media-video media-embed">
                        <iframe src="https://player.vimeo.com/video/${vimeoId}"
                                frameborder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowfullscreen></iframe>
                    </div>`;
            }
            return `<a href="${escapeHtml(content.value)}" target="_blank" class="media-link">Vimeo Video</a>`;

        case 'pdf_url':
            return `
                <div class="media-container media-pdf">
                    <a href="${escapeHtml(content.value)}" target="_blank" class="pdf-link">
                        <span class="pdf-icon">📄</span>
                        <span>View PDF</span>
                    </a>
                    <iframe src="${escapeHtml(content.value)}" class="pdf-embed"></iframe>
                </div>`;

        case 'url':
            return `<a href="${escapeHtml(content.value)}" target="_blank" class="media-link">${escapeHtml(content.value)}</a>`;

        case 'text':
        default:
            return escapeHtml(content.value);
    }
}

/**
 * Render a media reference (media://id)
 */
function renderMediaReference(mediaId, fieldKey) {
    const mediaUrl = `/api/media/${mediaId}`;

    // We'll fetch info about the media file to determine type
    // For now, we'll render a placeholder that loads dynamically
    return `
        <div class="media-container media-ref" data-media-id="${escapeHtml(mediaId)}">
            <div class="media-loading">Loading media...</div>
        </div>`;
}

/**
 * Load media references in the current row
 */
async function loadMediaReferences() {
    const mediaContainers = document.querySelectorAll('.media-ref[data-media-id]');

    for (const container of mediaContainers) {
        const mediaId = container.dataset.mediaId;
        try {
            const response = await fetch(`/api/media/${mediaId}/info`, { credentials: 'same-origin' });
            if (!response.ok) {
                container.innerHTML = '<span class="media-error">Media not found</span>';
                continue;
            }

            const info = await response.json();
            const mediaUrl = info.url;

            if (info.mime_type.startsWith('image/')) {
                container.innerHTML = `
                    <img src="${escapeHtml(mediaUrl)}"
                         alt="${escapeHtml(info.original_name)}"
                         onclick="openMediaViewer(this.src, 'image')"
                         loading="lazy">`;
                container.classList.add('media-image');
            } else if (info.mime_type.startsWith('video/')) {
                container.innerHTML = `
                    <video playsinline controls>
                        <source src="${escapeHtml(mediaUrl)}" type="${escapeHtml(info.mime_type)}">
                        Your browser does not support video playback.
                    </video>`;
                container.classList.add('media-video');
                // The init function will pick this up later if it's called again, 
                // OR we can manually init Plyr here if initAllVideoPlayers was already called.
                // For simplicity, let's just let the global init function handle it or re-run it.
                // However, initAllVideoPlayers runs once after render.
                // We should probably just init Plyr on this specific element.
                // But to be consistent with the "init all" pattern:
                initAllVideoPlayers();
            } else if (info.mime_type.startsWith('audio/')) {
                container.innerHTML = `
                    <audio controls preload="metadata">
                        <source src="${escapeHtml(mediaUrl)}" type="${escapeHtml(info.mime_type)}">
                        Your browser does not support audio playback.
                    </audio>`;
                container.classList.add('media-audio');
            } else if (info.mime_type === 'application/pdf') {
                container.innerHTML = `
                    <a href="${escapeHtml(mediaUrl)}" target="_blank" class="pdf-link">
                        <span class="pdf-icon">📄</span>
                        <span>${escapeHtml(info.original_name)}</span>
                    </a>
                    <iframe src="${escapeHtml(mediaUrl)}" class="pdf-embed"></iframe>`;
                container.classList.add('media-pdf');
            } else {
                container.innerHTML = `
                    <a href="${escapeHtml(mediaUrl)}" target="_blank" class="media-download">
                        Download: ${escapeHtml(info.original_name)}
                    </a>`;
            }
        } catch (error) {
            console.error('Failed to load media:', error);
            container.innerHTML = '<span class="media-error">Failed to load media</span>';
        }
    }
}

/**
 * Open media in a lightbox/viewer
 */
function openMediaViewer(src, type) {
    const viewer = document.createElement('div');
    viewer.className = 'media-viewer-overlay';
    viewer.onclick = (e) => {
        if (e.target === viewer) viewer.remove();
    };

    let content = '';
    if (type === 'image') {
        content = `<img src="${escapeHtml(src)}" alt="Enlarged view">`;
    }

    viewer.innerHTML = `
        <div class="media-viewer-content">
            <button class="media-viewer-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            ${content}
        </div>`;

    document.body.appendChild(viewer);
}

/**
 * Render a field value with media support
 * @param {string} key - The field key
 * @param {any} value - The field value
 * @returns {string} - HTML string for the field
 */
function renderFieldValue(key, value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    // Convert to string if needed
    const strValue = String(value);

    // Check if this looks like media content
    const content = detectContentType(strValue);
    if (content.type !== 'text') {
        return renderMediaContent(strValue, key);
    }

    // Regular text - escape and preserve newlines
    return escapeHtml(strValue).replace(/\n/g, '<br>');
}

// ============== Utility Functions ==============

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ============== Video Player (Plyr) Integration ==============

let activePlyr = null;

function initAllVideoPlayers() {
    // Destroy existing player if needed to prevent duplicates (though we usually clear content)
    if (activePlyr) {
        activePlyr.destroy();
        activePlyr = null;
    }

    const videoElements = document.querySelectorAll('.media-video video');
    if (videoElements.length > 0) {
        // Initialize Plyr on the first video found (assuming one per row for now)
        // For pairwise, we might have two, but let's start with basic support
        // Actually, Plyr can handle multiple, but we need to track the "active" one for shortcuts
        
        videoElements.forEach(videoEl => {
            const player = new Plyr(videoEl, {
                controls: [
                    'play-large', 'play', 'progress', 'current-time', 'duration', 
                    'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
                ],
                speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] },
                keyboard: { focused: true, global: true }, // Enable global shortcuts for Plyr
                tooltips: { controls: true, seek: true }
            });

            // If this is the first player, mark it as active for our custom shortcuts
            if (!activePlyr) {
                activePlyr = player;
            }

            // Custom Frame Stepping (using our own shortcuts since Plyr doesn't have frame step)
            // We'll rely on the global key handler below which uses 'activePlyr'
        });
    }
}

// Helper to step frames on the active Plyr instance
function stepVideoFrame(frames) {
    if (!activePlyr) return;
    
    // Pause if playing
    if (activePlyr.playing) activePlyr.pause();

    const fps = 30; // Assumed FPS
    const frameTime = 1 / fps;
    const newTime = activePlyr.currentTime + (frames * frameTime);
    
    // Clamp to duration
    activePlyr.currentTime = Math.max(0, Math.min(activePlyr.duration, newTime));
}

// Add global key listener for frame stepping (Arrow Left/Right)
// We need to be careful not to conflict with the rating navigation (also Arrow Left/Right)
// Strategy: If Shift is held, step frames. If not, use standard rating nav.
// OR: Since the user complained about clicking, maybe standard arrows SHOULD control video if one exists?
// Let's use Shift+Arrow for Frames, and maybe simple Arrow for small seek (Plyr default) or navigation?
// The user said "can't forward it", implying standard seek was broken. Plyr fixes standard seek.
// Let's map ',' and '.' to frame step (standard NLE shortcuts) as well.

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (!activePlyr) return;

    // Frame stepping with < and > (which are , and .)
    if (e.key === ',' || e.key === '<') {
        stepVideoFrame(-1);
    } else if (e.key === '.' || e.key === '>') {
        stepVideoFrame(1);
    }
});
