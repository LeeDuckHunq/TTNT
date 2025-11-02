const datasets = {
    animals: {
        name: 'Thế giới động vật',
        nodes: [
            { id: 'animal', label: 'Động vật', x: 300, y: 100 },
            { id: 'dog', label: 'Chó', x: 180, y: 250 },
            { id: 'cat', label: 'Mèo', x: 420, y: 250 },
            { id: 'bird', label: 'Chim', x: 300, y: 400 }
        ],
        edges: [
            { from: 'dog', to: 'animal', label: 'is_a', type: 'inheritance' },
            { from: 'cat', to: 'animal', label: 'is_a', type: 'inheritance' },
            { from: 'bird', to: 'animal', label: 'is_a', type: 'inheritance' }
        ],
        frames: {
            animal: {
                name: 'Động vật',
                slots: {
                    'loại': 'sinh vật sống',
                    'di_chuyển': 'có thể di chuyển',
                    'ăn': 'cần thức ăn',
                    'thở': 'cần oxy'
                }
            },
            dog: {
                name: 'Chó',
                slots: {
                    'isa': 'Động vật',
                    'màu_sắc': 'nhiều màu',
                    'tiếng_kêu': 'gâu gâu',
                    'số_chân': '4',
                    'trung_thành': 'cao',
                    'if_needed': 'gọi tiếng_kêu()'
                },
                inherits: 'animal'
            },
            cat: {
                name: 'Mèo',
                slots: {
                    'isa': 'Động vật',
                    'màu_sắc': 'đa dạng',
                    'tiếng_kêu': 'meo meo',
                    'số_chân': '4',
                    'độc_lập': 'cao',
                    'if_needed': 'gọi tiếng_kêu()'
                },
                inherits: 'animal'
            },
            bird: {
                name: 'Chim',
                slots: {
                    'isa': 'Động vật',
                    'có_cánh': 'true',
                    'bay': 'có thể bay',
                    'số_chân': '2',
                    'lông_vũ': 'có',
                    'if_needed': 'gọi bay()'
                },
                inherits: 'animal'
            }
        }
    },
    vehicles: {
        name: 'Phương tiện giao thông',
        nodes: [
            { id: 'vehicle', label: 'Phương tiện', x: 300, y: 100 },
            { id: 'car', label: 'Ô tô', x: 180, y: 250 },
            { id: 'bike', label: 'Xe đạp', x: 420, y: 250 },
            { id: 'plane', label: 'Máy bay', x: 300, y: 400 }
        ],
        edges: [
            { from: 'car', to: 'vehicle', label: 'is_a', type: 'inheritance' },
            { from: 'bike', to: 'vehicle', label: 'is_a', type: 'inheritance' },
            { from: 'plane', to: 'vehicle', label: 'is_a', type: 'inheritance' }
        ],
        frames: {
            vehicle: {
                name: 'Phương tiện',
                slots: {
                    'mục_đích': 'vận chuyển',
                    'di_chuyển': 'có thể di chuyển',
                    'chở': 'người hoặc hàng'
                }
            },
            car: {
                name: 'Ô tô',
                slots: {
                    'isa': 'Phương tiện',
                    'số_bánh': '4',
                    'động_cơ': 'xăng/dầu/điện',
                    'chỗ_ngồi': '2-7',
                    'di_chuyển': 'trên đường',
                    'if_needed': 'khởi_động_động_cơ()'
                },
                inherits: 'vehicle'
            },
            bike: {
                name: 'Xe đạp',
                slots: {
                    'isa': 'Phương tiện',
                    'số_bánh': '2',
                    'động_lực': 'sức người',
                    'chỗ_ngồi': '1-2',
                    'thân_thiện_môi_trường': 'cao',
                    'if_needed': 'đạp_bàn_đạp()'
                },
                inherits: 'vehicle'
            },
            plane: {
                name: 'Máy bay',
                slots: {
                    'isa': 'Phương tiện',
                    'có_cánh': 'true',
                    'bay': 'có thể bay',
                    'động_cơ': 'phản lực',
                    'di_chuyển': 'trên không',
                    'if_needed': 'cất_cánh()'
                },
                inherits: 'vehicle'
            }
        }
    }
};

