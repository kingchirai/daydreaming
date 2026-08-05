(() => {
  "use strict";

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;
  const PRESS_IMAGE_PATH = "./chirai-press.jpg";

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

  const ARCHETYPES = Object.freeze({
    ROMANTIC: {
      key: "romantic",
      index: "01/04",
      name: "THE LIFELONG ROMANTIC",
      tagline: "Day Dreaming, seeing visions of us in a life far from here",
      palette: {
        base: "#0F1123",
        accent: "#D8B4F8",
        accentTwo: "#F5B3CF",
        quote: "#F4A261",
        imageTint: "rgba(15,17,35,0.54)",
        overlayTop: "rgba(10,12,24,0.58)",
        overlayBottom: "rgba(7,9,18,0.86)",
        titlePanel: "rgba(12,14,28,0.38)",
        titlePanelStroke: "rgba(216,180,248,0.18)",
        glowA: "rgba(216,180,248,0.34)",
        glowB: "rgba(245,179,207,0.22)",
        glowC: "rgba(244,162,97,0.14)"
      },
      kicker: "Apparently, this is how I imagine forever."
    },
    SANCTUARY: {
      key: "sanctuary",
      index: "02/04",
      name: "THE SANCTUARY SEEKER",
      tagline: "Day Dreaming, seeing visions of us in the house on a hill",
      palette: {
        base: "#0C1021",
        accent: "#D8B4F8",
        accentTwo: "#99B9F7",
        quote: "#EFC284",
        imageTint: "rgba(8,12,22,0.60)",
        overlayTop: "rgba(8,12,25,0.62)",
        overlayBottom: "rgba(7,10,18,0.88)",
        titlePanel: "rgba(9,13,24,0.42)",
        titlePanelStroke: "rgba(153,185,247,0.16)",
        glowA: "rgba(153,185,247,0.24)",
        glowB: "rgba(216,180,248,0.18)",
        glowC: "rgba(244,162,97,0.08)"
      },
      kicker: "Quiet love. Safe love. The world can wait."
    },
    ADVENTURER: {
      key: "adventurer",
      index: "03/04",
      name: "THE ETERNAL ADVENTURER",
      tagline: "I come to realise, that it was all part of the plan",
      palette: {
        base: "#10142A",
        accent: "#F4A261",
        accentTwo: "#D8B4F8",
        quote: "#F7D38E",
        imageTint: "rgba(16,20,42,0.52)",
        overlayTop: "rgba(13,18,34,0.54)",
        overlayBottom: "rgba(8,10,18,0.84)",
        titlePanel: "rgba(13,18,34,0.36)",
        titlePanelStroke: "rgba(244,162,97,0.18)",
        glowA: "rgba(244,162,97,0.28)",
        glowB: "rgba(216,180,248,0.16)",
        glowC: "rgba(255,214,136,0.10)"
      },
      kicker: "Love, but make it feel like the horizon."
    },
    DAYDREAMER: {
      key: "daydreamer",
      index: "04/04",
      name: "THE DAYDREAMER",
      tagline: "Day Dreaming, seeing visions of us",
      palette: {
        base: "#0E1124",
        accent: "#D8B4F8",
        accentTwo: "#F4A261",
        quote: "#F4A261",
        imageTint: "rgba(14,17,36,0.56)",
        overlayTop: "rgba(10,13,24,0.58)",
        overlayBottom: "rgba(7,9,18,0.86)",
        titlePanel: "rgba(11,14,27,0.40)",
        titlePanelStroke: "rgba(216,180,248,0.16)",
        glowA: "rgba(216,180,248,0.28)",
        glowB: "rgba(244,162,97,0.14)",
        glowC: "rgba(255,255,255,0.05)"
      },
      kicker: "I’m somewhere between a memory and a vision."
    }
  });

  const form = document.querySelector("#romantic-profile-form");
  const formStatus = document.querySelector("#form-status");
  const canvas = document.querySelector("#story-canvas");
  const preview = document.querySelector("#story-preview");
  const dialog = document.querySelector("#result-dialog");
  const closeDialogButton = document.querySelector("#close-dialog-button");
  const downloadButton = document.querySelector("#download-button");
  const shareButton = document.querySelector("#share-button");
  const editAnswersButton = document.querySelector("#edit-answers-button");
  const shareStatus = document.querySelector("#share-status");

  if (
    !form ||
    !formStatus ||
    !canvas ||
    !preview ||
    !dialog ||
    !closeDialogButton ||
    !downloadButton ||
    !shareButton ||
    !editAnswersButton ||
    !shareStatus
  ) {
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
  let currentArchetype = ARCHETYPES.DAYDREAMER;
  let pressImage = null;

  function getArchetype(loveLanguage, foreverVision) {
    const romanticLanguages = new Set([
      "Quality time",
      "Words of affirmation"
    ]);

    const sanctuaryLanguages = new Set([
      "Physical touch",
      "Acts of service"
    ]);

    if (
      foreverVision === VISIONS.KITCHEN ||
      (foreverVision === VISIONS.SUNSET && romanticLanguages.has(loveLanguage))
    ) {
      return ARCHETYPES.ROMANTIC;
    }

    if (
      foreverVision === VISIONS.HAVEN ||
      (foreverVision === VISIONS.SUNSET && sanctuaryLanguages.has(loveLanguage))
    ) {
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
    if (!document.fonts || typeof document.fonts.load !== "function") {
      return;
    }

    await Promise.all([
      document.fonts.load(`700 110px ${FONT_FAMILIES.serif}`),
      document.fonts.load(`italic 600 48px ${FONT_FAMILIES.serif}`),
      document.fonts.load(`700 27px ${FONT_FAMILIES.sans}`),
      document.fonts.ready
    ]);
  }

  function loadPressImage() {
    if (pressImage) {
      return Promise.resolve(pressImage);
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        pressImage = image;
        resolve(image);
      };
      image.onerror = () => reject(new Error("The CHIRAI press image could not be loaded."));
      image.src = PRESS_IMAGE_PATH;
    });
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
    ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
    ctx.arcTo(x, y + height, x, y, safeRadius);
    ctx.arcTo(x, y, x + width, y, safeRadius);
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

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  function drawCenteredLines(ctx, lines, centerX, startY, lineHeight) {
    lines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });
  }

  function drawTrackedCenteredText(ctx, text, centerX, y, tracking) {
    const characters = Array.from(text);
    const widths = characters.map((character) => ctx.measureText(character).width);
    const totalWidth =
      widths.reduce((sum, width) => sum + width, 0) +
      tracking * Math.max(0, characters.length - 1);

    let cursorX = centerX - totalWidth / 2;

    characters.forEach((character, index) => {
      ctx.fillText(character, cursorX, y);
      cursorX += widths[index] + tracking;
    });
  }

  function drawImageCover(ctx, image, dx, dy, dWidth, dHeight) {
    const imageRatio = image.width / image.height;
    const destinationRatio = dWidth / dHeight;

    let sx = 0;
    let sy = 0;
    let sWidth = image.width;
    let sHeight = image.height;

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

  function drawBackground(ctx, archetype) {
    const palette = archetype.palette;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = palette.base;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawImageCover(ctx, pressImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = palette.imageTint;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const topGradient = ctx.createLinearGradient(0, 0, 0, 840);
    topGradient.addColorStop(0, palette.overlayTop);
    topGradient.addColorStop(0.45, "rgba(8,10,20,0.34)");
    topGradient.addColorStop(1, "rgba(8,10,20,0.08)");
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 840);

    const bottomGradient = ctx.createLinearGradient(0, 1160, 0, CANVAS_HEIGHT);
    bottomGradient.addColorStop(0, "rgba(8,10,20,0.18)");
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

  function drawFrameAndBranding(ctx, archetype) {
    const palette = archetype.palette;

    ctx.save();

    roundedRect(ctx, 42, 42, CANVAS_WIDTH - 84, CANVAS_HEIGHT - 84, 36);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const borderGradient = ctx.createLinearGradient(64, 64, CANVAS_WIDTH - 64, CANVAS_HEIGHT - 64);
    borderGradient.addColorStop(0, palette.accent);
    borderGradient.addColorStop(0.55, "rgba(255,255,255,0.10)");
    borderGradient.addColorStop(1, palette.quote);

    roundedRect(ctx, 64, 64, CANVAS_WIDTH - 128, CANVAS_HEIGHT - 128, 28);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.74;
    ctx.stroke();

    ctx.fillStyle = "#F8F4FF";
    ctx.font = `800 24px ${FONT_FAMILIES.sans}`;
    drawTrackedCenteredText(ctx, "CHIRAI // DAYDREAMING", CANVAS_WIDTH / 2, 130, 6);

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(106, 182);
    ctx.lineTo(974, 182);
    ctx.stroke();

    ctx.fillStyle = palette.quote;
    ctx.font = `800 18px ${FONT_FAMILIES.sans}`;
    drawTrackedCenteredText(ctx, `ROMANTIC PROFILE ${archetype.index}`, CANVAS_WIDTH / 2, 238, 4);

    ctx.restore();
  }

  function drawTitlePanel(ctx, archetype, bottomY) {
    const palette = archetype.palette;

    ctx.save();
    roundedRect(ctx, 82, 254, 916, bottomY - 254, 26);
    ctx.fillStyle = palette.titlePanel;
    ctx.fill();
    ctx.strokeStyle = palette.titlePanelStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawArchetypeBlock(ctx, archetype) {
    const palette = archetype.palette;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let titleSize = 104;
    ctx.font = `700 ${titleSize}px ${FONT_FAMILIES.serif}`;
    let titleLines = wrapText(ctx, archetype.name, 760);

    if (titleLines.length > 3) {
      titleSize = 90;
      ctx.font = `700 ${titleSize}px ${FONT_FAMILIES.serif}`;
      titleLines = wrapText(ctx, archetype.name, 760);
    }

    const titleLineHeight = titleSize * 0.88;
    const titleStartY = 356;
    const underlineY = titleStartY + titleLines.length * titleLineHeight + 20;
    const taglineStartY = underlineY + 92;
    const taglineLineHeight = 54;
    ctx.font = `italic 600 46px ${FONT_FAMILIES.serif}`;
    const taglineLines = wrapText(ctx, `“${archetype.tagline}”`, 720);
    const panelBottomY = taglineStartY + taglineLines.length * taglineLineHeight + 54;

    drawTitlePanel(ctx, archetype, panelBottomY);

    ctx.font = `700 ${titleSize}px ${FONT_FAMILIES.serif}`;
    ctx.fillStyle = palette.accent;
    ctx.shadowColor = "rgba(0,0,0,0.46)";
    ctx.shadowBlur = 18;
    drawCenteredLines(ctx, titleLines, CANVAS_WIDTH / 2, titleStartY, titleLineHeight);
    ctx.shadowBlur = 0;

    const accentLine = ctx.createLinearGradient(318, 0, 762, 0);
    accentLine.addColorStop(0, palette.accent);
    accentLine.addColorStop(1, palette.quote);
    ctx.fillStyle = accentLine;
    roundedRect(ctx, 318, underlineY, 444, 6, 3);
    ctx.fill();

    ctx.fillStyle = palette.quote;
    ctx.font = `italic 600 46px ${FONT_FAMILIES.serif}`;
    drawCenteredLines(ctx, taglineLines, CANVAS_WIDTH / 2, taglineStartY, taglineLineHeight);

    ctx.restore();
  }

  function drawEditorialStats(ctx, answers, archetype) {
    const palette = archetype.palette;
    const panelX = 98;
    const panelY = 1368;
    const panelW = 884;
    const panelH = 300;

    ctx.save();

    roundedRect(ctx, panelX, panelY, panelW, panelH, 30);
    ctx.fillStyle = "rgba(8,10,22,0.72)";
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const gradient = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY + panelH);
    gradient.addColorStop(0, "rgba(216,180,248,0.08)");
    gradient.addColorStop(1, "rgba(244,162,97,0.05)");

    roundedRect(ctx, panelX + 16, panelY + 16, panelW - 32, panelH - 32, 22);
    ctx.fillStyle = gradient;
    ctx.fill();

    const rows = [
      ["LOVE LANGUAGE", answers.loveLanguage],
      ["DEFAULT STATE", answers.mindset],
      ["FOREVER LOOKS LIKE", SHORT_VISIONS[answers.foreverVision] || answers.foreverVision]
    ];

    const startX = panelX + 46;
    let rowY = panelY + 70;

    rows.forEach((row, index) => {
      const [label, value] = row;

      ctx.fillStyle = palette.quote;
      ctx.font = `800 20px ${FONT_FAMILIES.sans}`;
      ctx.fillText(label, startX, rowY);

      ctx.fillStyle = "#F8F4FF";
      ctx.font = `600 28px ${FONT_FAMILIES.sans}`;
      const lines = wrapText(ctx, value.toUpperCase(), 600).slice(0, 2);

      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, 390, rowY + lineIndex * 34);
      });

      if (index < rows.length - 1) {
        const dividerY = rowY + Math.max(54, lines.length * 34 + 20);
        ctx.strokeStyle = "rgba(255,255,255,0.11)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, dividerY);
        ctx.lineTo(panelX + panelW - 46, dividerY);
        ctx.stroke();
      }

      rowY += 92;
    });

    ctx.restore();
  }

  function drawFooter(ctx, archetype) {
    const palette = archetype.palette;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(248,244,255,0.92)";
    ctx.font = `italic 600 32px ${FONT_FAMILIES.serif}`;
    ctx.fillText(archetype.kicker, CANVAS_WIDTH / 2, 1735);

    ctx.fillStyle = "rgba(248,244,255,0.84)";
    ctx.font = `600 24px ${FONT_FAMILIES.sans}`;
    ctx.fillText("Listen to ‘Daydreaming’ out now on all platforms.", CANVAS_WIDTH / 2, 1806);

    ctx.fillStyle = palette.quote;
    ctx.font = `800 18px ${FONT_FAMILIES.sans}`;
    drawTrackedCenteredText(ctx, "TAKE THE QUIZ • LISTEN TO DAY DREAMING", CANVAS_WIDTH / 2, 1858, 4);

    ctx.restore();
  }

  function renderStory(answers, archetype) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    drawBackground(context, archetype);
    drawFrameAndBranding(context, archetype);
    drawArchetypeBlock(context, archetype);
    drawEditorialStats(context, answers, archetype);
    drawFooter(context, archetype);
    drawFineGrain(context);

    generatedDataUrl = canvas.toDataURL("image/png");
    preview.src = generatedDataUrl;
    preview.alt = `${archetype.name} CHIRAI Day Dreaming artwork`;
  }

  function canvasToBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("The PNG file could not be generated."));
        }
      }, "image/png");
    });
  }

  function getFileName() {
    const slug = currentArchetype.name
      .toLowerCase()
      .replace(/^the\s+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return `chirai-daydreaming-${slug}.png`;
  }

  function openDialog() {
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      dialog.setAttribute("open", "");
    }

    closeDialogButton.focus();
  }

  function closeDialog() {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  async function downloadImage() {
    if (!generatedDataUrl) {
      shareStatus.textContent = "Generate your romantic profile first.";
      return;
    }

    try {
      const blob = generatedBlob || await canvasToBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = getFileName();

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      shareStatus.textContent = "Your 1080 × 1920 PNG is downloading.";
    } catch (error) {
      console.error(error);
      shareStatus.textContent = "The PNG could not be downloaded. Please try again.";
    }
  }

  async function shareImage() {
    if (!generatedDataUrl) {
      shareStatus.textContent = "Generate your romantic profile first.";
      return;
    }

    shareButton.disabled = true;
    shareStatus.textContent = "";

    try {
      const blob = generatedBlob || await canvasToBlob();
      const file = new File([blob], getFileName(), {
        type: "image/png",
        lastModified: Date.now()
      });

      const shareData = {
        title: "Day Dreaming with CHIRAI",
        text: `My CHIRAI romantic profile is ${currentArchetype.name}.`,
        files: [file]
      };

      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share(shareData);
        shareStatus.textContent = "Shared successfully.";
        return;
      }

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: window.location.href
        });

        shareStatus.textContent =
          "The page link was shared. Download the PNG to share the image directly.";
        return;
      }

      await downloadImage();
      shareStatus.textContent =
        "Your browser does not support native sharing, so the PNG was downloaded instead.";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        shareStatus.textContent = "Sharing was cancelled.";
      } else {
        console.error(error);
        shareStatus.textContent =
          "Sharing was unavailable. You can still download the PNG.";
      }
    } finally {
      shareButton.disabled = false;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    formStatus.textContent = "";
    shareStatus.textContent = "";

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

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (labelSpan) {
      labelSpan.textContent = "CREATING YOUR ARTWORK...";
    }

    try {
      await Promise.all([
        loadCanvasFonts(),
        loadPressImage()
      ]);

      currentArchetype = getArchetype(
        answers.loveLanguage,
        answers.foreverVision
      );

      renderStory(answers, currentArchetype);
      generatedBlob = await canvasToBlob();

      openDialog();
    } catch (error) {
      console.error(error);
      formStatus.textContent =
        "Something went wrong while creating your artwork. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }

      if (labelSpan) {
        labelSpan.textContent = "TELL ME MY ROMANTIC PROFILE";
      }
    }
  });

  downloadButton.addEventListener("click", downloadImage);
  shareButton.addEventListener("click", shareImage);
  closeDialogButton.addEventListener("click", closeDialog);

  editAnswersButton.addEventListener("click", () => {
    closeDialog();
    form.querySelector('input[type="radio"]:checked')?.focus();
  });

  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) {
      closeDialog();
    }
  });
})();
