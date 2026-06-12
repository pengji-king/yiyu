/* ── Circular 24-Hour Clock ──────────────────────────────────────── */
const Clock = {
    cx: 250, cy: 250,
    outerR: 190, innerR: 150,
    blocks: [],
    currentDate: null,

    /* ── Angle / Time Math ────────────────────────────────────── */
    timeToAngle(hours, minutes = 0) {
        return ((hours + minutes / 60) / 24) * 360;
    },

    angleToPoint(r, angleFromTopDeg) {
        const svgDeg = angleFromTopDeg - 90;
        const rad = svgDeg * Math.PI / 180;
        return {
            x: this.cx + r * Math.cos(rad),
            y: this.cy + r * Math.sin(rad)
        };
    },

    pointToAngle(px, py) {
        const dx = px - this.cx;
        const dy = py - this.cy;
        let svgDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        let angle = (svgDeg + 90 + 360) % 360;
        return angle;
    },

    angleToTime(angleDeg) {
        const totalMinutes = (angleDeg / 360) * 24 * 60;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = Math.round(totalMinutes % 60);
        const snappedMinutes = Math.round(minutes / 15) * 15;
        let snappedHours = (hours + Math.floor(snappedMinutes / 60)) % 24;
        let finalMinutes = snappedMinutes % 60;
        if (finalMinutes < 0) finalMinutes += 60;
        return { hours: snappedHours, minutes: finalMinutes };
    },

    /* ── Arc Path ─────────────────────────────────────────────── */
    describeArcBlock(startAngle, endAngle) {
        const outerStart = this.angleToPoint(this.outerR, startAngle);
        const outerEnd = this.angleToPoint(this.outerR, endAngle);
        const innerStart = this.angleToPoint(this.innerR, startAngle);
        const innerEnd = this.angleToPoint(this.innerR, endAngle);
        const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

        return [
            `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
            `A ${this.outerR} ${this.outerR} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
            `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
            `A ${this.innerR} ${this.innerR} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
            'Z'
        ].join(' ');
    },

    /* ── Render to SVG String ─────────────────────────────────── */
    render(blocks) {
        this.blocks = blocks || [];
        const svg = `
<svg viewBox="0 0 500 500" class="circular-clock" xmlns="http://www.w3.org/2000/svg">
    ${this._drawBgRing()}
    ${this._drawTicks()}
    ${this._drawLabels()}
    ${this._drawBlocks()}
    ${this._drawNowIndicator()}
    ${this._drawCenter()}
</svg>`;
        return svg;
    },

    _drawBgRing() {
        return `<circle cx="${this.cx}" cy="${this.cy}" r="${this.outerR}"
            fill="none" stroke="#E8E0D8" stroke-width="${this.outerR - this.innerR}"
            opacity="0.5" />`;
    },

    _drawTicks() {
        let lines = '';
        for (let h = 0; h < 24; h++) {
            const angle = this.timeToAngle(h, 0);
            const isMajor = h % 3 === 0;
            const r1 = this.outerR;
            const r2 = isMajor ? this.outerR - 22 : this.outerR - 14;
            const p1 = this.angleToPoint(r1, angle);
            const p2 = this.angleToPoint(r2, angle);
            lines += `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}"
                x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}"
                class="clock-tick${isMajor ? ' major' : ''}" />`;
        }
        return lines;
    },

    _drawLabels() {
        const labels = [
            { h: 0, t: '00' }, { h: 3, t: '03' }, { h: 6, t: '06' },
            { h: 9, t: '09' }, { h: 12, t: '12' }, { h: 15, t: '15' },
            { h: 18, t: '18' }, { h: 21, t: '21' }
        ];
        return labels.map(({ h, t }) => {
            const angle = this.timeToAngle(h, 0);
            const pt = this.angleToPoint(220, angle);
            let anchor = 'middle';
            if (angle > 20 && angle < 160) anchor = 'start';
            if (angle > 200 && angle < 340) anchor = 'end';
            return `<text x="${pt.x.toFixed(1)}" y="${pt.y.toFixed(1)}"
                text-anchor="${anchor}" dy="0.35em" class="clock-label">${t}</text>`;
        }).join('');
    },

    _drawBlocks() {
        return this.blocks.map((b, i) => {
            const startAngle = this.timeToAngle(b.start, 0);
            const endAngle = this.timeToAngle(b.end, 0);
            const d = this.describeArcBlock(startAngle, endAngle);
            const color = b.color || '#C4956A';
            return `<path d="${d}" fill="${color}" opacity="0.72"
                stroke="${color}" stroke-width="1"
                class="clock-block" data-block-id="${b.id}" data-block-index="${i}" />`;
        }).join('');
    },

    _drawNowIndicator() {
        const now = new Date();
        const angle = this.timeToAngle(now.getHours(), now.getMinutes());
        const outerPt = this.angleToPoint(this.outerR, angle);
        const midPt = this.angleToPoint(40, angle);
        return `
            <line x1="${midPt.x}" y1="${midPt.y}"
                x2="${outerPt.x}" y2="${outerPt.y}"
                class="clock-now-line" id="clock-now-line" />
            <circle cx="${outerPt.x}" cy="${outerPt.y}" r="5"
                class="clock-now-dot" id="clock-now-dot" />`;
    },

    _drawCenter() {
        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        return `
            <circle cx="${this.cx}" cy="${this.cy}" r="36"
                fill="white" stroke="#E8E0D8" stroke-width="1" />
            <text x="${this.cx}" y="${this.cy - 6}"
                class="clock-center-text">NOW</text>
            <text x="${this.cx}" y="${this.cy + 16}"
                class="clock-center-time" id="clock-center-time">${timeStr}</text>`;
    },

    /* ── Initialization after DOM mount ───────────────────────── */
    init(blocks, dateStr) {
        this.blocks = blocks || [];
        this.currentDate = dateStr || todayStr();
        const svg = document.querySelector('.circular-clock');
        if (!svg) return;

        svg.addEventListener('click', (e) => this._handleClick(e));
        svg.addEventListener('mousemove', (e) => this._handleMouseMove(e));
        svg.addEventListener('mouseleave', () => hideTooltip());
        this._startClockTimer();
    },

    /* ── Current Time Timer ───────────────────────────────────── */
    _startClockTimer() {
        if (this._timer) clearInterval(this._timer);
        this._updateNowIndicator();
        // Update every 30 seconds
        this._timer = setInterval(() => this._updateNowIndicator(), 30000);
    },

    _updateNowIndicator() {
        const svg = document.querySelector('.circular-clock');
        if (!svg) return;
        const now = new Date();
        const angle = this.timeToAngle(now.getHours(), now.getMinutes());
        const outerPt = this.angleToPoint(this.outerR, angle);
        const midPt = this.angleToPoint(40, angle);

        const line = svg.querySelector('#clock-now-line');
        const dot = svg.querySelector('#clock-now-dot');
        const timeText = svg.querySelector('#clock-center-time');
        if (line) { line.setAttribute('x1', midPt.x); line.setAttribute('x2', outerPt.x);
                    line.setAttribute('y1', midPt.y); line.setAttribute('y2', outerPt.y); }
        if (dot) { dot.setAttribute('cx', outerPt.x); dot.setAttribute('cy', outerPt.y); }
        if (timeText) {
            timeText.textContent = String(now.getHours()).padStart(2, '0') + ':' +
                String(now.getMinutes()).padStart(2, '0');
        }
    },

    /* ── Click Handling ───────────────────────────────────────── */
    _handleClick(event) {
        const svg = document.querySelector('.circular-clock');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scale = 500 / rect.width;
        const px = (event.clientX - rect.left) * scale;
        const py = (event.clientY - rect.top) * scale;
        const dist = Math.sqrt((px - this.cx) ** 2 + (py - this.cy) ** 2);

        if (dist >= this.innerR && dist <= this.outerR + 4) {
            const angle = this.pointToAngle(px, py);
            const hit = this._findBlockAtAngle(px, py, angle);
            if (hit) {
                this._showEditPopup(hit);
            } else {
                const time = this.angleToTime(angle);
                this._showCreatePopup(time);
            }
        }
    },

    _findBlockAtAngle(px, py, angle) {
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const b = this.blocks[i];
            let startAngle = this.timeToAngle(b.start, 0);
            let endAngle = this.timeToAngle(b.end, 0);
            if (endAngle < startAngle) {
                // wraps around midnight
                if (angle >= startAngle || angle <= endAngle) return b;
            } else {
                if (angle >= startAngle && angle <= endAngle) return b;
            }
        }
        return null;
    },

    /* ── Edit Popup ───────────────────────────────────────────── */
    _showEditPopup(block) {
        const startTime = formatTime(block.start);
        const endTime = formatTime(block.end);
        showModal(`
            <h3>编辑时间块</h3>
            <div class="form-group">
                <label>名称</label>
                <input type="text" id="edit-block-label" value="${this._esc(block.label || '')}" />
            </div>
            <div class="form-group">
                <label>时间</label>
                <div class="time-picker-row">
                    ${this._timeSelect('edit-block-start', block.start)}
                    <span>—</span>
                    ${this._timeSelect('edit-block-end', block.end)}
                </div>
            </div>
            <div class="form-group">
                <label>颜色</label>
                <input type="color" id="edit-block-color" value="${block.color || '#C4956A'}" style="width:60px;height:32px;padding:2px;" />
            </div>
            <div class="form-group">
                <label>备注</label>
                <input type="text" id="edit-block-note" value="${this._esc(block.note || '')}" />
            </div>
            <div class="form-actions">
                <button class="btn-danger" id="btn-delete-block">删除</button>
                <button class="btn-cancel" onclick="hideModal()">取消</button>
                <button class="btn-primary" id="btn-save-block">保存</button>
            </div>`);

        document.getElementById('btn-save-block').onclick = async () => {
            const startVal = parseFloat(document.getElementById('edit-block-start').value);
            const endVal = parseFloat(document.getElementById('edit-block-end').value);
            await api('PUT', `/api/schedule/${block.id}`, {
                label: document.getElementById('edit-block-label').value,
                start: startVal, end: endVal,
                color: document.getElementById('edit-block-color').value,
                note: document.getElementById('edit-block-note').value,
            });
            hideModal();
            await this._reloadAndRerender();
        };

        document.getElementById('btn-delete-block').onclick = async () => {
            await api('DELETE', `/api/schedule/${block.id}`);
            hideModal();
            await this._reloadAndRerender();
        };
    },

    /* ── Create Popup ─────────────────────────────────────────── */
    _showCreatePopup(time) {
        const startH = time.hours;
        const startM = time.minutes;
        const startFloat = startH + startM / 60;
        const endFloat = Math.min(24, startFloat + 1);
        showModal(`
            <h3>添加时间块</h3>
            <div class="form-group">
                <label>名称</label>
                <input type="text" id="new-block-label" placeholder="例如：学习线性代数" />
            </div>
            <div class="form-group">
                <label>时间</label>
                <div class="time-picker-row">
                    ${this._timeSelect('new-block-start', startFloat)}
                    <span>—</span>
                    ${this._timeSelect('new-block-end', endFloat)}
                </div>
            </div>
            <div class="form-group">
                <label>颜色</label>
                <input type="color" id="new-block-color" value="#C4956A" style="width:60px;height:32px;padding:2px;" />
            </div>
            <div class="form-actions">
                <button class="btn-cancel" onclick="hideModal()">取消</button>
                <button class="btn-primary" id="btn-create-block">添加</button>
            </div>`);

        document.getElementById('btn-create-block').onclick = async () => {
            const startVal = parseFloat(document.getElementById('new-block-start').value);
            const endVal = parseFloat(document.getElementById('new-block-end').value);
            if (endVal <= startVal) { alert('结束时间必须大于开始时间'); return; }
            await api('POST', '/api/schedule', {
                date: this.currentDate,
                start: startVal, end: endVal,
                label: document.getElementById('new-block-label').value || '未命名',
                color: document.getElementById('new-block-color').value,
            });
            hideModal();
            await this._reloadAndRerender();
        };
    },

    /* ── Time Select Helper ───────────────────────────────────── */
    _timeSelect(id, floatVal) {
        const h = Math.floor(floatVal);
        const m = Math.round((floatVal - h) * 60);
        let opts = '';
        for (let hour = 0; hour < 24; hour++) {
            for (let min = 0; min < 60; min += 15) {
                const val = hour + min / 60;
                const label = String(hour).padStart(2, '0') + ':' + String(min).padStart(2, '0');
                const sel = (hour === h && min === m) ? ' selected' : '';
                opts += `<option value="${val}"${sel}>${label}</option>`;
            }
        }
        return `<select id="${id}">${opts}</select>`;
    },

    /* ── Hover Tooltip ────────────────────────────────────────── */
    _handleMouseMove(event) {
        const svg = document.querySelector('.circular-clock');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const scale = 500 / rect.width;
        const px = (event.clientX - rect.left) * scale;
        const py = (event.clientY - rect.top) * scale;
        const dist = Math.sqrt((px - this.cx) ** 2 + (py - this.cy) ** 2);

        if (dist >= this.innerR && dist <= this.outerR) {
            const angle = this.pointToAngle(px, py);
            const hit = this._findBlockAtAngle(px, py, angle);
            if (hit) {
                showTooltip(event.clientX, event.clientY, `
                    <strong>${this._esc(hit.label || '未命名')}</strong><br>
                    ${formatTime(hit.start)} — ${formatTime(hit.end)}<br>
                    ${hit.note ? this._esc(hit.note) : ''}
                `);
                return;
            }
        }
        hideTooltip();
    },

    _esc(s) {
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    },

    /* ── Reload & Rerender ────────────────────────────────────── */
    async _reloadAndRerender() {
        const blocks = await api('GET', '/api/schedule', { date: this.currentDate });
        this.blocks = blocks;
        const container = document.getElementById('clock-container');
        if (container) {
            container.innerHTML = this.render(blocks);
            this.init(blocks, this.currentDate);
        }
        // Also refresh dashboard stats + checkin if visible
        const dashCheckin = document.getElementById('dash-checkin');
        if (dashCheckin) {
            const data = await api('GET', '/api/checkins', { date: this.currentDate });
            dashCheckin.innerHTML = Checkin.renderCompact(data, this.currentDate);
            Checkin.bindCompactEvents(this.currentDate);
        }
    }
};