// State
let currentData = null;
let selectedNode = null;
let compareMode = false;

// Zoom state for both canvases
let semanticZoom = { scale: 1, offsetX: 0, offsetY: 0 };
let frameZoom = { scale: 1, offsetX: 0, offsetY: 0 };

// Pan state
let isPanning = false;
let panStart = { x: 0, y: 0 };

// Elements
const dataSelect = document.getElementById('dataSelect');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const compareBtn = document.getElementById('compareBtn');
const resetBtn = document.getElementById('resetBtn');
const semanticCanvas = document.getElementById('semanticCanvas');
const frameCanvas = document.getElementById('frameCanvas');
const semanticEmpty = document.getElementById('semanticEmpty');
const frameEmpty = document.getElementById('frameEmpty');
const frameDetail = document.getElementById('frameDetail');
const legend = document.getElementById('legend');

const semanticCtx = semanticCanvas.getContext('2d');
const frameCtx = frameCanvas.getContext('2d');

// Resize canvas
function resizeCanvas() {
    const rect = semanticCanvas.parentElement.getBoundingClientRect();
    semanticCanvas.width = rect.width;
    semanticCanvas.height = rect.height;
    frameCanvas.width = rect.width;
    frameCanvas.height = rect.height;
    
    if (currentData) {
        drawSemanticNetwork();
        if (!selectedNode) drawFrameNetwork();
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Validate data structure
function validateData(data) {
    if (!data || typeof data !== 'object') {
        return 'Dữ liệu không hợp lệ';
    }
    if (!data.name || typeof data.name !== 'string') {
        return 'Thiếu tên dataset';
    }
    if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
        return 'Thiếu hoặc không có nodes';
    }
    if (!Array.isArray(data.edges)) {
        return 'Thiếu edges';
    }
    if (!data.frames || typeof data.frames !== 'object') {
        return 'Thiếu frames';
    }

    for (const node of data.nodes) {
        if (!node.id || !node.label || typeof node.x !== 'number' || typeof node.y !== 'number') {
            return 'Node không hợp lệ: cần có id, label, x, y';
        }
    }

    for (const edge of data.edges) {
        if (!edge.from || !edge.to || !edge.label) {
            return 'Edge không hợp lệ: cần có from, to, label';
        }
    }

    for (const [key, frame] of Object.entries(data.frames)) {
        if (!frame.name || !frame.slots || typeof frame.slots !== 'object') {
            return `Frame "${key}" không hợp lệ: cần có name và slots`;
        }
    }

    return null;
}

// Load data from file
function loadDataFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const error = validateData(data);
            
            if (error) {
                showToast(`❌ ${error}`, 'error');
                return;
            }

            currentData = data;
            selectedNode = null;
            dataSelect.value = '';
            
            semanticEmpty.style.display = 'none';
            frameEmpty.style.display = 'none';
            semanticCanvas.style.display = 'block';
            frameCanvas.style.display = 'block';
            frameDetail.style.display = 'none';

            drawSemanticNetwork();
            drawFrameNetwork();
            
            //showToast(`✓ Đã tải: ${data.name}`, 'success');
        } catch (err) {
            //showToast(`❌ Lỗi đọc file`, 'error');
        }
    };
    reader.onerror = () => {
        //showToast('❌ Không thể đọc file', 'error');
    };
    reader.readAsText(file);
}

