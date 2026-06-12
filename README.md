# ⏳ 一隅 · Corner of Time

> 一个跑在本地的极简时间管理工具。环形时钟 + 计划 + 打卡 + 热力图，全部打包在一个不到 400 行的 Python 文件里。

---

## 为什么叫「一隅」

在这个信息过载的时代，时间管理工具越来越重：Notion、Todoist、日历、Pomodoro……工具本身就成了 distraction。

**一隅** 回归最简单的三件事：

> **可视化你的一天** → **制定并追踪计划** → **打卡养成习惯**

不需要注册账号，不需要网络连接，数据就在你电脑上的 `data/` 文件夹里。

---

## 看一眼

```
       00
  23   ╱ ╲   01
 22   ╱     ╲   02
 21  │  NOW  │  03
 20  │ 14:36 │  04
 19   ╲     ╱   05
 18   ╲   ╱   06
 17      ●     07
    16       08
       15  09
```

24 小时环形时钟，每种颜色代表一个时间块。**点击圆环添加，悬停查看详情，点击已有色块编辑**。

---

## 功能

| 功能 | 说明 |
|---|---|
| 🕐 **环形时钟** | 24小时可视化，点击圆环添加时间块 |
| 📅 **日历视图** | 月历 + 任意日期的时间安排，**支持提前规划未来** |
| 📋 **计划管理** | 目标计划，分类/状态/截止日期追踪 |
| ✅ **每日打卡** | 自定义习惯，一键打卡 |
| 📊 **年度热力图** | GitHub 风格的年度打卡热力图 |
| 🎨 **主题定制** | 10 种预设主题色 + 自定义颜色 + 背景图片 |
| 💾 **离线优先** | 所有数据存本地 JSON，无需网络 |

---

## 快速开始

### 方法一：双击启动（macOS）

```
双击 启动.command → 浏览器自动打开
```

第一次双击 `.command` 文件时，macOS 可能会阻止。右键 → **打开** 即可。

### 方法二：终端启动

```bash
# 1. 安装依赖（只需要 Flask）
pip install flask

# 2. 启动
python3 server.py

# 3. 浏览器打开
open http://localhost:5050
```

> 首次运行会自动在 `data/` 文件夹创建三个 JSON 文件。

---

## 使用指南

### 环形时钟怎么用

1. **点击圆环的空白区域** → 弹出添加窗口，自动填充点击位置对应的时间
2. **鼠标悬停在色块上** → 显示时间块详情
3. **点击已有色块** → 编辑或删除
4. **切换日期** → 概览页时钟上方 ◀ ▶ 箭头，或点击日期文字弹出日期选择器

### 安排未来计划

- **概览页**：时钟上方的 ◀ ▶ 箭头切换日期
- **日历页**：点击任意日期格子，或点击「→ 明天」快捷按钮

### 主题设置

侧边栏底部「🎨 个性化」→ 选择预设主题色或自定义 → 上传背景图片

---

## 常见问题

### 启动报错 `Address already in use` / 端口被占用

**原因**：端口 5050 被其他程序占用（或之前的一隅还在运行）。

**解决**：
```bash
# 查找并关闭占用端口的进程
lsof -i :5050
kill -9 <PID>

# 或者换一个端口（编辑 server.py 最后一行）
app.run(debug=True, port=5051, host='127.0.0.1')
```

### `pip install flask` 失败

```bash
# 尝试使用 pip3
pip3 install flask

# 或者用 --user 安装
pip3 install --user flask

# 如果提示权限问题
pip3 install --break-system-packages flask
```

### 双击 启动.command 没反应

1. 确保文件有执行权限：`chmod +x 启动.command`
2. 第一次打开时：**右键 → 打开**（不要直接双击）
3. 在弹出的安全提示中点击「打开」

### 数据在哪里？怎么备份？

所有数据在 `data/` 文件夹的三个 JSON 文件中：
- `plans.json` — 计划
- `checkins.json` — 打卡记录
- `schedule.json` — 时间安排

**备份只需复制整个 `data/` 文件夹。**

### Python 版本要求

Python 3.8 及以上。检查版本：
```bash
python3 --version
```

---

## 项目结构

```
暑假沉淀/
├── server.py           # Flask 后端，约 310 行
├── requirements.txt    # 仅 flask>=3.0
├── 启动.command         # macOS 双击启动脚本
├── static/
│   ├── index.html      # SPA 入口
│   ├── css/style.css   # 样式
│   └── js/
│       ├── app.js      # 路由 + 概览页
│       ├── clock.js    # 环形时钟核心
│       ├── calendar.js # 月历视图
│       ├── plans.js    # 计划管理
│       ├── checkin.js  # 打卡 + 热力图
│       ├── settings.js # 主题个性化
│       └── onboarding.js # 新手引导
└── data/               # 数据文件（JSON）
    ├── plans.json
    ├── checkins.json
    └── schedule.json
```

---

## 技术栈

- **后端**：Python Flask，纯 JSON 文件存储，无数据库依赖
- **前端**：Vanilla JS（零框架），SVG 环形时钟，Hash 路由
- **存储**：localStorage（主题等设置） + JSON 文件（业务数据）

特意选择了 **零构建工具、零前端框架** 的技术栈。一个 Python 文件 + 几个 JS 文件，打开就能用，不需要 npm install。

---

## License

MIT — 随便用，随便改，随便分享。

---

*Made with ☕ and the desire to actually finish summer plans.*
