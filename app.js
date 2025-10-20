const videoInput = document.getElementById('videoInput');
const audioInput = document.getElementById('audioInput');
const uploadStatus = document.getElementById('uploadStatus');
const previewCanvas = document.getElementById('previewCanvas');
const ctx = previewCanvas.getContext('2d');
const togglePlayButton = document.getElementById('togglePlay');
const playIcon = document.getElementById('playIcon');
const playButton = document.getElementById('play');
const pauseButton = document.getElementById('pause');
const rewindButton = document.getElementById('rewind');
const startRange = document.getElementById('startRange');
const endRange = document.getElementById('endRange');
const startLabel = document.getElementById('startLabel');
const endLabel = document.getElementById('endLabel');
const currentLabel = document.getElementById('currentLabel');
const speedRange = document.getElementById('speedRange');
const speedLabel = document.getElementById('speedLabel');
const overlayTextInput = document.getElementById('overlayText');
const overlayColorInput = document.getElementById('overlayColor');
const overlaySizeInput = document.getElementById('overlaySize');
const overlayXInput = document.getElementById('overlayX');
const overlayYInput = document.getElementById('overlayY');
const overlayShadowInput = document.getElementById('overlayShadow');
const overlayFontSelect = document.getElementById('overlayFont');
const filterSelect = document.getElementById('filterSelect');
const videoVolumeInput = document.getElementById('videoVolume');
const musicVolumeInput = document.getElementById('musicVolume');
const exportButton = document.getElementById('export');
const exportStatus = document.getElementById('exportStatus');
const downloadSection = document.getElementById('downloadSection');
const downloadLink = document.getElementById('downloadLink');
const clearButton = document.getElementById('clearProject');

const hiddenVideo = document.createElement('video');
hiddenVideo.crossOrigin = 'anonymous';
hiddenVideo.playsInline = true;
hiddenVideo.preload = 'metadata';
hiddenVideo.muted = false;
hiddenVideo.controls = false;

const backgroundAudio = new Audio();
backgroundAudio.crossOrigin = 'anonymous';
backgroundAudio.loop = true;
backgroundAudio.preload = 'metadata';
backgroundAudio.volume = parseFloat(musicVolumeInput.value);

let videoUrl = null;
let audioUrl = null;
let isVideoLoaded = false;
let isExporting = false;
let renderHandle;

const editorState = {
  filter: 'none',
  overlayText: '',
  overlayColor: '#ffffff',
  overlaySize: 42,
  overlayX: 50,
  overlayY: 85,
  overlayShadow: true,
  overlayFont: "'Inter', sans-serif",
};

if (!('MediaRecorder' in window) || !previewCanvas.captureStream) {
  exportButton.disabled = true;
  exportStatus.textContent = 'Tarayıcınız bu uygulamanın gerektirdiği medya API\'lerini desteklemiyor.';
}

videoInput.addEventListener('change', handleVideoUpload);
audioInput.addEventListener('change', handleAudioUpload);
playButton.addEventListener('click', () => playVideo(true));
pauseButton.addEventListener('click', pauseVideo);
togglePlayButton.addEventListener('click', () => {
  if (hiddenVideo.paused) {
    playVideo(false);
  } else {
    pauseVideo();
  }
});
rewindButton.addEventListener('click', () => {
  if (!isVideoLoaded) return;
  pauseVideo();
  hiddenVideo.currentTime = parseFloat(startRange.value);
  backgroundAudio.currentTime = 0;
  updateCurrentTimeLabel();
});
clearButton.addEventListener('click', resetProject);

startRange.addEventListener('input', () => {
  if (!isVideoLoaded) return;
  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);
  if (start >= end) {
    endRange.value = Math.min(start + 0.1, hiddenVideo.duration).toFixed(2);
  }
  updateRangeLabels();
});

endRange.addEventListener('input', () => {
  if (!isVideoLoaded) return;
  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);
  if (end <= start) {
    startRange.value = Math.max(end - 0.1, 0).toFixed(2);
  }
  updateRangeLabels();
});

speedRange.addEventListener('input', () => {
  speedLabel.textContent = `${Number(speedRange.value).toFixed(2)}x`;
  hiddenVideo.playbackRate = parseFloat(speedRange.value);
});

overlayTextInput.addEventListener('input', () => {
  editorState.overlayText = overlayTextInput.value;
});

overlayColorInput.addEventListener('input', () => {
  editorState.overlayColor = overlayColorInput.value;
});

overlaySizeInput.addEventListener('input', () => {
  editorState.overlaySize = parseInt(overlaySizeInput.value, 10);
});

overlayXInput.addEventListener('input', () => {
  editorState.overlayX = parseInt(overlayXInput.value, 10);
});

overlayYInput.addEventListener('input', () => {
  editorState.overlayY = parseInt(overlayYInput.value, 10);
});

