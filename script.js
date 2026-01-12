const $ = (s) => document.querySelector(s);

const EVENT = {
    // thời điểm chụp (giờ VN)
    // 18/01/2026 08:30
    start: new Date('2026-01-18T08:30:00+07:00'),
    title: 'Chụp Kỉ Yếu 12E',
    location: 'THPT Nam Sách, Nam Sách, Hải Phòng'
};

const LS_RSVP = 'yr_rsvp';
const LS_HEART = 'yr_heart_count';

const toast = (msg) => {
    const el = $('#toast');
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.textContent = ''), 2500);
};

// ===== MUSIC (click to play due to browser policy) =====
const bgm = $('#bgm');
const musicBtn = $('#musicBtn');
let playing = false;

musicBtn.addEventListener('click', async () => {
    try {
        if (!playing) {
            await bgm.play();
            playing = true;
            musicBtn.textContent = '❚❚';
        } else {
            bgm.pause();
            playing = false;
            musicBtn.textContent = '♪';
        }
    } catch {
        toast('Trình duyệt chặn auto-play, bấm lại nhé.');
    }
});

// ===== COUNTDOWN =====
const pad = (n) => String(n).padStart(2, '0');
const fmtFull = (d) => {
    const days = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    return `${days[d.getDay()]} • ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} • ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

$('#fullDate').textContent = fmtFull(EVENT.start);

const tick = () => {
    const now = new Date();
    const diff = EVENT.start.getTime() - now.getTime();

    if (diff <= 0) {
        $('#d').textContent = '0';
        $('#h').textContent = '0';
        $('#m').textContent = '0';
        $('#s').textContent = '0';
        return;
    }

    const total = Math.floor(diff / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    $('#d').textContent = String(d);
    $('#h').textContent = String(h);
    $('#m').textContent = String(m);
    $('#s').textContent = String(s);
};

tick();
setInterval(tick, 1000);

// ===== CALENDAR (mark event day) =====
const buildCalendar = () => {
    const y = EVENT.start.getFullYear();
    const mo = EVENT.start.getMonth(); // 0-11
    const dayMark = EVENT.start.getDate();

    const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    $('#calTitle').textContent = `${monthNames[mo]} ${y}`;

    const cal = $('#cal');
    cal.innerHTML = '';

    const head = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
    head.forEach(h => {
        const c = document.createElement('div');
        c.className = 'cal-cell head';
        c.textContent = h;
        cal.appendChild(c);
    });

    const first = new Date(y, mo, 1);
    // convert JS Sunday=0 to Monday-first
    let startIndex = (first.getDay() + 6) % 7;

    const daysInMonth = new Date(y, mo + 1, 0).getDate();

    // previous month trailing
    const prevDays = new Date(y, mo, 0).getDate();
    for (let i = 0; i < startIndex; i++) {
        const c = document.createElement('div');
        c.className = 'cal-cell muted';
        c.textContent = String(prevDays - startIndex + 1 + i);
        cal.appendChild(c);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const c = document.createElement('div');
        c.className = 'cal-cell' + (d === dayMark ? ' mark' : '');
        c.textContent = String(d);
        cal.appendChild(c);
    }

    // fill remaining to complete grid (optional)
    const totalCells = 7 + startIndex + daysInMonth;
    const remain = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remain; i++) {
        const c = document.createElement('div');
        c.className = 'cal-cell muted';
        c.textContent = String(i);
        cal.appendChild(c);
    }
};

buildCalendar();

// ===== RSVP (localStorage) =====
const loadRsvp = () => {
    try {
        const raw = localStorage.getItem(LS_RSVP);
        if (!raw) return;
        const data = JSON.parse(raw);
        $('#name').value = data.name || '';
        $('#className').value = data.className || '';
        $('#status').value = data.status || 'yes';
        $('#note').value = data.note || '';
    } catch {}
};

$('#rsvpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
        name: $('#name').value.trim(),
        className: $('#className').value.trim(),
        status: $('#status').value,
        note: $('#note').value.trim(),
        savedAt: new Date().toISOString()
    };

    if (!payload.name || !payload.className) {
        toast('Bạn nhập đủ Họ tên và Lớp nha.');
        return;
    }

    localStorage.setItem(LS_RSVP, JSON.stringify(payload));
    toast('Đã lưu xác nhận 💗');
});

$('#reset').addEventListener('click', () => {
    localStorage.removeItem(LS_RSVP);
    $('#rsvpForm').reset();
    toast('Đã xoá dữ liệu.');
});

loadRsvp();

// ===== HEART SHOOT + BACKGROUND SPARKLES =====
const fx = $('#fx');
const ctx = fx.getContext('2d', { alpha: true });
const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

const state = {
    w: 0, h: 0,
    spark: [],
    burst: []
};

const resize = () => {
    state.w = window.innerWidth;
    state.h = window.innerHeight;
    fx.width = Math.floor(state.w * dpr);
    fx.height = Math.floor(state.h * dpr);
    fx.style.width = state.w + 'px';
    fx.style.height = state.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};
window.addEventListener('resize', resize);
resize();

const rand = (a, b) => Math.random() * (b - a) + a;

// subtle background sparkles
for (let i = 0; i < 90; i++) {
    state.spark.push({
        x: rand(0, state.w),
        y: rand(0, state.h),
        r: rand(0.8, 2.0),
        a: rand(0.12, 0.40),
        t: rand(0, Math.PI * 2),
        s: rand(0.3, 0.9)
    });
}

const heartPath = (x, y, size, rot) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, -0.25);
    ctx.bezierCurveTo(0.35, -0.55, 0.8, -0.2, 0, 0.6);
    ctx.bezierCurveTo(-0.8, -0.2, -0.35, -0.55, 0, -0.25);
    ctx.closePath();
    ctx.restore();
};

const shootBurst = () => {
    const x = state.w - 60;
    const y = state.h - 120;
    for (let i = 0; i < 18; i++) {
        state.burst.push({
            x, y,
            vx: rand(-80, 80),
            vy: rand(-220, -90),
            g: rand(260, 360),
            r: rand(10, 18),
            rot: rand(-0.8, 0.8),
            vr: rand(-2.5, 2.5),
            a: 1
        });
    }
};

const draw = (t) => {
    ctx.clearRect(0, 0, state.w, state.h);

    // sparkles
    for (const p of state.spark) {
        p.t += 0.01 * p.s;
        const a = p.a + Math.sin(p.t) * 0.12;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, a)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }

    // heart burst
    const dt = 1/60;
    for (let i = state.burst.length - 1; i >= 0; i--) {
        const b = state.burst[i];
        b.vy += b.g * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vr * dt;
        b.a -= 0.015;

        const a = Math.max(0, b.a);
        ctx.fillStyle = `rgba(255,105,180,${a})`;
        heartPath(b.x, b.y, b.r / 40, b.rot);
        ctx.fill();

        ctx.strokeStyle = `rgba(255,255,255,${a * 0.35})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (b.a <= 0) state.burst.splice(i, 1);
    }

    requestAnimationFrame(draw);
};
requestAnimationFrame(draw);

