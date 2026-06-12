/* ── API Helper ─────────────────────────────────────────────────── */
async function api(method, url, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    if (body && method === 'GET') {
        const params = new URLSearchParams(body);
        url += '?' + params.toString();
    }
    const resp = await fetch(url, opts);
    if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err);
    }
    return resp.json();
}

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function shiftDate(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    return dt.getFullYear() + '-' +
        String(dt.getMonth() + 1).padStart(2, '0') + '-' +
        String(dt.getDate()).padStart(2, '0');
}

function isToday(dateStr) {
    return dateStr === todayStr();
}

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

function formatTime(hoursFloat) {
    const h = Math.floor(hoursFloat);
    const m = Math.round((hoursFloat - h) * 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/* ── Modal ──────────────────────────────────────────────────────── */
function showModal(html) {
    document.getElementById('modal-box').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');
}
function hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) hideModal();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideModal();
});

/* ── Tooltip ────────────────────────────────────────────────────── */
function showTooltip(x, y, html) {
    const el = document.getElementById('tooltip');
    el.innerHTML = html;
    el.classList.remove('hidden');
    // Position so it doesn't go off screen
    let left = x + 14;
    let top = y - 10;
    if (left + 200 > window.innerWidth) left = x - 210;
    if (top + 80 > window.innerHeight) top = y - 90;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
}
function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
}

/* ── App Router ─────────────────────────────────────────────────── */
const App = {
    views: {},
    currentView: null,

    init() {
        document.getElementById('sidebar-date').textContent = formatDate(todayStr());
        this.bindNav();
        this.route();
        window.addEventListener('hashchange', () => this.route());
        document.getElementById('settings-btn').addEventListener('click', (e) => {
            e.preventDefault();
            showModal(Settings.renderModal());
            Settings.bindEvents();
        });
    },

    bindNav() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    async route() {
        const hash = window.location.hash.slice(1) || '/';
        const main = document.getElementById('main-content');

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const view = link.dataset.view;
            if ((hash === '/' || hash === '' || (hash.startsWith('/?') && !hash.startsWith('/calendar'))) && view === 'dashboard') link.classList.add('active');
            if (hash.startsWith('/calendar') && view === 'calendar') link.classList.add('active');
            if (hash === '/plans' && view === 'plans') link.classList.add('active');
            if (hash === '/checkin' && view === 'checkin') link.classList.add('active');
        });

        main.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';

        try {
            if (hash === '/' || hash === '' || (hash.startsWith('/?') && !hash.startsWith('/calendar'))) {
                const params = new URLSearchParams(hash.split('?')[1] || '');
                const dateStr = params.get('date') || todayStr();
                await App.renderDashboard(main, dateStr);
            } else if (hash.startsWith('/calendar')) {
                const params = new URLSearchParams(hash.split('?')[1] || '');
                const dateStr = params.get('date') || todayStr();
                await Calendar.render(main, dateStr);
            } else if (hash === '/plans') {
                await Plans.render(main);
            } else if (hash === '/checkin') {
                await Checkin.render(main);
            } else {
                await App.renderDashboard(main);
            }
        } catch (err) {
            main.innerHTML = `<div class="empty-state">
                <div class="empty-icon">😵</div>
                <p>加载失败: ${err.message}</p>
            </div>`;
        }
    },

    async renderDashboard(main, dateStr) {
        const stats = await api('GET', '/api/stats');
        const [blocks, checkinData] = await Promise.all([
            api('GET', '/api/schedule', { date: dateStr }),
            api('GET', '/api/checkins', { date: dateStr }),
        ]);

        const prevDate = shiftDate(dateStr, -1);
        const nextDate = shiftDate(dateStr, 1);
        const todayLabel = isToday(dateStr) ? ' (今天)' : '';

        main.innerHTML = `
            <div class="page-header">
                <h2>📊 概览</h2>
                <button class="btn-sm" id="help-btn" title="使用指南">❓ 帮助</button>
            </div>
            <div class="dashboard">
                <div class="dashboard-clock">
                    <div class="card">
                        <div class="date-nav-bar">
                            <button class="btn-sm date-nav-btn" data-date="${prevDate}" title="前一天">◀</button>
                            <span class="date-nav-label" style="cursor:pointer;" id="date-nav-jump">
                                <strong>${formatDate(dateStr)}</strong>${todayLabel}
                            </span>
                            <button class="btn-sm date-nav-btn" data-date="${nextDate}" title="后一天">▶</button>
                            ${!isToday(dateStr) ? `<button class="btn-sm" id="btn-back-today" style="margin-left:8px;">回到今天</button>` : ''}
                            <input type="date" id="date-nav-picker" value="${dateStr}" style="display:none;margin-left:8px;padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-family:inherit;" />
                        </div>
                        <div id="clock-container">${Clock.render(blocks)}</div>
                    </div>
                </div>
                <div class="dashboard-sidebar">
                    <div class="stats-cards">
                        <div class="stat-card">
                            <div class="stat-value">${stats.streak}</div>
                            <div class="stat-label">🔥 连续打卡天数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.completion_rate}%</div>
                            <div class="stat-label">📌 今日完成率</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.in_progress_plans}</div>
                            <div class="stat-label">📋 进行中计划</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.today_blocks_count}</div>
                            <div class="stat-label">⏰ 今日时间块</div>
                        </div>
                    </div>
                    <div class="card">
                        <h3>${isToday(dateStr) ? '今日打卡' : formatDate(dateStr) + ' 打卡'}</h3>
                        <div id="dash-checkin">${Checkin.renderCompact(checkinData, dateStr)}</div>
                    </div>
                </div>
            </div>`;

        Clock.init(blocks, dateStr);
        Checkin.bindCompactEvents(dateStr);

        // Date navigation events
        document.querySelectorAll('.date-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const d = btn.dataset.date;
                window.location.hash = `/?date=${d}`;
            });
        });

        const jumpLabel = document.getElementById('date-nav-jump');
        const picker = document.getElementById('date-nav-picker');
        if (jumpLabel && picker) {
            jumpLabel.addEventListener('click', () => {
                picker.style.display = picker.style.display === 'none' ? '' : 'none';
                if (picker.style.display !== 'none') {
                    picker.focus();
                    picker.showPicker ? picker.showPicker() : picker.click();
                }
            });
            picker.addEventListener('change', () => {
                window.location.hash = `/?date=${picker.value}`;
            });
            picker.addEventListener('blur', () => {
                setTimeout(() => { picker.style.display = 'none'; }, 200);
            });
        }

        const backBtn = document.getElementById('btn-back-today');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.hash = '/';
            });
        }

        // Help button re-triggers onboarding
        document.getElementById('help-btn').addEventListener('click', () => {
            localStorage.removeItem('yiyu_onboarding_done');
            Onboarding.restart();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
