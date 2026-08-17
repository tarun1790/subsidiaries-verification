document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excel-file');
    const fileNameDisplay = document.getElementById('file-name');
    const form = document.getElementById('verify-form');
    const submitBtn = document.getElementById('submit-btn');
    const spinner = document.getElementById('spinner');
    const btnText = submitBtn.querySelector('span');
    
    const resultsContainer = document.getElementById('results-container');
    const totalChecked = document.getElementById('total-checked');
    const incorrectCount = document.getElementById('incorrect-count');
    const resultsList = document.getElementById('results-list');
    
    const downloadContainer = document.getElementById('download-container');
    const downloadLink = document.getElementById('download-link');
    
    let resultsChart = null; // Global chart instance
    
    // Dynamic API Base URL for GitHub Pages
    const API_BASE = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? 'http://127.0.0.1:8000' 
    : 'http://127.0.0.1:8000'; // Fallback to local server even if hosted on GH Pages
    
    // Removed unused nav logic
    
    // Update file name display when file is selected
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = e.target.files[0].name;
            fileNameDisplay.style.color = '#ffffff';
        } else {
            fileNameDisplay.textContent = 'Choose an Excel file...';
            fileNameDisplay.style.color = '#a0a0a0';
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset state
        resultsContainer.classList.add('hidden');
        downloadContainer.classList.add('hidden');
        resultsList.innerHTML = '';
        
        // UI loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Verifying...';
        spinner.classList.remove('hidden');
        
        const progressWrapper = document.getElementById('progress-wrapper');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        progressWrapper.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = 'Initializing...';
        
        const clientId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
        const formData = new FormData(form);
        formData.append('client_id', clientId);
        
        let wsUrl = API_BASE ? API_BASE.replace('http', 'ws') : `ws://${window.location.host}`;
        const ws = new WebSocket(`${wsUrl}/ws/progress/${clientId}`);
        
        const parentName = document.getElementById('parent-name').value.trim();
        
        // Initialize the Graph
        nodes = new vis.DataSet([{id: parentName, label: parentName, shape: 'box', color: '#6366f1', font: {color: 'white', size: 16}}]);
        edges = new vis.DataSet([]);
        const container = document.getElementById('network-graph');
        const graphData = { nodes: nodes, edges: edges };
        const options = {
            physics: { stabilization: false, barnesHut: { gravitationalConstant: -3000, springLength: 100 } },
            nodes: { borderWidth: 0 },
            edges: { width: 2 }
        };
        if(network) network.destroy();
        network = new vis.Network(container, graphData, options);
        
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.progress) {
                    progressBar.style.width = `${msg.progress}%`;
                }
                if (msg.step) {
                    progressText.textContent = msg.step;
                }
                if (msg.type === "entity_result") {
                    try {
                        nodes.add({
                            id: msg.entity, 
                            label: msg.entity, 
                            color: msg.is_match ? '#30a46c' : '#e5484d',
                            shape: 'dot',
                            size: msg.is_match ? 15 : 20,
                            font: { color: 'white' }
                        });
                        edges.add({
                            from: parentName, 
                            to: msg.entity, 
                            color: msg.is_match ? '#30a46c' : '#e5484d',
                            dashes: !msg.is_match
                        });
                    } catch(e) {} // Ignore duplicate nodes
                }
            } catch(e) {}
        };
        
        try {
            const response = await fetch(`${API_BASE}/api/verify`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Display results
                const total = data.total_checked;
                const incorrect = data.incorrect_lems.length;
                const correct = total - incorrect;
                
                totalChecked.textContent = total;
                incorrectCount.textContent = incorrect;
                
                // Update Chart
                const ctx = document.getElementById('resultsChart').getContext('2d');
                if (resultsChart) {
                    resultsChart.destroy();
                }
                resultsChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Match (Correct)', 'No Match (Incorrect)'],
                        datasets: [{
                            data: [correct, incorrect],
                            backgroundColor: ['#30a46c', '#e5484d'],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#ededed' }
                            }
                        }
                    }
                });
                
                // Provide download link (Always available now)
                if (data.all_lems && data.all_lems.length > 0) {
                    downloadContainer.classList.remove('hidden');
                    downloadLink.href = `${API_BASE}${data.download_url}?cb=${Date.now()}`; 
                }
                
                // (History is now loaded on the separate /history page, no need to refresh it here)
                
                if (!data.all_lems || data.all_lems.length === 0) {
                    const li = document.createElement('li');
                    li.textContent = "No entities found.";
                    resultsList.appendChild(li);
                } else {
                    data.all_lems.forEach(lemObj => {
                        const li = document.createElement('li');
                        const isMatch = lemObj.is_match;
                        
                        if (isMatch) {
                            li.style.backgroundColor = "rgba(51, 255, 51, 0.1)";
                            li.style.borderLeftColor = "var(--success-color, #2ecc71)";
                        } else {
                            li.style.backgroundColor = "rgba(255, 51, 51, 0.1)";
                            li.style.borderLeftColor = "var(--error-color, #ff4757)";
                        }
                        
                        const textDiv = document.createElement('div');
                        textDiv.classList.add('result-text');
                        
                        const title = document.createElement('strong');
                        title.textContent = `${lemObj.name} - ${isMatch ? "MATCH" : "NO MATCH"}`;
                        
                        const meta = document.createElement('p');
                        meta.style.fontSize = "0.85em";
                        meta.style.color = "#a0a0a0";
                        meta.style.marginBottom = "8px";
                        meta.textContent = `Confidence: ${lemObj.confidence ? lemObj.confidence.toUpperCase() : 'N/A'} | Evidence: ${lemObj.evidence || 'N/A'}`;
                        
                        const reason = document.createElement('p');
                        reason.classList.add('result-reason');
                        reason.textContent = lemObj.reason;
                        
                        textDiv.appendChild(title);
                        textDiv.appendChild(meta);
                        textDiv.appendChild(reason);
                        
                        li.appendChild(textDiv);
                        resultsList.appendChild(li);
                    });
                }
                
                resultsContainer.classList.remove('hidden');
            } else {
                alert('Error: ' + (data.error || 'Something went wrong'));
            }
        } catch (error) {
            alert('Network Error: Could not connect to the server.');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Verify Relationships';
            spinner.classList.add('hidden');
            
            if (typeof ws !== 'undefined' && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            setTimeout(() => {
                const progressWrapper = document.getElementById('progress-wrapper');
                if (progressWrapper) progressWrapper.classList.add('hidden');
            }, 1000);
        }
    });
});
