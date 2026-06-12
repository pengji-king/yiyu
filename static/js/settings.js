/* Settings: Theme & Background */
const Settings = {
    KEY: 'yiyu_settings',

    defaults: {
        accent: '#C4956A',
        background: null,
        glass: 8,   // 0–20px backdrop-filter blur on foreground
        opacity: 70, // 40–100% foreground opacity
    },

    get() {
        try {
            const raw = localStorage.getItem(this.KEY);
            return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
        } catch { return { ...this.defaults }; }
    },

    save(obj) {
        localStorage.setItem(this.KEY, JSON.stringify({ ...this.get(), ...obj }));
    },

    apply() {
        const s = this.get();
        document.documentElement.style.setProperty('--accent', s.accent);
        document.documentElement.style.setProperty('--accent-light', this._lighten(s.accent, 0.6));

        // Background overlay — always clear, no blur
        let overlay = document.getElementById('yiyu-bg-overlay');
        if (s.background) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'yiyu-bg-overlay';
                document.body.prepend(overlay);
            }
            overlay.style.backgroundImage = `url(${s.background})`;
            overlay.style.filter = 'none';
        } else {
            if (overlay) overlay.remove();
        }

        // Glass mode CSS
        const styleId = 'yiyu-dynamic-theme';
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        if (s.background) {
            const glass = s.glass || 0;
            const alpha = (s.opacity || 70) / 100;
            // Light surfaces become semi-transparent with backdrop blur
            const sidebarAlpha = Math.max(0.2, alpha - 0.1);
            const cardAlpha = alpha;
            const modalAlpha = Math.min(1, alpha + 0.15);
            styleEl.textContent = `
                .nav-link.active { background: ${s.accent} !important; }
                .btn-primary { background: ${s.accent}; }
                .stat-card .stat-value { color: ${s.accent}; }

                /* Glass morphism — foreground becomes translucent */
                body { background: transparent !important; }
                #main-content { background: transparent !important; }
                #sidebar {
                    background: rgba(250,248,245, ${sidebarAlpha.toFixed(2)}) !important;
                    backdrop-filter: blur(${glass}px);
                    -webkit-backdrop-filter: blur(${glass}px);
                }
                /* Cards & surfaces across all pages */
                .card,
                .stat-card,
                .plan-card,
                .calendar-grid,
                .cal-cell,
                .check-item,
                .heatmap-container,
                .empty-state {
                    background: rgba(255,255,255, ${cardAlpha.toFixed(2)}) !important;
                    backdrop-filter: blur(${glass}px);
                    -webkit-backdrop-filter: blur(${glass}px);
                }
                .cal-header,
                .calendar-nav,
                .check-item:hover {
                    background: rgba(250,248,245, ${sidebarAlpha.toFixed(2)}) !important;
                    backdrop-filter: blur(${glass}px);
                    -webkit-backdrop-filter: blur(${glass}px);
                }
                .modal {
                    background: rgba(255,255,255, ${modalAlpha.toFixed(2)}) !important;
                    backdrop-filter: blur(${Math.max(glass, 12)}px);
                    -webkit-backdrop-filter: blur(${Math.max(glass, 12)}px);
                }
                .onboarding-tooltip {
                    background: rgba(255,255,255, ${modalAlpha.toFixed(2)}) !important;
                    backdrop-filter: blur(${Math.max(glass, 12)}px);
                    -webkit-backdrop-filter: blur(${Math.max(glass, 12)}px);
                }
                .tooltip {
                    background: rgba(45,45,45, 0.85) !important;
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                }
                /* Reset hover overrides that use solid colors */
                .check-item:hover { background: rgba(250,248,245, ${sidebarAlpha.toFixed(2)}) !important; }
                .cal-cell:hover { background: rgba(250,248,245, ${sidebarAlpha.toFixed(2)}) !important; }
            `;
        } else {
            styleEl.textContent = `
                .nav-link.active { background: ${s.accent} !important; }
                .btn-primary { background: ${s.accent}; }
                .stat-card .stat-value { color: ${s.accent}; }
            `;
        }
    },

    renderModal() {
        const s = this.get();
        const presets = [
            '#C4956A', '#6B8F71', '#6A9FB5', '#B5737A', '#9B7EB8',
            '#D4954B', '#5A8F8F', '#B56A8A', '#6A8FB5', '#8B8B8B',
        ];
        const bgPreview = s.background
            ? `<div style="width:100%;height:56px;border-radius:8px;background:url(${s.background}) center/cover;margin-bottom:8px;border:1px solid var(--border);"></div>`
            : '';

        return `
            <h3>🎨 个性化设置</h3>

            <div class="form-group">
                <label>主题色</label>
                <div class="theme-presets">
                    ${presets.map(c => `
                        <button class="theme-swatch ${s.accent === c ? 'active' : ''}"
                            style="background:${c};" data-color="${c}"
                            title="${c}"></button>
                    `).join('')}
                </div>
            </div>

            <div class="form-group">
                <label>自定义颜色</label>
                <input type="color" id="settings-accent-picker" value="${s.accent}"
                    style="width:60px;height:36px;padding:2px;border-radius:8px;border:1px solid var(--border);cursor:pointer;" />
            </div>

            <hr style="border:none;border-top:1px solid var(--border);margin:20px 0;" />

            <div class="form-group">
                <label>背景图片</label>
                ${bgPreview}
                <div style="display:flex;gap:8px;">
                    <label class="btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;">
                        📁 选择图片
                        <input type="file" id="settings-bg-file" accept="image/*" style="display:none;" />
                    </label>
                    ${s.background ? '<button class="btn-sm" id="settings-bg-remove" style="color:var(--danger);">✕ 移除背景</button>' : ''}
                </div>
            </div>

            ${s.background ? `
            <div class="form-group">
                <label>毛玻璃模糊 <span style="font-weight:400;color:var(--text-secondary);">— ${s.glass || 0}px</span></label>
                <input type="range" id="settings-glass" min="0" max="20" value="${s.glass || 8}" step="1"
                    style="width:100%;accent-color:var(--accent);" />
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);">
                    <span>清晰</span><span>半透</span><span>毛玻璃</span>
                </div>
            </div>

            <div class="form-group">
                <label>前景透明度 <span style="font-weight:400;color:var(--text-secondary);">— ${s.opacity || 70}%</span></label>
                <input type="range" id="settings-opacity" min="40" max="100" value="${s.opacity || 70}" step="5"
                    style="width:100%;accent-color:var(--accent);" />
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);">
                    <span>很透</span><span>适中</span><span>实色</span>
                </div>
            </div>
            ` : ''}

            <div class="form-actions">
                <button class="btn-sm" id="settings-reset" style="margin-right:auto;color:var(--text-secondary);">恢复默认</button>
                <button class="btn-cancel" onclick="hideModal()">关闭</button>
            </div>`;
    },

    bindEvents() {
        document.querySelectorAll('.theme-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                this.save({ accent: color });
                this.apply();
                const picker = document.getElementById('settings-accent-picker');
                if (picker) picker.value = color;
                document.querySelectorAll('.theme-swatch').forEach(b => {
                    b.classList.toggle('active', b.dataset.color === color);
                });
            });
        });

        const picker = document.getElementById('settings-accent-picker');
        if (picker) {
            picker.addEventListener('input', () => {
                const color = picker.value;
                this.save({ accent: color });
                this.apply();
                document.querySelectorAll('.theme-swatch').forEach(b => {
                    b.classList.toggle('active', b.dataset.color === color);
                });
            });
        }

        const fileInput = document.getElementById('settings-bg-file');
        if (fileInput) {
            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                    this.save({ background: reader.result });
                    this.apply();
                    hideModal();
                    showModal(this.renderModal());
                    this.bindEvents();
                };
                reader.readAsDataURL(file);
            });
        }

        const removeBtn = document.getElementById('settings-bg-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.save({ background: null });
                this.apply();
                hideModal();
                showModal(this.renderModal());
                this.bindEvents();
            });
        }

        const glassSlider = document.getElementById('settings-glass');
        if (glassSlider) {
            glassSlider.addEventListener('input', () => {
                const val = parseInt(glassSlider.value);
                this.save({ glass: val });
                this.apply();
                const label = glassSlider.closest('.form-group').querySelector('label span');
                if (label) label.textContent = `— ${val}px`;
            });
        }

        const opacitySlider = document.getElementById('settings-opacity');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', () => {
                const val = parseInt(opacitySlider.value);
                this.save({ opacity: val });
                this.apply();
                const label = opacitySlider.closest('.form-group').querySelector('label span');
                if (label) label.textContent = `— ${val}%`;
            });
        }

        document.getElementById('settings-reset').addEventListener('click', () => {
            localStorage.removeItem(this.KEY);
            this.apply();
            hideModal();
            showModal(this.renderModal());
            this.bindEvents();
        });
    },

    _lighten(hex, amount) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const lr = Math.round(r + (255 - r) * amount);
        const lg = Math.round(g + (255 - g) * amount);
        const lb = Math.round(b + (255 - b) * amount);
        return `rgb(${lr},${lg},${lb})`;
    },

    init() {
        this.apply();
    }
};

document.addEventListener('DOMContentLoaded', () => Settings.init());
