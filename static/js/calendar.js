/* ── Monthly Calendar ────────────────────────────────────────────── */
const Calendar = {
    currentYear: null,
    currentMonth: null, // 0-indexed
    selectedDate: null,

    async render(main, dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        this.currentYear = y;
        this.currentMonth = m - 1;
        this.selectedDate = dateStr;

        const [scheduleData, checkinData] = await Promise.all([
            api('GET', '/api/schedule', { date: dateStr }),
            api('GET', '/api/checkins', { date: dateStr }),
        ]);

        // Gather month data for dots
        const firstOfMonth = `${y}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        const lastOfMonth = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        main.innerHTML = `
            <div class="page-header"><h2>📅 日历</h2></div>
            ${this._buildNav()}
            ${this._buildGrid()}
            <div class="day-panel" style="margin-top:24px;">
                <div>
                    <div class="card">
                        <h3>📅 ${formatDate(dateStr)} 时间安排</h3>
                        <div id="cal-clock-container">${Clock.render(scheduleData)}</div>
                    </div>
                </div>
                <div>
                    <div class="card">
                        <h3>✅ 打卡</h3>
                        <div id="cal-checkin">${Checkin.renderCompact(checkinData, dateStr)}</div>
                    </div>
                </div>
            </div>`;

        Clock.init(scheduleData, dateStr);
        Checkin.bindCompactEvents(dateStr);
        this._bindEvents();
        this._loadMonthDots(firstOfMonth, lastOfMonth);
    },

    _buildNav() {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const tomorrow = shiftDate(todayStr(), 1);
        const yesterday = shiftDate(todayStr(), -1);
        return `
            <div class="calendar-nav">
                <button class="btn-sm" id="cal-prev">← 上月</button>
                <h2>${this.currentYear}年 ${months[this.currentMonth]}</h2>
                <button class="btn-sm" id="cal-next">下月 →</button>
                <button class="btn-sm" id="cal-today">今天</button>
                <button class="btn-sm" id="cal-tomorrow" data-date="${tomorrow}">→ 明天</button>
                <button class="btn-sm" id="cal-yesterday" data-date="${yesterday}">昨天 ←</button>
            </div>`;
    },

    _buildGrid() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startPadding = firstDay.getDay(); // 0=Sun
        const totalDays = lastDay.getDate();
        const today = todayStr();

        const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
        let html = '<div class="calendar-grid">';
        html += dayHeaders.map(d => `<div class="cal-header">${d}</div>`).join('');

        for (let p = 0; p < startPadding; p++) {
            html += '<div class="cal-cell empty"></div>';
        }
        for (let d = 1; d <= totalDays; d++) {
            const ds = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = ds === today;
            const isSelected = ds === this.selectedDate;
            html += `<div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
                data-date="${ds}" style="${isSelected ? 'background:#FDF5EC;' : ''}">
                <span class="cal-day-num">${d}</span>
                <div class="cal-dots" data-date="${ds}"></div>
            </div>`;
        }
        html += '</div>';
        return html;
    },

    async _loadMonthDots(firstDate, lastDate) {
        const cData = await api('GET', '/api/checkins/heatmap', { year: this.currentYear });

        // Check each day for schedule blocks (batch by checking if schedule data exists)
        const dotsMap = {};
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dotsMap[ds] = [];
        }

        // Check each day for schedule blocks (do a few in parallel)
        const batchSize = 5;
        const dayKeys = Object.keys(dotsMap);
        for (let i = 0; i < dayKeys.length; i += batchSize) {
            const batch = dayKeys.slice(i, i + batchSize);
            const results = await Promise.all(batch.map(ds =>
                api('GET', '/api/schedule', { date: ds }).catch(() => [])
            ));
            batch.forEach((ds, idx) => {
                if (results[idx] && results[idx].length > 0) {
                    dotsMap[ds].push({ color: '#C4956A' }); // gold for schedule
                }
                if (cData.data && cData.data[ds] && cData.data[ds] > 0) {
                    dotsMap[ds].push({ color: '#85C1A8' }); // green for checkin
                }
            });
        }

        document.querySelectorAll('.cal-dots').forEach(el => {
            const ds = el.dataset.date;
            if (dotsMap[ds] && dotsMap[ds].length > 0) {
                el.innerHTML = dotsMap[ds].map(d => `<span class="cal-dot" style="background:${d.color}"></span>`).join('');
            }
        });
    },

    _bindEvents() {
        document.getElementById('cal-prev').onclick = () => {
            this.currentMonth--;
            if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
            window.location.hash = `/calendar?date=${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
        };
        document.getElementById('cal-next').onclick = () => {
            this.currentMonth++;
            if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
            window.location.hash = `/calendar?date=${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
        };
        document.getElementById('cal-today').onclick = () => {
            window.location.hash = `/calendar?date=${todayStr()}`;
        };
        document.getElementById('cal-tomorrow').onclick = () => {
            window.location.hash = `/calendar?date=${document.getElementById('cal-tomorrow').dataset.date}`;
        };
        document.getElementById('cal-yesterday').onclick = () => {
            window.location.hash = `/calendar?date=${document.getElementById('cal-yesterday').dataset.date}`;
        };

        document.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
            cell.addEventListener('click', () => {
                const ds = cell.dataset.date;
                if (ds) window.location.hash = `/calendar?date=${ds}`;
            });
        });
    }
};
