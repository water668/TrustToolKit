class PhotoEditor {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadSection = document.getElementById('uploadSection');
        this.editorSection = document.getElementById('editorSection');
        this.cropFrame = document.getElementById('cropFrame');
        this.zoomOutBtn = document.getElementById('zoomOutBtn');
        this.zoomInBtn = document.getElementById('zoomInBtn');
        this.zoomValue = document.getElementById('zoomValue');
        this.resetBtn = document.getElementById('resetBtn');
        this.exportBtn = document.getElementById('exportBtn');
        
        this.image = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.photoSizes = {
            '1inch': { width: 295, height: 413 },
            '2inch': { width: 413, height: 579 }
        };
        this.currentSize = '1inch';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        this.canvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.canvas.addEventListener('mousemove', (e) => this.drag(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrag());
        this.canvas.addEventListener('mouseleave', () => this.stopDrag());
        
        this.canvas.addEventListener('touchstart', (e) => this.startTouchDrag(e));
        this.canvas.addEventListener('touchmove', (e) => this.touchDrag(e));
        this.canvas.addEventListener('touchend', () => this.stopDrag());
        
        this.zoomOutBtn.addEventListener('click', () => this.zoom(-0.1));
        this.zoomInBtn.addEventListener('click', () => this.zoom(0.1));
        
        document.querySelectorAll('input[name="photoSize"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.changeSize(e.target.value));
        });
        
        this.resetBtn.addEventListener('click', () => this.reset());
        this.exportBtn.addEventListener('click', () => this.exportPhoto());
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }
    
    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.image = new Image();
            this.image.onload = () => {
                this.reset();
                this.showEditor();
            };
            this.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    showEditor() {
        this.uploadSection.style.display = 'none';
        this.editorSection.style.display = 'block';
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const wrapper = document.getElementById('canvasWrapper');
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        this.updateCropFrame();
        this.draw();
    }
    
    updateCropFrame() {
        const wrapper = document.getElementById('canvasWrapper');
        const wrapperWidth = wrapper.clientWidth;
        const wrapperHeight = wrapper.clientHeight;
        
        const size = this.photoSizes[this.currentSize];
        const aspectRatio = size.width / size.height;
        
        let frameWidth, frameHeight;
        
        if (wrapperWidth / wrapperHeight > aspectRatio) {
            frameHeight = wrapperHeight * 0.8;
            frameWidth = frameHeight * aspectRatio;
        } else {
            frameWidth = wrapperWidth * 0.8;
            frameHeight = frameWidth / aspectRatio;
        }
        
        const frameX = (wrapperWidth - frameWidth) / 2;
        const frameY = (wrapperHeight - frameHeight) / 2;
        
        this.cropFrame.style.width = `${frameWidth}px`;
        this.cropFrame.style.height = `${frameHeight}px`;
        this.cropFrame.style.left = `${frameX}px`;
        this.cropFrame.style.top = `${frameY}px`;
        
        this.cropArea = {
            x: frameX,
            y: frameY,
            width: frameWidth,
            height: frameHeight,
            originalWidth: size.width,
            originalHeight: size.height
        };
        
        this.draw();
    }
    
    draw() {
        if (!this.image) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const centerX = this.canvas.width / 2 + this.offsetX;
        const centerY = this.canvas.height / 2 + this.offsetY;
        
        const imageWidth = this.image.width * this.scale;
        const imageHeight = this.image.height * this.scale;
        
        this.ctx.drawImage(
            this.image,
            centerX - imageWidth / 2,
            centerY - imageHeight / 2,
            imageWidth,
            imageHeight
        );
    }
    
    startDrag(e) {
        this.isDragging = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        this.offsetX += currentX - this.lastX;
        this.offsetY += currentY - this.lastY;
        
        this.lastX = currentX;
        this.lastY = currentY;
        
        this.draw();
    }
    
    stopDrag() {
        this.isDragging = false;
    }
    
    startTouchDrag(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.lastX = e.touches[0].clientX - rect.left;
            this.lastY = e.touches[0].clientY - rect.top;
        }
    }
    
    touchDrag(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.touches[0].clientX - rect.left;
        const currentY = e.touches[0].clientY - rect.top;
        
        this.offsetX += currentX - this.lastX;
        this.offsetY += currentY - this.lastY;
        
        this.lastX = currentX;
        this.lastY = currentY;
        
        this.draw();
    }
    
    zoom(delta) {
        const newScale = this.scale + delta;
        if (newScale >= 0.1 && newScale <= 3) {
            this.scale = newScale;
            this.zoomValue.textContent = `${Math.round(this.scale * 100)}%`;
            this.draw();
        }
    }
    
    changeSize(size) {
        this.currentSize = size;
        this.updateCropFrame();
    }
    
    reset() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoomValue.textContent = '100%';
        this.draw();
    }
    
    exportPhoto() {
        if (!this.image) return;
        
        const size = this.photoSizes[this.currentSize];
        const dpi = 300;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = size.width;
        exportCanvas.height = size.height;
        const exportCtx = exportCanvas.getContext('2d');
        
        const imageWidth = this.image.width * this.scale;
        const imageHeight = this.image.height * this.scale;
        
        const imageLeft = (this.canvas.width - imageWidth) / 2 + this.offsetX;
        const imageTop = (this.canvas.height - imageHeight) / 2 + this.offsetY;
        
        const cropOffsetX = this.cropArea.x - imageLeft;
        const cropOffsetY = this.cropArea.y - imageTop;
        
        const sourceX = cropOffsetX / this.scale;
        const sourceY = cropOffsetY / this.scale;
        const sourceWidth = this.cropArea.width / this.scale;
        const sourceHeight = this.cropArea.height / this.scale;
        
        exportCtx.drawImage(
            this.image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            size.width,
            size.height
        );
        
        const pngData = this.addDpiToPng(exportCanvas.toDataURL('image/png'), dpi);
        
        const link = document.createElement('a');
        link.download = `证件照_${this.currentSize === '1inch' ? '1寸' : '2寸'}.png`;
        link.href = pngData;
        link.click();
    }
    
    addDpiToPng(dataUrl, dpi) {
        const base64Data = dataUrl.split(',')[1];
        const binary = atob(base64Data);
        
        const ihdrIndex = binary.indexOf('IHDR');
        if (ihdrIndex === -1) {
            return dataUrl;
        }
        
        const ihdrLength = this.readUint32(binary, ihdrIndex - 4);
        const ihdrChunkEnd = ihdrIndex + 4 + ihdrLength + 4;
        
        const dpm = Math.round(dpi * 39.3701);
        const physChunk = this.createPhysChunk(dpm);
        
        const before = binary.substring(0, ihdrChunkEnd);
        const after = binary.substring(ihdrChunkEnd);
        
        const newBinary = before + physChunk + after;
        
        return 'data:image/png;base64,' + btoa(newBinary);
    }
    
    readUint32(str, offset) {
        return str.charCodeAt(offset) << 24 |
               str.charCodeAt(offset + 1) << 16 |
               str.charCodeAt(offset + 2) << 8 |
               str.charCodeAt(offset + 3);
    }
    
    createPhysChunk(dpm) {
        const data = new ArrayBuffer(9);
        const view = new DataView(data);
        
        view.setUint32(0, dpm, false);
        view.setUint32(4, dpm, false);
        view.setUint8(8, 1);
        
        const chunkType = 'pHYs';
        const chunkData = String.fromCharCode(...new Uint8Array(data));
        
        const crcData = chunkType + chunkData;
        const crc = this.crc32(crcData);
        
        const length = this.numberToBytes(9);
        const crcBytes = this.numberToBytes(crc);
        
        return length + chunkType + chunkData + crcBytes;
    }
    
    numberToBytes(num) {
        const bytes = [];
        for (let i = 3; i >= 0; i--) {
            bytes.push((num >> (8 * i)) & 0xff);
        }
        return String.fromCharCode(...bytes);
    }
    
    crc32(str) {
        let crc = 0xffffffff;
        const table = [];
        
        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c;
        }
        
        for (let i = 0; i < str.length; i++) {
            crc = table[(crc ^ str.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
        }
        
        return (crc ^ 0xffffffff) >>> 0;
    }
}

let photoEditorInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    photoEditorInstance = new PhotoEditor();
});

function loadExample(index) {
    const examples = [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ID%20card%20photo%20of%20professional%20Asian%20woman%20with%20neutral%20expression%20white%20background%20formal%20attire&image_size=portrait_4_3',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Passport%20photo%20of%20professional%20Asian%20man%20with%20neutral%20expression%20blue%20background%20business%20suit&image_size=portrait_4_3',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Professional%20resume%20photo%20of%20young%20Asian%20woman%20smiling%20white%20background%20business%20casual&image_size=portrait_4_3',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Student%20ID%20photo%20of%20young%20Asian%20girl%20with%20neutral%20expression%20white%20background%20school%20uniform&image_size=portrait_4_3'
    ];
    
    if (photoEditorInstance) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            photoEditorInstance.image = img;
            photoEditorInstance.reset();
            photoEditorInstance.showEditor();
        };
        img.src = examples[index - 1];
    }
}