// Draw semantic network
function drawSemanticNetwork() {
    semanticCtx.clearRect(0, 0, semanticCanvas.width, semanticCanvas.height);
    
    // Save context state
    semanticCtx.save();
    
    // Apply zoom and pan transformations
    semanticCtx.translate(semanticZoom.offsetX, semanticZoom.offsetY);
    semanticCtx.scale(semanticZoom.scale, semanticZoom.scale);

    // Draw edges
    currentData.edges.forEach(edge => {
        const fromNode = currentData.nodes.find(n => n.id === edge.from);
        const toNode = currentData.nodes.find(n => n.id === edge.to);

        if (fromNode && toNode) {
            // Check if this edge is connected to selected node
            const isToParent = selectedNode && edge.from === selectedNode; // Đường đến node cha
            const isFromParent = selectedNode && edge.to === selectedNode; // Đường từ node cha (đến node hiện tại)

            semanticCtx.beginPath();
            semanticCtx.moveTo(fromNode.x, fromNode.y);
            semanticCtx.lineTo(toNode.x, toNode.y);

            if (isToParent) {
                // Đường từ node được chọn đến node cha - màu tím
                const gradient = semanticCtx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
                gradient.addColorStop(0, '#8b5cf6');
                gradient.addColorStop(1, '#a78bfa');
                semanticCtx.strokeStyle = gradient;
                semanticCtx.lineWidth = 4;
            } else if (isFromParent) {
                // Đường từ node cha đến node được chọn (node con) - màu xanh lá
                const gradient = semanticCtx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
                gradient.addColorStop(0, '#059669');
                gradient.addColorStop(1, '#10b981');
                semanticCtx.strokeStyle = gradient;
                semanticCtx.lineWidth = 4;
            } else if (compareMode) {
                const gradient = semanticCtx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
                if (edge.type === 'inheritance') {
                    gradient.addColorStop(0, '#6366f1');
                    gradient.addColorStop(1, '#8b5cf6');
                } else {
                    gradient.addColorStop(0, '#10b981');
                    gradient.addColorStop(1, '#059669');
                }
                semanticCtx.strokeStyle = gradient;
                semanticCtx.lineWidth = 3;
            } else {
                semanticCtx.strokeStyle = '#d1d5db';
                semanticCtx.lineWidth = 3;
            }
            semanticCtx.stroke();

            // Label
            const isConnected = isToParent || isFromParent;
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            semanticCtx.fillStyle = isConnected ? '#1f2937' : '#6b7280';
            semanticCtx.font = isConnected ? 'bold 13px sans-serif' : '12px sans-serif';
            semanticCtx.fillText(edge.label, midX + 5, midY - 5);

            // Arrow
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const arrowSize = isConnected ? 12 : 10;
            semanticCtx.beginPath();
            semanticCtx.moveTo(toNode.x - 30 * Math.cos(angle), toNode.y - 30 * Math.sin(angle));
            semanticCtx.lineTo(
                toNode.x - 30 * Math.cos(angle) - arrowSize * Math.cos(angle - Math.PI / 6),
                toNode.y - 30 * Math.sin(angle) - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            semanticCtx.lineTo(
                toNode.x - 30 * Math.cos(angle) - arrowSize * Math.cos(angle + Math.PI / 6),
                toNode.y - 30 * Math.sin(angle) - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            semanticCtx.closePath();
            
            if (isToParent) {
                semanticCtx.fillStyle = '#8b5cf6';
            } else if (isFromParent) {
                semanticCtx.fillStyle = '#059669';
            } else if (compareMode && edge.type === 'inheritance') {
                semanticCtx.fillStyle = '#6366f1';
            } else if (compareMode) {
                semanticCtx.fillStyle = '#10b981';
            } else {
                semanticCtx.fillStyle = '#d1d5db';
            }
            semanticCtx.fill();
        }
    });

    // Draw nodes
    currentData.nodes.forEach(node => {
        const isSelected = selectedNode === node.id;
        
        // Check if node is parent (node cha) or child (node con) of selected node
        const isParentNode = selectedNode && currentData.edges.some(edge => 
            edge.from === selectedNode && edge.to === node.id
        );
        const isChildNode = selectedNode && currentData.edges.some(edge => 
            edge.to === selectedNode && edge.from === node.id
        );

        // Shadow
        semanticCtx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        semanticCtx.shadowBlur = 15;
        semanticCtx.shadowOffsetX = 0;
        semanticCtx.shadowOffsetY = 4;

        semanticCtx.beginPath();
        semanticCtx.arc(node.x, node.y, 35, 0, 2 * Math.PI);
        
        if (isSelected) {
            const gradient = semanticCtx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#8b5cf6');
            semanticCtx.fillStyle = gradient;
        } else if (isParentNode) {
            // Node cha - màu tím nhạt
            const gradient = semanticCtx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35);
            gradient.addColorStop(0, '#ede9fe');
            gradient.addColorStop(1, '#ddd6fe');
            semanticCtx.fillStyle = gradient;
        } else if (isChildNode) {
            // Node con - màu xanh lá nhạt
            const gradient = semanticCtx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 35);
            gradient.addColorStop(0, '#d1fae5');
            gradient.addColorStop(1, '#a7f3d0');
            semanticCtx.fillStyle = gradient;
        } else {
            semanticCtx.fillStyle = 'white';
        }
        semanticCtx.fill();
        
        semanticCtx.shadowColor = 'transparent';
        if (isSelected) {
            semanticCtx.strokeStyle = '#6366f1';
        } else if (isParentNode) {
            semanticCtx.strokeStyle = '#8b5cf6';
        } else if (isChildNode) {
            semanticCtx.strokeStyle = '#059669';
        } else {
            semanticCtx.strokeStyle = '#e5e7eb';
        }
        semanticCtx.lineWidth = 3;
        semanticCtx.stroke();

        if (isSelected) {
            semanticCtx.fillStyle = '#ffffff';
        } else if (isParentNode) {
            semanticCtx.fillStyle = '#7c3aed';
        } else if (isChildNode) {
            semanticCtx.fillStyle = '#047857';
        } else {
            semanticCtx.fillStyle = '#1f2937';
        }
        semanticCtx.font = 'bold 14px sans-serif';
        semanticCtx.textAlign = 'center';
        semanticCtx.textBaseline = 'middle';
        semanticCtx.fillText(node.label, node.x, node.y);
    });
    
    // Restore context state
    semanticCtx.restore();
}

