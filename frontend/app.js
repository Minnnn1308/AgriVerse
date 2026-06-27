// ================================================================
// AgriVerse v0.0.6.0 - JavaScript Revolution
// Mobile-first, farmer-friendly, offline-first approach
// ================================================================

const isProd = window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost';
const BACKEND_URL = isProd ? "https://agriverse-p7sh.onrender.com" : "http://127.0.0.1:8000";

const API_BASE = `${BACKEND_URL}/gamification`;
const WEATHER_API = `${BACKEND_URL}/weather`;
const USER_ID = "J-007";
const FARM_ID = "FARM_001";
const APP_VERSION = "0.0.6.0";
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carot";

const AVATAR_PRESETS = [
    { id: "carot", label: "Cà Rốt", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Carot" },
    { id: "farmer", label: "Nông dân", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Farmer" },
    { id: "bunny", label: "Thỏ con", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bunny" },
    { id: "star", label: "Ngôi sao", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star" },
    { id: "flower", label: "Hoa", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Flower" },
    { id: "sun", label: "Mặt trời", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sun" },
    { id: "rain", label: "Mưa", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Rain" },
    { id: "corn", label: "Ngô", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Corn" },
    { id: "robot", label: "Robot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Carot" },
    { id: "pixel", label: "Pixel", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Kid" },
    { id: "cat", label: "Mèo", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cat" },
    { id: "bear", label: "Gấu", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bear" },
];

const VIETNAM_PROVINCES = [
    { name: "Hà Nội", lat: 21.0285, lng: 105.8542 },
    { name: "TP. Hồ Chí Minh", lat: 10.8231, lng: 106.6297 },
    { name: "Đà Nẵng", lat: 16.0544, lng: 108.2022 },
    { name: "Hải Phòng", lat: 20.8449, lng: 106.6881 },
    { name: "Cần Thơ", lat: 10.0452, lng: 105.7469 },
    { name: "Đắk Lắk", lat: 12.6667, lng: 108.0500 },
    { name: "Nghệ An", lat: 18.6796, lng: 105.6813 },
    { name: "Thanh Hóa", lat: 19.8067, lng: 105.7852 },
    { name: "Quảng Ninh", lat: 21.0064, lng: 107.2925 },
    { name: "Bình Dương", lat: 11.3254, lng: 106.4770 },
    { name: "Lâm Đồng", lat: 11.9404, lng: 108.4583 },
    { name: "An Giang", lat: 10.5216, lng: 105.1259 },
    { name: "Quảng Nam", lat: 15.5394, lng: 108.0191 },
    { name: "Gia Lai", lat: 13.9833, lng: 108.0000 },
    { name: "Kiên Giang", lat: 10.0125, lng: 105.0809 },
    { name: "Lào Cai", lat: 22.4809, lng: 103.9756 },
    { name: "Phú Yên", lat: 13.0882, lng: 109.0929 },
    { name: "Bình Thuận", lat: 10.9333, lng: 108.1000 },
];

let userLocation = null;
let currentAvatarUrl = DEFAULT_AVATAR;

// --- Global State ---
let farmArea = 2.5;
let farmBlocks = [];
let selectedBlockId = null;
let currentMode = 'pro'; // 'pro' or 'game'
let diaryEntries = [];

// --- DOM Shortcuts ---
const $ = id => document.getElementById(id);

// ================================================================
// LOADING & INITIALIZATION
// ================================================================

function simulateLoading() {
    let progress = 0;
    const step = 100 / (3000 / 50);
    const interval = setInterval(() => {
        progress += step + Math.random() * 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                $('loading-screen').classList.remove('active');
                // Check if first time user
                const seen = localStorage.getItem('agriverse_onboarded');
                if (!seen) {
                    $('onboarding-screen').classList.add('active');
                } else {
                    $('start-menu-screen').classList.add('active');
                }
            }, 400);
        }
        const pctEl = $('loading-pct');
        const barEl = $('loading-bar');
        if (pctEl) pctEl.innerText = Math.floor(progress);
        if (barEl) barEl.style.width = `${progress}%`;

        const textEl = $('loading-text');
        if (textEl) {
            if (progress > 30 && progress < 60) textEl.innerText = "Tải dữ liệu nông trại...";
            else if (progress >= 60 && progress < 90) textEl.innerText = "Chuẩn bị bản đồ ruộng...";
            else if (progress >= 90) textEl.innerText = "Sẵn sàng!";
        }
    }, 50);
}

async function init() {
    simulateLoading();

    // Load profile
    try {
        await loadProfile();
    } catch (e) {
        console.warn("Offline mode - profile:", e);
        updateProfileUI({ full_name: "Bé Cà Rốt", current_level: 1, total_points: 0 });
    }

    // Load quests
    try {
        await loadQuests();
    } catch (e) {
        console.warn("Offline mode - quests:", e);
        renderOfflineQuests();
    }

    // Load farm
    await loadFarmBlocks();

    // Init sub-systems
    initSandbox('pro');
    initSandbox('game');
    initInventory();
    initCoins();
    renderShop();
    initAgriCatalog();
    initDiary();
    initAvatarPicker();
    initProvinceSelect();
    initLocationAndWeather();
}

// ================================================================
// ONBOARDING
// ================================================================

let onboardingStep = 1;

function nextOnboardingSlide() {
    onboardingStep++;
    if (onboardingStep > 4) {
        skipOnboarding();
        return;
    }
    updateOnboardingUI();
    if (onboardingStep === 4) {
        $('onboarding-next-btn').innerText = "Bắt đầu sử dụng! 🚀";
    }
}

function skipOnboarding() {
    localStorage.setItem('agriverse_onboarded', 'true');
    $('onboarding-screen').classList.remove('active');
    $('start-menu-screen').classList.add('active');
}

function updateOnboardingUI() {
    document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.onboarding-dots .dot').forEach(d => d.classList.remove('active'));
    const slide = document.querySelector(`.onboarding-slide[data-step="${onboardingStep}"]`);
    const dot = document.querySelector(`.dot[data-step="${onboardingStep}"]`);
    if (slide) slide.classList.add('active');
    if (dot) dot.classList.add('active');
}

// ================================================================
// NAVIGATION
// ================================================================

function enterMode(mode) {
    currentMode = mode;
    $('start-menu-screen').classList.remove('active');
    $('main-app-screen').classList.add('active');

    document.querySelectorAll('.mode-container').forEach(c => c.classList.remove('active'));

    if (mode === 'pro') {
        $('pro-mode-container').classList.add('active');
        $('pro-bottom-nav').style.display = 'flex';
        $('game-bottom-nav').style.display = 'none';
    } else {
        $('game-mode-container').classList.add('active');
        $('pro-bottom-nav').style.display = 'none';
        $('game-bottom-nav').style.display = 'flex';
    }
}

function goToStartMenu() {
    $('main-app-screen').classList.remove('active');
    $('start-menu-screen').classList.add('active');
}

function switchProTab(tab, btn) {
    document.querySelectorAll('#pro-mode-container .tab-page').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#pro-bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    $(`pro-tab-${tab}`).classList.add('active');
    btn.classList.add('active');
}

function switchGameTab(tab, btn) {
    document.querySelectorAll('#game-mode-container .tab-page').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#game-bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
    $(`game-tab-${tab}`).classList.add('active');
    btn.classList.add('active');
}

// ================================================================
// PROFILE
// ================================================================

async function loadProfile() {
    const res = await fetch(`${API_BASE}/profile/${USER_ID}`);
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    updateProfileUI(data);
}

function updateProfileUI(profile) {
    const nameEl = $('kid-name');
    const lvlEl = $('kid-level');
    const ptsEl = $('kid-points');
    const barEl = $('exp-bar');
    const avatarEl = $('kid-avatar');

    if (nameEl) nameEl.innerText = profile.full_name;
    if (lvlEl) lvlEl.innerText = profile.current_level;
    if (ptsEl) {
        const current = parseInt(ptsEl.innerText) || 0;
        animateValue(ptsEl, current, profile.total_points, 800);
    }
    if (barEl) barEl.style.width = `${Math.min(profile.total_points, 100)}%`;

    const avatarUrl = profile.avatar_url || localStorage.getItem('agriverse_avatar') || DEFAULT_AVATAR;
    currentAvatarUrl = avatarUrl;
    if (avatarEl) avatarEl.src = avatarUrl;
}

function animateValue(el, start, end, duration) {
    let startTs = null;
    const step = (ts) => {
        if (!startTs) startTs = ts;
        const progress = Math.min((ts - startTs) / duration, 1);
        el.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

// ================================================================
// QUESTS
// ================================================================

async function loadQuests() {
    const res = await fetch(`${API_BASE}/quests`);
    if (!res.ok) throw new Error("API Error");
    const quests = await res.json();
    renderQuests(quests);
}

function renderOfflineQuests() {
    const quests = [
        { quest_id: 'q_water', title: '🌱 Tưới nước buổi sáng', description: 'Tưới nước cho 5 ô đất đang khô hạn.', reward_points: 20 },
        { quest_id: 'q_pest', title: '🐛 Diệt sâu bảo vệ cây', description: 'Bắt sâu trên các ô đất bị nhiễm.', reward_points: 30 },
        { quest_id: 'q_fert', title: '🌿 Bón phân cho cây', description: 'Bón phân bổ sung dinh dưỡng cho 3 ô đất.', reward_points: 25 }
    ];
    renderQuests(quests);
}

function renderQuests(quests) {
    const list = $('quests-list');
    if (!list) return;
    list.innerHTML = '';
    quests.forEach(q => {
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.innerHTML = `
            <div class="quest-info">
                <h4>${q.title}</h4>
                <p>${q.description}</p>
                <div class="quest-reward">⭐ +${q.reward_points} EXP</div>
            </div>
            <button class="btn-complete" onclick="completeQuest('${q.quest_id}', '${q.title}', this)">
                Xong ✓
            </button>
        `;
        list.appendChild(card);
    });
}

async function completeQuest(questId, title, btn) {
    btn.disabled = true;
    btn.innerText = "...";
    try {
        const res = await fetch(`${API_BASE}/complete-quest/${USER_ID}/${questId}`, { method: "POST" });
        const data = await res.json();
        if (data.status === "info") { alert(data.message); btn.innerText = "Xong ✓"; return; }
        updateProfileUI({ full_name: $('kid-name').innerText, current_level: data.current_level, total_points: data.current_points });
        btn.innerText = "Đã xong!";
        addProNotification(`🔔 Hoàn thành: [${title}] (+${data.reward_points} EXP)`);
        addCoins(data.reward_points);
        if (data.level_up) alert(`🎉 LÊN CẤP! Level ${data.current_level}!`);
    } catch (e) {
        console.warn("Offline quest complete:", e);
        btn.innerText = "Đã xong!";
        addCoins(20);
        addProNotification(`[Offline] ✅ ${title}`);
    }
}

// ================================================================
// NOTIFICATIONS / LOG
// ================================================================

function addProNotification(msg) {
    const logEl = $('pro-notifications');
    if (!logEl) return;
    if (logEl.innerHTML.includes("Đang chờ kết nối")) logEl.innerHTML = '';
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    entry.innerHTML = `<span class="log-time">[${time}]</span><span>${msg}</span>`;
    logEl.insertBefore(entry, logEl.firstChild);
}

// ================================================================
// FARM BLOCKS & FIELD MAP
// ================================================================

function evaluateBlockState(moisture, temp, n, p, k, ph, humidity, pest, light) {
    if (pest > 30) return 'PEST';
    if (moisture < 50) return 'THIRSTY';
    if (moisture > 85) return 'WATERLOGGED';
    if (ph < 5.0) return 'ACIDIC';
    if (temp > 35) return 'HEAT_STRESSED';
    if (n < 50 || p < 50 || k < 50) return 'NUTRIENT_DEFICIENT';
    if (n > 80 && p > 80 && k > 80 && moisture >= 60 && moisture <= 80 && pest < 10) return 'READY_TO_HARVEST';
    return 'HEALTHY';
}

async function loadFarmBlocks() {
    try {
        const res = await fetch(`${API_BASE}/farm-detail/${FARM_ID}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        farmArea = data.area_size;
        farmBlocks = data.blocks.map(b => ({
            block_id: b.block_id,
            mock_crop_status: b.crop_status || 'HEALTHY',
            mock_soil_moisture: b.soil_moisture || 70,
            mock_temperature: b.temperature || 25,
            mock_n: b.n || 80, mock_p: b.p || 80, mock_k: b.k || 80,
            mock_ph: b.ph || 6.2, mock_humidity: b.humidity || 75,
            mock_pest: b.pest || 5, mock_light: b.light || 80,
            user_crop_status: null, user_soil_moisture: null, user_temperature: null,
            user_n: null, user_p: null, user_k: null, user_ph: null,
            user_humidity: null, user_pest: null, user_light: null,
            has_user_data: false,
            crop_status: b.crop_status || 'HEALTHY',
            soil_moisture: b.soil_moisture || 70,
            temperature: b.temperature || 25,
            fertilizer_level: b.fertilizer_level || 80
        }));
    } catch (e) {
        console.warn("Offline farmblocks:", e);
        addProNotification("⚠️ Offline Mode - Dữ liệu giả lập");
        farmArea = 10;
        farmBlocks = [];
        for (let i = 0; i < 50; i++) {
            const m = Math.random() > 0.85 ? Math.floor(25 + Math.random() * 20) : Math.floor(55 + Math.random() * 25);
            const t = Math.floor(18 + Math.random() * 16);
            const n = Math.random() > 0.95 ? Math.floor(20 + Math.random() * 20) : Math.floor(60 + Math.random() * 35);
            const p = Math.random() > 0.95 ? Math.floor(20 + Math.random() * 20) : Math.floor(60 + Math.random() * 35);
            const k = Math.random() > 0.95 ? Math.floor(20 + Math.random() * 20) : Math.floor(60 + Math.random() * 35);
            const ph = Math.random() > 0.93 ? 3.5 + Math.random() * 1.3 : 5.5 + Math.random() * 1.8;
            const hum = Math.floor(50 + Math.random() * 45);
            const pest = Math.random() > 0.9 ? Math.floor(35 + Math.random() * 40) : Math.floor(Math.random() * 15);
            const light = Math.floor(40 + Math.random() * 60);
            const status = evaluateBlockState(m, t, n, p, k, ph, hum, pest, light);
            farmBlocks.push({
                block_id: `${FARM_ID}_B_${Math.floor(i/10)}_${i%10}`,
                mock_crop_status: status, mock_soil_moisture: m, mock_temperature: t,
                mock_n: n, mock_p: p, mock_k: k, mock_ph: ph,
                mock_humidity: hum, mock_pest: pest, mock_light: light,
                user_crop_status: null, user_soil_moisture: null, user_temperature: null,
                user_n: null, user_p: null, user_k: null, user_ph: null,
                user_humidity: null, user_pest: null, user_light: null,
                has_user_data: false,
                crop_status: status, soil_moisture: m, temperature: t,
                fertilizer_level: Math.floor((n + p + k) / 3)
            });
        }
    } finally {
        const areaInput = $("pro-area-input");
        if (areaInput) areaInput.value = farmArea;
        convertUnit('pro', 'ha', farmArea);
        updateBlockSizeTexts();
        renderGrids();
        updateFarmSummary();
    }
}

function updateBlockSizeTexts() {
    const ha = (farmArea / 50).toFixed(3);
    const m2 = (farmArea * 10000 / 50).toFixed(0);
    const t1 = $("pro-block-size-text");
    const t2 = $("pro-block-size-m2-text");
    if (t1) t1.innerText = ha;
    if (t2) t2.innerText = m2;
}

function updateFarmSummary() {
    let healthy = 0, warning = 0, danger = 0, harvest = 0;
    farmBlocks.forEach(b => {
        const s = b.has_user_data ? b.user_crop_status : b.mock_crop_status;
        if (s === 'HEALTHY') healthy++;
        else if (s === 'THIRSTY' || s === 'WATERLOGGED' || s === 'ACIDIC' || s === 'NUTRIENT_DEFICIENT' || s === 'HEAT_STRESSED') warning++;
        else if (s === 'PEST') danger++;
        else if (s === 'READY_TO_HARVEST') harvest++;
        else healthy++;
    });
    const sh = $('sum-healthy'); if (sh) sh.innerText = healthy;
    const sw = $('sum-warning'); if (sw) sw.innerText = warning;
    const sd = $('sum-danger'); if (sd) sd.innerText = danger;
    const shv = $('sum-harvest'); if (shv) shv.innerText = harvest;
}

// ================================================================
// GRID RENDERING
// ================================================================

function renderGrids() {
    renderGrid('pro');
    renderGrid('game');
}

function renderGrid(mode) {
    const containerId = mode === 'pro' ? 'pro-3d-container' : 'game-3d-container';
    const container = $(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.className = mode === 'pro' ? 'field-grid-container' : 'game-field-grid-container';

    const grid = document.createElement('div');
    grid.className = mode === 'pro' ? 'farm-2d-grid' : 'game-2d-grid';

    farmBlocks.forEach(block => {
        const cell = document.createElement('div');
        const shortId = block.block_id.split('_').slice(-2).join('_');
        const activeStatus = block.has_user_data ? block.user_crop_status : block.mock_crop_status;

        cell.className = `${mode === 'pro' ? 'grid-cell' : 'game-cell'} status-${activeStatus.toLowerCase()}`;
        cell.dataset.id = block.block_id;
        if (block.block_id === selectedBlockId) cell.classList.add('selected');

        let emoji = '🌳';
        if (activeStatus === 'THIRSTY') emoji = '🍂';
        else if (activeStatus === 'WATERLOGGED') emoji = '💧';
        else if (activeStatus === 'ACIDIC') emoji = '🧪';
        else if (activeStatus === 'NUTRIENT_DEFICIENT') emoji = '🥀';
        else if (activeStatus === 'PEST') emoji = '🐛';
        else if (activeStatus === 'HEAT_STRESSED') emoji = '🔥';
        else if (activeStatus === 'READY_TO_HARVEST') emoji = '✨';

        cell.innerHTML = `<span class="cell-id">${shortId}</span><span class="cell-emoji">${emoji}</span>`;
        cell.onclick = () => selectBlock(block.block_id);
        grid.appendChild(cell);
    });

    container.appendChild(grid);
}

// ================================================================
// BLOCK SELECTION
// ================================================================

function selectBlock(blockId) {
    selectedBlockId = blockId;

    // Highlight
    document.querySelectorAll('.grid-cell, .game-cell').forEach(c => {
        c.classList.toggle('selected', c.dataset.id === blockId);
    });

    const block = farmBlocks.find(b => b.block_id === blockId);
    if (!block) return;

    const shortId = blockId.split('_').slice(-2).join('_');

    // Pro Mode detail
    const proPanel = $('pro-block-detail-panel');
    if (proPanel) {
        proPanel.style.display = 'block';
        $('pro-detail-block-id').innerText = `Ô Đất: ${shortId}`;

        const fields = ['moisture','temp','n','p','k','ph','humidity','pest','light'];
        const mockKeys = ['mock_soil_moisture','mock_temperature','mock_n','mock_p','mock_k','mock_ph','mock_humidity','mock_pest','mock_light'];
        const userKeys = ['user_soil_moisture','user_temperature','user_n','user_p','user_k','user_ph','user_humidity','user_pest','user_light'];

        fields.forEach((f, i) => {
            const slider = $(`input-${f}`);
            if (slider) slider.value = block.has_user_data ? block[userKeys[i]] : block[mockKeys[i]];
        });

        const actionBtns = $('pro-action-buttons-container');
        if (actionBtns) actionBtns.style.display = block.has_user_data ? 'grid' : 'none';

        onCauseVariableChange();
    }

    // Game Mode detail
    const gamePanel = $('game-block-detail-panel');
    if (gamePanel) {
        gamePanel.style.display = 'block';
        $('game-detail-block-id').innerText = `Ô đất: ${shortId}`;

        const activeStatus = block.has_user_data ? block.user_crop_status : block.mock_crop_status;
        const activeMoisture = block.has_user_data ? block.user_soil_moisture : block.mock_soil_moisture;
        const activeTemp = block.has_user_data ? block.user_temperature : block.mock_temperature;
        const activeN = block.has_user_data ? block.user_n : block.mock_n;
        const activeP = block.has_user_data ? block.user_p : block.mock_p;
        const activeK = block.has_user_data ? block.user_k : block.mock_k;
        const activePh = block.has_user_data ? block.user_ph : block.mock_ph;

        const statusMap = {
            'HEALTHY': { emoji: '🌳', text: 'Cây đang xanh tốt! 🌳', color: '#16a34a' },
            'THIRSTY': { emoji: '🍂', text: 'Cây khát nước, tưới mau! 💧', color: '#d97706' },
            'WATERLOGGED': { emoji: '💧', text: 'Đất bị ngập úng! 🛟', color: '#3b82f6' },
            'ACIDIC': { emoji: '🧪', text: 'Đất bị chua phèn! 🧪', color: '#eab308' },
            'NUTRIENT_DEFICIENT': { emoji: '🥀', text: 'Cây thiếu dinh dưỡng! 🥀', color: '#64748b' },
            'PEST': { emoji: '🐛', text: 'Có sâu ăn lá! 🐛', color: '#ef4444' },
            'HEAT_STRESSED': { emoji: '🔥', text: 'Sốc nhiệt! 🥵', color: '#dc2626' },
            'READY_TO_HARVEST': { emoji: '✨', text: 'Thu hoạch ngay! 🍒', color: '#a855f7' }
        };

        const info = statusMap[activeStatus] || statusMap['HEALTHY'];
        $('game-detail-plant-avatar').innerText = info.emoji;
        const statusEl = $('game-detail-status');
        statusEl.innerText = info.text;
        statusEl.style.color = info.color;

        $('game-detail-moisture').innerText = `${activeMoisture}%`;
        $('game-detail-temp').innerText = `${activeTemp}°C`;
        $('game-detail-fert').innerText = `N${activeN}% P${activeP}% K${activeK}%`;
    }
}

// ================================================================
// BLOCK ACTIONS
// ================================================================

async function executeBlockAction(mode, action) {
    if (!selectedBlockId) { alert("Chọn ô đất trước!"); return; }

    try {
        const res = await fetch(`${API_BASE}/block/${selectedBlockId}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action })
        });
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        const idx = farmBlocks.findIndex(b => b.block_id === selectedBlockId);
        if (idx !== -1) {
            const b = farmBlocks[idx];
            Object.assign(b, {
                user_crop_status: data.block.crop_status,
                user_soil_moisture: data.block.soil_moisture,
                user_temperature: data.block.temperature,
                user_n: data.block.n || 85, user_p: data.block.p || 85, user_k: data.block.k || 85,
                user_ph: data.block.ph || 6.5, user_humidity: data.block.humidity || 75,
                user_pest: data.block.pest || 0, user_light: data.block.light || 80,
                has_user_data: true
            });
        }
    } catch (e) {
        // Offline mode
        const idx = farmBlocks.findIndex(b => b.block_id === selectedBlockId);
        if (idx !== -1) {
            const b = farmBlocks[idx];
            if (!b.has_user_data) {
                b.user_soil_moisture = b.mock_soil_moisture; b.user_temperature = b.mock_temperature;
                b.user_n = b.mock_n; b.user_p = b.mock_p; b.user_k = b.mock_k;
                b.user_ph = b.mock_ph; b.user_humidity = b.mock_humidity;
                b.user_pest = b.mock_pest; b.user_light = b.mock_light;
                b.has_user_data = true;
            }
            if (action === 'water') b.user_soil_moisture = Math.min(100, (b.user_soil_moisture || 50) + 20);
            else if (action === 'fertilize') { b.user_n = Math.min(100, (b.user_n || 50) + 25); b.user_p = Math.min(100, (b.user_p || 50) + 25); b.user_k = Math.min(100, (b.user_k || 50) + 25); }
            else if (action === 'treat_pest') b.user_pest = 0;
            b.user_crop_status = evaluateBlockState(b.user_soil_moisture, b.user_temperature, b.user_n, b.user_p, b.user_k, b.user_ph, b.user_humidity, b.user_pest, b.user_light);
        }
    }

    const shortId = selectedBlockId.split('_').slice(-2).join('_');
    const actionVN = action === 'water' ? 'Tưới nước' : action === 'fertilize' ? 'Bón phân' : 'Trị sâu';
    addProNotification(`⚡ ${actionVN} ô ${shortId}`);

    renderGrids();
    selectBlock(selectedBlockId);
    updateTodoList();
    updateFarmSummary();
}

// ================================================================
// CAUSE-EFFECT ANALYSIS
// ================================================================

function onCauseVariableChange() {
    const vals = {};
    ['moisture','temp','n','p','k','ph','humidity','pest','light'].forEach(f => {
        const el = $(`input-${f}`);
        vals[f] = el ? (f === 'ph' ? parseFloat(el.value) : parseInt(el.value)) : 0;
    });

    $('val-moisture').innerText = `${vals.moisture}%`;
    $('val-temp').innerText = `${vals.temp}°C`;
    $('val-n').innerText = `${vals.n}%`;
    $('val-p').innerText = `${vals.p}%`;
    $('val-k').innerText = `${vals.k}%`;
    $('val-ph').innerText = vals.ph.toFixed(1);
    $('val-humidity').innerText = `${vals.humidity}%`;
    $('val-pest').innerText = `${vals.pest}%`;
    $('val-light').innerText = `${vals.light}%`;

    const status = evaluateBlockState(vals.moisture, vals.temp, vals.n, vals.p, vals.k, vals.ph, vals.humidity, vals.pest, vals.light);

    const statusEl = $('pro-evaluated-status');
    if (statusEl) {
        const map = {
            'HEALTHY': { text: '🌳 Khỏe mạnh', cls: 'healthy' },
            'THIRSTY': { text: '🍂 Khô hạn', cls: 'thirsty' },
            'WATERLOGGED': { text: '💧 Ngập úng', cls: 'waterlogged' },
            'ACIDIC': { text: '🧪 Chua phèn', cls: 'acidic' },
            'NUTRIENT_DEFICIENT': { text: '🥀 Thiếu chất', cls: 'nutrient_deficient' },
            'PEST': { text: '🐛 Sâu bệnh', cls: 'pest' },
            'HEAT_STRESSED': { text: '🔥 Sốc nhiệt', cls: 'heat_stressed' },
            'READY_TO_HARVEST': { text: '✨ Thu hoạch', cls: 'ready' }
        };
        const info = map[status] || map['HEALTHY'];
        statusEl.innerText = info.text;
        statusEl.className = `status-tag ${info.cls}`;
    }
}

function saveBlockUserData() {
    if (!selectedBlockId) { alert("Chọn ô đất trước!"); return; }
    const block = farmBlocks.find(b => b.block_id === selectedBlockId);
    if (!block) return;

    const m = parseInt($('input-moisture').value);
    const t = parseInt($('input-temp').value);
    const n = parseInt($('input-n').value);
    const p = parseInt($('input-p').value);
    const k = parseInt($('input-k').value);
    const ph = parseFloat($('input-ph').value);
    const hum = parseInt($('input-humidity').value);
    const pest = parseInt($('input-pest').value);
    const light = parseInt($('input-light').value);

    const status = evaluateBlockState(m, t, n, p, k, ph, hum, pest, light);

    Object.assign(block, {
        user_crop_status: status, user_soil_moisture: m, user_temperature: t,
        user_n: n, user_p: p, user_k: k, user_ph: ph,
        user_humidity: hum, user_pest: pest, user_light: light,
        has_user_data: true, crop_status: status, soil_moisture: m,
        temperature: t, fertilizer_level: Math.floor((n + p + k) / 3)
    });

    const shortId = selectedBlockId.split('_').slice(-2).join('_');
    addProNotification(`📝 Cập nhật ô ${shortId}: pH ${ph.toFixed(1)}, Ẩm ${m}%`);

    renderGrids();
    selectBlock(selectedBlockId);
    updateTodoList();
    updateFarmSummary();
    alert(`Đã lưu dữ liệu ô ${shortId}!`);
}

// ================================================================
// TODO LIST
// ================================================================

function updateTodoList() {
    const el = $('pro-todo-list');
    if (!el) return;
    el.innerHTML = '';

    const userBlocks = farmBlocks.filter(b => b.has_user_data);
    if (userBlocks.length === 0) {
        el.innerHTML = '<div class="todo-empty"><span>📋</span><p>Chưa có dữ liệu. Vào <strong>Bản Đồ Ruộng</strong> và nhập số liệu!</p></div>';
        return;
    }

    const tasks = [];
    const statusTasks = {
        'THIRSTY': { emoji: '💦', title: 'Tưới nước chống khô hạn', desc: 'Độ ẩm dưới 50%. Cần tưới ngay!', urgent: true },
        'WATERLOGGED': { emoji: '🚜', title: 'Thoát nước chống ngập', desc: 'Độ ẩm trên 85%. Khơi rãnh thoát nước!', urgent: true },
        'ACIDIC': { emoji: '🧂', title: 'Bón vôi khử chua', desc: 'pH dưới 5.0. Bón vôi bột nâng pH!', urgent: false },
        'NUTRIENT_DEFICIENT': { emoji: '🌿', title: 'Bón phân bổ sung', desc: 'NPK thấp. Cần bón phân dinh dưỡng!', urgent: false },
        'PEST': { emoji: '🐛', title: 'Trị sâu bệnh hại', desc: 'Mật độ sâu cao. Phun thuốc trừ sâu!', urgent: true },
        'HEAT_STRESSED': { emoji: '🕸️', title: 'Che nắng giảm nhiệt', desc: 'Nhiệt độ trên 35°C. Cần che nắng!', urgent: false },
        'READY_TO_HARVEST': { emoji: '🧺', title: 'Thu hoạch ngay', desc: 'Cây đã chín. Thu hoạch sớm!', urgent: false }
    };

    const grouped = {};
    userBlocks.forEach(b => {
        const s = b.user_crop_status;
        if (statusTasks[s]) {
            if (!grouped[s]) grouped[s] = [];
            grouped[s].push(b.block_id.split('_').slice(-2).join('_'));
        }
    });

    Object.entries(grouped).forEach(([status, ids]) => {
        const info = statusTasks[status];
        const item = document.createElement('div');
        item.className = `todo-item${info.urgent ? ' urgent' : ''}`;
        item.innerHTML = `
            <span class="todo-emoji">${info.emoji}</span>
            <div class="todo-info">
                <div class="todo-title">${info.title}: ${ids.join(', ')}</div>
                <div class="todo-desc">${info.desc}</div>
            </div>
        `;
        el.appendChild(item);
    });
}

// ================================================================
// UNIT CONVERTER
// ================================================================

function convertUnit(mode, unitType, value) {
    const val = parseFloat(value);
    const proHa = $("pro-conv-ha"), proM2 = $("pro-conv-m2");

    if (isNaN(val) || val < 0) return;

    if (unitType === 'ha') {
        if (proHa) proHa.value = val;
        if (proM2) proM2.value = Math.round(val * 10000);
    } else {
        if (proM2) proM2.value = val;
        if (proHa) proHa.value = parseFloat((val / 10000).toFixed(4));
    }
}

function applyRegionalUnit(mode, sizeInM2) {
    const proM2 = $("pro-conv-m2");
    if (proM2) proM2.value = sizeInM2;
    convertUnit(mode, 'm2', sizeInM2);
}

function updateFarmArea(mode) {
    const input = $(`${mode}-area-input`);
    if (!input) return;
    const newArea = parseFloat(input.value);
    if (isNaN(newArea) || newArea <= 0) { alert("Nhập diện tích hợp lệ!"); return; }
    farmArea = newArea;
    updateBlockSizeTexts();
    convertUnit(mode, 'ha', farmArea);
    addProNotification(`🔧 Cập nhật diện tích: ${farmArea} ha`);
    alert("Đã lưu diện tích!");
}

// ================================================================
// FARMING DIARY
// ================================================================

function initDiary() {
    const saved = localStorage.getItem('agriverse_diary');
    if (saved) {
        try { diaryEntries = JSON.parse(saved); } catch(e) { diaryEntries = []; }
    }
    renderDiary();
}

function quickLog(type) {
    const emojiMap = { water: '💦', fertilize: '🌿', spray: '💨', weed: '🌾', harvest: '🧺', other: '📋' };
    const nameMap = { water: 'Tưới nước', fertilize: 'Bón phân', spray: 'Phun thuốc', weed: 'Làm cỏ', harvest: 'Thu hoạch', other: 'Việc khác' };

    let note = '';
    if (type === 'other') {
        note = prompt('Ghi chú công việc:');
        if (!note) return;
    }

    const entry = {
        id: Date.now(),
        type,
        emoji: emojiMap[type],
        name: type === 'other' ? note : nameMap[type],
        time: new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    };

    diaryEntries.unshift(entry);
    if (diaryEntries.length > 50) diaryEntries = diaryEntries.slice(0, 50);
    localStorage.setItem('agriverse_diary', JSON.stringify(diaryEntries));
    renderDiary();
    addProNotification(`📝 Ghi nhật ký: ${entry.name}`);
}

function deleteDiaryEntry(id) {
    diaryEntries = diaryEntries.filter(e => e.id !== id);
    localStorage.setItem('agriverse_diary', JSON.stringify(diaryEntries));
    renderDiary();
}

function renderDiary() {
    const list = $('diary-list');
    if (!list) return;
    list.innerHTML = '';

    if (diaryEntries.length === 0) {
        list.innerHTML = '<div class="diary-empty"><span>📝</span><p>Chưa có ghi chép nào. Bấm các nút phía trên!</p></div>';
        return;
    }

    diaryEntries.forEach(e => {
        const div = document.createElement('div');
        div.className = 'diary-entry';
        div.innerHTML = `
            <span class="de-icon">${e.emoji}</span>
            <div class="de-info">
                <div class="de-title">${e.name}</div>
                <div class="de-time">${e.time}</div>
            </div>
            <button class="de-delete" onclick="deleteDiaryEntry(${e.id})">🗑️</button>
        `;
        list.appendChild(div);
    });
}

// ================================================================
// SANDBOX / LAB SIMULATOR
// ================================================================

const SB_RULES = {
    soils: {
        bazan: { name: "Đất đỏ Bazan", basePH: 5.5, waterRating: 3, nutrientRating: 4, pestBase: 10, price: 15000000 },
        catpha: { name: "Đất cát pha", basePH: 5.8, waterRating: 1, nutrientRating: 2, pestBase: 5, price: 8000000 },
        set: { name: "Đất sét", basePH: 5.2, waterRating: 5, nutrientRating: 4, pestBase: 12, price: 12000000 },
        phusa: { name: "Đất phù sa", basePH: 6.2, waterRating: 3, nutrientRating: 5, pestBase: 8, price: 20000000 },
        phen: { name: "Đất phèn chua", basePH: 3.8, waterRating: 3, nutrientRating: 3, pestBase: 15, price: 6000000 }
    },
    crops: {
        robusta: { name: "Cà phê Robusta", idealSoil: "bazan", waterReq: 3, fertReq: 3, baseYield: 3.5, pricePerKg: 85000, emoji: "☕" },
        arabica: { name: "Cà phê Arabica", idealSoil: "bazan", waterReq: 4, fertReq: 4, baseYield: 2.0, pricePerKg: 160000, emoji: "🌸" },
        tieuvinhlinh: { name: "Hồ tiêu", idealSoil: "bazan", waterReq: 3, fertReq: 4, baseYield: 2.5, pricePerKg: 140000, emoji: "🌶️" },
        macca: { name: "Mắc ca", idealSoil: "phusa", waterReq: 2, fertReq: 3, baseYield: 3.0, pricePerKg: 90000, emoji: "🌰" },
        saurieng: { name: "Sầu riêng Ri6", idealSoil: "phusa", waterReq: 5, fertReq: 5, baseYield: 12.0, pricePerKg: 75000, emoji: "👑" }
    },
    fertilizers: {
        huuco: { pHMod: 0.1, nutrientAdd: 10, pricePerKg: 4500 },
        npk: { pHMod: -0.3, nutrientAdd: 30, pricePerKg: 18000 },
        viluong: { pHMod: 0.0, nutrientAdd: 8, pricePerKg: 90000 },
        chuong: { pHMod: 0.1, nutrientAdd: 12, pricePerKg: 2000 },
        voibot: { pHMod: 1.2, nutrientAdd: 0, pricePerKg: 1500 }
    },
    products: {
        nhantho: { priceMult: 1.0, processingCost: 0 },
        botnguyenchat: { priceMult: 2.2, processingCost: 40000 },
        tieuso: { priceMult: 1.8, processingCost: 30000 },
        maccasay: { priceMult: 1.5, processingCost: 20000 },
        sauriengsay: { priceMult: 4.5, processingCost: 120000 }
    },
    equipments: {
        none: { waterSaving: 0, pestDetect: 0, installCost: 0 },
        sensor: { waterSaving: 0.10, pestDetect: 0.30, installCost: 15000000 },
        drip: { waterSaving: 0.40, pestDetect: 0.05, installCost: 25000000 },
        shade: { waterSaving: 0.15, pestDetect: 0.00, installCost: 8000000 },
        tractor: { waterSaving: 0.05, pestDetect: 0.00, installCost: 12000000 }
    }
};

let sandboxState = {
    pro: { active: false, month: 0, goal:'profit', soil:'bazan', crop:'robusta', fertilizer:'huuco', product:'nhantho', equipment:'none', grid: Array(9).fill('empty'), ph: 5.5, pest: 10, waterEff: 100, profit: 0, score: 0 },
    game: { active: false, month: 0, goal:'profit', soil:'bazan', crop:'robusta', fertilizer:'huuco', product:'nhantho', equipment:'none', grid: Array(9).fill('empty'), ph: 5.5, pest: 10, waterEff: 100, profit: 0, score: 0 }
};

function initSandbox(mode) {
    const s = sandboxState[mode];
    s.active = false; s.month = 0; s.grid = Array(9).fill('empty');
    const nb = $(`${mode}-sb-next-btn`); if (nb) nb.disabled = true;
    $(`${mode}-sb-month`).innerText = "0";
    $(`${mode}-sb-phase`).innerText = mode === 'pro' ? "Chuẩn bị đất" : "Chuẩn bị gieo hạt";
    $(`${mode}-sb-score`).innerText = "0";
    $(`${mode}-sb-score-bar`).style.width = "0%";
    $(`${mode}-sb-profit`).innerText = mode === 'pro' ? "0 VNĐ/ha" : "0 xu";
    $(`${mode}-sb-soil-health`).innerText = mode === 'pro' ? "Chưa đo" : "Đất trống";
    $(`${mode}-sb-pest-risk`).innerText = mode === 'pro' ? "0%" : "Chưa có";
    $(`${mode}-sb-resource`).innerText = "100%";
    $(`${mode}-sb-advice`).innerText = mode === 'pro' ? 'Chọn cấu hình và bấm "Bắt đầu".' : 'Chọn giống cây rồi bấm "TRỒNG!" nhé bé!';
    renderSandboxGrid(mode);
}

function renderSandboxGrid(mode) {
    const el = $(`${mode}-sandbox-grid`);
    if (!el) return;
    el.innerHTML = '';
    const s = sandboxState[mode];
    const cropInfo = SB_RULES.crops[s.crop];
    s.grid.forEach(cs => {
        const cell = document.createElement('div');
        cell.className = `sandbox-cell ${cs}`;
        let emoji = '🟫';
        if (cs === 'seed') emoji = '🌱';
        else if (cs === 'growing') emoji = '🌿';
        else if (cs === 'dry') emoji = '🍂';
        else if (cs === 'pest') emoji = '🐛';
        else if (cs === 'harvest') emoji = cropInfo ? cropInfo.emoji : '🍒';
        cell.innerText = emoji;
        el.appendChild(cell);
    });
}

function startSandboxSim(mode) {
    const s = sandboxState[mode];
    s.active = true; s.month = 0;
    s.goal = $(`${mode}-sb-goal`).value;
    s.soil = $(`${mode}-sb-soil`).value;
    s.crop = $(`${mode}-sb-crop`).value;
    s.fertilizer = $(`${mode}-sb-fertilizer`).value;
    s.product = $(`${mode}-sb-product`).value;
    s.equipment = $(`${mode}-sb-equipment`).value;
    s.ph = SB_RULES.soils[s.soil].basePH;
    s.pest = SB_RULES.soils[s.soil].pestBase;
    s.grid = Array(9).fill('seed');
    const nb = $(`${mode}-sb-next-btn`); if (nb) nb.disabled = false;
    if (mode === 'pro') addProNotification(`🔬 Mô phỏng bắt đầu: ${s.goal}`);
    updateSandboxIndicators(mode);
}

function advanceSandboxMonth(mode) {
    const s = sandboxState[mode];
    if (!s.active) return;
    s.month++;
    const soil = SB_RULES.soils[s.soil];
    const crop = SB_RULES.crops[s.crop];
    const fert = SB_RULES.fertilizers[s.fertilizer];

    s.ph += fert.pHMod;
    if (s.soil === 'phen' && s.fertilizer === 'voibot' && s.month === 1) s.ph = 5.2;

    let pestInc = 3;
    if (s.fertilizer === 'npk') pestInc += 5;
    if (s.equipment === 'sensor') pestInc -= 4;
    s.pest = Math.max(0, Math.min(100, s.pest + pestInc));

    s.grid = s.grid.map(cs => {
        if (cs === 'dry' || cs === 'pest') return cs;
        let dryChance = 0;
        if (soil.waterRating <= 1 && crop.waterReq >= 4 && s.equipment !== 'drip') dryChance = 0.25;
        if (soil.waterRating >= 5 && crop.waterReq <= 2 && s.equipment !== 'shade') dryChance = 0.15;
        if (s.soil === 'phen' && s.fertilizer !== 'voibot' && s.month >= 2 && Math.random() < 0.35) return 'dry';
        if (Math.random() < dryChance) return 'dry';
        if (Math.random() < s.pest / 250) return 'pest';
        if (s.month >= 6) return 'harvest';
        if (s.month >= 3) return 'growing';
        return 'seed';
    });

    if (s.month >= 6) {
        const nb = $(`${mode}-sb-next-btn`); if (nb) nb.disabled = true;
        if (mode === 'game') {
            const coins = Math.floor(s.score * 1.5);
            addCoins(coins);
            alert(`🎉 Hoàn thành! Điểm: ${s.score}% | +${coins} Xu!`);
        }
    }
    updateSandboxIndicators(mode);
}

function resetSandbox(mode) { initSandbox(mode); }

function updateSandboxIndicators(mode) {
    const s = sandboxState[mode];
    const soil = SB_RULES.soils[s.soil];
    const crop = SB_RULES.crops[s.crop];
    const fert = SB_RULES.fertilizers[s.fertilizer];
    const prod = SB_RULES.products[s.product];
    const equip = SB_RULES.equipments[s.equipment];

    s.waterEff = Math.floor(100 + equip.waterSaving * 100);
    let live = s.grid.filter(c => c !== 'dry' && c !== 'pest').length;
    let yieldFactor = live / 9;
    let match = 1.0;
    if (crop.idealSoil === s.soil) match += 0.2;
    if (s.ph < 5.0 || s.ph > 7.0) match -= 0.3;
    let actualYield = crop.baseYield * yieldFactor * Math.max(0.2, match);
    let cost = soil.price + crop.pricePerKg * 100 + fert.pricePerKg * 500 + equip.installCost;
    let revenue = (actualYield * 1000 * crop.pricePerKg * prod.priceMult) - (prod.processingCost * actualYield * 1000);
    s.profit = Math.max(-cost, Math.floor(revenue - cost));

    let score = 0;
    if (s.goal === 'profit') score = Math.min(100, Math.max(0, Math.floor((s.profit / (mode === 'pro' ? 250000000 : 200000000)) * 100)));
    else if (s.goal === 'organic') score = Math.min(100, Math.floor((s.fertilizer === 'huuco' || s.fertilizer === 'chuong' ? 30 : 0) + (s.ph >= 5.5 && s.ph <= 6.5 ? 30 : 0) + yieldFactor * 40 - (s.fertilizer === 'npk' ? 40 : 0)));
    else if (s.goal === 'resilience') score = Math.min(100, Math.floor(((s.equipment === 'sensor' || s.equipment === 'shade') ? 30 : 0) + ((s.soil === 'bazan' || s.soil === 'phusa') ? 30 : 10) + yieldFactor * 40));
    else if (s.goal === 'conservation') score = Math.min(100, Math.floor((s.equipment === 'drip' ? 40 : 10) + (crop.waterReq <= 2 ? 30 : 10) + (s.equipment === 'sensor' ? 30 : 0)));
    s.score = Math.max(0, score);

    $(`${mode}-sb-month`).innerText = s.month;
    let phase = s.month === 0 ? 'Chuẩn bị' : s.month >= 6 ? 'Thu hoạch!' : 'Sinh trưởng';
    $(`${mode}-sb-phase`).innerText = `${phase} (${s.month}/6)`;
    $(`${mode}-sb-score`).innerText = s.score;
    $(`${mode}-sb-score-bar`).style.width = `${s.score}%`;

    if (mode === 'pro') {
        $('pro-sb-profit').innerText = s.profit.toLocaleString('vi-VN') + " VNĐ/ha";
        $('pro-sb-soil-health').innerText = `pH ${s.ph.toFixed(1)} (${s.ph < 5.0 ? 'Chua' : s.ph > 7.0 ? 'Kiềm' : 'Tốt'})`;
        $('pro-sb-pest-risk').innerText = `${s.pest}% ${s.pest > 30 ? '⚠️' : ''}`;
        $('pro-sb-resource').innerText = `${s.waterEff}%`;
    } else {
        $('game-sb-profit').innerText = Math.max(0, Math.floor(s.profit / 1000)).toLocaleString() + " xu";
        $('game-sb-soil-health').innerText = `pH ${s.ph.toFixed(1)}`;
        $('game-sb-pest-risk').innerText = `${100 - s.pest}% khỏe`;
        $('game-sb-resource').innerText = s.waterEff >= 140 ? "Rất tốt 🌟" : "Bình thường";
    }

    generateSandboxAdvice(mode);
    renderSandboxGrid(mode);
}

function generateSandboxAdvice(mode) {
    const s = sandboxState[mode];
    let advices = [];
    const isPro = mode === 'pro';

    if (s.soil === 'phen' && s.fertilizer !== 'voibot') {
        advices.push(isPro ? "⚠️ Đất phèn chua (pH < 4.0): Cần bón Vôi bột nâng pH!" : "🧙‍♂️ Đất chua quá! Bón vôi bột trắng để cây khỏe nhé!");
    }
    if (s.soil === 'catpha' && SB_RULES.crops[s.crop].waterReq >= 4 && s.equipment !== 'drip') {
        advices.push(isPro ? "⚠️ Đất cát giữ nước kém. Cần hệ thống tưới nhỏ giọt!" : "🧙‍♂️ Đất cát khô nhanh lắm! Lắp ống tưới nhỏ giọt nhé!");
    }
    if (s.fertilizer === 'npk' && s.equipment !== 'sensor') {
        advices.push(isPro ? "💡 NPK thu hút sâu rầy. Nên dùng cảm biến IoT phát hiện sớm." : "🧙‍♂️ Phân NPK hấp dẫn sâu bọ! Lắp cảm biến cảnh báo nha!");
    }
    if (s.goal === 'organic' && s.fertilizer === 'npk') {
        advices.push(isPro ? "❌ Mục tiêu Hữu cơ nhưng dùng NPK hóa học. Điểm bị trừ!" : "🧙‍♂️ Vườn sạch mà dùng phân hóa học sao được! Đổi sang hữu cơ đi bé!");
    }

    if (advices.length === 0) {
        advices.push(isPro ? "✅ Thông số tốt! Tiếp tục theo dõi." : "🧙‍♂️ Tuyệt vời! Bấm +1 Tháng xem cây ra sao nhé!");
    }

    $(`${mode}-sb-advice`).innerHTML = advices.map(a => `<div style="margin-bottom:0.3rem;">${a}</div>`).join('');
}

// ================================================================
// INVENTORY
// ================================================================

let inventoryItems = [];
let currentInventoryTab = 'all';

const DEFAULT_INVENTORY = [
    { id: "crop_robusta", category: "crops", name: "Hạt Cà phê Robusta", emoji: "☕", quantity: 3, unit: "túi", desc: "Giống cà phê vối khỏe mạnh." },
    { id: "crop_tieuvinhlinh", category: "crops", name: "Dây Tiêu Vĩnh Linh", emoji: "🌶️", quantity: 5, unit: "dây", desc: "Giống tiêu leo cay nồng." },
    { id: "fert_organic", category: "fertilizers", name: "Phân hữu cơ", emoji: "🍂", quantity: 15, unit: "kg", desc: "Đất tơi xốp, giữ ẩm." },
    { id: "fert_npk", category: "fertilizers", name: "NPK 16-16-8", emoji: "🧪", quantity: 8, unit: "kg", desc: "Cây lớn nhanh." },
    { id: "fert_voibot", category: "fertilizers", name: "Vôi bột", emoji: "⚪", quantity: 10, unit: "kg", desc: "Khử chua phèn." },
    { id: "other_water_can", category: "others", name: "Bình tưới", emoji: "💦", quantity: 4, unit: "bình", desc: "+10 EXP" },
    { id: "other_magic_apple", category: "others", name: "Táo thần kỳ", emoji: "🍎", quantity: 3, unit: "quả", desc: "+30 EXP" }
];

function initInventory() {
    const saved = localStorage.getItem("agtech_inventory");
    try { inventoryItems = saved ? JSON.parse(saved) : [...DEFAULT_INVENTORY]; } catch(e) { inventoryItems = [...DEFAULT_INVENTORY]; }
    if (!saved) localStorage.setItem("agtech_inventory", JSON.stringify(inventoryItems));
    renderInventory();
}

function saveInventory() { localStorage.setItem("agtech_inventory", JSON.stringify(inventoryItems)); }

function switchInventoryTab(cat, btn) {
    currentInventoryTab = cat;
    document.querySelectorAll('.inv-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderInventory();
}

function renderInventory() {
    const container = $('inventory-items-container');
    if (!container) return;
    container.innerHTML = '';
    const filtered = currentInventoryTab === 'all' ? inventoryItems.filter(i => i.quantity > 0) : inventoryItems.filter(i => i.category === currentInventoryTab && i.quantity > 0);

    if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);"><span style="font-size:2.5rem; display:block; margin-bottom:0.5rem;">🎒</span><p>Trống rỗng! Làm nhiệm vụ để có đồ nhé!</p></div>';
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inv-card';
        card.innerHTML = `
            <span class="inv-card-emoji">${item.emoji}</span>
            <div class="inv-card-name">${item.name}</div>
            <div class="inv-card-qty">x${item.quantity} ${item.unit}</div>
            <button class="inv-card-btn" onclick="useInventoryItem('${item.id}')">Dùng</button>
        `;
        container.appendChild(card);
    });
}

async function useInventoryItem(itemId) {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item || item.quantity <= 0) return;

    if (item.category === 'crops' || item.category === 'fertilizers') {
        alert(`Mang ${item.name} vào Thí Nghiệm hoặc Khu Vườn để sử dụng!`);
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/use-item/${USER_ID}/${itemId}`, { method: "POST" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        item.quantity--;
        saveInventory(); renderInventory();
        updateProfileUI({ full_name: $('kid-name').innerText, current_level: data.current_level, total_points: data.current_points });
        alert(`✨ +${data.points_added} EXP!`);
    } catch(e) {
        item.quantity--;
        saveInventory(); renderInventory();
        alert(`✨ Đã dùng ${item.name}!`);
    }
}

// ================================================================
// COINS
// ================================================================

let kidCoins = 200;

function initCoins() {
    const saved = localStorage.getItem("agtech_coins");
    kidCoins = saved !== null ? parseInt(saved) : 200;
    if (saved === null) localStorage.setItem("agtech_coins", "200");
    updateCoinsUI();
}

function updateCoinsUI() {
    const c1 = $('kid-coins'); if (c1) c1.innerText = kidCoins;
    const c2 = $('shop-coins-val'); if (c2) c2.innerText = kidCoins;
}

function addCoins(n) { kidCoins += n; localStorage.setItem("agtech_coins", kidCoins.toString()); updateCoinsUI(); }
function deductCoins(n) { if (kidCoins < n) return false; kidCoins -= n; localStorage.setItem("agtech_coins", kidCoins.toString()); updateCoinsUI(); return true; }

// ================================================================
// SHOP
// ================================================================

const SHOP_ITEMS = {
    consumables: [
        { id: "other_magic_apple", name: "Táo thần kỳ", emoji: "🍎", cost: 50, desc: "+30 EXP" },
        { id: "other_water_can", name: "Bình tưới", emoji: "💦", cost: 20, desc: "+10 EXP" },
        { id: "fert_npk", name: "NPK Siêu Hạng", emoji: "🧪", cost: 30, desc: "Cây lớn nhanh" },
        { id: "fert_te", name: "Vi lượng TE", emoji: "💊", cost: 40, desc: "Hoa quả bám chắc" }
    ],
    'real-rewards': [
        { id: "other_ticket", name: "Vé đổi sữa", emoji: "🎟️", cost: 200, desc: "Đổi sữa tươi tại HTX" },
        { id: "reward_hat", name: "Mũ Nông Dân", emoji: "🧢", cost: 300, desc: "Mũ xanh lá siêu ngầu" },
        { id: "reward_crayons", name: "Bút màu", emoji: "🖍️", cost: 150, desc: "Bút từ sáp thực vật" }
    ]
};

function renderShop() {
    ['consumables', 'real-rewards'].forEach(cat => {
        const container = $(`shop-${cat}`);
        if (!container) return;
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'shop-grid';
        SHOP_ITEMS[cat].forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-card';
            card.innerHTML = `
                <span class="shop-card-emoji">${item.emoji}</span>
                <div class="shop-card-name">${item.name}</div>
                <div class="shop-card-cost">💰 ${item.cost} xu</div>
                <div class="shop-card-desc">${item.desc}</div>
                <button class="shop-buy-btn" onclick="buyShopItem('${item.id}','${cat}',${item.cost})">Mua 🛒</button>
            `;
            grid.appendChild(card);
        });
        container.appendChild(grid);
    });
}

function switchShopTab(tab, btn) {
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#game-tab-shop .sub-tab').forEach(b => b.classList.remove('active'));
    $(`shop-${tab}`).classList.add('active');
    btn.classList.add('active');
}

function buyShopItem(itemId, category, cost) {
    if (kidCoins < cost) { alert("Không đủ xu! Làm nhiệm vụ để kiếm thêm nhé!"); return; }
    deductCoins(cost);
    const existing = inventoryItems.find(i => i.id === itemId);
    if (existing) { existing.quantity++; }
    else {
        const all = [...SHOP_ITEMS.consumables, ...SHOP_ITEMS['real-rewards']];
        const si = all.find(i => i.id === itemId);
        if (si) inventoryItems.push({ id: si.id, category: si.id.startsWith('fert_') ? 'fertilizers' : 'others', name: si.name, emoji: si.emoji, quantity: 1, unit: 'cái', desc: si.desc });
    }
    saveInventory(); renderInventory();
    alert(`🎉 Đã mua ${inventoryItems.find(i=>i.id===itemId)?.name || 'vật phẩm'}!`);
}

// ================================================================
// AGRI CATALOG / LIBRARY
// ================================================================

const AGRI_CATALOG = {
    soil: [
        { name: "Đất đỏ Bazan", emoji: "🟫", price: "15M/ha", desc: "Đất núi lửa Tây Nguyên, giàu dinh dưỡng.", pros: "Giữ ẩm tốt, thích hợp cà phê, hồ tiêu.", cons: "Dễ chua nếu bón nhiều phân hóa học." },
        { name: "Đất phù sa", emoji: "🌾", price: "20M/ha", desc: "Đất bồi sông Mê Kông, màu mỡ.", pros: "Phì nhiêu cao, pH trung tính, trồng lúa cây ăn quả tốt.", cons: "Dễ ngập lũ và xâm nhập mặn." },
        { name: "Đất cát pha", emoji: "⏳", price: "8M/ha", desc: "Đất pha cát duyên hải miền Trung.", pros: "Dễ canh tác, thoát nước nhanh.", cons: "Giữ nước kém, dinh dưỡng hay bị rửa trôi." },
        { name: "Đất phèn chua", emoji: "🧪", price: "6M/ha", desc: "Đất chứa sắt nhôm Đồng Tháp Mười.", pros: "Giàu dinh dưỡng tiềm tàng nếu bón vôi.", cons: "pH rất thấp (<4.0), độc cho rễ cây." },
        { name: "Đất sét pha", emoji: "🧱", price: "12M/ha", desc: "Đất hạt mịn dày dặn.", pros: "Giữ phân bón rất tốt, không bị trôi.", cons: "Dễ ngập úng, khô thì nứt nẻ." }
    ],
    crops: [
        { name: "Cà phê Robusta", emoji: "☕", price: "12k/cây", desc: "Giống vối kháng bệnh tốt Tây Nguyên.", pros: "Năng suất cao 3.5-5 tấn/ha, chịu hạn.", cons: "Vị đắng gắt, giá thô thấp hơn Arabica." },
        { name: "Cà phê Arabica", emoji: "🌸", price: "18k/cây", desc: "Giống chè ưa độ cao ôn đới.", pros: "Hương thơm thanh, giá gấp đôi Robusta.", cons: "Dễ bị sâu, sợ nắng gắt." },
        { name: "Hồ tiêu Vĩnh Linh", emoji: "🌶️", price: "15k/dây", desc: "Giống tiêu leo Quảng Trị.", pros: "Dễ trồng xen cà phê, giá xuất khẩu tốt.", cons: "Rất sợ úng nước, dễ chết hàng loạt." },
        { name: "Lúa ST25", emoji: "🌾", price: "5k/gói", desc: "Gạo ngon nhất thế giới Sóc Trăng.", pros: "Chịu phèn mặn, hạt dài dẻo thơm.", cons: "Sinh trưởng dài ngày, kén nước." },
        { name: "Sầu riêng Ri6", emoji: "👑", price: "85k/cây", desc: "Cơm vàng hạt lép miền Tây.", pros: "Lợi nhuận rất cao, thị trường mạnh.", cons: "Đầu tư lớn, 4-5 năm mới cho trái." }
    ],
    fertilizers: [
        { name: "Hữu cơ Trichoderma", emoji: "🍃", price: "4.5k/kg", desc: "Phân sinh học chứa nấm đối kháng.", pros: "Đất tơi xốp, diệt nấm bệnh rễ.", cons: "Dinh dưỡng thấp, tác dụng chậm." },
        { name: "NPK 16-16-8", emoji: "🧪", price: "18k/kg", desc: "Phân hỗn hợp Đạm-Lân-Kali.", pros: "Hấp thụ nhanh, hiệu quả ngay.", cons: "Lạm dụng gây chai đất, diệt giun." },
        { name: "Vôi bột", emoji: "⚪", price: "1.5k/kg", desc: "Vôi nghiền mịn khử chua.", pros: "Giá rẻ, khử phèn nhanh, sát khuẩn.", cons: "Không bón cùng đạm urê." },
        { name: "Phân chuồng hoai", emoji: "💩", price: "2k/kg", desc: "Phân gà bò ủ men hoai mục.", pros: "Cải tạo đất cát, giữ ẩm tốt.", cons: "Cồng kềnh, chưa ủ kỹ dễ chứa sâu." },
        { name: "Đạm Urê", emoji: "❄️", price: "12k/kg", desc: "Phân đạm 46% nitơ nguyên chất.", pros: "Lá xanh mướt, đẻ nhánh mạnh.", cons: "Bay hơi nắng gắt, thừa dụ sâu rầy." }
    ]
};

function initAgriCatalog() {
    renderCatalog('pro');
    renderCatalog('game');
}

function renderCatalog(mode) {
    const prefix = mode === 'pro' ? 'lib' : 'game-lib';
    ['soil', 'crops', 'fertilizers'].forEach(cat => {
        const container = $(`${prefix}-${cat}`);
        if (!container) return;
        container.innerHTML = '';
        (AGRI_CATALOG[cat] || []).forEach(item => {
            const card = document.createElement('div');
            card.className = mode === 'pro' ? 'lib-card' : 'lib-card game-lib-card';
            card.innerHTML = `
                <div class="lib-card-header">
                    <span class="lib-emoji">${item.emoji}</span>
                    <h4>${item.name}</h4>
                    <span class="lib-price">${item.price}</span>
                </div>
                <p class="lib-desc">${item.desc}</p>
                <div class="lib-pros-cons">
                    <div class="lib-pro">✅ ${item.pros}</div>
                    <div class="lib-con">⚠️ ${item.cons}</div>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

function switchLibraryTab(tab, btn) {
    document.querySelectorAll('#pro-tab-library .lib-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#pro-tab-library .sub-tab').forEach(b => b.classList.remove('active'));
    $(`lib-${tab}`).classList.add('active');
    btn.classList.add('active');
}

function switchGameLibTab(tab, btn) {
    document.querySelectorAll('#game-tab-book .lib-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#game-tab-book .sub-tab').forEach(b => b.classList.remove('active'));
    $(`game-lib-${tab}`).classList.add('active');
    btn.classList.add('active');
}

// ================================================================
// AVATAR PICKER
// ================================================================

function initAvatarPicker() {
    const grid = $('avatar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    AVATAR_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'avatar-option';
        btn.title = preset.label;
        btn.innerHTML = `<img src="${preset.url}" alt="${preset.label}">`;
        btn.onclick = () => selectAvatar(preset.url, btn);
        grid.appendChild(btn);
    });
}

function openAvatarPicker() {
    const modal = $('avatar-modal');
    if (modal) {
        modal.classList.add('active');
        document.querySelectorAll('.avatar-option').forEach(opt => {
            const img = opt.querySelector('img');
            opt.classList.toggle('selected', img && img.src === currentAvatarUrl);
        });
    }
}

function closeAvatarPicker(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = $('avatar-modal');
    if (modal) modal.classList.remove('active');
}

async function selectAvatar(url, btnEl) {
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
    if (btnEl) btnEl.classList.add('selected');
    currentAvatarUrl = url;
    const avatarEl = $('kid-avatar');
    if (avatarEl) avatarEl.src = url;
    localStorage.setItem('agriverse_avatar', url);
    try {
        await fetch(`${API_BASE}/profile/${USER_ID}/avatar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: url })
        });
    } catch (e) {
        console.warn('Lưu avatar offline:', e);
    }
    setTimeout(closeAvatarPicker, 400);
}

// ================================================================
// GEOLOCATION & WEATHER (KTTV/NCHMF)
// ================================================================

function initProvinceSelect() {
    const sel = $('province-select');
    if (!sel) return;
    VIETNAM_PROVINCES.forEach(p => {
        const opt = document.createElement('option');
        opt.value = `${p.lat},${p.lng}`;
        opt.textContent = p.name;
        sel.appendChild(opt);
    });
}

function initLocationAndWeather() {
    const saved = localStorage.getItem('agriverse_location');
    if (saved) {
        try {
            userLocation = JSON.parse(saved);
            fetchWeather(userLocation.lat, userLocation.lng);
            updateLocationUI(userLocation);
            return;
        } catch (e) { /* fall through */ }
    }
    requestGeolocation();
}

function requestGeolocation() {
    const nameEl = $('location-name');
    const iconEl = $('location-icon');
    if (nameEl) nameEl.innerText = 'Đang lấy vị trí GPS...';
    if (iconEl) iconEl.innerText = '🛰️';

    if (!navigator.geolocation) {
        openLocationModal();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        pos => {
            const loc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                source: 'gps'
            };
            saveLocation(loc);
        },
        err => {
            console.warn('GPS error:', err);
            if (nameEl) nameEl.innerText = 'Không lấy được GPS — chọn thủ công';
            if (iconEl) iconEl.innerText = '📍';
            openLocationModal();
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
}

function saveLocation(loc) {
    userLocation = loc;
    localStorage.setItem('agriverse_location', JSON.stringify(loc));
    updateLocationUI(loc);
    fetchWeather(loc.lat, loc.lng);
    syncLocationToServer(loc);
}

async function syncLocationToServer(loc) {
    try {
        await fetch(`${API_BASE}/farm/${FARM_ID}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: loc.lat,
                lng: loc.lng,
                accuracy: loc.accuracy,
                location_name: loc.name
            })
        });
    } catch (e) {
        console.warn('Sync location offline:', e);
    }
}

function updateLocationUI(loc) {
    const nameEl = $('location-name');
    const iconEl = $('location-icon');
    if (iconEl) iconEl.innerText = loc.source === 'gps' ? '📍' : '🗺️';
    if (nameEl) {
        let label = loc.name || `${loc.lat.toFixed(4)}°, ${loc.lng.toFixed(4)}°`;
        if (loc.accuracy) label += ` (±${Math.round(loc.accuracy)}m)`;
        nameEl.innerText = label;
        nameEl.title = label;
    }
}

function openLocationModal() {
    const modal = $('location-modal');
    if (modal) modal.classList.add('active');
}

function closeLocationModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = $('location-modal');
    if (modal) modal.classList.remove('active');
}

function applyManualLocation() {
    const sel = $('province-select');
    if (!sel) return;
    const [lat, lng] = sel.value.split(',').map(Number);
    const name = sel.options[sel.selectedIndex].text;
    saveLocation({ lat, lng, source: 'manual', name });
    closeLocationModal();
}

async function fetchWeather(lat, lng) {
    const descEl = $('weather-desc');
    if (descEl) descEl.innerText = 'Đang tải dự báo KTTV/NCHMF...';

    try {
        const res = await fetch(`${WEATHER_API}/current?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();
        renderWeather(data);
        if (data.location && data.location.name && userLocation && !userLocation.name) {
            userLocation.name = data.location.name;
            localStorage.setItem('agriverse_location', JSON.stringify(userLocation));
            updateLocationUI(userLocation);
        }
    } catch (e) {
        console.warn('Weather fetch failed:', e);
        renderOfflineWeather();
    }
}

function renderWeather(data) {
    const c = data.current;
    const set = (id, val) => { const el = $(id); if (el) el.innerText = val; };

    set('weather-icon', c.icon);
    set('weather-temp', `${c.temperature}°C`);
    set('weather-desc', c.description);
    set('wi-humidity', `${c.humidity}%`);
    set('wi-wind', `${c.wind_kmh} km/h`);
    set('wi-rain', `${c.rain_probability}%`);
    set('wi-uv', `${c.uv_index} (${c.uv_label})`);
    set('weather-tip', data.farm_tip);
    set('weather-source', data.source || 'KTTV/NCHMF');

    const updatedEl = $('weather-updated');
    if (updatedEl && data.updated_at) {
        const t = new Date(data.updated_at);
        updatedEl.innerText = `Cập nhật: ${t.toLocaleTimeString('vi-VN')} · ${data.location?.accuracy_note || ''}`;
    }

    if (data.location?.name) {
        const nameEl = $('location-name');
        if (nameEl && !userLocation?.name) nameEl.innerText = data.location.name;
    }

    const scroll = $('forecast-scroll');
    if (scroll && data.forecast) {
        scroll.innerHTML = data.forecast.map(day => `
            <div class="forecast-day-card">
                <div class="fc-day">${day.day_label}</div>
                <div class="fc-icon">${day.icon}</div>
                <div class="fc-temp">${day.temp_min}-${day.temp_max}°C</div>
                <div class="fc-tip ${day.tip_class}">${day.farm_tip}</div>
            </div>
        `).join('');
    }
}

function renderOfflineWeather() {
    const set = (id, val) => { const el = $(id); if (el) el.innerText = val; };
    set('weather-icon', '🌤️');
    set('weather-temp', '28°C');
    set('weather-desc', 'Nắng ráo (dữ liệu ngoại tuyến)');
    set('wi-humidity', '72%');
    set('wi-wind', '14 km/h');
    set('wi-rain', '15%');
    set('wi-uv', '6 (Cao)');
    set('weather-tip', 'Kết nối mạng để nhận dự báo KTTV/NCHMF theo thời gian thực.');
}

// ================================================================
// RENAME KID
// ================================================================

async function promptRenameKid() {
    const old = $('kid-name').innerText;
    const name = prompt("Nhập tên mới:", old);
    if (!name || name.trim() === '' || name === old) return;
    try {
        const res = await fetch(`${API_BASE}/profile/${USER_ID}/rename`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ new_name: name.trim() })
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        $('kid-name').innerText = data.new_name;
    } catch(e) {
        $('kid-name').innerText = name.trim();
    }
    alert(`Đã đổi tên thành: ${name.trim()}!`);
}

// ================================================================
// RAIN EFFECT (legacy support)
// ================================================================

function toggleRain() {
    const rainPct = $('wi-rain')?.innerText?.replace('%', '') || '0';
    if (parseInt(rainPct) >= 50) {
        document.body.style.background = 'linear-gradient(180deg, #64748b 0%, #94a3b8 100%)';
        alert('🌧️ Trời có mưa theo dự báo KTTV! Hãy kiểm tra thoát nước ruộng.');
        setTimeout(() => { document.body.style.background = ''; }, 3000);
    } else {
        alert('☀️ Dự báo ít mưa — thời tiết thuận lợi cho công việc ngoài trời.');
    }
}

// ================================================================
// BOOT
// ================================================================

window.addEventListener('DOMContentLoaded', init);
