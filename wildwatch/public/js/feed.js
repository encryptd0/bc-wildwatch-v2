(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  var posts = window.__FEED_POSTS__ || [];
  var newestTimestamp = posts.length ? posts[0].createdAt : new Date().toISOString();
  var pendingNew = [];
  var activeFilter = 'all';

  // ── DOM refs ───────────────────────────────────────────────
  var feedList      = document.getElementById('feedList');
  var newIndicator  = document.getElementById('feedNewIndicator');
  var indicatorCount = document.getElementById('indicatorCount');
  var loadMoreBtn   = document.getElementById('loadMoreBtn');
  var composeForm   = document.getElementById('composeForm');
  var composeText   = document.getElementById('composeText');
  var charCounter   = document.getElementById('charCounter');
  var postBtn       = document.getElementById('postBtn');
  var postBtnText   = document.getElementById('postBtnText');
  var postBtnSpinner = document.getElementById('postBtnSpinner');
  var filterBtns    = document.querySelectorAll('.filter-btn');
  var emptyState    = document.getElementById('feedEmpty');
  var hasMoreFlag   = window.__FEED_HAS_MORE__;

  // ── Type config ────────────────────────────────────────────
  var TYPE_META = {
    post:      { icon: 'fa-comment',              label: 'Post',      cls: 'type-post' },
    question:  { icon: 'fa-circle-question',      label: 'Question',  cls: 'type-question' },
    alert:     { icon: 'fa-triangle-exclamation', label: 'Alert',     cls: 'type-alert' },
    emergency: { icon: 'fa-circle-exclamation',   label: 'Emergency', cls: 'type-emergency' }
  };

  // ── Helpers ────────────────────────────────────────────────
  function initials(name) {
    var parts = (name || '').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0] || '?').slice(0, 2).toUpperCase();
  }

  function relativeTime(iso) {
    var diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)  return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateEmptyState() {
    var visibleCards = feedList.querySelectorAll('.community-post:not([style*="display: none"]):not([style*="display:none"])');
    if (emptyState) emptyState.style.display = visibleCards.length ? 'none' : 'block';
  }

  // ── Render a single post card ──────────────────────────────
  function buildPostCard(post) {
    var meta = TYPE_META[post.type] || TYPE_META.post;
    var repliesHtml = '';
    if (post.replies && post.replies.length) {
      repliesHtml = post.replies.map(function (r) {
        return '<div class="reply-item">' +
          '<div class="reply-header">' +
            '<span class="post-avatar reply-avatar">' + escHtml(initials(r.authorName)) + '</span>' +
            '<span class="reply-author">' + escHtml(r.authorName) + '</span>' +
            '<span class="reply-time">' + relativeTime(r.createdAt) + '</span>' +
          '</div>' +
          '<p class="reply-content">' + escHtml(r.content) + '</p>' +
        '</div>';
      }).join('');
    }

    var card = document.createElement('div');
    card.className = 'community-post ' + meta.cls;
    card.dataset.postId = post._id;
    card.dataset.type = post.type;
    card.innerHTML =
      '<div class="post-header">' +
        '<span class="post-avatar">' + escHtml(initials(post.authorName)) + '</span>' +
        '<div class="post-author-group">' +
          '<span class="post-author-name">' + escHtml(post.authorName) + '</span>' +
          '<span class="post-type-badge ' + meta.cls + '">' +
            '<i class="fa-solid ' + meta.icon + '"></i> ' + meta.label +
          '</span>' +
        '</div>' +
        '<span class="post-time">' + relativeTime(post.createdAt) + '</span>' +
      '</div>' +
      '<p class="post-content">' + escHtml(post.content) + '</p>' +
      '<div class="post-footer">' +
        '<button class="reply-toggle" data-open="false">' +
          '<i class="fa-solid fa-reply"></i> ' +
          '<span class="reply-count">' + (post.replies ? post.replies.length : 0) + '</span> ' +
          (post.replies && post.replies.length === 1 ? 'reply' : 'replies') +
        '</button>' +
      '</div>' +
      '<div class="reply-section" style="display:none;">' +
        '<div class="reply-list">' + repliesHtml + '</div>' +
        '<div class="reply-compose">' +
          '<textarea class="reply-textarea" placeholder="Write a reply… (max 300 chars)" maxlength="300" rows="2"></textarea>' +
          '<button class="btn-reply-submit"><i class="fa-solid fa-paper-plane"></i> Reply</button>' +
        '</div>' +
      '</div>';

    // Toggle reply section
    card.querySelector('.reply-toggle').addEventListener('click', function () {
      var section = card.querySelector('.reply-section');
      var open = section.style.display === 'none';
      section.style.display = open ? 'block' : 'none';
      this.dataset.open = String(open);
      if (open) card.querySelector('.reply-textarea').focus();
    });

    // Submit reply
    card.querySelector('.btn-reply-submit').addEventListener('click', function () {
      submitReply(post._id, card);
    });

    card.querySelector('.reply-textarea').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitReply(post._id, card);
      }
    });

    return card;
  }

  function submitReply(postId, card) {
    var textarea = card.querySelector('.reply-textarea');
    var content = textarea.value.trim();
    if (!content) return;

    var btn = card.querySelector('.btn-reply-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    fetch('/feed/posts/' + postId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Reply';
      if (data.error) { alert(data.error); return; }
      textarea.value = '';
      var replyList = card.querySelector('.reply-list');
      var reply = data.post.replies[data.post.replies.length - 1];
      var div = document.createElement('div');
      div.className = 'reply-item reply-new';
      div.innerHTML =
        '<div class="reply-header">' +
          '<span class="post-avatar reply-avatar">' + escHtml(initials(reply.authorName)) + '</span>' +
          '<span class="reply-author">' + escHtml(reply.authorName) + '</span>' +
          '<span class="reply-time">just now</span>' +
        '</div>' +
        '<p class="reply-content">' + escHtml(reply.content) + '</p>';
      replyList.appendChild(div);
      var toggle = card.querySelector('.reply-toggle');
      var count = replyList.querySelectorAll('.reply-item').length;
      card.querySelector('.reply-count').textContent = count;
      toggle.lastChild.textContent = ' ' + (count === 1 ? 'reply' : 'replies');
    })
    .catch(function () {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Reply';
    });
  }

  function prependCard(post, animate) {
    var card = buildPostCard(post);
    if (animate) card.classList.add('post-slide-in');
    feedList.insertBefore(card, feedList.firstChild);
    if (activeFilter !== 'all' && post.type !== activeFilter) {
      card.style.display = 'none';
    }
    updateEmptyState();
  }

  function appendCard(post) {
    var card = buildPostCard(post);
    feedList.appendChild(card);
    if (activeFilter !== 'all' && post.type !== activeFilter) {
      card.style.display = 'none';
    }
    updateEmptyState();
  }

  // ── Render initial posts ───────────────────────────────────
  posts.forEach(function (p) { appendCard(p); });
  updateEmptyState();

  // ── Compose form ───────────────────────────────────────────
  var selectedType = 'post';
  document.querySelectorAll('.post-type-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.post-type-btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      selectedType = btn.dataset.type;
    });
  });

  if (composeText) {
    composeText.addEventListener('input', function () {
      var len = this.value.length;
      charCounter.textContent = len + ' / 500';
      charCounter.classList.toggle('char-warn', len > 480);
      postBtn.disabled = !this.value.trim();
    });
  }

  if (composeForm) {
    composeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var content = composeText.value.trim();
      if (!content) return;

      postBtn.disabled = true;
      postBtnText.style.display = 'none';
      postBtnSpinner.style.display = 'inline';

      fetch('/feed/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content, type: selectedType })
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        postBtn.disabled = false;
        postBtnText.style.display = 'inline';
        postBtnSpinner.style.display = 'none';
        if (data.error) { alert(data.error); return; }
        composeText.value = '';
        charCounter.textContent = '0 / 500';
        postBtn.disabled = true;
        prependCard(data.post, true);
        newestTimestamp = data.post.createdAt;
      })
      .catch(function () {
        postBtn.disabled = false;
        postBtnText.style.display = 'inline';
        postBtnSpinner.style.display = 'none';
      });
    });
  }

  // ── Filters ────────────────────────────────────────────────
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      feedList.querySelectorAll('.community-post').forEach(function (card) {
        var show = activeFilter === 'all' || card.dataset.type === activeFilter;
        card.style.display = show ? '' : 'none';
      });
      updateEmptyState();
    });
  });

  // ── Load more ──────────────────────────────────────────────
  if (loadMoreBtn) {
    if (!hasMoreFlag) loadMoreBtn.style.display = 'none';

    loadMoreBtn.addEventListener('click', function () {
      var cards = feedList.querySelectorAll('.community-post');
      if (!cards.length) return;
      var lastCard = cards[cards.length - 1];
      var oldestId = lastCard.dataset.postId;
      // Find createdAt of the last visible post from our posts array
      var allCards = Array.from(cards);
      var lastTs = allCards[allCards.length - 1].dataset.createdAt || new Date(0).toISOString();

      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

      fetch('/feed/posts?before=' + encodeURIComponent(lastTs))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          loadMoreBtn.disabled = false;
          data.posts.forEach(function (p) { appendCard(p); });
          if (!data.hasMore) loadMoreBtn.style.display = 'none';
          else loadMoreBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Load older posts';
        })
        .catch(function () {
          loadMoreBtn.disabled = false;
          loadMoreBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Load older posts';
        });
    });
  }

  // ── Polling for new posts ──────────────────────────────────
  setInterval(function () {
    fetch('/feed/posts?after=' + encodeURIComponent(newestTimestamp))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.posts || !data.posts.length) return;
        pendingNew = data.posts.concat(pendingNew);
        if (pendingNew.length) {
          indicatorCount.textContent = pendingNew.length;
          newIndicator.style.display = 'flex';
        }
      })
      .catch(function () {});
  }, 12000);

  if (newIndicator) {
    newIndicator.addEventListener('click', function () {
      pendingNew.forEach(function (p) {
        prependCard(p, true);
        if (new Date(p.createdAt) > new Date(newestTimestamp)) {
          newestTimestamp = p.createdAt;
        }
      });
      pendingNew = [];
      newIndicator.style.display = 'none';
    });
  }

  // Store createdAt on cards for load-more
  function patchCardTimestamps() {
    feedList.querySelectorAll('.community-post').forEach(function (card, i) {
      if (!card.dataset.createdAt && posts[i]) {
        card.dataset.createdAt = posts[i].createdAt;
      }
    });
  }
  patchCardTimestamps();

})();
