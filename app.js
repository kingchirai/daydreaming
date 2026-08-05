(() => {
  "use strict";

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  const COLORS = Object.freeze({
    background: "#0F1123",
    lavender: "#D8B4F8",
    gold: "#F4A261",
    text: "#F9F4FF",
    muted: "#C2BCD0"
  });

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
      name: "THE LIFELONG ROMANTIC",
      tagline: "Day Dreaming, seeing visions of us in a life far from here"
    },
    SANCTUARY: {
      name: "THE SANCTUARY SEEKER",
      tagline: "Day Dreaming, seeing visions of us in the house on a hill"
    },
    ADVENTURER: {
      name: "THE ETERNAL ADVENTURER",
      tagline: "I come to realise, that it was all part of the plan"
    },
    DAYDREAMER: {
      name: "THE DAYDREAMER",
      tagline: "Day Dreaming, seeing visions of us"
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
    console.error("The CHIRAI romantic profile app could not initialise.");
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
      (
        foreverVision === VISIONS.SUNSET &&
        romanticLanguages.has(loveLanguage)
      )
    ) {
      return ARCHETYPES.ROMANTIC;
    }

    if (
      foreverVision === VISIONS.HAVEN ||
      (
        foreverVision === VISIONS.SUNSET &&
        sanctuaryLanguages.has(loveLanguage)
      )
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
      document.fonts.load(`700 100px ${FONT_FAMILIES.serif}`),
      document.fonts.load(`italic 600 48px ${FONT_FAMILIES.serif}`),
      document.fonts.load(`700 28px ${FONT_FAMILIES.sans}`),
      document.fonts.ready
    ]);
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

  function drawRadialGlow(ctx, x, y, radius, colorStops) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    colorStops.forEach(([offset, color]) => {
      gradient.addColorStop(offset, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawBackground(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    drawRadialGlow(ctx, 180, 250, 650, [
      [0, "rgba(216, 180, 248, 0.45)"],
      [0.42, "rgba(216, 180, 248, 0.14)"],
      [1, "rgba(216, 180, 248, 0)"]
    ]);

    drawRadialGlow(ctx, 920, 860, 570, [
      [0, "rgba(244, 162, 97, 0.32)"],
      [0.5, "rgba(244, 162, 97, 0.10)"],
      [1, "rgba(244, 162, 97, 0)"]
    ]);

    drawRadialGlow(ctx, 260, 1760, 560, [
      [0, "rgba(216, 180, 248, 0.24)"],
      [0.5, "rgba(216, 180, 248, 0.07)"],
      [1, "rgba(216, 180, 248, 0)"]
    ]);

    ctx.restore();

    const wash = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    wash.addColorStop(0, "rgba(255,255,255,0.03)");
    wash.addColorStop(0.5, "rgba(255,255,255,0)");
    wash.addColorStop(1, "rgba(244,162,97,0.035)");

    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();

    roundedRect(ctx, 42, 42, CANVAS_WIDTH - 84, CANVAS_HEIGHT - 84, 36);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const borderGradient = ctx.createLinearGradient(65, 65, CANVAS_WIDTH - 65, CANVAS_HEIGHT - 65);
    borderGradient.addColorStop(0, COLORS.lavender);
    borderGradient.addColorStop(0.48, "rgba(216,180,248,0.15)");
    borderGradient.addColorStop(1, COLORS.gold);

    roundedRect(ctx, 64, 64, CANVAS_WIDTH - 128, CANVAS_HEIGHT - 128, 28);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.72;
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.24;

    const stars = [
      [132, 310, 2.1], [904, 260, 1.8], [812, 525, 1.5],
      [195, 760, 1.8], [940, 1120, 2.2], [160, 1380, 1.4],
      [845, 1540, 1.8], [310, 1685, 1.5], [630, 280, 1.1],
      [525, 990, 1.3], [740, 1750, 1.2], [284, 1120, 1.2]
    ];

    stars.forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
    });

    ctx.restore();
  }

  function drawHeader(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    ctx.font = `800 25px ${FONT_FAMILIES.sans}`;

    drawTrackedCenteredText(
      ctx,
      "CHIRAI // DAYDREAMING",
      CANVAS_WIDTH / 2,
      135,
      6
    );

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 205);
    ctx.lineTo(970, 205);
    ctx.stroke();

    ctx.restore();
  }

  function drawArchetype(ctx, archetype) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(249,244,255,0.64)";
    ctx.font = `700 22px ${FONT_FAMILIES.sans}`;
    drawTrackedCenteredText(
      ctx,
      "YOUR ROMANTIC PROFILE",
      CANVAS_WIDTH / 2,
      405,
      5
    );

    let titleFontSize = 110;
    ctx.font = `700 ${titleFontSize}px ${FONT_FAMILIES.serif}`;
    let titleLines = wrapText(ctx, archetype.name, 830);

    if (titleLines.length > 3) {
      titleFontSize = 94;
      ctx.font = `700 ${titleFontSize}px ${FONT_FAMILIES.serif}`;
      titleLines = wrapText(ctx, archetype.name, 830);
    }

    const titleLineHeight = titleFontSize * 0.9;
    const titleBlockHeight = titleLines.length * titleLineHeight;
    const titleStartY = 620 - titleBlockHeight / 2 + titleLineHeight / 2;

    ctx.fillStyle = COLORS.lavender;
    ctx.shadowColor = "rgba(216,180,248,0.26)";
    ctx.shadowBlur = 34;

    drawCenteredLines(
      ctx,
      titleLines,
      CANVAS_WIDTH / 2,
      titleStartY,
      titleLineHeight
    );

    ctx.shadowBlur = 0;

    const accentLine = ctx.createLinearGradient(350, 0, 730, 0);
    accentLine.addColorStop(0, COLORS.lavender);
    accentLine.addColorStop(1, COLORS.gold);

    ctx.fillStyle = accentLine;
    roundedRect(ctx, 350, 790, 380, 6, 3);
    ctx.fill();

    ctx.fillStyle = COLORS.gold;
    ctx.font = `italic 600 46px ${FONT_FAMILIES.serif}`;

    const quoteLines = wrapText(
      ctx,
      `“${archetype.tagline}”`,
      790
    );

    drawCenteredLines(
      ctx,
      quoteLines,
      CANVAS_WIDTH / 2,
      900,
      56
    );

    ctx.restore();
  }

  function drawStatRow(ctx, label, value, y, isLast = false) {
    const left = 138;
    const valueX = 430;

    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = COLORS.gold;
    ctx.font = `800 22px ${FONT_FAMILIES.sans}`;
    ctx.fillText(label, left, y);

    ctx.fillStyle = COLORS.text;
    ctx.font = `600 29px ${FONT_FAMILIES.sans}`;

    const lines = wrapText(ctx, value.toUpperCase(), 505).slice(0, 2);

    lines.forEach((line, index) => {
      ctx.fillText(line, valueX, y + index * 36);
    });

    if (!isLast) {
      const lineY = y + Math.max(68, lines.length * 36 + 28);
      ctx.strokeStyle = "rgba(255,255,255,0.11)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, lineY);
      ctx.lineTo(942, lineY);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawStats(ctx, answers) {
    const boxX = 92;
    const boxY = 1120;
    const boxWidth = 896;
    const boxHeight = 470;

    ctx.save();

    roundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 32);
    ctx.fillStyle = "rgba(12,14,31,0.62)";
    ctx.fill();

    ctx.strokeStyle = "rgba(216,180,248,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const insetGradient = ctx.createLinearGradient(
      boxX,
      boxY,
      boxX + boxWidth,
      boxY + boxHeight
    );

    insetGradient.addColorStop(0, "rgba(216,180,248,0.07)");
    insetGradient.addColorStop(1, "rgba(244,162,97,0.04)");

    roundedRect(ctx, boxX + 18, boxY + 18, boxWidth - 36, boxHeight - 36, 24);
    ctx.fillStyle = insetGradient;
    ctx.fill();

    ctx.restore();

    drawStatRow(
      ctx,
      "LOVE LANGUAGE",
      answers.loveLanguage,
      boxY + 92
    );

    drawStatRow(
      ctx,
      "MINDSET",
      answers.mindset,
      boxY + 225
    );

    drawStatRow(
      ctx,
      "FOREVER VISION",
      SHORT_VISIONS[answers.foreverVision] || answers.foreverVision,
      boxY + 358,
      true
    );
  }

  function drawFooter(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = COLORS.text;
    ctx.font = `600 26px ${FONT_FAMILIES.sans}`;
    ctx.fillText(
      "Listen to ‘Daydreaming’ out now on all platforms.",
      CANVAS_WIDTH / 2,
      1740
    );

    ctx.fillStyle = "rgba(249,244,255,0.55)";
    ctx.font = `700 19px ${FONT_FAMILIES.sans}`;
    drawTrackedCenteredText(
      ctx,
      "CHIRAI",
      CANVAS_WIDTH / 2,
      1820,
      6
    );

    ctx.restore();
  }

  function renderStory(answers, archetype) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    drawBackground(context);
    drawHeader(context);
    drawArchetype(context, archetype);
    drawStats(context, answers);
    drawFooter(context);

    generatedDataUrl = canvas.toDataURL("image/png");
    preview.src = generatedDataUrl;
    preview.alt = `${archetype.name} CHIRAI romantic profile story graphic`;
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

    return `chirai-romantic-profile-${slug}.png`;
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
    const originalButtonText = submitButton?.querySelector("span");

    if (submitButton) {
      submitButton.disabled = true;
    }

    if (originalButtonText) {
      originalButtonText.textContent = "CREATING YOUR PROFILE...";
    }

    try {
      await loadCanvasFonts();

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
        "Something went wrong while creating your profile. Please try again.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }

      if (originalButtonText) {
        originalButtonText.textContent = "TELL ME MY ROMANTIC PROFILE";
      }
    }
  });

  downloadButton.addEventListener("click", downloadImage);
  shareButton.addEventListener("click", shareImage);
  closeDialogButton.addEventListener("click", closeDialog);

  editAnswersButton.addEventListener("click", () => {
    closeDialog();

    const checkedInput = form.querySelector('input[type="radio"]:checked');
    checkedInput?.focus();
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
