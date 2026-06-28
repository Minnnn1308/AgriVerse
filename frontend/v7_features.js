
// ================================================================
// V0.0.7.0 REVOLUTION FEATURES
// ================================================================

// --- 1. DARK MODE ---
function initDarkMode() {
    const isDark = localStorage.getItem('agriverse_dark_mode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark-theme');
        const btn = $('dark-mode-btn');
        if(btn) btn.innerHTML = '<span>☀️</span>';
    }
}

function toggleDarkMode() {
    const root = document.documentElement;
    root.classList.toggle('dark-theme');
    const isDark = root.classList.contains('dark-theme');
    localStorage.setItem('agriverse_dark_mode', isDark);
    
    const btn = $('dark-mode-btn');
    if(btn) {
        btn.innerHTML = isDark ? '<span>☀️</span>' : '<span>🌙</span>';
    }

    // Refresh chart if it exists
    if(window.soilRadarChart) {
        window.soilRadarChart.options.scales.r.grid.color = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
        window.soilRadarChart.options.scales.r.ticks.color = isDark ? '#fff' : '#666';
        window.soilRadarChart.options.scales.r.pointLabels.color = isDark ? '#fff' : '#666';
        window.soilRadarChart.update();
    }
}

// --- 2. PARTICLE CANVAS (Decorative Animation) ---
function initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        const count = window.innerWidth < 600 ? 15 : 30; // Ít particle trên mobile cho mượt
        for(let i=0; i<count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 3 + 1,
                speedX: Math.random() * 1 - 0.5,
                speedY: Math.random() * 1 - 0.5,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        // Only show particles in Game Mode or if we want it everywhere (let's show it everywhere but very subtle)
        if(currentMode === 'pro') {
            ctx.fillStyle = document.documentElement.classList.contains('dark-theme') ? 'rgba(255,255,255,' : 'rgba(34,197,94,';
        } else {
            ctx.fillStyle = 'rgba(245,158,11,'; // Amber for game
        }

        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = ctx.fillStyle.substring(0, ctx.fillStyle.lastIndexOf(',')) + `,${p.opacity})`;
            ctx.fill();

            p.x += p.speedX;
            p.y += p.speedY;

            if(p.x < 0) p.x = width;
            if(p.x > width) p.x = 0;
            if(p.y < 0) p.y = height;
            if(p.y > height) p.y = 0;
        });

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); createParticles(); });
    resize();
    createParticles();
    draw();
}

// --- 3. CHART.JS: SOIL RADAR ---
function initSoilRadarChart() {
    const ctx = document.getElementById('soilRadarChart');
    if(!ctx) return;
    
    const isDark = document.documentElement.classList.contains('dark-theme');
    const gridColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const textColor = isDark ? '#fff' : '#666';

    window.soilRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Nitơ (N)', 'Phốt pho (P)', 'Kali (K)', 'Độ ẩm', 'pH', 'Hữu cơ'],
            datasets: [{
                label: 'Thực trạng',
                data: [65, 59, 90, 81, 56, 40],
                fill: true,
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgb(34, 197, 94)',
                pointBackgroundColor: 'rgb(34, 197, 94)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(34, 197, 94)'
            }, {
                label: 'Tiêu chuẩn',
                data: [80, 80, 80, 70, 75, 80],
                fill: true,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: 'rgb(245, 158, 11)',
                pointBackgroundColor: 'rgb(245, 158, 11)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(245, 158, 11)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: gridColor },
                    grid: { color: gridColor },
                    pointLabels: { color: textColor, font: { family: "'Be Vietnam Pro', sans-serif" } },
                    ticks: { display: false, max: 100, min: 0 }
                }
            },
            plugins: {
                legend: { labels: { color: textColor, font: { family: "'Be Vietnam Pro', sans-serif" } } }
            }
        }
    });
}

// --- 4. SEASONAL EVENT BANNER ---
async function loadSeasonalEvent() {
    try {
        const res = await fetch(`${API_BASE}/seasonal-event`);
        if(res.ok) {
            const data = await res.json();
            const banner = $('seasonal-banner');
            if(banner) {
                banner.style.display = 'flex';
                $('seasonal-icon').innerText = data.icon;
                $('seasonal-title').innerText = `${data.season_name} (Hệ số x${data.bonus_multiplier})`;
                $('seasonal-desc').innerText = `${data.description}. Còn lại: ${data.time_remaining}`;
            }
        }
    } catch(e) { console.warn("Could not load seasonal event"); }
}

