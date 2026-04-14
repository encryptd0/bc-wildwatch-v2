(function () {
  var sidebarList = document.getElementById('heatmapSidebarList');
  var totalEl     = document.getElementById('heatmapTotal');

  var SEV_COLORS = {
    Critical: '#EF4444',
    High:     '#F97316',
    Medium:   '#F59E0B',
    Low:      '#10B981'
  };

  // Map campus id → tooltip element
  var TOOLTIPS = {
    'campus-main':  document.getElementById('heatmapTooltipMain'),
    'campus-north': document.getElementById('heatmapTooltipNorth'),
    'campus-west':  document.getElementById('heatmapTooltipWest')
  };

  function worstSeverity(d) {
    if (d.critical > 0) return 'Critical';
    if (d.high > 0)     return 'High';
    if (d.medium > 0)   return 'Medium';
    if (d.low > 0)      return 'Low';
    return null;
  }

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  // ── Tab switching ─────────────────────────────────────────────
  var tabs    = document.querySelectorAll('.heatmap-tab');
  var wraps   = document.querySelectorAll('.heatmap-wrap');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      var campus = tab.dataset.campus;
      wraps.forEach(function (w) {
        w.style.display = (w.id === 'campus-' + campus) ? 'block' : 'none';
      });

      // Hide all tooltips when switching tab
      Object.values(TOOLTIPS).forEach(function (tt) {
        if (tt) tt.style.display = 'none';
      });
    });
  });

  // ── Fetch data + apply to all SVGs ───────────────────────────
  fetch('/heatmap/data')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.success) {
        totalEl.textContent = 'Could not load data';
        return;
      }
      var data = res.data;

      // Build lookup  { location → {total, critical, high, medium, low} }
      var lookup = {};
      data.forEach(function (d) { lookup[d.location] = d; });

      // Grand total
      var grand = data.reduce(function (acc, d) { return acc + d.total; }, 0);
      totalEl.textContent = grand + ' total report' + (grand !== 1 ? 's' : '');

      // Apply heat dots to every .map-zone across all three SVGs
      document.querySelectorAll('.map-zone').forEach(function (zone) {
        var loc = zone.dataset.location;
        var d   = lookup[loc];
        var rect = zone.querySelector('rect');
        var dot  = zone.querySelector('.heat-dot');
        if (!rect || !dot) return;

        if (d && d.total > 0) {
          var sev     = worstSeverity(d);
          var color   = SEV_COLORS[sev] || '#10B981';
          var opacity = Math.min(0.08 + d.total * 0.06, 0.45);

          rect.style.fill        = color;
          rect.style.fillOpacity = opacity;
          rect.style.stroke      = color;
          zone.classList.add('has-data');

          var radius = clamp(d.total * 5, 7, 36);
          dot.style.fill        = color;
          dot.style.fillOpacity = '0.55';
          dot.style.display     = 'block';
          setTimeout(function () { dot.setAttribute('r', radius); }, 80);
        }

        // Determine which tooltip to use based on parent campus wrap
        var campusWrap = zone.closest('.heatmap-wrap');
        var tooltip    = campusWrap ? TOOLTIPS[campusWrap.id] : null;

        zone.addEventListener('mouseenter', function (e) {
          if (!tooltip) return;
          var info = lookup[loc];
          var html = '<strong>' + loc + '</strong>';
          if (info && info.total > 0) {
            html += '<div class="tt-total">' + info.total + ' report' + (info.total !== 1 ? 's' : '') + '</div>';
            html += '<div class="tt-row"><span class="tt-dot" style="background:#EF4444"></span>Critical: ' + info.critical + '</div>';
            html += '<div class="tt-row"><span class="tt-dot" style="background:#F97316"></span>High: ' + info.high + '</div>';
            html += '<div class="tt-row"><span class="tt-dot" style="background:#F59E0B"></span>Medium: ' + info.medium + '</div>';
            html += '<div class="tt-row"><span class="tt-dot" style="background:#10B981"></span>Low: ' + info.low + '</div>';
          } else {
            html += '<div class="tt-total tt-none">No reports</div>';
          }
          tooltip.innerHTML     = html;
          tooltip.style.display = 'block';
          moveTooltip(e, tooltip);
        });

        zone.addEventListener('mousemove', function (e) {
          if (tooltip) moveTooltip(e, tooltip);
        });

        zone.addEventListener('mouseleave', function () {
          if (tooltip) tooltip.style.display = 'none';
        });
      });

      // ── Sidebar: all hotspots sorted by total ──────────────────
      var sorted = data.slice().sort(function (a, b) { return b.total - a.total; });
      if (sorted.length === 0) {
        sidebarList.innerHTML = '<div class="heatmap-sidebar-empty">No incidents reported yet.</div>';
        return;
      }
      var html = '';
      sorted.forEach(function (d) {
        var sev   = worstSeverity(d);
        var color = SEV_COLORS[sev] || '#94a3b8';
        html += '<div class="location-row">';
        html += '<div class="location-row-name">' + d.location + '</div>';
        html += '<div class="location-row-right">';
        html += '<span class="location-row-count" style="background:' + color + '20;color:' + color + '">' + d.total + '</span>';
        html += '<div class="severity-mini-bar">';
        if (d.critical) html += '<span style="width:' + Math.round(d.critical / d.total * 100) + '%;background:#EF4444"></span>';
        if (d.high)     html += '<span style="width:' + Math.round(d.high     / d.total * 100) + '%;background:#F97316"></span>';
        if (d.medium)   html += '<span style="width:' + Math.round(d.medium   / d.total * 100) + '%;background:#F59E0B"></span>';
        if (d.low)      html += '<span style="width:' + Math.round(d.low      / d.total * 100) + '%;background:#10B981"></span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      });
      sidebarList.innerHTML = html;
    })
    .catch(function () {
      if (totalEl) totalEl.textContent = 'Could not load data';
      if (sidebarList) sidebarList.innerHTML = '<div class="heatmap-sidebar-empty">Failed to load.</div>';
    });

  function moveTooltip(e, tooltip) {
    var x = e.clientX + 14;
    var y = e.clientY - 10;
    if (x + 220 > window.innerWidth) x = e.clientX - 234;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }
})();