// Draw frame network
function drawFrameNetwork() {
    frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
    
    // Save context state
    frameCtx.save();
    
    // Apply zoom and pan transformations
    frameCtx.translate(frameZoom.offsetX, frameZoom.offsetY);
    frameCtx.scale(frameZoom.scale, frameZoom.scale);

    const frameNodes = Object.keys(currentData.frames).map((key, idx) => ({
        id: key,
        label: currentData.frames[key].name,
        x: 130 + (idx % 2) * 220,
        y: 120 + Math.floor(idx / 2) * 180
    }));

    // Draw inheritance edges
    frameNodes.forEach(node => {
        const frame = currentData.frames[node.id];
        if (frame.inherits) {
            const parentNode = frameNodes.find(n => n.id === frame.inherits);
            if (parentNode) {
                frameCtx.beginPath();
                frameCtx.moveTo(node.x, node.y);
                frameCtx.lineTo(parentNode.x, parentNode.y);
                frameCtx.strokeStyle = '#d1d5db';
                frameCtx.lineWidth = 2;
                frameCtx.setLineDash([5, 5]);
                frameCtx.stroke();
                frameCtx.setLineDash([]);
            }
        }
    });

    // Draw frame boxes
    frameNodes.forEach(node => {
        const frame = currentData.frames[node.id];
        const boxWidth = 130;
        const boxHeight = 75;
        const x = node.x - boxWidth / 2;
        const y = node.y - boxHeight / 2;

        // Shadow
        frameCtx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        frameCtx.shadowBlur = 10;
        frameCtx.shadowOffsetX = 0;
        frameCtx.shadowOffsetY = 3;

        frameCtx.fillStyle = 'white';
        frameCtx.fillRect(x, y, boxWidth, boxHeight);
        
        frameCtx.shadowColor = 'transparent';
        frameCtx.strokeStyle = '#e5e7eb';
        frameCtx.lineWidth = 2;
        frameCtx.strokeRect(x, y, boxWidth, boxHeight);

        frameCtx.fillStyle = '#1f2937';
        frameCtx.font = 'bold 14px sans-serif';
        frameCtx.textAlign = 'center';
        frameCtx.fillText(node.label, node.x, y + 22);

        frameCtx.fillStyle = '#6b7280';
        frameCtx.font = '11px sans-serif';
        const slotCount = Object.keys(frame.slots).length;
        frameCtx.fillText(`${slotCount} thuộc tính`, node.x, y + 43);

        if (frame.inherits) {
            frameCtx.fillStyle = '#9ca3af';
            frameCtx.font = '10px sans-serif';
            frameCtx.fillText(`← ${currentData.frames[frame.inherits].name}`, node.x, y + 60);
        }
    });
    
    // Restore context state
    frameCtx.restore();
}

