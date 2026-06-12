/* ── Plans Management ────────────────────────────────────────────── */
const Plans = {
    CATEGORIES: ['学业', '健康', '技能', '项目', '生活'],
    STATUS_LABELS: { todo: '待开始', in_progress: '进行中', done: '已完成', cancelled: '已取消' },

    async render(main) {
        const plans = await api('GET', '/api/plans');
        main.innerHTML = `
            <div class="page-header">
                <h2>📋 计划管理</h2>
                <button class="btn-primary" id="add-plan-btn">+ 新计划</button>
            </div>
            <div class="plans-list" id="plans-list">
                ${plans.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <p>还没有计划，点击上方按钮创建第一个</p>
                    </div>
                ` : plans.map(p => this._planCard(p)).join('')}
            </div>`;
        this._bindEvents();
    },

    _planCard(p) {
        const deadlineStr = p.deadline ? ` · 📅 ${p.deadline}` : '';
        return `
        <div class="plan-card" data-plan-id="${p.id}">
            <div class="plan-info">
                <div class="plan-title">
                    <span class="color-dot" style="background:${p.color || '#4A90D9'};flex-shrink:0;"></span>
                    ${this._esc(p.title)}
                </div>
                ${p.description ? `<div class="plan-desc">${this._esc(p.description)}</div>` : ''}
                <div class="plan-meta">
                    ${p.category ? `<span class="badge badge-category">${this._esc(p.category)}</span>` : ''}
                    <span class="badge badge-${p.status}">${this.STATUS_LABELS[p.status] || p.status}</span>
                    <span style="font-size:11px;color:var(--text-secondary);">${deadlineStr}</span>
                </div>
            </div>
            <div class="plan-actions">
                <button class="btn-sm edit-plan-btn" data-plan-id="${p.id}">✏️</button>
                <button class="btn-sm delete-plan-btn" data-plan-id="${p.id}" style="color:var(--danger);">🗑</button>
            </div>
        </div>`;
    },

    _bindEvents() {
        document.getElementById('add-plan-btn').onclick = () => this._showPlanModal();

        document.querySelectorAll('.edit-plan-btn').forEach(btn => {
            btn.onclick = async () => {
                const pid = btn.dataset.planId;
                const plans = await api('GET', '/api/plans');
                const plan = plans.find(p => p.id === pid);
                if (plan) this._showPlanModal(plan);
            };
        });

        document.querySelectorAll('.delete-plan-btn').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('确定删除这个计划吗？')) return;
                await api('DELETE', `/api/plans/${btn.dataset.planId}`);
                const main = document.getElementById('main-content');
                await this.render(main);
            };
        });
    },

    _showPlanModal(plan) {
        const isEdit = !!plan;
        const title = plan ? plan.title : '';
        const desc = plan ? (plan.description || '') : '';
        const category = plan ? (plan.category || '') : '';
        const status = plan ? plan.status : 'todo';
        const deadline = plan ? (plan.deadline || '') : '';
        const color = plan ? (plan.color || '#4A90D9') : '#4A90D9';

        const catOpts = this.CATEGORIES.map(c =>
            `<option value="${c}" ${c === category ? 'selected' : ''}>${c}</option>`
        ).join('');

        const statusOpts = Object.entries(this.STATUS_LABELS).map(([val, label]) =>
            `<option value="${val}" ${val === status ? 'selected' : ''}>${label}</option>`
        ).join('');

        showModal(`
            <h3>${isEdit ? '编辑计划' : '新建计划'}</h3>
            <div class="form-group">
                <label>标题 *</label>
                <input type="text" id="plan-title" value="${this._esc(title)}" placeholder="计划标题" />
            </div>
            <div class="form-group">
                <label>描述</label>
                <textarea id="plan-desc" placeholder="详细描述...">${this._esc(desc)}</textarea>
            </div>
            <div class="form-group" style="display:flex;gap:12px;">
                <div style="flex:1;">
                    <label>分类</label>
                    <select id="plan-category">
                        <option value="">无分类</option>
                        ${catOpts}
                    </select>
                </div>
                <div style="flex:1;">
                    <label>状态</label>
                    <select id="plan-status">${statusOpts}</select>
                </div>
            </div>
            <div class="form-group" style="display:flex;gap:12px;">
                <div style="flex:1;">
                    <label>截止日期</label>
                    <input type="date" id="plan-deadline" value="${deadline}" />
                </div>
                <div>
                    <label>颜色</label>
                    <input type="color" id="plan-color" value="${color}" style="width:50px;height:32px;padding:2px;" />
                </div>
            </div>
            <div class="form-actions">
                <button class="btn-cancel" onclick="hideModal()">取消</button>
                <button class="btn-primary" id="btn-save-plan">${isEdit ? '保存' : '创建'}</button>
            </div>`);

        document.getElementById('btn-save-plan').onclick = async () => {
            const data = {
                title: document.getElementById('plan-title').value.trim(),
                description: document.getElementById('plan-desc').value.trim(),
                category: document.getElementById('plan-category').value,
                status: document.getElementById('plan-status').value,
                deadline: document.getElementById('plan-deadline').value,
                color: document.getElementById('plan-color').value,
            };
            if (!data.title) { alert('请输入计划标题'); return; }
            if (isEdit) {
                await api('PUT', `/api/plans/${plan.id}`, data);
            } else {
                await api('POST', '/api/plans', data);
            }
            hideModal();
            const main = document.getElementById('main-content');
            await this.render(main);
        };
    },

    _esc(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
};
