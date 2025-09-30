// Smart LOD Selection based on device capabilities
// Considers DPR, deviceMemory, GPU capabilities

export class LODSelector {
    constructor(renderer) {
        this.renderer = renderer;
        this.deviceTier = this.detectDeviceTier();
        console.log(`🎯 Device Tier: ${this.deviceTier.name}`);
        console.log(`   GPU: ${this.deviceTier.maxTextureSize}px`);
        console.log(`   Memory: ${this.deviceTier.memory}GB`);
        console.log(`   DPR: ${this.deviceTier.dpr}`);
    }

    detectDeviceTier() {
        const gl = this.renderer.getContext();
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const dpr = window.devicePixelRatio || 1;
        const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const effectiveType = connection ? connection.effectiveType : '4g';
        
        // Detect if mobile/tablet
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Tier calculation - Most modern devices default to high
        let tier = 'high';
        let quality = 'high-mid';
        let targetFPS = 60;
        let targetDPR = 1;

        // Ultra: Only for very high-end devices
        if (maxTextureSize >= 16384 && memory >= 16 && dpr >= 2) {
            tier = 'ultra';
            quality = 'very-high';
            targetFPS = 60;
            targetDPR = 2;
        }
        // High: Most modern devices (default)
        else if (maxTextureSize >= 8192 && memory >= 4) {
            tier = 'high';
            quality = 'high-mid';
            targetFPS = 60;
            targetDPR = 1.5;
        }
        // Medium: Older but still capable devices
        else if (maxTextureSize >= 4096) {
            tier = 'medium';
            quality = 'medium';
            targetFPS = 60;
            targetDPR = 1;
        }
        // Low: Only for very old/limited devices
        else {
            tier = 'low';
            quality = 'low';
            targetFPS = 60;
            targetDPR = 1;
        }

        // Mobile/Phone override - use medium quality for better performance and battery
        if (isMobile) {
            quality = 'medium';
            tier = 'medium';
            targetDPR = 1;
        }

        // Network consideration
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
            quality = 'low'; // Force low quality on very slow networks
        }

        return {
            name: tier,
            quality: quality,
            maxTextureSize: maxTextureSize,
            dpr: dpr,
            memory: memory,
            network: effectiveType,
            targetFPS: targetFPS,
            targetDPR: targetDPR,
            isMobile: isMobile
        };
    }

    getQualityLevel() {
        return this.deviceTier.quality;
    }

    getTextureUrl(basename) {
        const quality = this.deviceTier.quality;
        const ext = quality === 'high' ? 'jpg' : 'webp';
        return `textures/processed/${quality}/${basename}.${ext}`;
    }

    shouldUseKTX2() {
        // Use KTX2 for medium and above
        return this.deviceTier.quality !== 'low';
    }

    getMaxConcurrentLoads() {
        // Limit concurrent loads based on tier
        const limits = {
            'ultra': 6,
            'high': 4,
            'medium': 2,
            'low': 1
        };
        return limits[this.deviceTier.name] || 2;
    }
}

