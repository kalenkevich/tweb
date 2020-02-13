String.prototype.toHHMMSS = function() {
  let sec_num = parseInt(this, 10);
  let hours   = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  let seconds = sec_num - (hours * 3600) - (minutes * 60);
  
  if(hours   < 10) hours   = "0" + hours;
  if(minutes < 10) minutes = minutes;
  if(seconds < 10) seconds = "0" + seconds;
  return minutes + ':' + seconds;
}

function stylePlayer(player, video) {
  let skin = attachSkin(video.dataset.ckin);
  player.classList.add(skin);
  
  let overlay = video.dataset.overlay;
  addOverlay(player, overlay);
  
  let html = buildControls(skin);
  player.insertAdjacentHTML('beforeend', html);

  var stopAndScrubTimeout = 0;
  
  if(skin === 'default') {
    var progress = player.querySelector('.progress');;
    var progressBar = player.querySelector('.progress__filled');
    var toggle = player.querySelectorAll('.toggle');
    var fullScreenButton = player.querySelector('.fullscreen');
    var seek = player.querySelector('#seek');
    var timeElapsed = player.querySelector('#time-elapsed');
    var timeDuration = player.querySelector('#time-duration');
    seek.setAttribute('max', video.duration);
    timeDuration.innerHTML = String(video.duration | 0).toHHMMSS();
    
    toggle.forEach((button) => {
      return button.addEventListener('click', () => {
        togglePlay(video, player);
      });
    });
    
    video.addEventListener('click', function() {
      togglePlay(this, player);
    });
    
    video.addEventListener('play', function() {
      updateButton(this, toggle);
    });
    
    video.addEventListener('pause', function() {
      updateButton(this, toggle);
    });
    
    let mousedown = false;
    progress.addEventListener('mousemove', (e) => {
      return mousedown && scrub(e, video, progress);
    });
    progress.addEventListener('mousedown', (e) => {
      //console.log(video.currentTime);
      scrub(e, video, progress, progressBar);
      //Таймер для того, чтобы стопать видео, если зажал мышку и не отпустил клик
      stopAndScrubTimeout = setTimeout(function() {
        togglePlay(video, player, 1); 
      }, 150);
      
      return mousedown = true;
    });
    progress.addEventListener('mouseup', () => {
      clearTimeout(stopAndScrubTimeout);
      togglePlay(video, player, 0);
      return mousedown = false;
    });
    fullScreenButton.addEventListener('click', (e) => {
      return toggleFullScreen(player, fullScreenButton);
    });
    addListenerMulti(player, 'webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', (e) => {
      return onFullScreen(e, player);
    });
  }
  
  if(skin === 'circle') {
    let wrapper = document.createElement('div');
    wrapper.classList.add('circle-time-left');
    video.parentNode.insertBefore(wrapper, video);
    wrapper.innerHTML = '<div class="circle-time"></div><div class="iconVolume tgico-nosound"></div>';
    
    var circle = player.querySelector('.progress-ring__circle');
    var radius = circle.r.baseVal.value;
    var circumference = 2 * Math.PI * radius;
    var timeDuration = player.querySelector('.circle-time');
    var iconVolume = player.querySelector('.iconVolume');
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    circle.addEventListener('click', () => {
      togglePlay(video, player);
    });
    
    video.addEventListener('play', () => {
      iconVolume.style.display = 'none';
    });
    
    video.addEventListener('pause', () => {
      iconVolume.style.display = '';
    });
  }

  //Для хрома
  timeDuration.innerHTML = String(video.duration | 0).toHHMMSS();
  if(skin === 'default') seek.setAttribute('max', video.duration);
  //Для Opera / Safari / IE
  video.addEventListener('loadeddata', function() {
    timeDuration.innerHTML = String(video.duration | 0).toHHMMSS();
    if(skin === 'default') seek.setAttribute('max', video.duration);
  })
  
  video.addEventListener('timeupdate', function() {
    handleProgress(this, skin, timeDuration, circumference, circle, progressBar, seek, timeElapsed);
  });
}

function showControls(video) {
  video.setAttribute("controls", "controls");
}

function togglePlay(video, player, stop) {
  if(stop == 1) {
    video['pause']();
    player.classList.remove('is-playing');
    return;
  } else if(stop == 0) {
    video['play']();
    player.classList.add('is-playing');
    return;
  }
  
  let method = video.paused ? 'play' : 'pause';
  video[method]();
  video.paused ? player.classList.remove('is-playing') : player.classList.add('is-playing');
}

