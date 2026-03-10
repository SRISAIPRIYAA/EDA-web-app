document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showMessage('uploadMessage', data.error, 'error');
            return;
        }
        
        showMessage('uploadMessage', 'CSV uploaded successfully!', 'success');
        
        // Update UI
        document.getElementById('rowCount').textContent = data.shape[0];
        document.getElementById('colCount').textContent = data.shape[1];
        document.getElementById('previewHead').innerHTML = data.preview_head;
        document.getElementById('previewTail').innerHTML = data.preview_tail;
        
        // Display data types
        displayDataTypes(data.dtypes);
        
        // Display missing values
        displayMissingValues(data.missing_values);
        
        // Populate column selector
        const columnSelect = document.getElementById('columnSelect');
        columnSelect.innerHTML = '<option value="">-- Select Column --</option>';
        data.columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col;
            option.textContent = col;
            columnSelect.appendChild(option);
        });
        
        // Show main content
        document.getElementById('mainContent').style.display = 'block';
        window.scrollTo(0, document.getElementById('mainContent').offsetTop);
        
    } catch (error) {
        showMessage('uploadMessage', 'Error uploading file', 'error');
    }
});

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const column = document.getElementById('columnSelect').value;
    
    if (!column) {
        alert('Please select a column');
        return;
    }
    
    try {
        const response = await fetch('/analyze-column', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ column })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error);
            return;
        }
        
        displayStats(data.stats, data.dtype);
        displayInsights(data.insights);
        displayPlots(data.plots);
        
    } catch (error) {
        console.error('Error analyzing column:', error);
    }
});

document.getElementById('dropMissingBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/drop-missing', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showMessage('cleaningMessage', data.error, 'error');
            return;
        }
        
        showMessage('cleaningMessage', data.message, 'success');
        document.getElementById('previewHead').innerHTML = data.preview_head;
        document.getElementById('previewTail').innerHTML = data.preview_tail;
        document.getElementById('rowCount').textContent = data.remaining_rows;
        displayMissingValues(data.missing_values);
        
    } catch (error) {
        showMessage('cleaningMessage', 'Error dropping missing values', 'error');
    }
});

document.getElementById('correlationBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/correlation-heatmap', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error);
            return;
        }
        
        const container = document.getElementById('heatmapContainer');
        container.innerHTML = `
            <div class="plot-container">
                <img src="data:image/png;base64,${data.plot}" alt="Correlation Heatmap">
            </div>
        `;
        
    } catch (error) {
        console.error('Error generating heatmap:', error);
    }
});

function displayStats(stats, dtype) {
    const container = document.getElementById('statsContainer');
    let html = '';
    
    for (const [key, value] of Object.entries(stats)) {
        if (value !== null) {
            const displayKey = key.replace(/_/g, ' ').toUpperCase();
            const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
            html += `
                <div class="stat-item">
                    <div class="stat-item-label">${displayKey}</div>
                    <div class="stat-item-value">${displayValue}</div>
                </div>
            `;
        }
    }
    
    container.innerHTML = `<div class="stats-grid">${html}</div>`;
}

function displayInsights(insights) {
    const container = document.getElementById('insightsContainer');
    const html = `
        <ul class="insights-list">
            ${insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
    `;
    container.innerHTML = html;
}

function displayPlots(plots) {
    const container = document.getElementById('plotsContainer');
    let html = '';
    
    for (const [name, base64] of Object.entries(plots)) {
        const title = name.replace(/_/g, ' ').toUpperCase();
        html += `
            <div class="plot-container">
                <div class="plot-title">${title}</div>
                <img src="data:image/png;base64,${base64}" alt="${title}">
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function displayDataTypes(dtypes) {
    const container = document.getElementById('datatypesReport');
    let html = '';
    
    for (const [col, dtype] of Object.entries(dtypes)) {
        html += `
            <div class="report-item">
                <span class="report-item-label">${col}</span>
                <span class="report-item-value">${dtype}</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function displayMissingValues(missingValues) {
    const container = document.getElementById('missingValuesReport');
    let html = '';
    
    for (const [col, data] of Object.entries(missingValues)) {
        html += `
            <div class="report-item">
                <span class="report-item-label">${col}</span>
                <span class="report-item-value">${data.count} (${data.percentage.toFixed(2)}%)</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message-${type}`;
}
