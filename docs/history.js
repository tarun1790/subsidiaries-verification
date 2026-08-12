document.addEventListener('DOMContentLoaded', () => {
    const historyBody = document.getElementById('history-body');
    
    // Dynamic API Base URL for GitHub Pages
    const API_BASE = window.location.hostname === 'tarun1790.github.io' ? 'http://127.0.0.1:8000' : '';
    
    // Load history immediately on page load
    loadHistory();
    
    async function loadHistory() {
        try {
            const response = await fetch(`${API_BASE}/api/history`);
            const history = await response.json();
            
            historyBody.innerHTML = '';
            
            if (history.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="6" class="history-empty" style="text-align: center; padding: 2rem; color: #a0a0a0;">No history found. Run a verification first!</td></tr>';
                return;
            }
            
            history.forEach(run => {
                const tr = document.createElement('tr');
                const hasData = (run.all_lems && run.all_lems.length > 0) || (run.incorrect_lems && run.incorrect_lems.length > 0);
                
                tr.innerHTML = `
                    <td>${new Date(run.timestamp).toLocaleString()}</td>
                    <td>${run.parent_name}</td>
                    <td>${run.file_name || run.filename}</td>
                    <td>${run.total_checked}</td>
                    <td><span style="color: #ff3333; font-weight: bold;">${run.incorrect_count}</span></td>
                    <td>
                        <a href="${API_BASE}/api/download/${run.id}?cb=${Date.now()}" class="history-dl-link">Download</a>
                        ${hasData ? `<button class="btn-details" onclick="toggleDetails('${run.id}')">View Details</button>` : ''}
                    </td>
                `;
                historyBody.appendChild(tr);
                
                if (hasData) {
                    const detailsTr = document.createElement('tr');
                    detailsTr.id = `details-${run.id}`;
                    detailsTr.className = 'details-row hidden';
                    
                    const displayData = run.all_lems || run.incorrect_lems;
                    let tableRows = displayData.map(lem => `
                        <tr>
                            <td style="border-left: 4px solid ${lem.is_match === false ? 'var(--error-color)' : (lem.is_match === true ? 'var(--success-color)' : 'transparent')}">${lem.name}</td>
                            <td>${lem.is_match !== undefined ? (lem.is_match ? 'MATCH' : 'NO MATCH') : 'NO MATCH'}</td>
                            <td>${lem.confidence ? lem.confidence.toUpperCase() : 'N/A'}</td>
                            <td>${lem.reason}</td>
                        </tr>
                    `).join('');
                    
                    detailsTr.innerHTML = `
                        <td colspan="6">
                            <div class="details-container">
                                <h4>Verification Results</h4>
                                <table class="details-table">
                                    <thead>
                                        <tr>
                                            <th>Entity Name</th>
                                            <th>Status</th>
                                            <th>Confidence</th>
                                            <th>Reasoning</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${tableRows}
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    `;
                    historyBody.appendChild(detailsTr);
                }
            });
        } catch (error) {
            console.error('Failed to load history', error);
            historyBody.innerHTML = '<tr><td colspan="6" class="history-empty" style="text-align: center; color: red;">Failed to load history.</td></tr>';
        }
    }
});

function toggleDetails(runId) {
    const detailsRow = document.getElementById(`details-${runId}`);
    if (detailsRow) {
        detailsRow.classList.toggle('hidden');
    }
}
