/* Onboarding Tutorial */
const Onboarding = {
    STORAGE_KEY: 'yiyu_onboarding_done',
    steps: [
        {
            title: '欢迎来到一隅',
            body: '这是一个帮助你管理时间、制定计划、养成习惯的个人工具。<br><br>下面花 1 分钟快速了解如何使用。',
            target: null,
            placement: 'center',
        },
        {
            title: '📊 概览 · 环形时钟',
            body: '这是你的<strong>24小时环形时钟</strong>。<br>点击圆环任意位置可以<strong>添加时间块</strong>，点击已有色块可以<strong>编辑或删除</strong>。<br><br>右侧卡片显示今日统计和快速打卡。',
            target: '#clock-container',
            placement: 'right',
        },
        {
            title: '📅 日历 · 提前安排',
            body: '<strong>点击侧边栏"日历"</strong>进入日历视图。<br>点击任意日期即可查看或<strong>为未来任何一天提前安排</strong>时间块。<br><br>💡 提示：概览页也支持切换日期，用时钟上方的箭头即可。',
            target: '.nav-link[data-view="calendar"]',
            placement: 'right',
        },
        {
            title: '📋 计划 · 目标管理',
            body: '在计划页面创建你的<strong>长期目标</strong>。<br>设置分类、状态、截止日期，追踪每个计划的进度。',
            target: '.nav-link[data-view="plans"]',
            placement: 'right',
        },
        {
            title: '✅ 打卡 · 习惯养成',
            body: '创建每日习惯，一键打卡。<br>GitHub 风格的<strong>年度热力图</strong>会记录你的每一天，帮你保持连续。',
            target: '.nav-link[data-view="checkin"]',
            placement: 'right',
        },
        {
            title: '一切就绪 🎉',
            body: '数据自动保存在本地，<strong>无需注册账号</strong>。<br>备份只需复制 <code>data/</code> 文件夹即可。<br><br>祝你暑假充实愉快！',
            target: null,
            placement: 'center',
        },
    ],
    currentStep: 0,
    overlay: null,
    tooltip: null,

    start() {
        if (localStorage.getItem(this.STORAGE_KEY)) return;
        this.currentStep = 0;
        this._createDOM();
        this._showStep(0);
    },

    restart() {
        this.currentStep = 0;
        this._createDOM();
        this._showStep(0);
    },

    _createDOM() {
        if (document.getElementById('onboarding-overlay')) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);

        this.spotlight = document.createElement('div');
        this.spotlight.id = 'onboarding-spotlight';
        this.spotlight.className = 'onboarding-spotlight hidden';
        document.body.appendChild(this.spotlight);

        this.tooltip = document.createElement('div');
        this.tooltip.id = 'onboarding-tooltip';
        this.tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(this.tooltip);
    },

    _removeDOM() {
        [this.overlay, this.spotlight, this.tooltip].forEach(el => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        this.overlay = null;
        this.spotlight = null;
        this.tooltip = null;
    },

    _showStep(index) {
        if (index >= this.steps.length) {
            this._finish();
            return;
        }
        this.currentStep = index;
        const step = this.steps[index];
        const total = this.steps.length;

        if (!step.target) {
            // Center modal
            this.spotlight.classList.add('hidden');
            this.overlay.classList.remove('hidden');
            this.tooltip.classList.add('onboarding-center');
            this.tooltip.classList.remove('onboarding-right', 'onboarding-left', 'onboarding-bottom');
            this.tooltip.style.left = '';
            this.tooltip.style.top = '';
        } else {
            this.overlay.classList.remove('hidden');
            this._positionSpotlight(step.target);
            this._positionTooltip(step.target, step.placement || 'right');
        }

        const isFirst = index === 0;
        const isLast = index === total - 1;

        this.tooltip.innerHTML = `
            <div class="onboarding-step-count">${index + 1} / ${total}</div>
            <h3 class="onboarding-title">${step.title}</h3>
            <p class="onboarding-body">${step.body}</p>
            <div class="onboarding-actions">
                <button class="onboarding-btn-skip" id="onboarding-skip">跳过</button>
                ${!isFirst ? '<button class="onboarding-btn-prev" id="onboarding-prev">上一步</button>' : ''}
                <button class="onboarding-btn-next" id="onboarding-next">${isLast ? '开始使用' : '下一步 →'}</button>
            </div>
        `;

        this.tooltip.classList.remove('hidden');

        document.getElementById('onboarding-next').onclick = () => this._showStep(index + 1);
        document.getElementById('onboarding-skip').onclick = () => this._finish();
        const prevBtn = document.getElementById('onboarding-prev');
        if (prevBtn) prevBtn.onclick = () => this._showStep(index - 1);
    },

    _positionSpotlight(targetSelector) {
        const target = document.querySelector(targetSelector);
        if (!target) {
            this.spotlight.classList.add('hidden');
            return;
        }
        const rect = target.getBoundingClientRect();
        const pad = 8;
        this.spotlight.style.left = (rect.left - pad) + 'px';
        this.spotlight.style.top = (rect.top - pad) + 'px';
        this.spotlight.style.width = (rect.width + pad * 2) + 'px';
        this.spotlight.style.height = (rect.height + pad * 2) + 'px';
        this.spotlight.classList.remove('hidden');
    },

    _positionTooltip(targetSelector, placement) {
        const target = document.querySelector(targetSelector);
        const tooltip = this.tooltip;

        tooltip.classList.remove('onboarding-center');
        tooltip.style.left = '';
        tooltip.style.top = '';
        tooltip.style.bottom = '';
        tooltip.style.right = '';

        if (!target) return;

        const rect = target.getBoundingClientRect();
        const tipW = 340;

        if (placement === 'right') {
            const left = Math.min(rect.right + 20, window.innerWidth - tipW - 20);
            tooltip.style.left = left + 'px';
            tooltip.style.top = Math.max(60, rect.top - 20) + 'px';
            tooltip.classList.add('onboarding-right');
        } else if (placement === 'bottom') {
            tooltip.style.left = Math.max(20, rect.left) + 'px';
            tooltip.style.top = (rect.bottom + 16) + 'px';
            tooltip.classList.add('onboarding-bottom');
        } else if (placement === 'left') {
            tooltip.style.left = Math.max(20, rect.left - tipW - 20) + 'px';
            tooltip.style.top = Math.max(60, rect.top - 20) + 'px';
            tooltip.classList.add('onboarding-left');
        }
    },

    _finish() {
        localStorage.setItem(this.STORAGE_KEY, '1');
        this._removeDOM();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Delay a bit so the page renders first
    setTimeout(() => Onboarding.start(), 600);
});
