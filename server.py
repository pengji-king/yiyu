import json
import os
import uuid
import tempfile
from datetime import date, datetime, timedelta
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
PLANS_FILE = os.path.join(DATA_DIR, 'plans.json')
CHECKINS_FILE = os.path.join(DATA_DIR, 'checkins.json')
SCHEDULE_FILE = os.path.join(DATA_DIR, 'schedule.json')


def read_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(filepath, data):
    fd, tmp = tempfile.mkstemp(dir=DATA_DIR, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, filepath)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


# ── Plans ──────────────────────────────────────────────────────────

@app.route('/api/plans', methods=['GET'])
def list_plans():
    plans = read_json(PLANS_FILE)
    plans.sort(key=lambda p: p.get('sort_order', 0))
    return jsonify(plans)


@app.route('/api/plans', methods=['POST'])
def create_plan():
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'title is required'}), 400
    plans = read_json(PLANS_FILE)
    plan = {
        'id': uuid.uuid4().hex[:12],
        'title': data['title'],
        'description': data.get('description', ''),
        'category': data.get('category', ''),
        'status': data.get('status', 'todo'),
        'deadline': data.get('deadline', ''),
        'color': data.get('color', '#4A90D9'),
        'sort_order': len(plans),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
    }
    plans.append(plan)
    write_json(PLANS_FILE, plans)
    return jsonify(plan), 201


@app.route('/api/plans/<plan_id>', methods=['PUT'])
def update_plan(plan_id):
    data = request.get_json()
    plans = read_json(PLANS_FILE)
    for i, p in enumerate(plans):
        if p['id'] == plan_id:
            for key in ('title', 'description', 'category', 'status', 'deadline', 'color', 'sort_order'):
                if key in data:
                    p[key] = data[key]
            p['updated_at'] = datetime.now().isoformat()
            write_json(PLANS_FILE, plans)
            return jsonify(p)
    return jsonify({'error': 'plan not found'}), 404


