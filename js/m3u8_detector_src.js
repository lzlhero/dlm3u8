javascript: (function() {
    var debugMode = true;

    function debug(msg) {
        if (debugMode) console.log('[M3U8 Detector] ' + msg)
    }

    function sendLink(url) {
        urlInput.value = url.split('#')[0];
    }

    function scanForM3u8(text) {
        if (!text || typeof text !== 'string') return;
        var urlRegex = /"(?:url|src|file)"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi;
        var match;
        while ((match = urlRegex.exec(text)) !== null) {
            if (match[1]) sendLink(match[1])
        }
        var directRegex = /(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/gi;
        while ((match = directRegex.exec(text)) !== null) {
            if (match[1]) sendLink(match[1])
        }
    }

    function checkVideo(video) {
        if (!video) return;
        if (video.src && video.src.indexOf('.m3u8') > -1) {
            sendLink(video.src)
        }
        var sources = video.querySelectorAll('source');
        for (var i = 0; i < sources.length; i++) {
            if (sources[i].src && sources[i].src.indexOf('.m3u8') > -1) {
                sendLink(sources[i].src)
            }
        }
        for (var attr in video.dataset) {
            if (typeof video.dataset[attr] === 'string' && video.dataset[attr].indexOf('.m3u8') > -1) {
                sendLink(video.dataset[attr])
            }
        }
    }

    function scanAllVideos() {
        debug('Scanning video elements');
        document.querySelectorAll('video').forEach(checkVideo)
    }

    function scanPageScripts() {
        debug('Scanning page scripts');
        document.querySelectorAll('script').forEach(function(script) {
            if (script.textContent) {
                scanForM3u8(script.textContent)
            }
        })
    }

    function deepScanPage() {
        debug('Deep scanning page');
        document.querySelectorAll('*').forEach(function(el) {
            for (var attr in el.dataset) {
                if (typeof el.dataset[attr] === 'string' && el.dataset[attr].indexOf('.m3u8') > -1) {
                    sendLink(el.dataset[attr])
                }
            } ['src', 'href', 'data', 'poster'].forEach(function(attr) {
                if (el[attr] && typeof el[attr] === 'string' && el[attr].indexOf('.m3u8') > -1) {
                    sendLink(el[attr])
                }
            })
        })
    }
    var originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (url && typeof url === 'string' && url.indexOf('.m3u8') > -1) {
            sendLink(url)
        }
        return originalOpen.apply(this, arguments)
    };
    var originalFetch = window.fetch;
    window.fetch = function(input) {
        try {
            var url = '';
            if (typeof input === 'string') {
                url = input
            } else if (input instanceof Request) {
                url = input.url
            }
            if (url && url.indexOf('.m3u8') > -1) {
                sendLink(url)
            }
        } catch (e) {
            debug('Error in fetch override: ' + e.message)
        }
        return originalFetch.apply(this, arguments)
    };
    try {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeName === 'VIDEO') {
                            checkVideo(node)
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('video').forEach(checkVideo)
                        }
                    })
                } else if (mutation.type === 'attributes') {
                    if (mutation.target.nodeName === 'VIDEO') {
                        checkVideo(mutation.target)
                    }
                }
            })
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src']
        });
        debug('DOM observer started')
    } catch (e) {
        debug('Error setting up observer: ' + e.message)
    }
    var indicator = document.createElement('div');
    indicator.style.cssText = 'position:fixed;top:10px;right:10px;padding:10px;background:rgba(0,123,255,0.8);color:white;border-radius:5px;z-index:9999;font-size:14px;';
    indicator.textContent = 'M3U8 Detector Active';
    document.body.appendChild(indicator);
    var scanButton = document.createElement('button');
    scanButton.textContent = 'Force Scan';
    scanButton.style.cssText = 'display:block;margin-top:5px;padding:3px 8px;background:#fff;color:#007bff;border:none;border-radius:3px;cursor:pointer;';
    scanButton.onclick = function() {
        scanAllVideos();
        scanPageScripts();
        deepScanPage()
    };
    indicator.appendChild(scanButton);
    var urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = 'Focus to Copy M3U8 URL';
    urlInput.style.cssText = 'display:block;margin-top:5px;padding:3px;background:#fff;color:#000;border:none;border-radius:3px;';
    urlInput.onfocus = function() {
        this.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(this.value);
        } else {
            document.execCommand('copy');
        }
    };
    indicator.appendChild(urlInput);
    scanAllVideos();
    scanPageScripts();
    setTimeout(deepScanPage, 2000);
    setTimeout(function() {
        indicator.style.opacity = '0.7'
    }, 30000);
    debug('M3U8 detector initialized')
})();
