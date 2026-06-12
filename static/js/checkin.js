/* ── Check-in & Heatmap ──────────────────────────────────────────── */
const Checkin = {
    /* ── Full page render ─────────────────────────────────────── */
    async render(main) {
        const dateStr = todayStr();
        const [data, heatmapData] = await Promise.all([
            api('GET', '/api/checkins', { date: dateStr }),
            api('GET', '/api/checkins/heatmap', { year: new Date().getFullYear() }),
        ]);

        main.innerHTML = `
            <div class="page-header">
                <h2>✅ 每日打卡</h2>
                <button class="btn-primary" id="add-habit-btn">+ 新习惯</button>
            </div>
            <div class="card" style="margin-bottom:20px;">
                <h3>今日 · ${formatDate(dateStr)}</h3>
                <div id="main-checkin">${this.renderCompact(data, dateStr)}</div>
            </div>
            <div class="heatmap-container">
                <h3>📊 ${new Date().getFullYear()} 年打卡热力图</h3>
                ${this._buildHeatmap(heatmapData.data)}
            </div>
            <div class="card" style="margin-top:24px;">
                <h3>习惯管理</h3>
                <div id="habits-list">${this._habitList(data.habits)}</div>
            </div>`;

        this.bindCompactEvents(dateStr);
        this._bindHabitEvents();
    },

    /* ── Compact render (for dashboard sidebar / calendar) ────── */
    renderCompact(data, dateStr) {
        const habits = data.habits || [];
        const records = data.records || {};
        if (habits.length === 0) {
            return `<div class="empty-state" style="padding:20px;">
                <p style="font-size:13px;">还没有习惯，去打卡页面创建吧</p>
            </div>`;
        }
        return `<div class="check-list">${habits.map(h => {
            const rec = records[h.id];
            const done = rec && rec.done;
            return `<div class="check-item" data-habit-id="${h.id}">
                <span class="check-emoji">${h.emoji || '☐'}</span>
                <span class="check-name">${this._esc(h.name)}</span>
                <button class="check-toggle ${done ? 'checked' : ''}">${done ? '✓' : ''}</button>
            </div>`;
        }).join('')}</div>`;
    },

    bindCompactEvents(dateStr) {
        document.querySelectorAll('.check-item').forEach(item => {
            item.onclick = async function(e) {
                // Don't trigger if clicking a button inside
                if (e.target.tagName === 'BUTTON') return;
                const habitId = this.dataset.habitId;
                const toggle = this.querySelector('.check-toggle');
                const isChecked = toggle.classList.contains('checked');
                await api('POST', '/api/checkins', {
                    date: dateStr, habit_id: habitId, done: !isChecked
                });
                if (!isChecked) {
                    toggle.classList.add('checked');
                    toggle.textContent = '✓';
                } else {
                    toggle.classList.remove('checked');
                    toggle.textContent = '';
                }
            };
        });
    },

    /* ── Habit list (management page) ─────────────────────────── */
    _habitList(habits) {
        if (habits.length === 0) {
            return `<div class="empty-state" style="padding:20px;">
                <div class="empty-icon">🌟</div>
                <p>还没有习惯，创建一个开始打卡吧</p>
            </div>`;
        }
        return `<div class="check-list">${habits.map(h => `
            <div class="check-item" style="cursor:default;">
                <span class="check-emoji">${h.emoji || '☐'}</span>
                <span class="check-name">${this._esc(h.name)}</span>
                <button class="btn-sm edit-habit-btn" data-habit-id="${h.id}">✏️</button>
                <button class="btn-sm delete-habit-btn" data-habit-id="${h.id}" style="color:var(--danger);">🗑</button>
            </div>
        `).join('')}</div>`;
    },

    _bindHabitEvents() {
        const addBtn = document.getElementById('add-habit-btn');
        if (addBtn) addBtn.onclick = () => this._showHabitModal();

        document.querySelectorAll('.edit-habit-btn').forEach(btn => {
            btn.onclick = async () => {
                const checkinData = await api('GET', '/api/checkins', { date: todayStr() });
                const habit = checkinData.habits.find(h => h.id === btn.dataset.habitId);
                if (habit) this._showHabitModal(habit);
            };
        });

        document.querySelectorAll('.delete-habit-btn').forEach(btn => {
            btn.onclick = async () => {
                if (!confirm('确定删除这个习惯吗？所有打卡记录也会删除。')) return;
                await api('DELETE', `/api/checkins/habits/${btn.dataset.habitId}`);
                const main = document.getElementById('main-content');
                await this.render(main);
            };
        });
    },

    _showHabitModal(habit) {
        const isEdit = !!habit;
        showModal(`
            <h3>${isEdit ? '编辑习惯' : '新建习惯'}</h3>
            <div class="form-group">
                <label>名称 *</label>
                <input type="text" id="habit-name" value="${this._esc(habit ? habit.name : '')}" placeholder="例如：跑步" />
            </div>
            <div class="form-group">
                <label>图标 Emoji</label>
                <input type="text" id="habit-emoji" value="${this._esc(habit ? (habit.emoji || '') : '')}" placeholder="例如：🏃" maxlength="4" style="font-size:20px;" />
            </div>
            <div class="form-group">
                <label>颜色</label>
                <input type="color" id="habit-color" value="${habit ? (habit.color || '#C4956A') : '#C4956A'}" style="width:60px;height:32px;padding:2px;" />
            </div>
            <div class="form-actions">
                <button class="btn-cancel" onclick="hideModal()">取消</button>
                <button class="btn-primary" id="btn-save-habit">${isEdit ? '保存' : '创建'}</button>
            </div>`);

        document.getElementById('btn-save-habit').onclick = async () => {
            const data = {
                name: document.getElementById('habit-name').value.trim(),
                emoji: document.getElementById('habit-emoji').value.trim(),
                color: document.getElementById('habit-color').value,
            };
            if (!data.name) { alert('请输入习惯名称'); return; }
            if (isEdit) {
                await api('PUT', `/api/checkins/habits/${habit.id}`, data);
            } else {
                await api('POST', '/api/checkins/habits', data);
            }
            hideModal();
            const main = document.getElementById('main-content');
            await this.render(main);
        };
    },

    /* ── Heatmap (GitHub-style) ───────────────────────────────── */
    _buildHeatmap(data) {
        const year = new Date().getFullYear();
        // Find the first Sunday on or before Jan 1
        const firstDate = new Date(year, 0, 1);
        while (firstDate.getDay() !== 0) firstDate.setDate(firstDate.getDate() - 1);
        // Find the last Saturday on or after Dec 31
        const lastDate = new Date(year, 11, 31);
        while (lastDate.getDay() !== 6) lastDate.setDate(lastDate.getDate() + 1);

        const totalDays = Math.ceil((lastDate - firstDate) / (24 * 3600 * 1000)) + 1;
        const weeks = Math.ceil(totalDays / 7);
        const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

        // Build month labels
        let monthHtml = '<div class="heatmap-month-labels" style="display:flex;margin-bottom:4px;">';
        for (let w = 0; w < weeks; w++) {
            const d = new Date(firstDate);
            d.setDate(d.getDate() + w * 7);
            const label = months[d.getMonth()];
            if (d.getDate() <= 7) {
                monthHtml += `<span style="font-size:10px;width:${weeks > 30 ? '13px' : '15px'};">${label}</span>`;
            } else {
                monthHtml += `<span style="font-size:10px;width:${weeks > 30 ? '13px' : '15px'};"></span>`;
            }
        }
        monthHtml += '</div>';

        // Build 7 rows (Sun-Sat) x N weeks
        const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
        let gridHtml = '<div class="heatmap-wrapper">';
        // Day labels column
        gridHtml += '<div style="display:flex;flex-direction:column;gap:3px;margin-right:6px;">';
        for (let day = 0; day < 7; day++) {
            gridHtml += `<span style="font-size:10px;line-height:13px;color:var(--text-secondary);">${day % 2 === 0 ? dayLabels[day] : ''}</span>`;
        }
        gridHtml += '</div>';

        // Heatmap grid
        for (let w = 0; w < weeks; w++) {
            gridHtml += '<div class="heatmap-week">';
            for (let day = 0; day < 7; day++) {
                const d = new Date(firstDate);
                d.setDate(d.getDate() + w * 7 + day);
                const key = d.toISOString().slice(0, 10);
                const ratio = data[key] || 0;
                const level = ratio <= 0 ? 0 : (ratio <= 0.25 ? 1 : (ratio <= 0.5 ? 2 : (ratio <= 0.75 ? 3 : 4)));
                gridHtml += `<div class="heatmap-cell level-${level}" title="${key}: ${Math.round(ratio * 100)}%"></div>`;
            }
            gridHtml += '</div>';
        }
        gridHtml += '</div>';

        // Legend
        let legendHtml = '<div class="heatmap-legend"><span>少</span>';
        for (let l = 0; l <= 4; l++) {
            legendHtml += `<div class="heatmap-cell level-${l}" style="width:13px;height:13px;border-radius:2px;"></div>`;
        }
        legendHtml += '<span>多</span></div>';

        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);
        const todayRatio = data[todayKey] || 0;

        return `
            <div style="margin-bottom:8px;font-size:13px;color:var(--text-secondary);">
                今日完成率: <strong style="color:var(--accent);">${Math.round(todayRatio * 100)}%</strong>
            </div>
            ${monthHtml}
            ${gridHtml}
            ${legendHtml}`;
    },

    _esc(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
};