@app.route('/api/plans/<plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    plans = read_json(PLANS_FILE)
    plans = [p for p in plans if p['id'] != plan_id]
    write_json(PLANS_FILE, plans)
    return jsonify({'ok': True})


# ── Checkins ───────────────────────────────────────────────────────

@app.route('/api/checkins/habits', methods=['GET'])
def list_habits():
    data = read_json(CHECKINS_FILE)
    habits = data.get('habits', [])
    habits.sort(key=lambda h: h.get('sort_order', 0))
    return jsonify(habits)


@app.route('/api/checkins/habits', methods=['POST'])
def create_habit():
    body = request.get_json()
    if not body or not body.get('name'):
        return jsonify({'error': 'name is required'}), 400
    data = read_json(CHECKINS_FILE)
    habit = {
        'id': uuid.uuid4().hex[:8],
        'name': body['name'],
        'emoji': body.get('emoji', '☐'),
        'color': body.get('color', '#C4956A'),
        'sort_order': len(data.get('habits', [])),
        'created_at': date.today().isoformat(),
    }
    data.setdefault('habits', []).append(habit)
    write_json(CHECKINS_FILE, data)
    return jsonify(habit), 201


@app.route('/api/checkins/habits/<habit_id>', methods=['PUT'])
def update_habit(habit_id):
    body = request.get_json()
    data = read_json(CHECKINS_FILE)
    for h in data.get('habits', []):
        if h['id'] == habit_id:
            for key in ('name', 'emoji', 'color', 'sort_order'):
                if key in body:
                    h[key] = body[key]
            write_json(CHECKINS_FILE, data)
            return jsonify(h)
    return jsonify({'error': 'habit not found'}), 404


@app.route('/api/checkins/habits/<habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    data = read_json(CHECKINS_FILE)
    data['habits'] = [h for h in data.get('habits', []) if h['id'] != habit_id]
    for date_str in data.get('records', {}):
        data['records'][date_str].pop(habit_id, None)
    write_json(CHECKINS_FILE, data)
    return jsonify({'ok': True})


@app.route('/api/checkins', methods=['GET'])
def get_checkins():
    date_str = request.args.get('date', date.today().isoformat())
    data = read_json(CHECKINS_FILE)
    habits = data.get('habits', [])
    habits.sort(key=lambda h: h.get('sort_order', 0))
    records = data.get('records', {}).get(date_str, {})
    return jsonify({'habits': habits, 'records': records})


@app.route('/api/checkins', methods=['POST'])
def toggle_checkin():
    body = request.get_json()
    if not body:
        return jsonify({'error': 'body required'}), 400
    date_str = body.get('date', date.today().isoformat())
    habit_id = body.get('habit_id')
    done = body.get('done', False)
    note = body.get('note', '')
    if not habit_id:
        return jsonify({'error': 'habit_id required'}), 400
    data = read_json(CHECKINS_FILE)
    data.setdefault('records', {}).setdefault(date_str, {})
    data['records'][date_str][habit_id] = {'done': done, 'note': note}
    write_json(CHECKINS_FILE, data)
    return jsonify({'ok': True, 'done': done})


@app.route('/api/checkins/heatmap', methods=['GET'])
def get_heatmap():
    year = int(request.args.get('year', date.today().year))
    data = read_json(CHECKINS_FILE)
    habits = data.get('habits', [])
    records = data.get('records', {})
    total_habits = len(habits)
    result = {}
    for date_str, day_records in records.items():
        if not date_str.startswith(str(year)):
            continue
        if total_habits == 0:
            result[date_str] = 0
        else:
            done = sum(1 for r in day_records.values() if r.get('done'))
            result[date_str] = round(done / total_habits, 2)
    return jsonify({'data': result, 'total_habits': total_habits})


# ── Schedule ───────────────────────────────────────────────────────

@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    date_str = request.args.get('date', date.today().isoformat())
    data = read_json(SCHEDULE_FILE)
    blocks = data.get(date_str, [])
    blocks.sort(key=lambda b: b.get('start', 0))
    return jsonify(blocks)


@app.route('/api/schedule', methods=['POST'])
def create_schedule_block():
    body = request.get_json()
    if not body:
        return jsonify({'error': 'body required'}), 400
    date_str = body.get('date', date.today().isoformat())
    start = body.get('start')
    end = body.get('end')
    label = body.get('label', '')
    if start is None or end is None:
        return jsonify({'error': 'start and end required'}), 400
    data = read_json(SCHEDULE_FILE)
    block = {
        'id': uuid.uuid4().hex[:8],
        'start': float(start),
        'end': float(end),
        'label': label,
        'color': body.get('color', '#C4956A'),
        'plan_id': body.get('plan_id'),
        'note': body.get('note', ''),
    }
    data.setdefault(date_str, []).append(block)
    write_json(SCHEDULE_FILE, data)
    return jsonify(block), 201


@app.route('/api/schedule/<block_id>', methods=['PUT'])
def update_schedule_block(block_id):
    body = request.get_json()
    data = read_json(SCHEDULE_FILE)
    for date_str, blocks in data.items():
        for b in blocks:
            if b['id'] == block_id:
                for key in ('start', 'end', 'label', 'color', 'plan_id', 'note'):
                    if key in body:
                        b[key] = float(body[key]) if key in ('start', 'end') else body[key]
                write_json(SCHEDULE_FILE, data)
                return jsonify(b)
    return jsonify({'error': 'block not found'}), 404


@app.route('/api/schedule/<block_id>', methods=['DELETE'])
def delete_schedule_block(block_id):
    data = read_json(SCHEDULE_FILE)
    for date_str, blocks in list(data.items()):
        data[date_str] = [b for b in blocks if b['id'] != block_id]
        if not data[date_str]:
            del data[date_str]
    write_json(SCHEDULE_FILE, data)
    return jsonify({'ok': True})


# ── Stats ──────────────────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
def get_stats():
    plans = read_json(PLANS_FILE)
    checkins = read_json(CHECKINS_FILE)
    schedule = read_json(SCHEDULE_FILE)
    today_str = date.today().isoformat()

    done_plans = sum(1 for p in plans if p['status'] == 'done')
    in_progress_plans = sum(1 for p in plans if p['status'] == 'in_progress')

    habits = checkins.get('habits', [])
    records = checkins.get('records', {})

    streak = 0
    current = date.today()
    while True:
        ds = current.isoformat()
        day_records = records.get(ds, {})
        done_count = sum(1 for r in day_records.values() if r.get('done'))
        if done_count > 0 and len(habits) > 0:
            streak += 1
            current -= timedelta(days=1)
        else:
            break

    today_records = records.get(today_str, {})
    done_today = sum(1 for h in habits if today_records.get(h['id'], {}).get('done'))
    completion_rate = round(done_today / len(habits) * 100) if habits else 0

    today_blocks = schedule.get(today_str, [])

    return jsonify({
        'total_plans': len(plans),
        'done_plans': done_plans,
        'in_progress_plans': in_progress_plans,
        'streak': streak,
        'completion_rate': completion_rate,
        'total_habits': len(habits),
        'done_today': done_today,
        'today_blocks_count': len(today_blocks),
    })


# ── Static files ──────────────────────────────────────────────────

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    file_path = os.path.join(app.static_folder, path)
    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    for f, default in [(PLANS_FILE, '[]'), (CHECKINS_FILE, '{"habits":[],"records":{}}'), (SCHEDULE_FILE, '{}')]:
        if not os.path.exists(f):
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(default)
    app.run(debug=True, port=5050, host='127.0.0.1')