overlayShadowInput.addEventListener('change', () => {
  editorState.overlayShadow = overlayShadowInput.checked;
});

overlayFontSelect.addEventListener('change', () => {
  editorState.overlayFont = overlayFontSelect.value;
});

filterSelect.addEventListener('change', () => {
  editorState.filter = filterSelect.value;
});

videoVolumeInput.addEventListener('input', () => {
  hiddenVideo.volume = parseFloat(videoVolumeInput.value);
});

musicVolumeInput.addEventListener('input', () => {
  backgroundAudio.volume = parseFloat(musicVolumeInput.value);
});

hiddenVideo.addEventListener('loadedmetadata', () => {
  isVideoLoaded = true;
  previewCanvas.width = hiddenVideo.videoWidth || 1280;
  previewCanvas.height = hiddenVideo.videoHeight || 720;
  startRange.max = endRange.max = hiddenVideo.duration.toFixed(2);
  startRange.value = '0';
  endRange.value = hiddenVideo.duration.toFixed(2);
  updateRangeLabels();
  updateCurrentTimeLabel();
  hiddenVideo.currentTime = 0;
  hiddenVideo.volume = parseFloat(videoVolumeInput.value);
  uploadStatus.textContent = `Yüklendi: ${formatFileSize(videoInput.files?.[0]?.size || 0)} | Süre: ${formatTime(hiddenVideo.duration)}`;
});

  hiddenVideo.addEventListener('timeupdate', () => {
    if (!isVideoLoaded || isExporting) return;
    const end = parseFloat(endRange.value);
    if (hiddenVideo.currentTime >= end) {
      hiddenVideo.pause();
      hiddenVideo.currentTime = parseFloat(startRange.value);
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
    }
    updateCurrentTimeLabel();
  });

hiddenVideo.addEventListener('play', () => {
  playIcon.textContent = '⏸️';
});

hiddenVideo.addEventListener('pause', () => {
  playIcon.textContent = '▶️';
});

exportButton.addEventListener('click', () => {
  if (isExporting) return;
  exportVideo().catch((error) => {
    console.error(error);
    exportStatus.textContent = `Dışa aktarma başarısız oldu: ${error.message}`;
    exportButton.disabled = false;
    isExporting = false;
  });
});

function handleVideoUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith('video/')) {
    uploadStatus.textContent = 'Lütfen geçerli bir video dosyası seçin.';
    return;
  }

  if (videoUrl) {
    URL.revokeObjectURL(videoUrl);
  }

  videoUrl = URL.createObjectURL(file);
  hiddenVideo.src = videoUrl;
  hiddenVideo.load();
  pauseVideo();
  backgroundAudio.pause();
  backgroundAudio.currentTime = 0;
  downloadSection.hidden = true;
  exportStatus.textContent = '';
  uploadStatus.textContent = 'Video yükleniyor...';
}

function handleAudioUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    audioUrl && URL.revokeObjectURL(audioUrl);
    audioUrl = null;
    backgroundAudio.pause();
    backgroundAudio.removeAttribute('src');
    uploadStatus.textContent = 'Arka plan müziği temizlendi.';
    return;
  }

  if (!file.type.startsWith('audio/')) {
    uploadStatus.textContent = 'Lütfen geçerli bir ses dosyası seçin.';
    return;
  }

  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
  }

  audioUrl = URL.createObjectURL(file);
  backgroundAudio.src = audioUrl;
  backgroundAudio.currentTime = 0;
  backgroundAudio.volume = parseFloat(musicVolumeInput.value);
  backgroundAudio.load();
  uploadStatus.textContent = 'Arka plan müziği hazır.';
}

function playVideo(forceFromStart) {
  if (!isVideoLoaded) return;
  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);

  if (forceFromStart || hiddenVideo.currentTime < start || hiddenVideo.currentTime >= end) {
    hiddenVideo.currentTime = start;
    backgroundAudio.currentTime = 0;
  }

  hiddenVideo.playbackRate = parseFloat(speedRange.value);
  hiddenVideo.volume = parseFloat(videoVolumeInput.value);
  hiddenVideo.muted = false;

  if (audioUrl) {
    backgroundAudio.volume = parseFloat(musicVolumeInput.value);
    if (Math.abs(hiddenVideo.currentTime - start) < 0.05) {
      backgroundAudio.currentTime = 0;
    }
    backgroundAudio.play().catch(() => {
      /* autoplay engeli */
    });
  }

  hiddenVideo.play().catch(() => {
    uploadStatus.textContent = 'Video oynatılırken bir hata oluştu.';
  });
}

function pauseVideo() {
  hiddenVideo.pause();
  backgroundAudio.pause();
}

