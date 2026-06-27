/**
 * 3D Engine for Agtech-Platform (Scale x100)
 * Uses Three.js for 3D visualization and WebSockets for Real-time Data
 */

class Farm3DEngine {
    constructor(containerId, farmId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.farmId = farmId;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.blocks = {}; // Lưu trữ tham chiếu đến các ô đất 3D
        this.particles = null; // Thời tiết động
        
        this.init();
        this.initWebSocket();
    }

    init() {
        // 1. Setup Renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 2. Setup Camera & Controls
        this.camera.position.set(0, 15, 20);
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Khóa góc nhìn không chìm xuống dưới mặt đất

        // 3. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // 4. Ground (Mặt đất nền)
        const groundGeo = new THREE.PlaneGeometry(50, 50);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 5. Render Farm Blocks (Lưới Nông Trại 3D)
        this.renderBlocks();
        
        // 6. Xử lý Resize
        window.addEventListener('resize', () => this.resize());

        // 7. Animation Loop
        this.animate();
    }

    resize() {
        if (this.container && this.camera && this.renderer) {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        }
    }

    renderBlocks() {
        const gridSize = 5;
        const spacing = 2.2;
        
        const soilGeo = new THREE.BoxGeometry(2, 0.5, 2);
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Tạo màu đất ngẫu nhiên để trông tự nhiên
                const mat = new THREE.MeshStandardMaterial({ 
                    color: 0x78350f,
                    roughness: 0.9 
                });
                const block = new THREE.Mesh(soilGeo, mat);
                
                // Căn giữa lưới
                block.position.x = (i - gridSize/2) * spacing;
                block.position.z = (j - gridSize/2) * spacing;
                block.position.y = 0.25;
                block.castShadow = true;
                block.receiveShadow = true;
                
                const blockId = `B_${i}_${j}`;
                block.userData = { id: blockId, state: 'HEALTHY' };
                
                // Trồng cây 3D lên ô đất
                this.plantTreeOnBlock(block);
                
                this.scene.add(block);
                this.blocks[blockId] = block;
            }
        }
    }

    plantTreeOnBlock(block) {
        // Thân cây (Cylinder)
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.1, 1);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 0.75;
        trunk.castShadow = true;
        
        // Tán lá (Sphere)
        const leafGeo = new THREE.DodecahedronGeometry(0.6);
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.7 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = 1.3;
        leaf.castShadow = true;
        
        block.add(trunk);
        block.add(leaf);
        
        // Gắn reference để dễ dàng đổi màu tán lá khi cây bệnh
        block.userData.leaf = leaf; 
    }

    initWebSocket() {
        // Kết nối đến FastAPI WebSockets
        const isProd = window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost';
        const wsProtocol = isProd ? "wss://" : "ws://";
        const wsHost = isProd ? "agriverse-p7sh.onrender.com" : "localhost:8000";
        const wsUrl = `${wsProtocol}${wsHost}/ws/farm/${this.farmId}`;
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log(`📡 [3D Engine] Đã kết nối Real-time tới ${this.farmId}`);
                // Thêm hiệu ứng phát sáng cho bản đồ báo hiệu đã online
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("📥 [3D Engine] Nhận tín hiệu:", data);
                
                // Ví dụ: Xử lý tín hiệu tưới nước, bón phân
                if (data.event === "action_ack") {
                    this.showNotification3D(data.message);
                }
            };
            
            this.ws.onerror = (err) => {
                console.error("WebSocket Error:", err);
            };
        } catch (e) {
            console.warn("Chưa khởi chạy Backend, đang chạy ở chế độ Offline (Local 3D).");
        }
    }

    showNotification3D(msg) {
        // Hiệu ứng trên UI HTML
        const uiLog = document.getElementById("pro-notifications");
        if (uiLog) {
            uiLog.innerHTML = `<li><span class="timestamp">[REAL-TIME]</span> ${msg}</li>` + uiLog.innerHTML;
        }
    }

    setWeatherEffect(type) {
        // Xóa hiệu ứng cũ
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles = null;
        }
        
        if (type === 'RAIN') {
            const rainGeo = new THREE.BufferGeometry();
            const rainCount = 1500;
            const posArray = new Float32Array(rainCount * 3);
            for(let i=0; i<rainCount*3; i++) {
                posArray[i] = (Math.random() - 0.5) * 30; // spread
            }
            rainGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            const rainMat = new THREE.PointsMaterial({
                color: 0x0ea5e9,
                size: 0.1,
                transparent: true,
                opacity: 0.6
            });
            this.particles = new THREE.Points(rainGeo, rainMat);
            this.particles.userData = { type: 'RAIN' };
            this.scene.add(this.particles);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        
        // Animate particles (Weather)
        if (this.particles && this.particles.userData.type === 'RAIN') {
            const positions = this.particles.geometry.attributes.position.array;
            for(let i=1; i<positions.length; i+=3) { // Y axis
                positions[i] -= 0.5; // Tốc độ rơi
                if (positions[i] < 0) {
                    positions[i] = 20; // Trở lại đỉnh
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Khởi tạo toàn cục khi load
window.addEventListener('DOMContentLoaded', () => {
    // Chỉ khởi tạo khi thẻ tồn tại (Ví dụ ở Tab Pro Mode hoặc Game Mode)
    // Sẽ gọi hàm này trong app.js khi người dùng click vào Bản Đồ Ruộng
});
