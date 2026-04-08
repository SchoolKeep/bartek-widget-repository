var PORTAL_URL = 'https://bartek-gainsigh.fider.io';

var STATUS_MAP = {
  open: 'open',
  planned: 'planned',
  started: 'started',
  completed: 'completed',
  declined: 'declined',
  duplicate: 'duplicate'
};

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export async function init(sdk) {
  await sdk.whenReady();

  var serviceSDK = new window.WidgetServiceSDK();
  var props = sdk.getProps();

  function showState(state) {
    sdk.$('#fi-loading').style.display = state === 'loading' ? '' : 'none';
    sdk.$('#fi-error').style.display = state === 'error' ? '' : 'none';
    sdk.$('#fi-empty').style.display = state === 'empty' ? '' : 'none';
    sdk.$('#fi-list').style.display = state === 'list' ? '' : 'none';
  }

  function renderIdeas(posts) {
    var list = sdk.$('#fi-list');
    list.innerHTML = '';

    if (!posts || posts.length === 0) {
      showState('empty');
      return;
    }

    posts.forEach(function (post) {
      var link = document.createElement('a');
      link.className = 'fi-idea';
      link.href = PORTAL_URL + '/posts/' + post.number + '/' + post.slug;
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
      var posts = await serviceSDK.connectors.execute({
        permalink: 'fider-list-posts',
        method: 'GET',
        queryParams: {
          view: currentProps.view_filter || 'most-wanted',
          limit: String(currentProps.max_ideas || 10)
        }
      });
      renderIdeas(posts);
    } catch (err) {
      sdk.$('#fi-error-msg').textContent = err.message || 'Could not load ideas. Please try again later.';
      showState('error');
    }
  }

  function openModal() { sdk.$('#fi-overlay').classList.add('fi-visible'); }
  function closeModal() {
    sdk.$('#fi-overlay').classList.remove('fi-visible');
    sdk.$('#fi-idea-title').value = '';
    sdk.$('#fi-idea-desc').value = '';
    sdk.$('#fi-post-btn').disabled = false;
    sdk.$('#fi-post-btn').textContent = 'Submit';
  }

  function showToast(msg) {
    var toast = sdk.$('#fi-toast');
    toast.textContent = msg;
    toast.classList.add('fi-visible');
    setTimeout(function () { toast.classList.remove('fi-visible'); }, 3000);
  }

  sdk.$('#fi-submit-btn').addEventListener('click', openModal);
  sdk.$('#fi-close-btn').addEventListener('click', closeModal);
  sdk.$('#fi-cancel-btn').addEventListener('click', closeModal);

  sdk.$('#fi-overlay').addEventListener('click', function (e) {
    if (e.target === sdk.$('#fi-overlay')) closeModal();
  });

  sdk.$('#fi-post-btn').addEventListener('click', async function () {
    var title = sdk.$('#fi-idea-title').value.trim();
    var description = sdk.$('#fi-idea-desc').value.trim();

    if (!title) {
      sdk.$('#fi-idea-title').focus();
      return;
    }

    var btn = sdk.$('#fi-post-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      await serviceSDK.connectors.execute({
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

  sdk.on('propsChanged', function () {
    loadIdeas();
  });

  loadIdeas();
}