function resetProject() {
  pauseVideo();
  if (videoUrl) {
    URL.revokeObjectURL(videoUrl);
  }
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
  }
  videoUrl = null;
  audioUrl = null;
  hiddenVideo.removeAttribute('src');
  backgroundAudio.removeAttribute('src');
  videoInput.value = '';
  audioInput.value = '';
  isVideoLoaded = false;
  editorState.overlayText = '';
  overlayTextInput.value = '';
  overlayColorInput.value = '#ffffff';
  overlaySizeInput.value = 42;
  overlayXInput.value = 50;
  overlayYInput.value = 85;
  overlayShadowInput.checked = true;
  overlayFontSelect.value = "'Inter', sans-serif";
  filterSelect.value = 'none';
  videoVolumeInput.value = 1;
  musicVolumeInput.value = 0.6;
  startRange.value = '0';
  endRange.value = '0';
  startRange.max = '0';
  endRange.max = '0';
  updateRangeLabels();
  updateCurrentTimeLabel();
  uploadStatus.textContent = 'Yeni bir proje başlatıldı.';
  exportStatus.textContent = '';
  downloadSection.hidden = true;
}

function updateRangeLabels() {
  const start = parseFloat(startRange.value) || 0;
  const end = parseFloat(endRange.value) || 0;
  startLabel.textContent = `${formatTime(start)}`;
  endLabel.textContent = `${formatTime(end)}`;
}

function updateCurrentTimeLabel() {
  currentLabel.textContent = `${formatTime(hiddenVideo.currentTime || 0)}`;
}