function updateButton(video, toggle) {
  let icon = video.paused ? 'tgico-play' : 'tgico-pause';
  toggle.forEach((button) => {
    button.classList.remove('tgico-play', 'tgico-pause');
    button.classList.add(icon);
  });
}

function handleProgress(video, skin, timeDuration, circumference, circle, progressBar, seek, timeElapsed) {
  let percent = video.currentTime / video.duration * 100;
  if(skin === 'default') {
    progressBar.style.width = percent + '%';
    seek.value = video.currentTime;
    timeElapsed.innerHTML = String(video.currentTime | 0).toHHMMSS();
  } else if(skin === 'circle') {
    let timeLeft = String((video.duration - video.currentTime) | 0).toHHMMSS();
    let offset = circumference - percent / 100 * circumference;
    circle.style.strokeDashoffset = offset;
    if(timeLeft != 0 | 0) timeDuration.innerHTML = timeLeft;
  }
}

function scrub(e, video, progress) {
  let scrubTime = e.offsetX / progress.offsetWidth * video.duration;
  video.currentTime = scrubTime;
}

export function wrapPlayer(video) {
  let wrapper = document.createElement('div');
  wrapper.classList.add('ckin__player');
    
  video.parentNode.insertBefore(wrapper, video);
  wrapper.appendChild(video);

  stylePlayer(wrapper, video);
}

function buildControls(skin) {
  let html = [];
  if(skin === 'default') {
    html.push('<button class="' + skin + '__button--big toggle tgico-largeplay" title="Toggle Play"></button>');
    html.push('<div class="' + skin + '__controls ckin__controls">');
    html.push('<div class="progress">',
    '<div class="progress__filled"></div><input class="seek" id="seek" value="0" min="0" type="range" step="0.1" max="0">',
    '</div>',
    '<div class="bottom-controls">',
    '<div class="left-controls"><button class="' + skin + '__button toggle tgico-play" title="Toggle Video"></button>',
    '<div class="time">',
    '<time id="time-elapsed">0:00</time>',
    '<span> / </span>',
    '<time id="time-duration">0:00</time>',
    '</div>',
    '</div>',
    '<div class="right-controls"><button class="' + skin + '__button fullscreen tgico-fullscreen" title="Full Screen"></button></div></div>');
    html.push('</div>');
  } else if(skin === 'circle') {
    html.push('<svg class="progress-ring" width="200px" height="200px">',
    '<circle class="progress-ring__circle" stroke="white" stroke-opacity="0.3" stroke-width="3.5" cx="100" cy="100" r="93" fill="transparent"/>',
    '</svg>');
  }
  
  return html.join('');
}

function attachSkin(skin) {
  console.log("skin: " + skin);
  if(typeof skin != 'undefined' && skin != '') {
    return skin;
  } else {
    return 'default';
  }
}

function addOverlay(player, overlay) {
  if(overlay == 1) {
    player.classList.add('ckin__overlay');
  } else {
    return;
  }
}

function toggleFullScreen(player, fullScreenButton) {
  // alternative standard method
  if(!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
    player.classList.add('ckin__fullscreen');
    
    if(player.requestFullscreen) {
      player.requestFullscreen();
    } else if(player.mozRequestFullScreen) {
      player.mozRequestFullScreen(); // Firefox
    } else if(player.webkitRequestFullscreen) {
      player.webkitRequestFullscreen(); // Chrome and Safari
    } else if(player.msRequestFullscreen) {
      player.msRequestFullscreen();
    }

    fullScreenButton.classList.remove('tgico-fullscreen');
    fullScreenButton.classList.add('tgico-smallscreen');
    fullScreenButton.setAttribute('title', 'Exit Full Screen');
  } else {
    player.classList.remove('ckin__fullscreen');
    
    if(document.cancelFullScreen) {
      document.cancelFullScreen();
    } else if(document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if(document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    } else if(document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    fullScreenButton.classList.remove('tgico-smallscreen');
    fullScreenButton.classList.add('tgico-fullscreen');
    fullScreenButton.setAttribute('title', 'Full Screen');
  }
}

function onFullScreen(e, player) {
  let isFullscreenNow = document.webkitFullscreenElement !== null;
  if(!isFullscreenNow) {
    player.classList.remove('ckin__fullscreen');

    /* let el = player.querySelector('.fullscreen');
    el.classList.remove('tgico-smallscreen');
    el.classList.add('tgico-fullscreen'); */
  } else {
    // player.querySelector('.fullscreen').innerHTML = iconExpand;
    
  }
}

function addListenerMulti(element, eventNames, listener) {
  let events = eventNames.split(' ');
  for (let i = 0, iLen = events.length; i < iLen; i++) {
    element.addEventListener(events[i], listener, false);
  }
}
