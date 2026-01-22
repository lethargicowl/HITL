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

        // Display instructions if available
        if (currentSession.project.instructions) {
            const instructionsSection = document.getElementById('instructionsSection');
            const instructionsContent = document.getElementById('instructionsContent');
            if (instructionsSection && instructionsContent) {
                instructionsSection.style.display = 'block';
                instructionsContent.innerHTML = escapeHtml(currentSession.project.instructions).replace(/\n/g, '<br>');
            }
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

function setupStarListeners() {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            currentResponse = { value: selectedRating };
            updateStars();
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
                    <div class="field-value">${escapeHtml(value)}</div>
                </div>
            `).join('');

        contentHtml = `
            ${prompt ? `
                <div class="content-field pairwise-prompt">
                    <div class="field-label">Prompt</div>
                    <div class="field-value">${escapeHtml(prompt)}</div>
                </div>
            ` : ''}
            ${otherFields}
            <div class="pairwise-comparison">
                <div class="pairwise-response pairwise-response-a">
                    <div class="pairwise-label">Response A</div>
                    <div class="pairwise-content">${escapeHtml(responseA)}</div>
                </div>
                <div class="pairwise-divider"></div>
                <div class="pairwise-response pairwise-response-b">
                    <div class="pairwise-label">Response B</div>
                    <div class="pairwise-content">${escapeHtml(responseB)}</div>
                </div>
            </div>
        `;
    } else {
        // Standard display for other evaluation types
        contentHtml = Object.entries(content).map(([key, value]) => `
            <div class="content-field">
                <div class="field-label">${escapeHtml(key)}</div>
                <div class="field-value">${escapeHtml(value)}</div>
            </div>
        `).join('');
    }

    document.getElementById('rowContent').innerHTML = contentHtml;
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
    } else {
        statusEl.textContent = 'Not rated by you';
        statusEl.className = 'rating-status unrated';
        selectedRating = 0;
        currentResponse = null;
        document.getElementById('comment').value = '';

        // Clear form state
        if (evaluationType === 'binary') {
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

    if (evaluationType === 'rating') {
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

    document.getElementById('progressText').textContent = `${rated} / ${total} rated`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
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

    // Validate that we have a response
    if (evaluationType === 'rating' && selectedRating === 0) return;
    if (!currentResponse && evaluationType !== 'rating') return;

    const row = currentRows[0];
    const comment = document.getElementById('comment').value.trim();

    // Build the request body
    const requestBody = {
        data_row_id: row.id,
        session_id: currentSession.id,
        comment: comment || null
    };

    // Add rating_value for rating type (backward compatibility)
    if (evaluationType === 'rating') {
        requestBody.rating_value = selectedRating;
        requestBody.response = { value: selectedRating };
    } else {
        requestBody.response = currentResponse;
    }

    try {
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error('Failed to save rating');

        const savedRating = await response.json();

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
        alert('Failed to save rating. Please try again.');
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

// ============== Utility Functions ==============

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
