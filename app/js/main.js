/* Clean home dashboard for Samsung Tizen TVs.
 * Favourites dock, connected HDMI inputs and a grid of every launchable app.
 * Remote: arrows move, OK opens, hold OK (or Red) adds/removes a favourite,
 * Back leaves an HDMI input and returns to the dashboard. */
(function () {
    'use strict';

    var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, RED: 403 };
    var GRID_COLS = 6;
    var HOLD_MS = 700;
    var FAV_KEY = 'favourites';
    var SELF_ID = 'CleanSHub1.Dashboard';
    // Samsung marks well over a hundred internal tools as visible apps,
    // including factory tests that take over the screen until they finish
    // (org.tizen.AgingApp). So only list apps known to be for viewers:
    // store apps, third-party apps, and Samsung's own user-facing apps.
    var SAMSUNG_USER_APPS = [
        'org.tizen.netflix-app', 'org.tizen.primevideo', 'com.samsung.tv.aria-video',
        'org.tizen.apple.apple-music', 'org.tizen.browser', 'com.samsung.tv.store',
        'com.samsung.tv.SmartThingsApp', 'com.samsung.tv.gallery', 'com.samsung.tv.gaminghub',
        'org.tizen.art-app', 'HEPsqFNie0.tvplusstandalone'
    ];
    // Store-style IDs that are Samsung promotions, manuals or settings.
    var NOT_USER_APPS = ['yL49PNFmjW.PromotionApp', 'w2VwCK465D.OTApp', '2025ePop01.SmartTV', '25emanual2.emanual'];
    var STORE_APP = /^[A-Za-z0-9]{10}\./;
    var SYSTEM_NAMESPACE = /^(com\.samsung|org\.tizen|org\.volt|com\.sec|lib-|ug-|ep-)/;
    var HIDDEN = /factory|aging|ageing|burn|test|service|diagnos|debug|demo|calibrat|hotel|pattern|selfcheck|self-check|panel|engineer|svc|\bqa\b/i;

    function isUserApp(a) {
        if (!a.name || a.id === SELF_ID || HIDDEN.test(a.id) || HIDDEN.test(a.name)) return false;
        if (SAMSUNG_USER_APPS.indexOf(a.id) >= 0) return true;
        if (!a.show || NOT_USER_APPS.indexOf(a.id) >= 0) return false;
        if (STORE_APP.test(a.id)) return true;
        return a.id.indexOf('.') > 0 && !SYSTEM_NAMESPACE.test(a.id);
    }

    var apps = [];          // [{id, name, icon}]
    var inputs = [];        // [{type, number, label}]
    var favourites = loadFavourites();
    var sections = [];      // [{name, el, items, cols}]
    var focus = { s: 0, i: 0 };
    var watching = false;
    var holdTimer = null;
    var holdFired = false;
    var enterDown = false;

    var $ = function (id) { return document.getElementById(id); };
    var hasTizen = typeof tizen !== 'undefined';

    // ---- storage ----------------------------------------------------------
    function loadFavourites() {
        try {
            var v = JSON.parse(localStorage.getItem(FAV_KEY));
            return Array.isArray(v) ? v : [];
        } catch (e) { return []; }
    }

    function saveFavourites() {
        try { localStorage.setItem(FAV_KEY, JSON.stringify(favourites)); } catch (e) { /* not fatal */ }
    }

    // ---- data -------------------------------------------------------------
    function loadApps(done) {
        if (!hasTizen) { done(); return; }
        tizen.application.getAppsInfo(function (list) {
            apps = list.filter(isUserApp).map(function (a) {
                return { id: a.id, name: a.name, icon: a.iconPath };
            }).sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            // Forget favourites for apps that have been uninstalled.
            favourites = favourites.filter(function (id) {
                return apps.some(function (a) { return a.id === id; });
            });
            done();
        }, function (err) {
            toast('Could not list apps: ' + err.message);
            done();
        });
    }

    function loadInputs(done) {
        if (!hasTizen || !tizen.systeminfo) { done(); return; }
        try {
            tizen.systeminfo.getPropertyValue('VIDEOSOURCE', function (src) {
                inputs = (src.connected || []).filter(function (s) {
                    return s.type === 'HDMI';
                }).map(function (s) {
                    return { type: s.type, number: s.number, label: 'HDMI ' + s.number };
                });
                done();
            }, function () { done(); });
        } catch (e) { done(); }
    }

    // ---- rendering --------------------------------------------------------
    function appById(id) {
        for (var i = 0; i < apps.length; i++) if (apps[i].id === id) return apps[i];
        return null;
    }

    function appTile(app) {
        var el = document.createElement('div');
        el.className = 'tile' + (favourites.indexOf(app.id) >= 0 ? ' fav' : '');
        if (app.icon) {
            var img = document.createElement('img');
            img.src = app.icon;
            img.onerror = function () { img.remove(); };
            el.appendChild(img);
        }
        var label = document.createElement('span');
        label.textContent = app.name;
        el.appendChild(label);
        return el;
    }

    function render() {
        var dockApps = favourites.map(appById).filter(Boolean);
        sections = [];

        fill($('dock'), dockApps, appTile);
        $('dock-empty').style.display = dockApps.length ? 'none' : '';
        if (dockApps.length) sections.push({ name: 'dock', el: $('dock'), items: dockApps, cols: dockApps.length });

        fill($('inputs'), inputs, function (input) {
            var el = document.createElement('div');
            el.className = 'tile input';
            var label = document.createElement('span');
            label.textContent = input.label;
            el.appendChild(label);
            return el;
        });
        $('inputs-section').style.display = inputs.length ? '' : 'none';
        if (inputs.length) sections.push({ name: 'inputs', el: $('inputs'), items: inputs, cols: inputs.length });

        fill($('grid'), apps, appTile);
        if (apps.length) sections.push({ name: 'grid', el: $('grid'), items: apps, cols: GRID_COLS });

        if (!sections.length) { $('focus-name').textContent = 'No apps found'; return; }
        focus.s = Math.min(focus.s, sections.length - 1);
        focus.i = Math.min(focus.i, sections[focus.s].items.length - 1);
        showFocus();
    }

    function fill(container, items, make) {
        container.innerHTML = '';
        items.forEach(function (item) { container.appendChild(make(item)); });
    }

    function showFocus() {
        var old = document.querySelector('.tile.focused');
        if (old) old.classList.remove('focused');
        var sec = sections[focus.s];
        if (!sec) return;
        var el = sec.el.children[focus.i];
        if (!el) return;
        el.classList.add('focused');
        var item = sec.items[focus.i];
        $('focus-name').textContent = item.name || item.label;
        scrollIntoView(el);
    }

    function scrollIntoView(el) {
        var main = document.querySelector('main');
        var top = el.offsetTop - main.offsetTop;
        var bottom = top + el.offsetHeight;
        if (focus.s === 0) {
            main.scrollTop = 0;
        } else if (bottom + 40 > main.scrollTop + main.clientHeight) {
            main.scrollTop = bottom + 40 - main.clientHeight;
        } else if (top - 180 < main.scrollTop) {
            main.scrollTop = Math.max(0, top - 180);
        }
    }

    // ---- navigation -------------------------------------------------------
    function move(dx, dy) {
        var sec = sections[focus.s];
        if (!sec) return;
        var col = focus.i % sec.cols;
        var row = Math.floor(focus.i / sec.cols);
        var rows = Math.ceil(sec.items.length / sec.cols);

        if (dx) {
            var next = focus.i + dx;
            if (next >= 0 && next < sec.items.length && Math.floor(next / sec.cols) === row) focus.i = next;
        } else if (dy > 0) {
            if (row + 1 < rows) {
                focus.i = Math.min(focus.i + sec.cols, sec.items.length - 1);
            } else if (focus.s + 1 < sections.length) {
                focus.s++;
                focus.i = Math.min(col, sections[focus.s].items.length - 1);
            }
        } else if (dy < 0) {
            if (row > 0) {
                focus.i -= sec.cols;
            } else if (focus.s > 0) {
                focus.s--;
                var prev = sections[focus.s];
                var lastRowStart = Math.floor((prev.items.length - 1) / prev.cols) * prev.cols;
                focus.i = Math.min(lastRowStart + col, prev.items.length - 1);
            }
        }
        showFocus();
    }

    function activate() {
        var sec = sections[focus.s];
        if (!sec) return;
        var item = sec.items[focus.i];
        if (sec.name === 'inputs') {
            watchInput(item);
        } else if (hasTizen) {
            tizen.application.launch(item.id, null, function (err) {
                toast('Could not open ' + item.name + ': ' + err.message);
            });
        }
    }

    function toggleFavourite() {
        var sec = sections[focus.s];
        if (!sec || sec.name === 'inputs') return;
        var id = sec.items[focus.i].id;
        var at = favourites.indexOf(id);
        if (at >= 0) {
            favourites.splice(at, 1);
            toast('Removed from favourites');
        } else {
            favourites.push(id);
            toast('Added to favourites');
        }
        saveFavourites();
        var keepName = sec.name;
        var keepIndex = focus.i;
        render();
        focus.i = keepIndex;
        // Stay in the grid when editing from it; the dock may have shifted it.
        for (var s = 0; s < sections.length; s++) {
            if (sections[s].name === keepName) { focus.s = s; break; }
        }
        focus.i = Math.min(focus.i, sections[focus.s].items.length - 1);
        showFocus();
    }

    // ---- HDMI -------------------------------------------------------------
    function watchInput(input) {
        if (!hasTizen || !tizen.tvwindow) { toast('Inputs are not available'); return; }
        tizen.tvwindow.setSource({ type: input.type, number: input.number }, function () {
            tizen.tvwindow.show(function () {
                watching = true;
                document.body.classList.add('watching');
            }, function (err) {
                toast('Could not show ' + input.label + ': ' + err.message);
            }, ['0px', '0px', '1920px', '1080px'], 'MAIN');
        }, function (err) {
            toast('Could not switch to ' + input.label + ': ' + err.message);
        });
    }

    function stopWatching() {
        try { tizen.tvwindow.hide(function () {}, function () {}, 'MAIN'); } catch (e) { /* ignore */ }
        watching = false;
        document.body.classList.remove('watching');
    }

    // ---- keys -------------------------------------------------------------
    document.addEventListener('keydown', function (e) {
        if (watching) {
            if (e.keyCode === KEY.BACK) { e.preventDefault(); stopWatching(); }
            return;
        }
        switch (e.keyCode) {
            case KEY.LEFT: move(-1, 0); break;
            case KEY.RIGHT: move(1, 0); break;
            case KEY.UP: move(0, -1); break;
            case KEY.DOWN: move(0, 1); break;
            case KEY.RED: toggleFavourite(); break;
            case KEY.ENTER:
                if (!enterDown) {
                    enterDown = true;
                    holdFired = false;
                    holdTimer = setTimeout(function () { holdFired = true; toggleFavourite(); }, HOLD_MS);
                }
                break;
            case KEY.BACK: break; // this is the home screen; nothing to go back to
            default: return;
        }
        e.preventDefault();
    });

    document.addEventListener('keyup', function (e) {
        if (e.keyCode !== KEY.ENTER || !enterDown) return;
        enterDown = false;
        clearTimeout(holdTimer);
        if (!holdFired) activate();
    });

    // ---- clock, toast -----------------------------------------------------
    function tick() {
        var now = new Date();
        var h = now.getHours();
        $('greeting').textContent = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
        $('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        $('date').textContent = now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    }

    var toastTimer = null;
    function toast(text) {
        var el = $('toast');
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2500);
    }

    function refresh() {
        loadApps(function () { loadInputs(render); });
    }

    // ---- start ------------------------------------------------------------
    if (hasTizen && tizen.tvinputdevice) {
        try { tizen.tvinputdevice.registerKey('ColorF0Red'); } catch (e) { /* remote may lack it */ }
    }
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) { if (watching) stopWatching(); refresh(); }
    });
    tick();
    setInterval(tick, 10000);
    refresh();
})();
