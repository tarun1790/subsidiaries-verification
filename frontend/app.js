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
    const incorrectList = document.getElementById('incorrect-list');
    
    const downloadContainer = document.getElementById('download-container');
    const downloadLink = document.getElementById('download-link');
    
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
        incorrectList.innerHTML = '';
        
        // UI loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Verifying...';
        spinner.classList.remove('hidden');
        
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Display results
                totalChecked.textContent = data.total_checked;
                incorrectCount.textContent = data.incorrect_lems.length;
                
                // Provide download link
                if (data.incorrect_lems.length > 0) {
                    downloadContainer.classList.remove('hidden');
                    downloadLink.href = `/api/download/${data.run_id || 'latest'}?cb=${Date.now()}`; 
                }
                
                // (History is now loaded on the separate /history page, no need to refresh it here)
                
                if (data.incorrect_lems.length === 0) {
                    const li = document.createElement('li');
                    li.textContent = "All entities are related!";
                    li.style.backgroundColor = "rgba(51, 255, 51, 0.1)";
                    li.style.borderLeftColor = "var(--success-color)";
                    li.style.setProperty('--error-color', 'var(--success-color)');
                    li.classList.add('success');
                    incorrectList.appendChild(li);
                } else {
                    data.incorrect_lems.forEach(lemObj => {
                        const li = document.createElement('li');
                        
                        const textDiv = document.createElement('div');
                        textDiv.classList.add('result-text');
                        
                        const title = document.createElement('strong');
                        title.textContent = lemObj.name;
                        
                        const reason = document.createElement('p');
                        reason.classList.add('result-reason');
                        reason.textContent = lemObj.reason;
                        
                        textDiv.appendChild(title);
                        textDiv.appendChild(reason);
                        
                        li.appendChild(textDiv);
                        incorrectList.appendChild(li);
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
            // Restore UI state
            submitBtn.disabled = false;
            btnText.textContent = 'Verify Relationships';
            spinner.classList.add('hidden');
        }
    });
});
