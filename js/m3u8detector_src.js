// Copyright (c) 2025 lzlhero
// Licensed under the GNU General Public License v3.0 (GPL-3.0)

javascript: (function init() {

if (window.__setM3U8URL__) return;

// debug helper
var debugMode = true;
var log = console.log;
function debug(msg) {
  if (debugMode) {
    log('[M3U8 Detector] [' + location.href + '] ' + msg);
  }
}

// set m3u8 url gobal function
var m3u8URL = '';
var copyButton;
window.__setM3U8URL__ = function(url) {
  if (window.parent === window.self) {
    url = url.split('#')[0];
    if (m3u8URL === url) return;

    debug('Set URL: ' + url);
    m3u8URL = url;

    // animate copy button
    if (copyButton) {
      copyButton.className = 'animation';
      copyButton.disabled = false;
    }
  } else {
    window.parent.__setM3U8URL__(url);
  }
};

// inject script to window
function injectScript(iframe) {
  var win = iframe.contentWindow;
  try { win.eval; } catch (e) { return; }

  debug('Inject script to iframe\'s window');
  win.eval('(' + init.toString() + ')();');
}

// check video node self, children and dataset
function checkVideo(video) {
  if (!video) return;
  if (video.src && /\.m3u8/i.test(video.src)) {
    debug('video.src: ' + video.src);
    __setM3U8URL__(video.src);
  }
  var sources = video.querySelectorAll('source');
  for (var i = 0; i < sources.length; i++) {
    if (sources[i].src && /\.m3u8/i.test(sources[i].src)) {
      debug('video>source[' + i + '].src: ' + sources[i].src);
      __setM3U8URL__(sources[i].src);
    }
  }
  for (var attr in video.dataset) {
    if (typeof video.dataset[attr] === 'string' && /\.m3u8/i.test(video.dataset[attr])) {
      debug('video.dataset[' + attr + ']: ' + video.dataset[attr]);
      __setM3U8URL__(video.dataset[attr]);
    }
  }
}

// override gobal xhr open method
var originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
  if (url && typeof url === 'string' && /\.m3u8$|\.m3u8\?/i.test(url)) {
    debug('xhr.open: ' + url);
    __setM3U8URL__(url);
  }
  return originalOpen.apply(this, arguments);
};
debug('xhr.open() has been overridden');

// override gobal fetch method
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
      debug('fetch: ' + url);
      __setM3U8URL__(url);
    }
  } catch (e) {
    debug('Error in fetch override: ' + e.message);
  }
  return originalFetch.apply(this, arguments);
};
debug('fetch() has been overridden');

// create detector UI
function createUI() {
  var style = document.createElement('style');
  style.textContent = `
    #m3u8-detector-panel {
      position: fixed;
      z-index: 2147483647;
      top: 10px;
      right: 10px;
      padding: 5px;
      border-radius: 5px;
      background: rgba(0, 123, 255, 0.7);
    }

    #m3u8-detector-panel button {
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: content-box;
      padding: 5px;
      height: 14px;
      font-size: 14px;
      border: none;
      border-radius: 3px;
      user-select: none;
      color: #007bff;
      background: #fff;
      cursor: pointer;
    }

    #m3u8-detector-panel button:disabled {
      color: #777;
      background: #b0b0b0;
      cursor: not-allowed;
    }

    #m3u8-detector-panel button:enabled:active {
      color: #f00;
    }

    @keyframes in-out {
      0%, 100% {
        color: #7bbbff;
        background: #fff;
      }

      50% {
        color: #fff;
        background: #7bbbff;
      }
    }

    #m3u8-detector-panel button.animation {
      animation: in-out 1s ease-in-out 1;
    }
  `;
  document.head.appendChild(style);

  var panel = document.createElement('div');
  panel.id = 'm3u8-detector-panel';
  document.body.appendChild(panel);

  copyButton = document.createElement('button');
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

  debug('Detector UI has created');
}

// dom ready callback
var isReady = false;
function domReady() {
  if (isReady) return;
  isReady = true;

  // create detector UI
  if (window.parent === window.self) {
    createUI();
  }

  // observe dom tree changes
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeName === 'IFRAME') {
            debug('iframe has been added');
            injectScript(node);
          } else if (node.nodeName === 'VIDEO') {
            checkVideo(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video').forEach(checkVideo);
          }
        });
      } else if (mutation.type === 'attributes') {
        if (mutation.target.nodeName === 'IFRAME' && mutation.attributeName === 'src') {
          debug('iframe\'s src has changed');
          mutation.target.contentWindow.addEventListener('unload', function() {
            setTimeout(function() {
              injectScript(mutation.target);
            }, 0);
          });
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

  // check all video elements
  var videos = document.querySelectorAll('video');
  debug('Found video elements: ' + videos.length);
  videos.forEach(checkVideo);

  // inject script to all iframe elements
  var iframes = document.querySelectorAll('iframe');
  debug('Found iframe elements: ' + iframes.length);
  iframes.forEach(injectScript);
}

// exec dom ready callback
if (document.readyState === 'loading') {
  document.addEventListener('readystatechange', domReady);
} else {
  domReady();
}

})();