// heart count
const loadHeartCount = () => {
    const n = Number(localStorage.getItem(LS_HEART) || '0');
    $('#heartCount').textContent = String(n);
    return n;
};
let heartCount = loadHeartCount();

$('#heartBtn').addEventListener('click', () => {
    heartCount += 1;
    localStorage.setItem(LS_HEART, String(heartCount));
    $('#heartCount').textContent = String(heartCount);
    shootBurst();
});
// ===== HEART + BUBBLE FALLING EFFECT =====
(() => {
    const layer = document.getElementById('falling-layer');
    if (!layer) return;

    const images = [
        'heart.png',
        'heart12.png',
        'bubble.png',
        'bubble1.jpg'
    ];

    const rand = (min, max) => Math.random() * (max - min) + min;

    const createItem = () => {
        const el = document.createElement('img');
        el.src = images[Math.floor(Math.random() * images.length)];
        el.className = 'fall-item';

        const size = rand(24, 64);
        el.style.width = size + 'px';

        el.style.left = rand(0, window.innerWidth) + 'px';
        el.style.opacity = rand(0.5, 0.9);

        const duration = rand(8, 16); // tốc độ rơi
        const rotate = rand(-30, 30);

        el.style.animationDuration = duration + 's';
        el.style.transform = `rotate(${rotate}deg)`;

        layer.appendChild(el);

        // xoá sau khi rơi xong
        setTimeout(() => {
            el.remove();
        }, duration * 1000);
    };

    // tạo liên tục
    setInterval(createItem, 600);

    // tạo sẵn vài cái lúc đầu
    for (let i = 0; i < 10; i++) {
        setTimeout(createItem, i * 300);
    }
})();


