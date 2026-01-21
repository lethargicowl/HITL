// ============== Upload Page Functions ==============

let selectedFile = null;

function initUpload() {
    const uploadBox = document.getElementById('uploadBox');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const removeBtn = document.getElementById('removeFile');
    const tryAgainBtn = document.getElementById('tryAgain');

    // Drag and drop handlers
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // Click to upload
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Remove file
    removeBtn.addEventListener('click', () => {
        selectedFile = null;
        uploadBox.style.display = 'block';
        uploadForm.style.display = 'none';
        fileInput.value = '';
    });

    // Upload button
    uploadBtn.addEventListener('click', uploadFile);

    // Try again button
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            document.getElementById('uploadError').style.display = 'none';
            uploadBox.style.display = 'block';
        });
    }
}

function handleFileSelect(file) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        alert('Please select an Excel file (.xlsx, .xls) or CSV file (.csv)');
        return;
    }

    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('uploadBox').style.display = 'none';
    document.getElementById('uploadForm').style.display = 'block';
    document.getElementById('sessionName').value = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
}

async function uploadFile() {
    if (!selectedFile) return;

    const uploadForm = document.getElementById('uploadForm');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadError = document.getElementById('uploadError');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    uploadForm.style.display = 'none';
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('session_name', document.getElementById('sessionName').value || selectedFile.name);

    try {
        progressFill.style.width = '50%';
        progressText.textContent = 'Processing file...';

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        progressFill.style.width = '100%';
        progressText.textContent = 'Upload complete!';

        const result = await response.json();

        // Redirect to rating page
        setTimeout(() => {
            window.location.href = `/rate/${result.session_id}`;
        }, 500);

    } catch (error) {
        uploadProgress.style.display = 'none';
        uploadError.style.display = 'block';
        document.getElementById('errorText').textContent = error.message;
    }
}

async function loadSessions() {
    const sessionsList = document.getElementById('sessionsList');

    try {
        const response = await fetch('/api/sessions');
        const sessions = await response.json();

        if (sessions.length === 0) {
            sessionsList.innerHTML = '<p class="no-sessions">No sessions yet. Upload a file to get started.</p>';
            return;
        }

        sessionsList.innerHTML = sessions.map(session => {
            const progress = session.row_count > 0
                ? Math.round((session.rated_count / session.row_count) * 100)
                : 0;
            const date = new Date(session.created_at).toLocaleDateString();

            return `
                <div class="session-item">
                    <div class="session-info">
                        <h3>${escapeHtml(session.name)}</h3>
                        <p class="session-meta">${escapeHtml(session.filename)} • ${date}</p>
                    </div>
                    <div class="session-progress">
                        <div class="progress-text">${session.rated_count} / ${session.row_count} rated</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="session-actions">
                        <a href="/rate/${session.id}" class="btn-continue">Continue</a>
                        <button class="btn-delete" onclick="deleteSession('${session.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        sessionsList.innerHTML = '<p class="error">Failed to load sessions</p>';
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadSessions();
        } else {
            alert('Failed to delete session');
        }
    } catch (error) {
        alert('Failed to delete session');
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

function initRating(sessionId) {
    // Load session data
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

    // Set up star rating
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
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
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        currentSession = await response.json();
        document.getElementById('sessionName').textContent = currentSession.name;
        updateProgress();
        loadRows(sessionId);
    } catch (error) {
        console.error('Failed to load session:', error);
        window.location.href = '/';
    }
}

async function loadRows(sessionId) {
    try {
        const url = `/api/sessions/${sessionId}/rows?page=${currentPage}&per_page=1&filter=${currentFilter}`;
        const response = await fetch(url);
        const data = await response.json();

        currentRows = data.items;
        totalRows = data.total;
        currentSession.rated_count = data.rated_count;

        updateProgress();
        updateNavigation();

        if (currentRows.length > 0) {
            displayRow(currentRows[0]);
        } else {
            document.getElementById('rowContent').innerHTML = '<p class="no-sessions">No rows to display</p>';
            document.getElementById('ratingStatus').textContent = '';
        }
    } catch (error) {
        console.error('Failed to load rows:', error);
    }
}

function displayRow(row) {
    const content = row.content;
    const contentHtml = Object.entries(content).map(([key, value]) => `
        <div class="content-field">
            <div class="field-label">${escapeHtml(key)}</div>
            <div class="field-value">${escapeHtml(value)}</div>
        </div>
    `).join('');

    document.getElementById('rowContent').innerHTML = contentHtml;
    document.getElementById('rowNumber').textContent = `Row #${row.row_index}`;

    // Set rating status
    const statusEl = document.getElementById('ratingStatus');
    if (row.rating) {
        statusEl.textContent = `Rated: ${row.rating.rating_value}/5`;
        statusEl.className = 'rating-status rated';
        selectedRating = row.rating.rating_value;
        document.getElementById('comment').value = row.rating.comment || '';
    } else {
        statusEl.textContent = 'Not rated';
        statusEl.className = 'rating-status unrated';
        selectedRating = 0;
        document.getElementById('comment').value = '';
    }

    updateStars();
    updateButtons();
}

function updateStars() {
    document.querySelectorAll('.star').forEach(star => {
        const value = parseInt(star.dataset.value);
        star.classList.toggle('active', value <= selectedRating);
    });
}

function updateButtons() {
    const hasRating = selectedRating > 0;
    document.getElementById('saveBtn').disabled = !hasRating;
    document.getElementById('saveNextBtn').disabled = !hasRating;
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
    if (selectedRating === 0 || currentRows.length === 0) return;

    const row = currentRows[0];
    const comment = document.getElementById('comment').value.trim();

    try {
        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data_row_id: row.id,
                session_id: currentSession.id,
                rating_value: selectedRating,
                comment: comment || null
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save rating');
        }

        // Update local state
        if (!row.rating) {
            currentSession.rated_count++;
        }
        row.rating = await response.json();

        updateProgress();

        if (goNext && currentPage < totalRows) {
            navigateRow(1);
        } else {
            // Update status display
            const statusEl = document.getElementById('ratingStatus');
            statusEl.textContent = `Rated: ${selectedRating}/5`;
            statusEl.className = 'rating-status rated';
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
    // Ignore if typing in textarea
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return;
    }

    // Number keys 1-5 for rating
    if (e.key >= '1' && e.key <= '5') {
        selectedRating = parseInt(e.key);
        updateStars();
        updateButtons();
    }

    // Arrow keys for navigation
    if (e.key === 'ArrowLeft') {
        navigateRow(-1);
    } else if (e.key === 'ArrowRight') {
        navigateRow(1);
    }

    // Enter to save and next
    if (e.key === 'Enter' && selectedRating > 0) {
        saveRating(true);
    }
}

// ============== Utility Functions ==============

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
