javascript: (function() {

function init() {
  if (window.saveM3U8DetectorURL) return;

  var debugMode = true;
  function debug(msg) {
    if (debugMode) console.log('[M3U8 Detector] ' + msg);
  }

  var m3u8URL = '';
  window.saveM3U8DetectorURL = function(url) {
    if (window.parent === window.self) {
      m3u8URL = url.split('#')[0];
      debug('URL: ' + m3u8URL);
      copyButton.className = 'animation';
      copyButton.disabled = false;
    } else {
      window.parent.saveM3U8DetectorURL(url);
    }
  };

  function checkVideo(video) {
    if (!video) return;
    if (video.src && /\.m3u8/i.test(video.src)) {
      saveM3U8DetectorURL(video.src);
    }
    var sources = video.querySelectorAll('source');
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].src && /\.m3u8/i.test(sources[i].src)) {
        saveM3U8DetectorURL(sources[i].src);
      }
    }
    for (var attr in video.dataset) {
      if (typeof video.dataset[attr] === 'string' && /\.m3u8/i.test(video.dataset[attr])) {
        saveM3U8DetectorURL(video.dataset[attr]);
      }
    }
  }

  function isAccessible(win) {
    try {
      win.document;
      return true;
    } catch (e) {
      return false;
    }
  }

  function appendScript(doc) {
    var script = doc.createElement('script');
    script.textContent = `(function(){${init.toString()}init();})();`;
    doc.head.appendChild(script);
  }

  function injectScript(iframe) {
    var win = iframe.contentWindow;
    if (!isAccessible(win)) return;

    var doc = win.document;
    if (doc.readyState === 'loading') {
      doc.addEventListener("DOMContentLoaded", function() {
        appendScript(doc);
      });
    } else {
      appendScript(doc);
    }
  }

  var originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url && typeof url === 'string' && /\.m3u8$|\.m3u8\?/i.test(url)) {
      debug('XHR: ' + url);
      saveM3U8DetectorURL(url);
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
        saveM3U8DetectorURL(url);
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
            if (node.nodeName === 'IFRAME') {
              injectScript(node);
            } else if (node.nodeName === 'VIDEO') {
              checkVideo(node);
            } else if (node.querySelectorAll) {
              node.querySelectorAll('video').forEach(checkVideo);
            }
          });
        } else if (mutation.type === 'attributes') {
          if (mutation.target.nodeName === 'IFRAME' && mutation.attributeName === 'src') {
            injectScript(mutation.target);
          } else if (mutation.target.nodeName === 'VIDEO') {
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

  debug('Before scanning video elements');
  document.querySelectorAll('video').forEach(checkVideo);
  debug('After scanning video elements');

  document.querySelectorAll('iframe').forEach(injectScript);
  debug('Inject script to iframe elements');

  if (window.parent !== window.self) return;

  var style = document.createElement('style');
  style.textContent = `
    #m3u8-detector-panel {
      position:fixed;
      z-index:2147483647;
      top:10px;
      right:10px;
      padding:5px;
      border-radius:5px;
      background:#007bff;
      opacity:0.9;
    }

    #m3u8-detector-panel button {
      display:flex;
      box-sizing:content-box;
      justify-content:center;
      align-items:center;
      padding:5px;
      height:14px;
      font-size:14px;
      border:none;
      border-radius:3px;
      user-select:none;
      color:#007bff;
      background:#fff;
      cursor:pointer;
    }

    #m3u8-detector-panel button:disabled {
      color:#838383;
      background:#ddd;
      cursor:not-allowed;
    }

    #m3u8-detector-panel button:enabled:active {
      color:#f00;
    }

    @keyframes in-out {
      0%   { color:#7bbbff; background:#fff; }
      50%  { color:#fff; background:#7bbbff; }
      100% { color:#7bbbff; background:#fff; }
    }

    #m3u8-detector-panel button.animation {
      animation: in-out 1s ease-in-out 1;
    }
  `;
  document.head.appendChild(style);

  var panel = document.createElement('div');
  panel.id = 'm3u8-detector-panel';
  document.body.appendChild(panel);

  var copyButton = document.createElement('button');
  copyButton.disabled = true;
  copyButton.textContent = 'Copy';
  copyButton.onanimationend = function() {
    this.className = '';
  };
  copyButton.onclick = function() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(m3u8URL);
    }
  };
  panel.appendChild(copyButton);

  debug('UI created');
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

})();