function formatTime(value) {
  if (!Number.isFinite(value)) return '0.00s';
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function drawOverlay() {
  if (!editorState.overlayText.trim()) return;

  ctx.save();
  ctx.fillStyle = editorState.overlayColor;
  ctx.font = `${editorState.overlaySize}px ${editorState.overlayFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const x = (editorState.overlayX / 100) * previewCanvas.width;
  const y = (editorState.overlayY / 100) * previewCanvas.height;

  if (editorState.overlayShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  }

  const lines = editorState.overlayText.split(/\n+/);
  const lineHeight = editorState.overlaySize * 1.2;
  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, x, y + offset);
  });

  ctx.restore();
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  if (isVideoLoaded && hiddenVideo.readyState >= 2) {
    ctx.filter = editorState.filter;
    ctx.drawImage(hiddenVideo, 0, 0, previewCanvas.width, previewCanvas.height);
    ctx.filter = 'none';
  } else {
    const gradient = ctx.createLinearGradient(0, 0, previewCanvas.width, previewCanvas.height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    gradient.addColorStop(1, 'rgba(14, 116, 144, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
    ctx.font = "32px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Başlamak için video yükleyin', previewCanvas.width / 2, previewCanvas.height / 2);
  }

  drawOverlay();
  ctx.restore();
  renderHandle = requestAnimationFrame(render);
}

render();

async function exportVideo() {
  if (!isVideoLoaded) {
    exportStatus.textContent = 'Önce bir video yükleyin.';
    return;
  }

  if (!previewCanvas.captureStream) {
    exportStatus.textContent = 'Tarayıcınız dışa aktarmayı desteklemiyor.';
    return;
  }

  const start = parseFloat(startRange.value);
  const end = parseFloat(endRange.value);
  const playbackRate = parseFloat(speedRange.value);
  const duration = Math.max(end - start, 0);

  if (duration < 0.1) {
    exportStatus.textContent = 'Lütfen daha uzun bir aralık seçin.';
    return;
  }

  pauseVideo();
  isExporting = true;
  exportButton.disabled = true;
  exportStatus.textContent = 'Dışa aktarma hazırlanıyor...';
  downloadSection.hidden = true;

  await seekVideo(hiddenVideo, start);
  hiddenVideo.playbackRate = playbackRate;

  const fps = 30;
  const canvasStream = previewCanvas.captureStream(fps);
  const finalStream = new MediaStream();
  canvasStream.getVideoTracks().forEach((track) => finalStream.addTrack(track));

  let audioContext = null;
  let destination = null;
  let exportMusic = null;
  let exportRecorder = null;
  const cleanups = [];

  try {
    if (typeof window.AudioContext === 'function' || typeof window.webkitAudioContext === 'function') {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      destination = audioContext.createMediaStreamDestination();

      const capture = hiddenVideo.captureStream?.() || hiddenVideo.mozCaptureStream?.();
      if (capture && capture.getAudioTracks().length) {
        const audioStream = new MediaStream();
        capture.getAudioTracks().forEach((track) => audioStream.addTrack(track));
        const videoSource = audioContext.createMediaStreamSource(audioStream);
        const videoGain = audioContext.createGain();
        videoGain.gain.value = parseFloat(videoVolumeInput.value);
        videoSource.connect(videoGain).connect(destination);
        cleanups.push(() => videoGain.disconnect());
      }

      if (audioUrl) {
        exportMusic = new Audio(audioUrl);
        exportMusic.crossOrigin = 'anonymous';
        exportMusic.loop = false;
        exportMusic.volume = parseFloat(musicVolumeInput.value);
        const musicSource = audioContext.createMediaElementSource(exportMusic);
        const musicGain = audioContext.createGain();
        musicGain.gain.value = parseFloat(musicVolumeInput.value);
        musicSource.connect(musicGain).connect(destination);
        cleanups.push(() => {
          musicGain.disconnect();
          musicSource.disconnect();
          exportMusic.pause();
        });
      }

      if (destination.stream.getAudioTracks().length) {
        destination.stream.getAudioTracks().forEach((track) => finalStream.addTrack(track));
      }
    }
  } catch (error) {
    console.warn('Ses işleme başlatılamadı:', error);
    exportStatus.textContent = 'Ses karıştırma devre dışı. Yalnızca görüntü kaydedilecek.';
  }

  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm'
  ];

  let recorderOptions = {};
  let selectedMimeType = '';
  for (const candidate of mimeCandidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      recorderOptions.mimeType = candidate;
      selectedMimeType = candidate;
      break;
    }
  }

  const recordedChunks = [];
  try {
    exportRecorder = new MediaRecorder(finalStream, recorderOptions);
  } catch (error) {
    console.warn('Seçilen mime tipi kullanılamadı, varsayılan kullanılacak.', error);
    exportRecorder = new MediaRecorder(finalStream);
    selectedMimeType = exportRecorder.mimeType || 'video/webm';
  }

  exportStatus.textContent = 'Dışa aktarılıyor... %0';
  const exportStart = performance.now();
  const effectiveDuration = duration / playbackRate;

  exportRecorder.ondataavailable = (event) => {
    if (event.data?.size) {
      recordedChunks.push(event.data);
    }
  };

  const stopPromise = new Promise((resolve, reject) => {
    exportRecorder.onerror = (event) => {
      reject(event.error);
    };
    exportRecorder.onstop = () => {
      resolve();
    };
  });

  exportRecorder.start();

  const progressLoop = () => {
    if (!isExporting) return;
    const elapsed = (performance.now() - exportStart) / 1000;
    const progress = Math.min(1, elapsed / Math.max(effectiveDuration, 0.1));
    exportStatus.textContent = `Dışa aktarılıyor... %${Math.round(progress * 100)}`;
    if (progress < 1) {
      requestAnimationFrame(progressLoop);
    }
  };
  requestAnimationFrame(progressLoop);

  try {
    await hiddenVideo.play();
    if (exportMusic) {
      exportMusic.currentTime = 0;
      await exportMusic.play().catch(() => {
        /* müzik oynatılamadı */
      });
    }
  } catch (error) {
    console.warn('Oynatma başlatılamadı:', error);
  }

  const stopTimeout = setTimeout(() => {
    if (isExporting) {
      exportRecorder.stop();
    }
  }, Math.max(effectiveDuration * 1000 + 150, 500));

  await stopPromise;
  clearTimeout(stopTimeout);

  hiddenVideo.pause();
  hiddenVideo.currentTime = start;
  updateCurrentTimeLabel();
  if (exportMusic) {
    exportMusic.pause();
    exportMusic.currentTime = 0;
  }

  const blob = new Blob(recordedChunks, { type: selectedMimeType || 'video/webm' });
  const downloadUrl = URL.createObjectURL(blob);
  if (downloadLink.href && downloadLink.href.startsWith('blob:')) {
    URL.revokeObjectURL(downloadLink.href);
  }
  downloadLink.href = downloadUrl;
  downloadLink.download = `akal-montaj-${Date.now()}.webm`;
  downloadSection.hidden = false;
  exportStatus.textContent = 'Dışa aktarma tamamlandı!';

  if (audioContext) {
    try {
      await audioContext.close();
    } catch (error) {
      console.warn('Ses oturumu kapatılamadı:', error);
    }
  }
  cleanups.forEach((cleanup) => {
    try {
      cleanup();
    } catch (error) {
      console.warn('Temizlik başarısız oldu', error);
    }
  });

  isExporting = false;
  exportButton.disabled = false;
}

function seekVideo(video, time) {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.01) {
      resolve();
      return;
    }
    const seekHandler = () => {
      video.removeEventListener('seeked', seekHandler);
      resolve();
    };
    video.addEventListener('seeked', seekHandler, { once: true });
    video.currentTime = time;
  });
}

window.addEventListener('beforeunload', () => {
  if (videoUrl) URL.revokeObjectURL(videoUrl);
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  if (renderHandle) cancelAnimationFrame(renderHandle);
});
