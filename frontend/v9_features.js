/**
 * AgriVerse v0.0.9.0 Features
 * - To-Do List Dashboard
 * - Data Entry Queue
 * - Kids SOS Button
 * - Grid Heatmap Visualization
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Khởi tạo To-Do List cho Pro Mode
    initToDoList();

    // 2. Thêm nút SOS vào Kids Mode
    initKidsSOSButton();

    // 3. Khởi tạo Sổ đo lường cuối ngày (Data Entry Queue)
    initDataEntryQueue();

    // 4. Khởi tạo Biểu đồ Phân tích Đất (Deferred to enterMode)
    // initSoilChart() is now called when the user enters Pro mode.
});

// --- To-Do List ---
function initToDoList() {
    const todoContainer = document.getElementById('pro-todo-list');
    if (!todoContainer) return;

    // Giả lập lấy dữ liệu Task từ API
    const mockTasks = [
        { id: 'T-1', title: 'Tưới nước Khu A', desc: 'Gợi ý: 200ml/cây', createdBy: 'Trợ lý nhí' },
        { id: 'T-2', title: 'Bón phân Khu B', desc: 'Gợi ý: 50g NPK', createdBy: 'Hệ thống AI' }
    ];

    let html = '<div class="v9-todo-container">';
    mockTasks.forEach(task => {
        html += `
            <div class="v9-todo-item" id="task-${task.id}">
                <input type="checkbox" class="v9-todo-checkbox" onchange="completeTask('${task.id}')">
                <div class="v9-todo-content">
                    <h4 class="v9-todo-title">${task.title} <span class="v9-todo-badge">${task.createdBy}</span></h4>
                    <p class="v9-todo-desc">${task.desc}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';

    // Thay thế nút báo cáo cũ bằng To-Do list thực tế
    todoContainer.innerHTML = html;
}

window.completeTask = function(taskId) {
    const taskEl = document.getElementById(`task-${taskId}`);
    if (taskEl) {
        taskEl.style.opacity = '0.5';
        setTimeout(() => {
            taskEl.remove();
            showToast('Đã hoàn thành nhiệm vụ! Dữ liệu đã được lưu vào Sổ đo lường.');
            // Add to data entry queue locally for demo
            pendingDataEntries.push({ id: 'DE-' + taskId, name: 'Đo độ ẩm Khu A' });
            updateDataEntryUI();
        }, 500);
    }
}

// --- Kids SOS Button ---
function initKidsSOSButton() {
    // Insert into Game Mode profile card
    const profileCard = document.querySelector('.card.game-card.profile-card');
    if (profileCard) {
        const sosBtn = document.createElement('button');
        sosBtn.className = 'v9-sos-btn';
        sosBtn.innerHTML = '🚨 Báo Động Cho Bố Mẹ!';
        sosBtn.onclick = () => {
            showToast('Đã gửi thông báo khẩn cấp đến máy của Bố/Mẹ!');
            // Play sound effect if any
        };
        profileCard.appendChild(sosBtn);
    }
}

// --- Data Entry Queue ---
let pendingDataEntries = [];

function initDataEntryQueue() {
    // Inject Modal HTML into body
    const modalHtml = `
        <div id="v9-data-entry-modal" class="v9-data-entry-modal" style="display: none;">
            <div class="v9-data-entry-content">
                <div class="v9-data-entry-header">
                    <h3>📓 Sổ Đo Lường Cuối Ngày</h3>
                    <button class="modal-close" onclick="closeDataEntryModal()">✕</button>
                </div>
                <div id="v9-data-entry-body">
                    <!-- Form input here -->
                </div>
                <button class="btn-primary btn-lg" style="width:100%" onclick="submitDataEntry()">Ghi Vào Hệ Thống</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Simulate End-of-Day popup
    setTimeout(() => {
        if (pendingDataEntries.length > 0) {
            openDataEntryModal();
        }
    }, 10000); // 10 seconds for demo purposes
}

window.openDataEntryModal = function() {
    const modal = document.getElementById('v9-data-entry-modal');
    const body = document.getElementById('v9-data-entry-body');
    if (modal && body) {
        let formHtml = '<p>Bác hãy nhập số liệu thực tế để hệ thống dự báo chính xác hơn:</p>';
        pendingDataEntries.forEach((entry, index) => {
            formHtml += `
                <div class="v9-data-input-group">
                    <label>${entry.name}</label>
                    <input type="number" id="de-input-${index}" placeholder="Nhập chỉ số (VD: 45)" />
                </div>
            `;
        });
        body.innerHTML = formHtml;
        modal.style.display = 'flex';
    }
}

window.closeDataEntryModal = function() {
    const modal = document.getElementById('v9-data-entry-modal');
    if (modal) modal.style.display = 'none';
}

window.openGlobalDataEntry = function() {
    pendingDataEntries = [
        { id: 'GLOBAL_MOISTURE', name: 'Độ ẩm trung bình tổng thể (%)' },
        { id: 'GLOBAL_TEMP', name: 'Nhiệt độ đất trung bình (°C)' }
    ];
    openDataEntryModal();
}

window.submitDataEntry = function() {
    closeDataEntryModal();
    
    // Read input values
    let avgMoisture = null;
    let avgTemp = null;
    pendingDataEntries.forEach((entry, index) => {
        const inputEl = document.getElementById(`de-input-${index}`);
        if (inputEl && inputEl.value) {
            if (entry.id === 'GLOBAL_MOISTURE') avgMoisture = parseFloat(inputEl.value);
            if (entry.id === 'GLOBAL_TEMP') avgTemp = parseFloat(inputEl.value);
        }
    });
    
    pendingDataEntries = []; // Clear queue
    
    if (avgMoisture === null) {
        showToast('Bác chưa nhập số liệu. Đã hủy cập nhật bản đồ.');
        return;
    }
    
    showToast(`Đã lưu! Hệ thống đang tiến hành nội suy (Spread Simulation) với mốc Độ ẩm ${avgMoisture}%...`);
    
    // Update map blocks
    const gridContainer = document.getElementById('pro-3d-container');
    let lowCount = 0;
    
    if (gridContainer) {
        const blocks = gridContainer.querySelectorAll('.v9-grid-cell');
        blocks.forEach(block => {
            block.classList.remove('v9-moist-low', 'v9-moist-med', 'v9-moist-high');
            
            // Nội suy: Dao động ngẫu nhiên +- 10% quanh mức trung bình
            const randOffset = (Math.random() * 20) - 10;
            const simulatedMoisture = avgMoisture + randOffset;
            
            if (simulatedMoisture < 40) {
                block.classList.add('v9-moist-low');
                lowCount++;
            } else if (simulatedMoisture > 75) {
                block.classList.add('v9-moist-high');
            } else {
                block.classList.add('v9-moist-med');
            }
        });
    }
    
    // Update AI Suggested Actions Panel
    const aiPanel = document.getElementById('ai-action-list');
    if (aiPanel) {
        if (avgMoisture < 40) {
            aiPanel.innerHTML = `
                <div style="padding: 15px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--red-400); color: var(--red-600); margin-bottom: 10px;">
                    <strong>⚠️ Báo Động Khô Hạn Toàn Trại:</strong> Độ ẩm tổng thể chỉ đạt ${avgMoisture}%. Hệ thống phát hiện ${lowCount} ô đất ở mức khô nghiêm trọng.
                </div>
                <button class="btn-primary" style="width: 100%; margin-bottom: 5px;" onclick="showToast('Đã kích hoạt hệ thống tưới toàn trại!')">💦 Bật Bơm Toàn Trại Ngay</button>
            `;
        } else if (avgMoisture > 75) {
            aiPanel.innerHTML = `
                <div style="padding: 15px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid var(--blue-400); color: var(--blue-600); margin-bottom: 10px;">
                    <strong>💧 Cảnh báo úng ngập:</strong> Độ ẩm tổng thể đạt ${avgMoisture}%. Đề xuất kiểm tra mương thoát nước.
                </div>
                <button class="btn-outline" style="width: 100%; margin-bottom: 5px;" onclick="showToast('Đang theo dõi mực nước...')">👁️ Theo dõi rãnh thoát nước</button>
            `;
        } else {
            aiPanel.innerHTML = `
                <div style="padding: 15px; border-radius: 8px; background: rgba(34, 197, 94, 0.1); border: 1px solid var(--green-400); color: var(--green-600); margin-bottom: 10px;">
                    <strong>✅ Trạng thái lý tưởng:</strong> Độ ẩm tổng thể ${avgMoisture}% rất phù hợp cho cây trồng. Trại đang phát triển tốt.
                </div>
                <button class="btn-secondary" style="width: 100%; margin-bottom: 5px;" onclick="showToast('Đã ghi vào nhật ký!')">📝 Ghi nhật ký "Trại ổn định"</button>
            `;
        }
    }
}


// --- Grid Heatmap Override for Pro Mode ---
// Hooking into existing render functions if possible.
// In v7 app.js, it might render blocks. We override the grid container.
setTimeout(() => {
    const gridContainer = document.getElementById('pro-3d-container');
    if (gridContainer) {
        // Just adding some heatmap classes to existing block items for demo
        const blocks = gridContainer.querySelectorAll('.block-item');
        blocks.forEach((block, index) => {
            block.classList.add('v9-grid-cell');
            // Fake heatmap logic based on index
            if (index % 3 === 0) block.classList.add('v9-moist-low');
            else if (index % 2 === 0) block.classList.add('v9-moist-med');
            else block.classList.add('v9-moist-high');
        });
    }
}, 2000); // Wait for app.js to render

window.soilChartInitialized = false;
window.initSoilChart = function() {
    if (window.soilChartInitialized) return;
    const ctx = document.getElementById('soilRadarChart');
    if (!ctx) return;
    
    // Only init if Chart is available
    if (typeof Chart !== 'undefined') {
        // Căn chỉnh CSS cho canvas container
        ctx.parentElement.style.position = 'relative';
        ctx.parentElement.style.height = '250px';
        ctx.parentElement.style.width = '100%';

        window.soilRadarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Độ ẩm', 'Nhiệt độ', 'Đạm (N)', 'Lân (P)', 'Kali (K)', 'pH'],
                datasets: [{
                    label: 'Chỉ số hiện tại',
                    data: [68, 45, 75, 60, 80, 50],
                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
                }, {
                    label: 'Chỉ số lý tưởng',
                    data: [70, 50, 70, 70, 70, 60],
                    backgroundColor: 'rgba(96, 165, 250, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        pointLabels: {
                            font: { family: "'Be Vietnam Pro', sans-serif", size: 11 },
                            color: '#6b7280'
                        },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: "'Be Vietnam Pro', sans-serif" } }
                    }
                }
            }
        });
        
        // Fix: Prevent multiple instantiations of the chart
        window.soilChartInitialized = true;
    } else {
        ctx.parentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Đang tải biểu đồ... (Yêu cầu kết nối mạng để tải Chart.js)</div>';
    }
}