// Show frame detail
function showFrameDetail(nodeId) {
    const frame = currentData.frames[nodeId];
    if (!frame) return;

    const parentFrame = frame.inherits ? currentData.frames[frame.inherits] : null;

    let html = `
        <div class="frame-detail">
            <div class="frame-title">
                <span style="font-size: 22px;">📦</span>
                <h3>Frame: ${frame.name}</h3>
            </div>
            <div class="frame-section">
                <div class="section-title">
                    <div class="bullet"></div>
                    <span>Thuộc tính (Slots)</span>
                </div>
    `;

    for (const [key, value] of Object.entries(frame.slots)) {
        html += `
            <div class="slot-item">
                <div class="slot-key">${key}:</div>
                <div class="slot-value">${value}</div>
            </div>
        `;
    }

    html += `</div>`;

    if (parentFrame) {
        html += `
            <div class="frame-section inherited">
                <div class="section-title">
                    <div class="bullet"></div>
                    <span>Kế thừa từ: ${parentFrame.name}</span>
                </div>
        `;

        for (const [key, value] of Object.entries(parentFrame.slots)) {
            html += `
                <div class="slot-item">
                    <div class="slot-key">${key}:</div>
                    <div class="slot-value">${value}</div>
                </div>
            `;
        }

        html += `</div>`;
    }

    html += `</div>`;

    frameDetail.innerHTML = html;
    frameDetail.style.display = 'block';
    frameCanvas.style.display = 'none';
    frameEmpty.style.display = 'none';
}

// Event handlers
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadDataFromFile(file);
    }
    fileInput.value = '';
});

dataSelect.addEventListener('change', (e) => {
    const datasetKey = e.target.value;
    if (!datasetKey) return;

    currentData = datasets[datasetKey];
    selectedNode = null;
    
    semanticEmpty.style.display = 'none';
    frameEmpty.style.display = 'none';
    semanticCanvas.style.display = 'block';
    frameCanvas.style.display = 'block';
    frameDetail.style.display = 'none';

    drawSemanticNetwork();
    drawFrameNetwork();
});

resetBtn.addEventListener('click', () => {
    currentData = null;
    selectedNode = null;
    compareMode = false;
    dataSelect.value = '';
    
    // Reset zoom
    semanticZoom = { scale: 1, offsetX: 0, offsetY: 0 };
    frameZoom = { scale: 1, offsetX: 0, offsetY: 0 };
    
    semanticEmpty.style.display = 'block';
    frameEmpty.style.display = 'block';
    semanticCanvas.style.display = 'none';
    frameCanvas.style.display = 'none';
    frameDetail.style.display = 'none';
    
    semanticCtx.clearRect(0, 0, semanticCanvas.width, semanticCanvas.height);
    frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
});

