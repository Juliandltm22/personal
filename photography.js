(function () {
    var flow = document.getElementById('flow');
    var rail = document.getElementById('rail');
    var pp = document.getElementById('pp');
    var originals = [].slice.call(rail.children);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var x = 0, kick = 0, setW = 0, step = 0;
    var speed = 0.6;
    var paused = reduce, hover = false, dragging = false, viewing = false;
    var lastX = 0, lastT = 0, startX = 0, startY = 0, downTarget = null;

    function build() {
        [].slice.call(rail.querySelectorAll('.clone')).forEach(function (n) { n.parentNode.removeChild(n); });
        if (!originals.length) return;
        var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
        setW = 0;
        originals.forEach(function (s) { setW += s.getBoundingClientRect().width + gap; });
        step = originals[0].getBoundingClientRect().width + gap;
        if (setW <= 0) return;
        var copies = Math.ceil(flow.clientWidth / setW) + 1;
        for (var c = 0; c < copies; c++) {
            originals.forEach(function (s) {
                var n = s.cloneNode(true);
                n.classList.add('clone');
                n.setAttribute('aria-hidden', 'true');
                rail.appendChild(n);
            });
        }
    }

    function wrap() {
        if (setW > 0) { x = ((x % setW) - setW) % setW; }
    }

    function frame(t) {
        var dt = lastT ? Math.min(t - lastT, 50) : 16;
        lastT = t;
        if (!dragging) {
            if (Math.abs(kick) > 0.5) {
                var s = kick * 0.14;
                x += s;
                kick -= s;
            } else {
                kick = 0;
                if (!paused && !hover && !viewing) x -= speed * dt / 16;
            }
        }
        wrap();
        rail.style.transform = 'translate3d(' + x + 'px,0,0)';
        requestAnimationFrame(frame);
    }

    function setPaused(p) {
        paused = p;
        pp.classList.toggle('paused', p);
        pp.setAttribute('aria-pressed', p);
        pp.setAttribute('aria-label', p ? 'Play' : 'Pause');
    }

    document.getElementById('next').addEventListener('click', function () { kick -= step; });
    document.getElementById('prev').addEventListener('click', function () { kick += step; });
    pp.addEventListener('click', function () { setPaused(!paused); });

    flow.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); kick -= step; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); kick += step; }
    });

    /* ---------- Lightbox (click a photo to enlarge) ---------- */
    var xIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var lIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
    var rIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<button class="lb-btn lb-close" aria-label="Close photo">' + xIcon + '</button>' +
        '<button class="lb-btn lb-prev" aria-label="Previous photo">' + lIcon + '</button>' +
        '<img alt="">' +
        '<div class="lb-cap"><strong></strong><span></span></div>' +
        '<button class="lb-btn lb-next" aria-label="Next photo">' + rIcon + '</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbTitle = lb.querySelector('strong');
    var lbDesc = lb.querySelector('.lb-cap span');
    var lbBtns = [].slice.call(lb.querySelectorAll('button'));
    var cur = 0;

    function viewable() { return originals.filter(function (s) { return s.querySelector('img'); }); }

    function show(i) {
        var list = viewable();
        if (!list.length) return;
        cur = (i + list.length) % list.length;
        var s = list[cur], im = s.querySelector('img');
        lbImg.src = im.src;
        lbImg.alt = im.alt || '';
        var t = s.querySelector('figcaption strong'), d = s.querySelector('figcaption span');
        lbTitle.textContent = t ? t.textContent : '';
        lbDesc.textContent = d ? d.textContent : '';
    }

    function openLb(slide) {
        var idx = [].slice.call(rail.children).indexOf(slide) % originals.length;
        var list = viewable();
        var vi = list.indexOf(originals[idx]);
        if (vi < 0) return;
        show(vi);
        viewing = true;
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lb-close').focus();
    }

    function closeLb() {
        viewing = false;
        lb.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.removeAttribute('src');
        try { flow.focus({ preventScroll: true }); } catch (err) { }
    }

    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
        if (!viewing) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowRight') show(cur + 1);
        if (e.key === 'ArrowLeft') show(cur - 1);
        if (e.key === 'Tab') {
            var first = lbBtns[0], last = lbBtns[lbBtns.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    /* ---------- Drag to scrub, tap to enlarge ---------- */
    flow.addEventListener('pointerdown', function (e) {
        dragging = true; kick = 0; lastX = e.clientX; startX = e.clientX; startY = e.clientY; downTarget = e.target;
        flow.classList.add('drag');
        try { flow.setPointerCapture(e.pointerId); } catch (err) { }
    });
    flow.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        x += e.clientX - lastX;
        lastX = e.clientX;
    });
    flow.addEventListener('pointerup', function (e) {
        var moved = Math.hypot(e.clientX - startX, e.clientY - startY);
        var wasDragging = dragging;
        dragging = false;
        flow.classList.remove('drag');
        if (wasDragging && moved < 6 && downTarget && downTarget.closest) {
            var slide = downTarget.closest('.slide');
            if (slide) openLb(slide);
        }
        downTarget = null;
    });
    flow.addEventListener('pointercancel', function () { dragging = false; downTarget = null; flow.classList.remove('drag'); });
    flow.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    flow.addEventListener('pointerleave', function () { hover = false; });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
    window.addEventListener('load', build);

    setPaused(paused);
    build();
    requestAnimationFrame(frame);
})();
