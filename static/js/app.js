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
        
        updateProgress();
        loadRows(sessionId);
    } catch (error) {
        console.error('Failed to load session:', error);
        window.location.href = '/dashboard';
    }
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
    const contentHtml = Object.entries(content).map(([key, value]) => `
        <div class="content-field">
            <div class="field-label">${escapeHtml(key)}</div>
            <div class="field-value">${escapeHtml(value)}</div>
        </div>
    `).join('');

    document.getElementById('rowContent').innerHTML = contentHtml;
    document.getElementById('rowNumber').textContent = `Row #${row.row_index}`;
    document.getElementById('ratingControls').style.display = 'block';

    // Set rating status based on current user's rating
    const statusEl = document.getElementById('ratingStatus');
    if (row.my_rating) {
        statusEl.textContent = `Your rating: ${row.my_rating.rating_value}/5`;
        statusEl.className = 'rating-status rated';
        selectedRating = row.my_rating.rating_value;
        document.getElementById('comment').value = row.my_rating.comment || '';
    } else {
        statusEl.textContent = 'Not rated by you';
        statusEl.className = 'rating-status unrated';
        selectedRating = 0;
        document.getElementById('comment').value = '';
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

    container.innerHTML = otherRatings.map(rating => `
        <div class="other-rating">
            <span class="rater-name">${escapeHtml(rating.rater_username || 'Unknown')}</span>
            <span class="rater-score">${'★'.repeat(rating.rating_value)}${'☆'.repeat(5 - rating.rating_value)}</span>
            ${rating.comment ? `<span class="rater-comment">"${escapeHtml(rating.comment)}"</span>` : ''}
        </div>
    `).join('');
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data_row_id: row.id,
                session_id: currentSession.id,
                rating_value: selectedRating,
                comment: comment || null
            }),
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

    if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        selectedRating = parseInt(e.key);
        updateStars();
        updateButtons();
    }

    if (e.key === 'ArrowLeft') navigateRow(-1);
    else if (e.key === 'ArrowRight' || e.key === ' ') navigateRow(1);

    if (e.key === 'Enter' && selectedRating > 0) {
        e.preventDefault();
        saveRating(true);
    }
}

// ============== Utility Functions ==============

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
