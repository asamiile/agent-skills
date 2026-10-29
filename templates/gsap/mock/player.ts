/*
 * Player bar for mock pages (window.mockPlayer). Mock only; never shipped
 * Keys: Space play/pause, ← → one frame (Shift: 10), R restart, Home/End start/end, 1-9 jump to labels
 * ⏱ plays from the start and reports average fps, the three longest frames with their positions, and frames over 20 ms
 * Depends only on GSAP (gsap.ticker and a gsap.core.Timeline)
 */
type MockPlayerOptions = {
  /** Returns the current timeline (it may be rebuilt when values change) */
  timeline: () => gsap.core.Timeline;
  /** Label names shown as marks and bound to the number keys */
  labels?: string[];
  /** Called instead of timeline().restart() (for example to rebuild first) */
  onRestart?: () => void;
  /** Return false while the page is not ready to play */
  canPlay?: () => boolean;
};

interface Window {
  mockPlayer: (options: MockPlayerOptions) => { notify: (text: string) => void; refresh: () => void };
}

(() => {
  const FPS = 60;

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = ''): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };

  window.mockPlayer = ({ timeline, labels = [], onRestart, canPlay = () => true }) => {
    const bar = el('div', 'mock-player');
    const btnRestart = el('button', 'mock-player__btn', '⏮');
    const btnPrev = el('button', 'mock-player__btn', '◀ 1f');
    const btnToggle = el('button', 'mock-player__btn', '▶');
    const btnNext = el('button', 'mock-player__btn', '1f ▶');
    const seekWrap = el('div', 'mock-player__seek');
    const seek = el('input', 'mock-player__range');
    seek.type = 'range';
    seek.min = '0';
    seek.step = String(1 / FPS);
    const marks = el('div', 'mock-player__marks');
    seekWrap.append(seek, marks);
    const timeText = el('span', 'mock-player__time');
    const btnMeasure = el('button', 'mock-player__btn', '⏱');
    const result = el('span', 'mock-player__result');
    const message = el('span', 'mock-player__message');
    btnRestart.title = 'Restart (R)';
    btnPrev.title = 'Back one frame (←, Shift: 10)';
    btnToggle.title = 'Play / pause (Space)';
    btnNext.title = 'Forward one frame (→, Shift: 10)';
    btnMeasure.title = 'Play from the start and measure frame intervals';
    bar.append(btnRestart, btnPrev, btnToggle, btnNext, seekWrap, timeText, btnMeasure, result, message);
    document.body.append(bar);

    const clamp = (t: number): number => Math.min(Math.max(t, 0), timeline().duration());
    const seekTo = (t: number): void => {
      const tl = timeline();
      tl.pause();
      tl.time(clamp(t));
    };
    // Snap to whole frames so stepping always lands on the same times
    const step = (frames: number): void => seekTo(Math.round(timeline().time() * FPS + frames) / FPS);
    const toggle = (): void => {
      if (!canPlay()) return;
      const tl = timeline();
      if (tl.progress() >= 1) tl.restart();
      else tl.paused(!tl.paused());
    };
    const restart = (): void => {
      if (!canPlay()) return;
      if (onRestart) onRestart();
      else timeline().restart();
    };
    const notify = (text: string): void => {
      message.textContent = text;
      window.setTimeout(() => { if (message.textContent === text) message.textContent = ''; }, 2500);
    };

    let measuring = false;
    const measure = (): void => {
      if (measuring || !canPlay()) return;
      measuring = true;
      result.textContent = 'Measuring…';
      restart();
      const gaps: number[] = [];
      const times: number[] = [];
      let prev = 0;
      const tick = (now: number): void => {
        const tl = timeline();
        if (prev) {
          gaps.push(now - prev);
          times.push(tl.time());
        }
        prev = now;
        if (tl.progress() < 1 && gaps.length < 2000) {
          requestAnimationFrame(tick);
          return;
        }
        measuring = false;
        if (gaps.length === 0) return;
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const over = gaps.filter((g) => g > 20).length;
        const longest = gaps.map((g, i) => [g, times[i]]).sort((a, b) => b[0] - a[0]).slice(0, 3)
          .map(([g, t]) => `${g.toFixed(0)}ms (${t.toFixed(2)}s)`).join(', ');
        result.textContent = `avg ${Math.round(1000 / avg)}fps / longest ${longest} / >20ms ${over}/${gaps.length}`;
      };
      requestAnimationFrame(tick);
    };

    const refresh = (): void => {
      const tl = timeline();
      const total = tl.duration() || 1;
      marks.replaceChildren();
      labels.forEach((name) => {
        const t = tl.labels[name];
        if (t === undefined) return;
        const mark = el('span', 'mock-player__mark', name);
        mark.style.left = `${(t / total) * 100}%`;
        marks.append(mark);
      });
      seek.max = String(tl.duration());
    };

    gsap.ticker.add(() => {
      const tl = timeline();
      const time = tl.time();
      const total = tl.duration();
      if (document.activeElement !== seek) seek.value = String(time);
      timeText.textContent = `${time.toFixed(2)}s / ${total.toFixed(2)}s · f${Math.round(time * FPS)}/${Math.round(total * FPS)}`;
      btnToggle.textContent = tl.paused() || !tl.isActive() ? '▶' : '❚❚';
    });

    seek.addEventListener('input', () => seekTo(Number(seek.value)));
    btnRestart.addEventListener('click', restart);
    btnPrev.addEventListener('click', (e) => step(e.shiftKey ? -10 : -1));
    btnNext.addEventListener('click', (e) => step(e.shiftKey ? 10 : 1));
    btnToggle.addEventListener('click', toggle);
    btnMeasure.addEventListener('click', measure);

    window.addEventListener('keydown', (e) => {
      // Ignore keys while typing in the tuning panel or another input
      const target = e.target;
      if (target instanceof Element && target.closest('.lil-gui') && target.tagName !== 'BUTTON') return;
      if ((target instanceof HTMLInputElement && target !== seek) || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); toggle(); break;
        case 'ArrowLeft': e.preventDefault(); step(e.shiftKey ? -10 : -1); break;
        case 'ArrowRight': e.preventDefault(); step(e.shiftKey ? 10 : 1); break;
        case 'r': case 'R': restart(); break;
        case 'Home': seekTo(0); break;
        case 'End': seekTo(timeline().duration()); break;
        default: {
          const n = Number(e.key);
          if (Number.isInteger(n) && n >= 1 && n <= labels.length) seekTo(timeline().labels[labels[n - 1]] ?? 0);
        }
      }
    });

    refresh();
    return { notify, refresh };
  };
})();