semanticCanvas.addEventListener('click', (e) => {
    if (!currentData || isPanning) return;

    const rect = semanticCanvas.getBoundingClientRect();
    // Convert screen coordinates to canvas coordinates with zoom
    const x = (e.clientX - rect.left - semanticZoom.offsetX) / semanticZoom.scale;
    const y = (e.clientY - rect.top - semanticZoom.offsetY) / semanticZoom.scale;

    let clickedNode = null;
    for (const node of currentData.nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < 35) {
            clickedNode = node.id;
            break;
        }
    }

    if (!clickedNode) return;

    if (selectedNode === clickedNode) {
        selectedNode = null;
        frameDetail.style.display = 'none';
        frameCanvas.style.display = 'block';
        frameEmpty.style.display = 'none';
        drawFrameNetwork();
        drawSemanticNetwork();
        return;
    }

    selectedNode = clickedNode;
    showFrameDetail(clickedNode);
    drawSemanticNetwork();
});

// Zoom functionality for semantic canvas
semanticCanvas.addEventListener('wheel', (e) => {
    if (!currentData) return;
    e.preventDefault();
    
    const rect = semanticCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate zoom
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(0.3, semanticZoom.scale * zoom), 3);
    
    // Adjust offset to zoom towards mouse position
    semanticZoom.offsetX = mouseX - (mouseX - semanticZoom.offsetX) * (newScale / semanticZoom.scale);
    semanticZoom.offsetY = mouseY - (mouseY - semanticZoom.offsetY) * (newScale / semanticZoom.scale);
    semanticZoom.scale = newScale;
    
    drawSemanticNetwork();
});

// Pan functionality for semantic canvas
semanticCanvas.addEventListener('mousedown', (e) => {
    if (!currentData || e.button !== 0) return;
    
    const rect = semanticCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - semanticZoom.offsetX) / semanticZoom.scale;
    const y = (e.clientY - rect.top - semanticZoom.offsetY) / semanticZoom.scale;
    
    // Check if clicking on a node
    const clickedOnNode = currentData.nodes.some(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < 35;
    });
    
    if (!clickedOnNode) {
        isPanning = true;
        panStart = { x: e.clientX - semanticZoom.offsetX, y: e.clientY - semanticZoom.offsetY };
        semanticCanvas.style.cursor = 'grabbing';
    }
});

semanticCanvas.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    
    semanticZoom.offsetX = e.clientX - panStart.x;
    semanticZoom.offsetY = e.clientY - panStart.y;
    drawSemanticNetwork();
});

semanticCanvas.addEventListener('mouseup', () => {
    isPanning = false;
    semanticCanvas.style.cursor = 'pointer';
});

semanticCanvas.addEventListener('mouseleave', () => {
    isPanning = false;
    semanticCanvas.style.cursor = 'pointer';
});

// Zoom functionality for frame canvas
frameCanvas.addEventListener('wheel', (e) => {
    if (!currentData) return;
    e.preventDefault();
    
    const rect = frameCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate zoom
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(0.3, frameZoom.scale * zoom), 3);
    
    // Adjust offset to zoom towards mouse position
    frameZoom.offsetX = mouseX - (mouseX - frameZoom.offsetX) * (newScale / frameZoom.scale);
    frameZoom.offsetY = mouseY - (mouseY - frameZoom.offsetY) * (newScale / frameZoom.scale);
    frameZoom.scale = newScale;
    
    drawFrameNetwork();
});

// Pan functionality for frame canvas
let framePanning = false;
let framePanStart = { x: 0, y: 0 };

frameCanvas.addEventListener('mousedown', (e) => {
    if (!currentData || e.button !== 0) return;
    
    framePanning = true;
    framePanStart = { x: e.clientX - frameZoom.offsetX, y: e.clientY - frameZoom.offsetY };
    frameCanvas.style.cursor = 'grabbing';
});

frameCanvas.addEventListener('mousemove', (e) => {
    if (!framePanning) return;
    
    frameZoom.offsetX = e.clientX - framePanStart.x;
    frameZoom.offsetY = e.clientY - framePanStart.y;
    drawFrameNetwork();
});

frameCanvas.addEventListener('mouseup', () => {
    framePanning = false;
    frameCanvas.style.cursor = 'default';
});

frameCanvas.addEventListener('mouseleave', () => {
    framePanning = false;
    frameCanvas.style.cursor = 'default';
});