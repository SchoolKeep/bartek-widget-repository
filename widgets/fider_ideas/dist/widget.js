(function () {
  var host = document.querySelector('gs-cc-registry-widget[data-widget-type*="fider_ideas"]');
  if (!host || !host.shadowRoot) return;
  if (host._fiderInit) return;
  host._fiderInit = true;

  var root = host.shadowRoot;
  var sdk = new WidgetServiceSDK();
  var portalUrl = 'https://bartek-gainsigh.fider.io';

  var STATUS_MAP = {
    open: 'open',
    planned: 'planned',
    started: 'started',
    completed: 'completed',
    declined: 'declined',
    duplicate: 'duplicate'
  };

  function $(sel) { return root.querySelector(sel); }

  function showState(state) {
    $('#fi-loading').style.display = state === 'loading' ? '' : 'none';
    $('#fi-error').style.display = state === 'error' ? '' : 'none';
    $('#fi-empty').style.display = state === 'empty' ? '' : 'none';
    $('#fi-list').style.display = state === 'list' ? '' : 'none';
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderIdeas(posts) {
    var list = $('#fi-list');
    list.innerHTML = '';

    if (!posts || posts.length === 0) {
      showState('empty');
      return;
    }

    posts.forEach(function (post) {
      var link = document.createElement('a');
      link.className = 'fi-idea';
      link.href = portalUrl + '/posts/' + post.number + '/' + post.slug;
      link.target = '_blank';
      link.rel = 'noopener';

      var statusClass = STATUS_MAP[post.status] || 'open';
      var statusLabel = post.status.charAt(0).toUpperCase() + post.status.slice(1);

      link.innerHTML =
        '<div class="fi-votes">' +
          '<div class="fi-votes-arrow">&#x25B2;</div>' +
          '<div class="fi-votes-count">' + post.votesCount + '</div>' +
        '</div>' +
        '<div class="fi-idea-body">' +
          '<div class="fi-idea-title">' + escapeHtml(post.title) + '</div>' +
          (post.description ? '<div class="fi-idea-desc">' + escapeHtml(truncate(post.description, 150)) + '</div>' : '') +
          '<div class="fi-idea-meta">' +
            '<span class="fi-status fi-status-' + statusClass + '">' + statusLabel + '</span>' +
            '<span class="fi-meta-item"><span class="fi-meta-icon">&#x1f4ac;</span> ' + post.commentsCount + '</span>' +
          '</div>' +
        '</div>';

      list.appendChild(link);
    });

    showState('list');
  }

  async function loadIdeas() {
    showState('loading');
    try {
      var currentProps = sdk.getProps();
      var posts = await sdk.connectors.execute({
        permalink: 'fider-list-posts',
        method: 'GET',
        queryParams: {
          view: currentProps.view_filter || 'most-wanted',
          limit: String(currentProps.max_ideas || 10)
        }
      });
      renderIdeas(posts);
    } catch (err) {
      $('#fi-error-msg').textContent = err.message || 'Could not load ideas. Please try again later.';
      showState('error');
    }
  }

  function openModal() { $('#fi-overlay').classList.add('fi-visible'); }
  function closeModal() {
    $('#fi-overlay').classList.remove('fi-visible');
    $('#fi-idea-title').value = '';
    $('#fi-idea-desc').value = '';
    $('#fi-post-btn').disabled = false;
    $('#fi-post-btn').textContent = 'Submit';
  }

  function showToast(msg) {
    var toast = $('#fi-toast');
    toast.textContent = msg;
    toast.classList.add('fi-visible');
    setTimeout(function () { toast.classList.remove('fi-visible'); }, 3000);
  }

  $('#fi-submit-btn').addEventListener('click', openModal);
  $('#fi-close-btn').addEventListener('click', closeModal);
  $('#fi-cancel-btn').addEventListener('click', closeModal);

  $('#fi-overlay').addEventListener('click', function (e) {
    if (e.target === $('#fi-overlay')) closeModal();
  });

  $('#fi-post-btn').addEventListener('click', async function () {
    var title = $('#fi-idea-title').value.trim();
    var description = $('#fi-idea-desc').value.trim();

    if (!title) {
      $('#fi-idea-title').focus();
      return;
    }

    var btn = $('#fi-post-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      await sdk.connectors.execute({
        permalink: 'fider-create-post',
        method: 'POST',
        body: JSON.stringify({ title: title, description: description })
      });
      closeModal();
      showToast('Idea submitted successfully!');
      loadIdeas();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Submit';
      showToast('Failed to submit: ' + (err.message || 'Unknown error'));
    }
  });

  loadIdeas();
})();
