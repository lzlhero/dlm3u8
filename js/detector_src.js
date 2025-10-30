javascript: (function() {
  if (document.getElementById('m3u8-detector-panel')) return;

  var debugMode = true;
  function debug(msg) {
    if (debugMode) console.log('[M3U8 Detector] ' + msg);
  }

  var m3u8URL = '';
  function saveURL(url) {
    m3u8URL = url.split('#')[0];
    debug('URL: ' + m3u8URL);
    copyButton.className = 'animation';
    copyButton.disabled = false;
  }

  function checkVideo(video) {
    if (!video) return;
    if (video.src && /\.m3u8/i.test(video.src)) {
      saveURL(video.src);
    }
    var sources = video.querySelectorAll('source');
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].src && /\.m3u8/i.test(sources[i].src)) {
        saveURL(sources[i].src);
      }
    }
    for (var attr in video.dataset) {
      if (typeof video.dataset[attr] === 'string' && /\.m3u8/i.test(video.dataset[attr])) {
        saveURL(video.dataset[attr]);
      }
    }
  }

  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url && typeof url === 'string' && /\.m3u8$|\.m3u8\?/i.test(url)) {
      debug('XHR: ' + url);
      saveURL(url);
    }
    return originalOpen.apply(this, arguments);
  };

  var originalFetch = window.fetch;
  window.fetch = function(input) {
    try {
      var url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
      }
      if (url && /\.m3u8$|\.m3u8\?/i.test(url)) {
        debug('window.fetch: ' + url);
        saveURL(url);
      }
    } catch (e) {
      debug('Error in fetch override: ' + e.message);
    }
    return originalFetch.apply(this, arguments);
  };

  try {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeName === 'VIDEO') {
              checkVideo(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('video').forEach(checkVideo);
            }
          });
        } else if (mutation.type === 'attributes') {
          if (mutation.target.nodeName === 'VIDEO') {
            checkVideo(mutation.target);
          }
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src']
    });

    debug('DOM observer started');
  } catch (e) {
    debug('Error setting up observer: ' + e.message);
  }

  var style = document.createElement('style');
  style.textContent = `
    #m3u8-detector-panel {
      position:fixed;
      z-index:2147483647;
      top:10px;
      right:10px;
      padding:10px;
      border-radius:5px;
      background:#007bff;
      font-size:14px;
      opacity:0.9;
    }

    #m3u8-detector-panel button {
      display:block;
      padding:3px 8px;
      width:100%;
      color:#007bff;
      background:#fff;
      border:none;
      border-radius:3px;
      cursor:pointer;
      user-select:none;
    }

    @keyframes in-out {
      0%   { color:#7bbbff; background:#fff; }
      50%  { color:#fff; background:#7bbbff; }
      100% { color:#7bbbff; background:#fff; }
    }

    #m3u8-detector-panel button.animation {
      animation: in-out 1s ease-in-out 1;
    }

    #m3u8-detector-panel button:disabled {
      color:#838383;
      background:#ddd;
      cursor:not-allowed;
    }

    #m3u8-detector-panel button:enabled:active {
      color:#f00;
    }
  `;
  document.head.appendChild(style);

  var panel = document.createElement('div');
  panel.id = 'm3u8-detector-panel';
  document.body.appendChild(panel);

  var copyButton = document.createElement('button');
  copyButton.disabled = true;
  copyButton.textContent = 'Copy URL';
  copyButton.onanimationend = function() {
    this.className = '';
  };
  copyButton.onclick = function() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(m3u8URL);
    }
  };
  panel.appendChild(copyButton);

  debug('Before scanning video elements');
  document.querySelectorAll('video').forEach(checkVideo);
  debug('After scanning video elements');

  debug('M3U8 detector initialized');
})();