// --- 5. AI CHATBOT (RULE-BASED) ---
function toggleChatbot() {
    const modal = $('chatbot-modal');
    if(!modal) return;
    if(modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
        modal.style.transform = 'translateY(100%)';
        setTimeout(() => modal.style.transform = 'translateY(0)', 10);
        $('chatbot-input').focus();
    } else {
        modal.style.transform = 'translateY(100%)';
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function handleChatKeyPress(e) {
    if(e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const inputEl = $('chatbot-input');
    const msg = inputEl.value.trim();
    if(!msg) return;

    // Add user msg
    addChatBubble(msg, 'user-msg');
    inputEl.value = '';

    // Show typing...
    const typingId = 'typing-' + Date.now();
    addChatBubble('...', 'bot-msg', typingId);

    try {
        const res = await fetch(`${BACKEND_URL}/ai/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        
        // Remove typing
        const typingEl = $(typingId);
        if(typingEl) typingEl.remove();

        addChatBubble(data.answer, 'bot-msg');

    } catch(e) {
        const typingEl = $(typingId);
        if(typingEl) typingEl.remove();
        addChatBubble('Xin lỗi bác, trợ lý đang bận hoặc mất mạng ạ. Bác thử lại sau nhé!', 'bot-msg');
    }
}

function addChatBubble(text, className, id = null) {
    const container = $('chatbot-messages');
    const div = document.createElement('div');
    div.className = `chat-msg ${className}`;
    if(id) div.id = id;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// --- 6. ACHIEVEMENTS & LEADERBOARD & ECO-PET ---
async function loadAchievements() {
    try {
        const res = await fetch(`${API_BASE}/achievements/${USER_ID}`);
        if(!res.ok) return;
        const data = await res.json();
        const container = $('achievements-list');
        if(!container) return;
        container.innerHTML = '';
        
        data.forEach(ach => {
            const isReady = ach.progress_current >= ach.progress_target && !ach.is_claimed;
            const statusClass = ach.is_claimed ? 'claimed' : (isReady ? 'ready' : '');
            
            let btnHtml = '';
            if(isReady) {
                btnHtml = `<button class="game-btn fert" onclick="claimAchievement('${ach.achievement_id}')">Nhận thưởng</button>`;
            } else if (ach.is_claimed) {
                btnHtml = `<span style="color:var(--green-500)">✅ Xong</span>`;
            } else {
                btnHtml = `<span style="color:var(--text-muted)">${ach.progress_current}/${ach.progress_target}</span>`;
            }

            container.innerHTML += `
                <div class="achievement-item ${statusClass}" id="ach-${ach.achievement_id}">
                    <div class="achievement-icon">${ach.emoji}</div>
                    <div class="achievement-info">
                        <div class="achievement-title">${ach.name}</div>
                        <div class="achievement-desc">${ach.description}</div>
                    </div>
                    <div class="achievement-action">${btnHtml}</div>
                </div>
            `;
        });
    } catch(e) { console.warn("Failed to load achievements", e); }
}

async function claimAchievement(achId) {
    try {
        const res = await fetch(`${API_BASE}/achievements/${USER_ID}/${achId}/claim`, {method: 'POST'});
        if(res.ok) {
            const data = await res.json();
            alert(`🎉 Chúc mừng bé! ${data.message}`);
            // Update points and reload
            const pts = parseInt($('kid-points').innerText) + data.exp_gained;
            $('kid-points').innerText = pts;
            loadAchievements();
        }
    } catch(e) { console.error(e); }
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_BASE}/leaderboard`);
        if(!res.ok) return;
        const data = await res.json();
        const container = $('leaderboard-list');
        if(!container) return;
        container.innerHTML = '';

        data.forEach(user => {
            const cls = user.is_current_user ? 'current-user' : '';
            container.innerHTML += `
                <div class="lb-item ${cls}">
                    <div class="lb-rank rank-${user.rank}">${user.rank}</div>
                    <div class="lb-name">${user.name} <br><small style="color:var(--text-muted);font-weight:normal">Cấp ${user.level}</small></div>
                    <div class="lb-score">${user.score} pt</div>
                </div>
            `;
        });
    } catch(e) { console.warn("Failed to load leaderboard"); }
}

async function loadEcoPet() {
    // Mock for now, since API might need fixing
    const karma = Math.floor(Math.random() * 50) + 10;
    const loyalty = 30;
    const petAvatar = '🐉';
    const petName = 'Bé Rồng Đất';
    
    $('eco-karma').innerText = karma;
    $('pet-avatar').innerText = petAvatar;
    $('pet-name').innerText = petName;
    $('pet-loyalty-text').innerText = `${loyalty}/100`;
    $('pet-loyalty-bar').style.width = `${loyalty}%`;
}

async function feedEcoPet() {
    let karma = parseInt($('eco-karma').innerText);
    if(karma < 10) {
        alert("Bé không đủ Eco Karma! Hãy chăm sóc vườn bằng phân hữu cơ để nhận thêm nhé.");
        return;
    }
    
    karma -= 10;
    $('eco-karma').innerText = karma;
    
    const petAvatar = $('pet-avatar');
    petAvatar.style.animation = 'none';
    petAvatar.innerText = '🍖';
    
    setTimeout(() => {
        petAvatar.innerText = '🐉';
        petAvatar.style.animation = 'bounce 2s infinite';
        alert("Bé Rồng Đất rất thích đồ ăn bé cho! ❤️ Độ thân thiết tăng lên.");
        $('pet-loyalty-text').innerText = `35/100`;
        $('pet-loyalty-bar').style.width = `35%`;
    }, 1000);
}
