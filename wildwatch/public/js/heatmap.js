(function () {
  var tooltip = document.getElementById('heatmapTooltip');
  var sidebarList = document.getElementById('heatmapSidebarList');
  var totalEl = document.getElementById('heatmapTotal');

  var SEV_COLORS = {
    Critical: '#EF4444',
    High:     '#F97316',
    Medium:   '#F59E0B',
    Low:      '#10B981'
  };

  function worstSeverity(d) {
    if (d.critical > 0) return 'Critical';
    if (d.high > 0)     return 'High';
    if (d.medium > 0)   return 'Medium';
    if (d.low > 0)      return 'Low';
    return null;
  }

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  fetch('/heatmap/data')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.success) return;
      var data = res.data;

      // Build lookup
      var lookup = {};
      data.forEach(function (d) { lookup[d.location] = d; });

      // Total incidents
      var grand = data.reduce(function (acc, d) { return acc + d.total; }, 0);
      totalEl.textContent = grand + ' total report' + (grand !== 1 ? 's' : '');

      // Animate zones
      document.querySelectorAll('.map-zone').forEach(function (zone) {
        var loc = zone.dataset.location;
        var d = lookup[loc];
        var rect = zone.querySelector('rect');
        var dot  = zone.querySelector('.heat-dot');
        if (!rect || !dot) return;

        if (d && d.total > 0) {
          var sev = worstSeverity(d);
          var color = SEV_COLORS[sev] || '#10B981';
          var opacity = Math.min(0.08 + d.total * 0.06, 0.45);

          rect.style.fill = color;
          rect.style.fillOpacity = opacity;
          rect.style.stroke = color;
          zone.classList.add('has-data');

          // Animate dot
          var radius = clamp(d.total * 5, 7, 36);
          dot.setAttribute('cx', parseFloat(dot.getAttribute('cx')));
          dot.setAttribute('cy', parseFloat(dot.getAttribute('cy')));
          dot.style.fill = color;
          dot.style.fillOpacity = '0.55';
          dot.style.display = 'block';
          setTimeout(function () { dot.setAttribute('r', radius); }, 80);
        }

        // Hover tooltip
        zone.addEventListener('mouseenter', function (e) {
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
          tooltip.innerHTML = html;
          tooltip.style.display = 'block';
          moveTooltip(e);
        });

        zone.addEventListener('mousemove', moveTooltip);

        zone.addEventListener('mouseleave', function () {
          tooltip.style.display = 'none';
        });
      });

      // Sidebar: top hotspots sorted by total
      var sorted = data.slice().sort(function (a, b) { return b.total - a.total; });
      if (sorted.length === 0) {
        sidebarList.innerHTML = '<div class="heatmap-sidebar-empty">No incidents reported yet.</div>';
        return;
      }
      var html = '';
      sorted.forEach(function (d) {
        var sev = worstSeverity(d);
        var color = SEV_COLORS[sev] || '#94a3b8';
        var barW = clamp(Math.round((d.total / sorted[0].total) * 100), 4, 100);
        html += '<div class="location-row">';
        html += '<div class="location-row-name">' + d.location + '</div>';
        html += '<div class="location-row-right">';
        html += '<span class="location-row-count" style="background:' + color + '20;color:' + color + '">' + d.total + '</span>';
        html += '<div class="severity-mini-bar">';
        if (d.critical) html += '<span style="width:' + Math.round(d.critical/d.total*100) + '%;background:#EF4444"></span>';
        if (d.high)     html += '<span style="width:' + Math.round(d.high/d.total*100) + '%;background:#F97316"></span>';
        if (d.medium)   html += '<span style="width:' + Math.round(d.medium/d.total*100) + '%;background:#F59E0B"></span>';
        if (d.low)      html += '<span style="width:' + Math.round(d.low/d.total*100) + '%;background:#10B981"></span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      });
      sidebarList.innerHTML = html;
    })
    .catch(function () {
      totalEl.textContent = 'Could not load data';
    });

  function moveTooltip(e) {
    var x = e.clientX + 14;
    var y = e.clientY - 10;
    if (x + 200 > window.innerWidth) x = e.clientX - 214;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }
})();
