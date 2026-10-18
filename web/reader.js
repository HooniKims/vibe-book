"use strict";
(() => {
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const key = "sudo-vibe-ebook-20261019-hub-v1";
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(key) || "{}");
  } catch {}
  let page = 0,
    mode =
      stored.mode ||
      (matchMedia("(max-width:650px)").matches ? "read" : "book"),
    zoom = 1,
    font = Number(stored.font) || 18,
    bookmarks = new Set(stored.bookmarks || []),
    pages = [],
    chapters = [],
    busy = false,
    readObserver = null;
  const save = () => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ page, mode, font, bookmarks: [...bookmarks] }),
      );
    } catch {}
  };
  const toast = (t) => {
    const el = $("#toast");
    el.textContent = t;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (el.hidden = true), 2600);
  };
  const count = () => (window.innerWidth >= 1000 ? 2 : 1);
  const clone = (n) => n.cloneNode(true);
  function paper(title, cover = false) {
    let el = document.createElement("article");
    el.className = "paper" + (cover ? " cover" : "");
    el.innerHTML = cover
      ? $("#cover-template").innerHTML
      : '<div class="phead"><span></span><span>요즘 바이브코딩</span></div><div class="pagebody"></div><div class="pfoot"><span>수도여자고등학교 · 김형훈</span><b></b></div>';
    if (!cover) el.querySelector(".phead span").textContent = title;
    return el;
  }
  function paginate() {
    const meas = $("#measurement");
    pages = [paper("", true)];
    pages[0].dataset.chapter = "cover";
    const sections = [...$("#source").content.querySelectorAll("section")];
    for (const [ci, section] of sections.entries()) {
      const title = section.querySelector("h2").textContent;
      const chapter = { title, id: section.id, page: pages.length };
      chapters.push(chapter);
      let leaf, body;
      const fresh = () => {
        leaf = paper(title);
        leaf.dataset.chapter = section.id;
        pages.push(leaf);
        meas.replaceChildren(leaf);
        body = leaf.querySelector(".pagebody");
      };
      fresh();
      const over = () => body.scrollHeight > body.clientHeight + 1;
      const put = (node) => {
        body.append(node);
        if (!over()) return;
        node.remove();
        if (body.children.length) {
          let orphan = null;
          const last = body.lastElementChild;
          if (last && /^H[234]$/.test(last.tagName)) {
            orphan = last;
            orphan.remove();
          }
          if (!body.children.length) {
            pages.pop();
            leaf.remove();
          }
          fresh();
          if (orphan) body.append(orphan);
          body.append(node);
          if (!over()) return;
          node.remove();
        }
        // Split large, structured blocks without dropping their contents.
        if (node.matches(".table-scroll")) {
          const table = node.querySelector("table"),
            rows = [...table.querySelectorAll("tbody>tr")];
          let wrap = null,
            tb = null;
          const newTable = () => {
            wrap = node.cloneNode(false);
            const t = table.cloneNode(false);
            if (table.tHead) t.append(clone(table.tHead));
            tb = document.createElement("tbody");
            t.append(tb);
            wrap.append(t);
            body.append(wrap);
          };
          newTable();
          for (const row of rows) {
            tb.append(clone(row));
            if (over() && tb.children.length > 1) {
              tb.lastElementChild.remove();
              fresh();
              newTable();
              tb.append(clone(row));
            }
          }
        } else if (node.matches(".codebox")) {
          const text = node.querySelector("code").textContent,
            lines = text.split("\n");
          let box, code;
          const newBox = () => {
            box = node.cloneNode(true);
            code = box.querySelector("code");
            code.textContent = "";
            body.append(box);
          };
          newBox();
          for (const line of lines) {
            let prev = code.textContent;
            code.textContent += (prev ? "\n" : "") + line;
            if (over() && prev) {
              code.textContent = prev;
              fresh();
              newBox();
              code.textContent = line;
            }
          }
        } else if (node.matches("ul,ol")) {
          let list = node.cloneNode(false),
            offset = 0;
          body.append(list);
          for (const item of [...node.children]) {
            list.append(clone(item));
            if (over() && list.children.length > 1) {
              list.lastElementChild.remove();
              offset += list.children.length;
              fresh();
              list = node.cloneNode(false);
              if (node.tagName === "OL")
                list.start = (Number(node.getAttribute("start")) || 1) + offset;
              body.append(list);
              list.append(clone(item));
            }
          }
        } else {
          body.append(node);
          if (over()) {
            leaf.dataset.overflow = "true";
          }
        }
      };
      for (const node of [...section.children]) put(clone(node));
      if (!body.children.length) {
        pages.pop();
        leaf.remove();
      }
      // Avoid leaving only a closing sentence on the last page of a chapter.
      if (pages.length > chapter.page + 1) {
        const last = pages.at(-1),
          previous = pages.at(-2);
        const lastBody = last.querySelector(".pagebody"),
          previousBody = previous.querySelector(".pagebody");
        meas.replaceChildren(previous, last);
        const used = (b) =>
          b.lastElementChild
            ? b.lastElementChild.getBoundingClientRect().bottom -
              b.getBoundingClientRect().top
            : 0;
        while (used(lastBody) < 190 && previousBody.children.length > 1) {
          const move = previousBody.lastElementChild;
          if (/^H2$/.test(move.tagName)) break;
          lastBody.prepend(move);
          if (lastBody.scrollHeight > lastBody.clientHeight + 1) {
            previousBody.append(move);
            break;
          }
          const heading = previousBody.lastElementChild;
          if (heading && /^H[34]$/.test(heading.tagName)) {
            lastBody.prepend(heading);
            if (lastBody.scrollHeight > lastBody.clientHeight + 1) {
              previousBody.append(heading, move);
              break;
            }
          }
        }
      }
    }
    meas.replaceChildren();
    pages.forEach((p, i) => {
      p.dataset.page = String(i);
      p.setAttribute("aria-label", `${i + 1}쪽`);
      const f = p.querySelector(".pfoot b");
      if (f) f.textContent = String(i + 1).padStart(2, "0");
    });
    $("#print-pages").replaceChildren(...pages.map(clone));
    const reading = $("#reading");
    reading.innerHTML = "";
    const c = paper("", true);
    c.id = "cover";
    reading.append(c);
    reading.append(...sections.map(clone));
    reading.querySelector(".cover").classList.remove("paper");
    $("#total-pages").textContent = "/ " + pages.length;
    $("#page-number").max = pages.length;
    window.__ebookAudit = {
      pages: pages.length,
      overflow: pages.flatMap((p, i) => (p.dataset.overflow ? [i + 1] : [])),
      chapters: chapters.map((c) => ({ title: c.title, page: c.page + 1 })),
      sourceChars: sections.reduce(
        (a, s) => a + s.textContent.replace(/\s/g, "").length,
        0,
      ),
    };
    renderTOC();
  }
  function fit() {
    if (mode === "read") return;
    const n = count();
    let availW = Math.max(280, window.innerWidth - 54),
      availH = Math.max(
        370,
        window.innerHeight -
          $("#topbar").offsetHeight -
          $("#bottom").offsetHeight -
          50,
      );
    const s = Math.min(availW / (600 * n), availH / 850, 1.2) * zoom;
    $("#book-wrap").style.setProperty("--spread-width", 600 * n + "px");
    $("#book-wrap").style.setProperty("--scale", s);
    $("#spread").classList.toggle("two", n === 2);
    $("#zoom-value").textContent = Math.round(zoom * 100) + "%";
  }
  function currentChapter() {
    return (
      chapters.filter((c) => c.page <= page).at(-1) || {
        title: "표지",
        id: "cover",
      }
    );
  }
  function status() {
    const ch = currentChapter();
    $("#chapter-current").textContent = ch.title;
    $("#progress-fill").style.width = ((page + 1) / pages.length) * 100 + "%";
    $("#page-number").value = page + 1;
    $("#prev").disabled = page === 0;
    $("#next").disabled =
      page >= (mode === "book" ? pages.length - count() : pages.length - 1);
    $("#first").disabled = page === 0;
    $("#last").disabled =
      page >= (mode === "book" ? pages.length - count() : pages.length - 1);
    $("#bookmark").setAttribute("aria-pressed", String(bookmarks.has(page)));
    $("#bookmark").title = bookmarks.has(page)
      ? "현재 쪽 책갈피 지우기"
      : "현재 쪽 책갈피";
    $("#bookmark").style.background = bookmarks.has(page)
      ? "var(--yellow)"
      : "";
    $$(".toc-link").forEach((b) =>
      b.setAttribute("aria-current", String(b.dataset.chapter === ch.id)),
    );
    $("#page-status").textContent =
      mode === "book" && count() === 2
        ? `${page + 1}–${Math.min(page + 2, pages.length)}쪽 / ${pages.length}쪽`
        : `${page + 1}쪽 / ${pages.length}쪽`;
  }
  function show(p, animate = 0, fromRead = false) {
    const old = page;
    page = Math.max(0, Math.min(p, pages.length - 1));
    if (mode === "book" && count() === 2) page = Math.floor(page / 2) * 2;
    if (mode === "book") {
      const nodes = pages.slice(page, page + count()).map(clone);
      if (nodes.length < count()) {
        const blank = paper("");
        blank.classList.add("blank");
        blank.querySelector(".pagebody").textContent =
          "다음 작업은 여러분의 이야기로.";
        nodes.push(blank);
      }
      const spread = $("#spread");
      spread.replaceChildren(...nodes);
      spread.classList.remove("turn-next", "turn-prev");
      if (animate && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
        void spread.offsetWidth;
        spread.classList.add(animate > 0 ? "turn-next" : "turn-prev");
      }
      fit();
    } else if (!fromRead) {
      const block = pages[page].querySelector("[data-block]")?.dataset.block;
      const target = block
        ? $(`#reading [data-block="${block}"]`)
        : $(`#reading #${pages[page].dataset.chapter}`);
      target?.scrollIntoView({ behavior: "auto", block: "start" });
    }
    status();
    save();
    if (!fromRead) history.replaceState(null, "", "#p=" + String(page + 1));
  }
  function setMode(next, initial = false) {
    mode = next;
    document.body.classList.toggle("read-mode", mode === "read");
    $$("[data-mode]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
    );
    $("#font-control").hidden = mode !== "read";
    document.documentElement.style.setProperty("--reader-size", font + "px");
    show(page, 0, initial);
    if (mode === "read") observeReading();
    else readObserver?.disconnect();
    save();
  }
  function observeReading() {
    readObserver?.disconnect();
    const nodes = $$("#reading [data-block]");
    const mapping = new Map();
    pages.forEach((p, i) =>
      p.querySelectorAll("[data-block]").forEach((b) => {
        if (!mapping.has(b.dataset.block)) mapping.set(b.dataset.block, i);
      }),
    );
    readObserver = new IntersectionObserver(
      () => {
        if (mode !== "read" || busy) return;
        const edge = $("#topbar").offsetHeight + 12;
        const n = nodes.find((n) => {
          const r = n.getBoundingClientRect();
          return r.bottom > edge && r.top < innerHeight * 0.65;
        });
        if (n) {
          page = mapping.get(n.dataset.block) || 0;
          status();
          save();
        } else if ($("#reading #cover").getBoundingClientRect().bottom > edge) {
          page = 0;
          status();
          save();
        }
      },
      { rootMargin: "-120px 0px -35% 0px", threshold: 0 },
    );
    nodes.forEach((n) => readObserver.observe(n));
    readObserver.observe($("#reading #cover"));
  }
  function renderTOC(bookmarked = false) {
    const nav = $("#toc");
    nav.replaceChildren();
    const items = bookmarked
      ? [...bookmarks]
          .sort((a, b) => a - b)
          .map((p) => ({
            page: p,
            title:
              pages[p]?.querySelector("h2,h3")?.textContent ||
              chapters.filter((c) => c.page <= p).at(-1)?.title ||
              "표지",
            id: pages[p]?.dataset.chapter,
          }))
          .filter((x) => pages[x.page])
      : [{ title: "표지", id: "cover", page: 0 }, ...chapters];
    if (!items.length) {
      const p = document.createElement("p");
      p.textContent = "읽고 싶은 쪽에서 책갈피 버튼을 누르면 여기에 모입니다.";
      p.className = "tip";
      nav.append(p);
    }
    items.forEach((c) => {
      const b = document.createElement("button");
      b.className = "toc-link";
      b.dataset.chapter = c.id;
      b.innerHTML = "<span></span><small></small>";
      b.querySelector("span").textContent = c.title;
      b.querySelector("small").textContent = c.page + 1 + "쪽";
      b.onclick = () => {
        closeDrawer();
        show(c.page);
      };
      nav.append(b);
    });
    status();
  }
  let drawerTrigger = null;
  function openDrawer() {
    drawerTrigger = document.activeElement;
    $("#drawer").hidden = false;
    $("#overlay").hidden = false;
    $("#drawer-close").focus();
    renderTOC($("#bookmarks-tab").getAttribute("aria-selected") === "true");
  }
  function closeDrawer() {
    $("#drawer").hidden = true;
    $("#overlay").hidden = true;
    drawerTrigger?.focus();
  }
  function search() {
    const query = $("#search-input").value.trim().toLocaleLowerCase();
    const results = $("#results");
    results.replaceChildren();
    if (!query) {
      $("#search-count").textContent = "";
      results.innerHTML =
        "<small>학과, 성적, 타이머처럼 찾고 싶은 말을 입력하세요.</small>";
      return;
    }
    let found = 0;
    pages.forEach((p, i) => {
      const text = (p.querySelector(".pagebody") || p).textContent.replace(
          /\s+/g,
          " ",
        ),
        at = text.toLocaleLowerCase().indexOf(query);
      if (at < 0) return;
      found++;
      const b = document.createElement("button");
      b.className = "result";
      const title = document.createElement("b"),
        snippet = document.createElement("span");
      title.textContent = `${i + 1}쪽 · ${chapters.filter((c) => c.page <= i).at(-1)?.title || "표지"}`;
      snippet.textContent =
        (at > 35 ? "…" : "") + text.slice(Math.max(0, at - 35), at + 110) + "…";
      b.append(title, snippet);
      b.onclick = () => {
        $("#search-dialog").close();
        busy = true;
        show(i);
        setTimeout(() => (busy = false), 800);
      };
      results.append(b);
    });
    if (!found)
      results.innerHTML =
        "<p>찾은 내용이 없어요. 더 짧은 말로 검색해 보세요.</p>";
    $("#search-count").textContent = found ? `${found}쪽에서 찾았어요` : "";
  }
  async function copyPrompt(btn) {
    const text =
      btn.dataset.copy ||
      btn.closest(".codebox").querySelector("code").textContent;
    try {
      if (!navigator.clipboard?.writeText) throw Error();
      await navigator.clipboard.writeText(text);
      const prev = btn.textContent;
      btn.textContent = "복사했어요";
      setTimeout(() => (btn.textContent = prev), 1800);
    } catch {
      const dlg = $("#copy-dialog");
      $("#copy-text").value = text;
      dlg.showModal();
      $("#copy-text").focus();
      $("#copy-text").select();
    }
  }
  async function start() {
    await document.fonts.ready;
    await Promise.all([...$("#source").content.querySelectorAll("img")].map(n => new Promise(resolve => { const im=new Image(); im.onload=im.onerror=resolve; im.src=n.src; })));
    paginate();
    const hashPage = Number(
      new URLSearchParams(location.hash.slice(1)).get("p"),
    );
    page = Math.max(
      0,
      Math.min(
        Number.isInteger(hashPage) && hashPage > 0
          ? hashPage - 1
          : Number(stored.page) || 0,
        pages.length - 1,
      ),
    );
    $("#loading").hidden = true;
    $("#app-content").hidden = false;
    setMode(mode, true);
    if (mode === "read" && page) show(page);
    $("#menu").onclick = openDrawer;
    $("#drawer-close").onclick = closeDrawer;
    $("#overlay").onclick = closeDrawer;
    for (const [id, marked] of [
      ["contents-tab", false],
      ["bookmarks-tab", true],
    ])
      $("#" + id).onclick = () => {
        $("#contents-tab").setAttribute("aria-selected", String(!marked));
        $("#bookmarks-tab").setAttribute("aria-selected", String(marked));
        renderTOC(marked);
      };
    $("#prev").onclick = () => show(page - (mode === "book" ? count() : 1), -1);
    $("#next").onclick = () => show(page + (mode === "book" ? count() : 1), 1);
    $("#first").onclick = () => show(0, -1);
    $("#last").onclick = () => show(pages.length - 1, 1);
    $("#page-form").onsubmit = (e) => {
      e.preventDefault();
      const n = Number($("#page-number").value);
      if (Number.isInteger(n) && n >= 1 && n <= pages.length) show(n - 1);
      else {
        toast("1~" + pages.length + " 사이의 쪽수를 입력하세요.");
        status();
      }
    };
    $$("[data-mode]").forEach(
      (b) => (b.onclick = () => setMode(b.dataset.mode)),
    );
    $("#zoom-in").onclick = () => {
      zoom = Math.min(1.6, Math.round((zoom + 0.1) * 10) / 10);
      fit();
    };
    $("#zoom-out").onclick = () => {
      zoom = Math.max(0.7, Math.round((zoom - 0.1) * 10) / 10);
      fit();
    };
    $("#zoom-value").onclick = () => {
      zoom = 1;
      fit();
    };
    $("#font-plus").onclick = () => {
      font = Math.min(24, font + 1);
      document.documentElement.style.setProperty("--reader-size", font + "px");
      save();
    };
    $("#font-minus").onclick = () => {
      font = Math.max(16, font - 1);
      document.documentElement.style.setProperty("--reader-size", font + "px");
      save();
    };
    $("#bookmark").onclick = () => {
      bookmarks.has(page) ? bookmarks.delete(page) : bookmarks.add(page);
      status();
      save();
      toast(
        bookmarks.has(page)
          ? page + 1 + "쪽에 책갈피를 넣었어요."
          : "책갈피를 지웠어요.",
      );
    };
    $("#search-open").onclick = () => {
      $("#search-dialog").showModal();
      $("#search-input").focus();
      search();
    };
    $("#search-input").oninput = search;
    $("#search-close").onclick = () => $("#search-dialog").close();
    $("#copy-close").onclick = () => $("#copy-dialog").close();
    $("#fullscreen").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen)
          await document.documentElement.requestFullscreen();
        else toast("이 브라우저에서는 전체 화면 전환을 지원하지 않아요.");
      } catch {
        toast("브라우저의 전체 화면 메뉴를 이용해 주세요.");
      }
    };
    $("#print").onclick = () => window.print();
    document.addEventListener("click", (e) => {
      const b = e.target.closest("button.copy");
      if (b) copyPrompt(b);
    });
    document.addEventListener("keydown", (e) => {
      if (!$("#drawer").hidden) {
        if (e.key === "Escape") {
          closeDrawer();
          return;
        }
        if (e.key === "Tab") {
          const focus = [
            ...$("#drawer").querySelectorAll("button,a,input"),
          ].filter((x) => !x.disabled);
          const first = focus[0],
            last = focus.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if (
        document.querySelector("dialog[open]") ||
        e.target.closest("input,textarea,select,button,a") ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (
        mode === "book" &&
        ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
      ) {
        e.preventDefault();
        if (e.key === "ArrowRight") show(page + count(), 1);
        if (e.key === "ArrowLeft") show(page - count(), -1);
        if (e.key === "Home") show(0);
        if (e.key === "End") show(pages.length - 1);
      }
    });
    let touch = null;
    $("#app-content").addEventListener(
      "touchstart",
      (e) => {
        touch = null;
        if (
          e.touches.length !== 1 ||
          e.target.closest("a,button,input,textarea,select,pre,.codebox")
        )
          return;
        const table = e.target.closest(".table-scroll");
        if (table && table.scrollWidth > table.clientWidth + 1) return;
        const t = e.changedTouches[0];
        touch = { x: t.clientX, y: t.clientY };
      },
      { passive: true },
    );
    $("#app-content").addEventListener(
      "touchend",
      (e) => {
        if (!touch) return;
        const t = e.changedTouches[0],
          dx = t.clientX - touch.x,
          dy = t.clientY - touch.y;
        touch = null;
        if (
          Math.abs(dx) > 65 &&
          Math.abs(dx) > Math.abs(dy) * 1.5 &&
          !window.getSelection().toString()
        ) {
          if (mode === "book")
            show(page + (dx < 0 ? count() : -count()), dx < 0 ? 1 : -1);
          else
            window.scrollBy({
              top: (dx < 0 ? 1 : -1) * Math.max(160, innerHeight - 190),
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "instant"
                : "smooth",
            });
        }
      },
      { passive: true },
    );
    $("#app-content").addEventListener(
      "touchcancel",
      () => {
        touch = null;
      },
      { passive: true },
    );
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => show(page, 0, true), 120);
    });
    window.addEventListener("hashchange", () => {
      const p = Number(new URLSearchParams(location.hash.slice(1)).get("p"));
      if (p) show(p - 1);
    });
    window.__ebookReady = true;
    const norm = (t) => t.replace(/\s/g, "");
    const contentText = (n) => {
      const c = clone(n);
      c.querySelectorAll(".code-label").forEach((x) => x.remove());
      return norm(c.textContent);
    };
    const missing = [];
    for (const s of $("#source").content.querySelectorAll("[data-block]")) {
      const found = [
        ...$("#print-pages").querySelectorAll(
          `[data-block="${s.dataset.block}"]`,
        ),
      ];
      if (!found.length) {
        missing.push(s.dataset.block);
        continue;
      }
      let actual = found
        .map((n, i) => {
          const c = clone(n);
          if (i && c.matches(".table-scroll"))
            c.querySelector("thead")?.remove();
          return contentText(c);
        })
        .join("");
      if (actual !== contentText(s)) missing.push(s.dataset.block);
    }
    window.__ebookAudit.contentMismatches = missing;
    window.__ebookAudit.layoutOverflow = [
      ...$("#print-pages").querySelectorAll(".pagebody"),
    ].flatMap((n) =>
      n.scrollHeight > n.clientHeight + 1
        ? [Number(n.parentElement.dataset.page) + 1]
        : [],
    );
    window.__ebookAudit.viewport = {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      mode,
    };
    const audit = document.createElement("script");
    audit.type = "application/json";
    audit.id = "ebook-audit";
    audit.textContent = JSON.stringify(window.__ebookAudit);
    document.body.append(audit);
  }
  start().catch((e) => {
    $("#loading").textContent =
      "책 화면을 준비하지 못했습니다. 파일을 다시 열어 주세요.";
    console.error(e);
  });
})();
