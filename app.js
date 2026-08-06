(() => {
  "use strict";

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;
  const AUDIO_PATH = "./day-dreaming-audio.mp3";
  const VIDEO_DURATION = 15;

  const FONT_FAMILIES = Object.freeze({
    serif: '"Cormorant Garamond", Georgia, serif',
    sans: '"Inter", Arial, sans-serif'
  });

  const VISIONS = Object.freeze({
    SUNSET: "Watching the sunset in comfortable silence every night",
    KITCHEN: "Slow dancing in a cozy kitchen 50 years from today",
    TRAVEL: "Traveling the world side-by-side, never losing the initial spark",
    HAVEN: "Tucked away in a quiet haven, completely hidden from the rest of the world"
  });

  const SHORT_VISIONS = Object.freeze({
    [VISIONS.SUNSET]: "Watching sunsets in comfortable silence",
    [VISIONS.KITCHEN]: "Slow dancing in our kitchen, 50 years from now",
    [VISIONS.TRAVEL]: "Traveling the world side-by-side",
    [VISIONS.HAVEN]: "Hidden away together in a quiet haven"
  });

  const IMAGE_PATHS = Object.freeze({
    romantic: "./chirai-romantic.jpg",
    sanctuary: "./chirai-sanctuary.jpg",
    adventurer: "./chirai-adventurer.jpg",
    daydreamer: "./chirai-daydreamer.jpg"
  });

  const ARCHETYPES = Object.freeze({
    ROMANTIC: {
      key: "romantic",
      name: "THE LIFELONG ROMANTIC",
      tagline: "Day Dreaming, seeing visions of us in a life far from here",
      palette: {
        base: "#0F1123",
        accent: "#D8B4F8",
        quote: "#F4A261",
        imageTint: "rgba(15,17,35,0.54)",
        overlayTop: "rgba(10,12,24,0.58)",
        overlayBottom: "rgba(7,9,18,0.86)",
        titlePanelStroke: "rgba(216,180,248,0.18)",
        glowA: "rgba(216,180,248,0.34)",
        glowB: "rgba(245,179,207,0.22)",
        glowC: "rgba(244,162,97,0.14)"
      }
    },
    SANCTUARY: {
      key: "sanctuary",
      name: "THE SANCTUARY SEEKER",
      tagline: "Day Dreaming, seeing visions of us in the house on a hill",
      palette: {
        base: "#0C1021",
        accent: "#D8B4F8",
        quote: "#EFC284",
        imageTint: "rgba(8,12,22,0.62)",
        overlayTop: "rgba(8,12,25,0.66)",
        overlayBottom: "rgba(7,10,18,0.88)",
        titlePanelStroke: "rgba(153,185,247,0.16)",
        glowA: "rgba(153,185,247,0.24)",
        glowB: "rgba(216,180,248,0.18)",
        glowC: "rgba(244,162,97,0.08)"
      }
    },
    ADVENTURER: {
      key: "adventurer",
      name: "THE ETERNAL ADVENTURER",
      tagline: "I come to realise, that it was all part of the plan",
      palette: {
        base: "#10142A",
        accent: "#F4A261",
        quote: "#F7D38E",
        imageTint: "rgba(16,20,42,0.54)",
        overlayTop: "rgba(13,18,34,0.58)",
        overlayBottom: "rgba(8,10,18,0.84)",
        titlePanelStroke: "rgba(244,162,97,0.18)",
        glowA: "rgba(244,162,97,0.28)",
        glowB: "rgba(216,180,248,0.16)",
        glowC: "rgba(255,214,136,0.10)"
      }
    },
    DAYDREAMER: {
      key: "daydreamer",
      name: "THE DAYDREAMER",
      tagline: "Day Dreaming, seeing visions of us",
      palette: {
        base: "#0E1124",
        accent: "#D8B4F8",
        quote: "#F4A261",
        imageTint: "rgba(14,17,36,0.56)",
        overlayTop: "rgba(10,13,24,0.60)",
        overlayBottom: "rgba(7,9,18,0.86)",
        titlePanelStroke: "rgba(216,180,248,0.16)",
        glowA: "rgba(216,180,248,0.28)",
        glowB: "rgba(244,162,97,0.14)",
        glowC: "rgba(255,255,255,0.05)"
      }
    }
  });

  const form = document.querySelector("#romantic-profile-form");
  const formStatus = document.querySelector("#form-status");
  const canvas = document.querySelector("#story-canvas");
  const preview = document.querySelector("#story-preview");
  const dialog = document.querySelector("#result-dialog");
  const closeDialogButton = document.querySelector("#close-dialog-button");
  const downloadButton = document.querySelector("#download-button");
  const downloadVideoButton = document.querySelector("#download-video-button");
  const shareButton = document.querySelector("#share-button");
  const editAnswersButton = document.querySelector("#edit-answers-button");
  const shareStatus = document.querySelector("#share-status");
  const audioElement = document.querySelector("#page-audio");
  const audioToggle = document.querySelector("#audio-toggle");

  if (!form || !formStatus || !canvas || !preview || !dialog || !closeDialogButton ||
      !downloadButton || !downloadVideoButton || !shareButton || !editAnswersButton ||
      !shareStatus || !audioElement || !audioToggle) {
    console.error("The CHIRAI Day Dreaming app could not initialise.");
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    formStatus.textContent = "Your browser does not support story image generation.";
    return;
  }

  let generatedDataUrl = "";
  let generatedBlob = null;
  let generatedMp4Blob = null;
  let currentArchetype = ARCHETYPES.DAYDREAMER;
  let ffmpegInstance = null;
  const imageCache = new Map();

  function getArchetype(loveLanguage, foreverVision) {
    const romanticLanguages = new Set(["Quality time", "Words of affirmation"]);
    const sanctuaryLanguages = new Set(["Physical touch", "Acts of service"]);

    if (foreverVision === VISIONS.KITCHEN || (foreverVision === VISIONS.SUNSET && romanticLanguages.has(loveLanguage))) {
      return ARCHETYPES.ROMANTIC;
    }
    if (foreverVision === VISIONS.HAVEN || (foreverVision === VISIONS.SUNSET && sanctuaryLanguages.has(loveLanguage))) {
      return ARCHETYPES.SANCTUARY;
    }
    if (foreverVision === VISIONS.TRAVEL) {
      return ARCHETYPES.ADVENTURER;
    }
    return ARCHETYPES.DAYDREAMER;
  }

  function getAnswers() {
    const data = new FormData(form);
    return {
      loveLanguage: String(data.get("loveLanguage") || ""),
      mindset: String(data.get("mindset") || ""),
      foreverVision: String(data.get("foreverVision") || "")
    };
  }

  async function loadCanvasFonts() {
    if (!document.fonts || typeof document.fonts.load !== "function") return;
    await Promise.all([
      document.fonts.load(`700 100px ${FONT_FAMILIES.serif}`),
      document.fonts.load(`italic 600 66px ${FONT_FAMILIES.serif}`),
      document.fonts.load(`700 31px ${FONT_FAMILIES.sans}`),
      document.fonts.ready
    ]);
  }

  function loadImage(path) {
    if (imageCache.has(path)) return Promise.resolve(imageCache.get(path));
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => { imageCache.set(path, image); resolve(image); };
      image.onerror = () => reject(new Error(`The image ${path} could not be loaded.`));
      image.src = path;
    });
  }

  async function loadArchetypeImage(archetypeKey) {
    const path = IMAGE_PATHS[archetypeKey];
    if (!path) throw new Error(`No image mapped for archetype: ${archetypeKey}`);
    return loadImage(path);
  }

  function updateAudioButton() {
    if (audioElement.paused) {
      audioToggle.textContent = "Audio Off";
      audioToggle.setAttribute("aria-pressed", "false");
    } else {
      audioToggle.textContent = "Audio On";
      audioToggle.setAttribute("aria-pressed", "true");
    }
  }

  async function attemptAudioPlayback() {
    try {
      audioElement.volume = 1;
      await audioElement.play();
      updateAudioButton();
      return true;
    } catch (error) {
      updateAudioButton();
      return false;
    }
  }

  function queueAudioResume() {
    const resume = async () => {
      await attemptAudioPlayback();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  }

  audioToggle.addEventListener("click", async () => {
    if (audioElement.paused) {
      await attemptAudioPlayback();
    } else {
      audioElement.pause();
      updateAudioButton();
    }
  });

  window.addEventListener("load", async () => {
    updateAudioButton();
    const started = await attemptAudioPlayback();
    if (!started) queueAudioResume();
  });

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.trim().split(/\s+/);
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (!currentLine || ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function drawCenteredLines(ctx, lines, centerX, startY, lineHeight) {
    lines.forEach((line, index) => ctx.fillText(line, centerX, startY + index * lineHeight));
  }

  function drawImageCover(ctx, image, dx, dy, dWidth, dHeight) {
    const imageRatio = image.width / image.height;
    const destinationRatio = dWidth / dHeight;
    let sx = 0, sy = 0, sWidth = image.width, sHeight = image.height;
    if (imageRatio > destinationRatio) {
      sWidth = image.height * destinationRatio;
      sx = (image.width - sWidth) / 2;
    } else {
      sHeight = image.width / destinationRatio;
      sy = (image.height - sHeight) / 2;
    }
    ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }

  function fadeColorOpacity(color, replacement) {
    return color.replace(/0\.\d+\)/, `${replacement})`);
  }

  function drawRadialGlow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.45, fadeColorOpacity(color, "0.08"));
    gradient.addColorStop(1, fadeColorOpacity(color, "0"));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function fitTextToWidth(ctx, text, maxWidth, preferredSize, minSize, fontBuilder) {
    let size = preferredSize;
    while (size > minSize) {
      ctx.font = fontBuilder(size);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    return size;
  }

  function drawFineGrain(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    for (let i = 0; i < 1400; i += 1) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const size = Math.random() * 1.2 + 0.3;
      ctx.fillStyle = Math.random() > 0.62 ? "#ffffff" : "#000000";
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  function drawBackground(ctx, archetype, image) {
    const palette = archetype.palette;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = palette.base;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawImageCover(ctx, image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = palette.imageTint;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const topGradient = ctx.createLinearGradient(0, 0, 0, 840);
    topGradient.addColorStop(0, palette.overlayTop);
    topGradient.addColorStop(0.45, "rgba(8,10,20,0.34)");
    topGradient.addColorStop(1, "rgba(8,10,20,0.08)");
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 840);

    const bottomGradient = ctx.createLinearGradient(0, 1160, 0, CANVAS_HEIGHT);
    bottomGradient.addColorStop(0, "rgba(8,10,20,0.16)");
    bottomGradient.addColorStop(1, palette.overlayBottom);
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, 1160, CANVAS_WIDTH, CANVAS_HEIGHT - 1160);

    const sideVignette = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    sideVignette.addColorStop(0, "rgba(7,9,18,0.40)");
    sideVignette.addColorStop(0.16, "rgba(7,9,18,0.06)");
    sideVignette.addColorStop(0.84, "rgba(7,9,18,0.06)");
    sideVignette.addColorStop(1, "rgba(7,9,18,0.40)");
    ctx.fillStyle = sideVignette;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    drawRadialGlow(ctx, 180, 170, 520, palette.glowA);
    drawRadialGlow(ctx, 930, 900, 560, palette.glowB);
    drawRadialGlow(ctx, 260, 1730, 420, palette.glowC);
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.02)";
    roundedRect(ctx, 44, 44, CANVAS_WIDTH - 88, CANVAS_HEIGHT - 88, 36);
    ctx.fill();
  }

  function drawFrame(ctx, archetype) {
    const palette = archetype.palette;
    ctx.save();
    roundedRect(ctx, 42, 42, CANVAS_WIDTH - 84, CANVAS_HEIGHT - 84, 36);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const borderGradient = ctx.createLinearGradient(64, 64, CANVAS_WIDTH - 64, CANVAS_HEIGHT - 64);
    borderGradient.addColorStop(0, palette.accent);
    borderGradient.addColorStop(0.55, "rgba(255,255,255,0.08)");
    borderGradient.addColorStop(1, palette.quote);

    roundedRect(ctx, 64, 64, CANVAS_WIDTH - 128, CANVAS_HEIGHT - 128, 28);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.68;
    ctx.stroke();
    ctx.restore();
  }

  function drawTitlePanel(ctx, archetype, topY, bottomY) {
    const palette = archetype.palette;
    ctx.save();
    const gradient = ctx.createLinearGradient(0, topY, 0, bottomY);
    gradient.addColorStop(0, "rgba(7,9,18,0.42)");
    gradient.addColorStop(0.5, "rgba(7,9,18,0.28)");
    gradient.addColorStop(1, "rgba(7,9,18,0.08)");

    roundedRect(ctx, 92, topY, 896, bottomY - topY, 32);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = palette.titlePanelStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawArchetypeBlock(ctx, archetype) {
    const palette = archetype.palette;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let titleSize = 94;
    ctx.font = `700 ${titleSize}px ${FONT_FAMILIES.serif}`;
    let titleLines = wrapText(ctx, archetype.name, 790);
    if (titleLines.length > 2) {
      titleSize = 84;
      ctx.font = `700 ${titleSize}px ${FONT_FAMILIES.serif}`;
      titleLines = wrapText(ctx, archetype.name, 790);
    }

    const titleLineHeight = titleSize * 0.86;
    const titleStartY = 220;
    const titleBottom = titleStartY + (titleLines.length - 1) * titleLineHeight;

    ctx.font = `italic 600 66px ${FONT_FAMILIES.serif}`;
    let lyricLines = wrapText(ctx, `“${archetype.tagline}”`, 790);
    if (lyricLines.length > 3) {
      ctx.font = `italic 600 60px ${FONT_FAMILIES.serif}`;
      lyricLines = wrapText(ctx, `“${archetype.tagline}”`, 790);
    }

    const lyricLineHeight = 72;
    const lyricStartY = titleBottom + 168;
    const panelBottomY = lyricStartY + (lyricLines.length - 1) * lyricLineHeight + 90;

    drawTitlePanel(ctx, archetype, 130, panelBottomY);

    ctx.font = `700 ${titleSize}px ${FONT_FAMILIES.serif}`;
    ctx.fillStyle = palette.accent;
    ctx.shadowColor = "rgba(0,0,0,0.52)";
    ctx.shadowBlur = 22;
    drawCenteredLines(ctx, titleLines, CANVAS_WIDTH / 2, titleStartY, titleLineHeight);
    ctx.shadowBlur = 0;

    const underlineY = titleBottom + 76;
    const accentLine = ctx.createLinearGradient(318, 0, 762, 0);
    accentLine.addColorStop(0, palette.accent);
    accentLine.addColorStop(1, palette.quote);
    ctx.fillStyle = accentLine;
    roundedRect(ctx, 318, underlineY, 444, 6, 3);
    ctx.fill();

    ctx.fillStyle = palette.quote;
    ctx.font = lyricLines.length > 3 ? `italic 600 60px ${FONT_FAMILIES.serif}` : `italic 600 66px ${FONT_FAMILIES.serif}`;
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 16;
    drawCenteredLines(ctx, lyricLines, CANVAS_WIDTH / 2, lyricStartY, lyricLineHeight);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawEditorialStats(ctx, answers, archetype) {
    const palette = archetype.palette;
    const panelX = 96;
    const panelY = 1414;
    const panelW = 888;
    const panelH = 330;
    const contentX = panelX + 52;
    const contentWidth = panelW - 104;

    ctx.save();
    roundedRect(ctx, panelX, panelY, panelW, panelH, 32);
    ctx.fillStyle = "rgba(7,9,20,0.75)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const rows = [
      ["LOVE LANGUAGE", answers.loveLanguage],
      ["DEFAULT STATE", answers.mindset],
      ["FOREVER LOOKS LIKE", SHORT_VISIONS[answers.foreverVision] || answers.foreverVision]
    ];

    const rowHeight = 97;

    rows.forEach(([label, value], index) => {
      const rowTop = panelY + 24 + index * rowHeight;
      const valueMaxWidth = contentWidth;

      ctx.fillStyle = palette.quote;
      ctx.font = `800 18px ${FONT_FAMILIES.sans}`;
      ctx.fillText(label, contentX, rowTop + 24);

      const uppercaseValue = value.toUpperCase();
      let valueSize = fitTextToWidth(ctx, uppercaseValue, valueMaxWidth, 31, 22, (size) => `700 ${size}px ${FONT_FAMILIES.sans}`);
      ctx.font = `700 ${valueSize}px ${FONT_FAMILIES.sans}`;
      let lines = wrapText(ctx, uppercaseValue, valueMaxWidth).slice(0, 2);

      if (lines.length > 1 && valueSize > 26) {
        valueSize = 26;
        ctx.font = `700 ${valueSize}px ${FONT_FAMILIES.sans}`;
        lines = wrapText(ctx, uppercaseValue, valueMaxWidth).slice(0, 2);
      }

      ctx.fillStyle = "#F8F4FF";
      const valueStartY = rowTop + 62;
      const lineHeight = valueSize + 6;
      lines.forEach((line, lineIndex) => ctx.fillText(line, contentX, valueStartY + lineIndex * lineHeight));

      if (index < rows.length - 1) {
        const dividerY = panelY + 24 + (index + 1) * rowHeight - 8;
        ctx.strokeStyle = "rgba(255,255,255,0.11)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(contentX, dividerY);
        ctx.lineTo(panelX + panelW - 52, dividerY);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function renderStory(answers, archetype, image) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    drawBackground(context, archetype, image);
    drawFrame(context, archetype);
    drawArchetypeBlock(context, archetype);
    drawEditorialStats(context, answers, archetype);
    drawFineGrain(context);
    generatedDataUrl = canvas.toDataURL("image/png");
    preview.src = generatedDataUrl;
    preview.alt = `${archetype.name} CHIRAI Day Dreaming ID artwork`;
  }

  function canvasToBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The PNG file could not be generated.")), "image/png");
    });
  }

  function getFileName(extension) {
    const slug = currentArchetype.name.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `chirai-day-dreaming-id-${slug}.${extension}`;
  }

  function openDialog() {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    closeDialogButton.focus();
  }

  function closeDialog() {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  async function downloadImage() {
    if (!generatedDataUrl) {
      shareStatus.textContent = "Generate your Day Dreaming ID first.";
      return;
    }
    try {
      const blob = generatedBlob || await canvasToBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName("png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      shareStatus.textContent = "Your PNG is downloading.";
    } catch (error) {
      console.error(error);
      shareStatus.textContent = "The PNG could not be downloaded. Please try again.";
    }
  }

  async function ensureFFmpeg() {
    if (ffmpegInstance) return ffmpegInstance;
    if (!window.FFmpegWASM || !window.FFmpegUtil) throw new Error("FFmpeg could not be loaded.");
    const { FFmpeg } = window.FFmpegWASM;
    const { toBlobURL } = window.FFmpegUtil;
    const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm")
    });
    ffmpegInstance = ffmpeg;
    return ffmpegInstance;
  }

  async function buildMp4() {
    if (generatedMp4Blob) return generatedMp4Blob;
    if (!generatedBlob) throw new Error("Generate the artwork before exporting video.");
    const ffmpeg = await ensureFFmpeg();
    const { fetchFile } = window.FFmpegUtil;
    shareStatus.textContent = "Preparing 15-second video...";
    await ffmpeg.writeFile("frame.png", await fetchFile(generatedBlob));
    await ffmpeg.writeFile("audio.mp3", await fetchFile(AUDIO_PATH));

    const tryCommands = [
      ["-loop","1","-framerate","30","-i","frame.png","-stream_loop","-1","-i","audio.mp3","-t",String(VIDEO_DURATION),"-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac","-shortest","output.mp4"],
      ["-loop","1","-framerate","30","-i","frame.png","-stream_loop","-1","-i","audio.mp3","-t",String(VIDEO_DURATION),"-c:v","mpeg4","-q:v","4","-pix_fmt","yuv420p","-c:a","aac","-shortest","output.mp4"]
    ];

    let ok = false;
    let lastError = null;
    for (const command of tryCommands) {
      try {
        await ffmpeg.exec(command);
        ok = true;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!ok) throw lastError || new Error("Video export failed.");
    const data = await ffmpeg.readFile("output.mp4");
    generatedMp4Blob = new Blob([data.buffer], { type: "video/mp4" });
    return generatedMp4Blob;
  }

  async function downloadVideo() {
    if (!generatedDataUrl) {
      shareStatus.textContent = "Generate your Day Dreaming ID first.";
      return;
    }
    downloadVideoButton.disabled = true;
    downloadButton.disabled = true;
    shareButton.disabled = true;
    try {
      shareStatus.textContent = "Loading video export tools...";
      const blob = await buildMp4();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName("mp4");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      shareStatus.textContent = "Your 15-second MP4 is downloading.";
    } catch (error) {
      console.error(error);
      shareStatus.textContent = "The MP4 could not be created in this browser. Please try Chrome or Edge.";
    } finally {
      downloadVideoButton.disabled = false;
      downloadButton.disabled = false;
      shareButton.disabled = false;
    }
  }

  async function shareImage() {
    if (!generatedDataUrl) {
      shareStatus.textContent = "Generate your Day Dreaming ID first.";
      return;
    }
    shareButton.disabled = true;
    shareStatus.textContent = "";
    try {
      const blob = generatedBlob || await canvasToBlob();
      const file = new File([blob], getFileName("png"), { type: "image/png", lastModified: Date.now() });
      const shareData = {
        title: "Day Dreaming with CHIRAI",
        text: `My CHIRAI Day Dreaming ID is ${currentArchetype.name}.`,
        files: [file]
      };

      if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
        shareStatus.textContent = "Shared successfully.";
        return;
      }
      if (typeof navigator.share === "function") {
        await navigator.share({ title: shareData.title, text: shareData.text, url: window.location.href });
        shareStatus.textContent = "The page link was shared. Download the PNG or MP4 to share the asset directly.";
        return;
      }
      await downloadImage();
      shareStatus.textContent = "Your browser does not support native sharing, so the PNG was downloaded instead.";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        shareStatus.textContent = "Sharing was cancelled.";
      } else {
        console.error(error);
        shareStatus.textContent = "Sharing was unavailable. You can still download the PNG or MP4.";
      }
    } finally {
      shareButton.disabled = false;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "";
    shareStatus.textContent = "";
    generatedMp4Blob = null;

    if (!form.checkValidity()) {
      formStatus.textContent = "Please answer all three questions.";
      form.reportValidity();
      return;
    }

    const answers = getAnswers();
    if (!answers.loveLanguage || !answers.mindset || !answers.foreverVision) {
      formStatus.textContent = "Please answer all three questions.";
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const labelSpan = submitButton?.querySelector("span");
    if (submitButton) submitButton.disabled = true;
    if (labelSpan) labelSpan.textContent = "CREATING YOUR ARTWORK...";

    try {
      await loadCanvasFonts();
      currentArchetype = getArchetype(answers.loveLanguage, answers.foreverVision);
      const currentImage = await loadArchetypeImage(currentArchetype.key);
      renderStory(answers, currentArchetype, currentImage);
      generatedBlob = await canvasToBlob();
      openDialog();
    } catch (error) {
      console.error(error);
      formStatus.textContent = "Something went wrong while creating your artwork. Please try again.";
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (labelSpan) labelSpan.textContent = "TELL ME MY DAY DREAMING ID";
    }
  });

  downloadButton.addEventListener("click", downloadImage);
  downloadVideoButton.addEventListener("click", downloadVideo);
  shareButton.addEventListener("click", shareImage);
  closeDialogButton.addEventListener("click", closeDialog);
  editAnswersButton.addEventListener("click", () => {
    closeDialog();
    form.querySelector('input[type="radio"]:checked')?.focus();
  });

  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const clickedOutside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (clickedOutside) closeDialog();
  });
})();
