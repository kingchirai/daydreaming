(() => {
  "use strict";

  const STORY_WIDTH = 1080;
  const STORY_HEIGHT = 1920;

  const VISION = Object.freeze({
    SUNSET: "Watching the sunset in comfortable silence every night",
    KITCHEN: "Slow dancing in a cozy kitchen 50 years from today",
    TRAVEL: "Traveling the world side-by-side, never losing the initial spark",
    HAVEN: "Tucked away in a quiet haven, completely hidden from the rest of the world"
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

  const form = document.querySelector("#daydream-form");
  const canvas = document.querySelector("#story-canvas");
  const previewImage = document.querySelector("#story-preview-image");
  const resultDialog = document.querySelector("#result-dialog");
  const closeDialogButton = document.querySelector("#close-dialog");
  const downloadButton = document.querySelector("#download-button");
  const shareButton = document.querySelector("#share-button");
  const startAgainButton = document.querySelector("#start-again-button");
  const formStatus = document.querySelector("#form-status");
  const shareStatus = document.querySelector("#share-status");

  if (
    !form ||
    !canvas ||
    !previewImage ||
    !resultDialog ||
    !closeDialogButton ||
    !downloadButton ||
    !shareButton ||
    !startAgainButton
  ) {
    console.error("The Daydreaming app could not initialise because required elements are missing.");
    return;
  }

  const context = canvas.getContext("2d");
  let currentDataUrl = "";
  let currentArchetype = ARCHETYPES.DAYDREAMER;

  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  function determineArchetype(loveLanguage, foreverVision) {
    const romanticLoveLanguages = new Set([
      "Quality time",
      "Words of affirmation"
    ]);

    const sanctuaryLoveLanguages = new Set([
      "Physical touch",
      "Acts of service"
    ]);

    if (
      foreverVision === VISION.KITCHEN ||
      (
        foreverVision === VISION.SUNSET &&
        romanticLoveLanguages.has(loveLanguage)
      )
    ) {
      return ARCHETYPES.ROMANTIC;
    }

    if (
      foreverVision === VISION.HAVEN ||
      (
        foreverVision === VISION.SUNSET &&
        sanctuaryLoveLanguages.has(loveLanguage)
      )
    ) {
      return ARCHETYPES.SANCTUARY;
    }

    if (foreverVision === VISION.TRAVEL) {
      return ARCHETYPES.ADVENTURER;
    }

    return ARCHETYPES.DAYDREAMER;
  }

  function shortenForeverVision(foreverVision) {
    const shortenedVisions = {
      [VISION.SUNSET]: "Watching sunsets in comfortable silence",
      [VISION.KITCHEN]: "Slow dancing in the kitchen, 50 years from now",
      [VISION.TRAVEL]: "Traveling the world side-by-side",
      [VISION.HAVEN]: "Hidden away together in a quiet haven"
    };

    return shortenedVisions[foreverVision] || foreverVision;
  }

  function getFormAnswers() {
    const data = new FormData(form);

    return {
      loveLanguage: String(data.get("loveLanguage") || ""),
      mindset: String(data.get("mindset") || ""),
      foreverVision: String(data.get("foreverVision") || "")
    };
  }

  function roundRect(ctx, x, y, width, height, radius) {
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

      if (ctx.measureText(testLine).width <= maxWidth || !currentLine) {
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

  function drawLetterSpacedText(ctx, text, x, y, spacing) {
    let cursorX = x;

    for (const character of text) {
      ctx.fillText(character, cursorX, y);
      cursorX += ctx.measureText(character).width + spacing;
    }

    return cursorX;
  }

  function stringToSeed(value) {
    let seed = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
      seed ^= value.charCodeAt(index);
      seed = Math.imul(seed, 16777619);
    }

    return seed >>> 0;
  }

  function createSeededRandom(seed) {
    let state = seed >>> 0;

    return () => {
      state += 0x6D2B79F5;
      let result = state;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawBackground(ctx, seedText) {
    ctx.clearRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
    ctx.fillStyle = "#111116";
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

    const topGlow = ctx.createRadialGradient(160, 150, 0, 160, 150, 650);
    topGlow.addColorStop(0, "rgba(255, 157, 206, 0.34)");
    topGlow.addColorStop(0.45, "rgba(184, 164, 255, 0.13)");
    topGlow.addColorStop(1, "rgba(17, 17, 22, 0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

    const lowerGlow = ctx.createRadialGradient(920, 1560, 0, 920, 1560, 760);
    lowerGlow.addColorStop(0, "rgba(136, 215, 255, 0.24)");
    lowerGlow.addColorStop(0.42, "rgba(167, 255, 217, 0.08)");
    lowerGlow.addColorStop(1, "rgba(17, 17, 22, 0)");
    ctx.fillStyle = lowerGlow;
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

    const wash = ctx.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT);
    wash.addColorStop(0, "rgba(255, 255, 255, 0.025)");
    wash.addColorStop(0.48, "rgba(255, 255, 255, 0)");
    wash.addColorStop(1, "rgba(184, 164, 255, 0.045)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

    const random = createSeededRandom(stringToSeed(seedText));

    ctx.save();
    for (let index = 0; index < 42; index += 1) {
      const x = 70 + random() * 940;
      const y = 120 + random() * 1660;
      const radius = 0.8 + random() * 2.6;
      const alpha = 0.12 + random() * 0.45;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.13)";
    ctx.lineWidth = 2;
    roundRect(ctx, 40, 40, STORY_WIDTH - 80, STORY_HEIGHT - 80, 36);
    ctx.stroke();

    const borderGradient = ctx.createLinearGradient(40, 40, STORY_WIDTH - 40, STORY_HEIGHT - 40);
    borderGradient.addColorStop(0, "rgba(255, 157, 206, 0.9)");
    borderGradient.addColorStop(0.5, "rgba(184, 164, 255, 0.3)");
    borderGradient.addColorStop(1, "rgba(136, 215, 255, 0.9)");
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 4;
    roundRect(ctx, 58, 58, STORY_WIDTH - 116, STORY_HEIGHT - 116, 28);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;

    for (let y = 300; y <= 1660; y += 170) {
      ctx.beginPath();
      ctx.moveTo(76, y);
      ctx.lineTo(1004, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHeader(ctx) {
    ctx.save();
    ctx.fillStyle = "#f7f4ff";
    ctx.font = '700 27px Arial, sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    drawLetterSpacedText(ctx, "CHIRAI // DAYDREAMING", 92, 124, 3.7);

    ctx.fillStyle = "#ff9dce";
    ctx.beginPath();
    ctx.arc(944, 124, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(92, 178);
    ctx.lineTo(988, 178);
    ctx.stroke();
    ctx.restore();
  }

  function drawArchetype(ctx, archetype) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(247, 244, 255, 0.62)";
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText("YOUR DAYDREAMING ARCHETYPE", STORY_WIDTH / 2, 430);

    ctx.font = '900 92px Arial, sans-serif';
    const titleLines = wrapText(ctx, archetype.name, 830);
    const titleLineHeight = 100;
    const titleBlockHeight = titleLines.length * titleLineHeight;
    const titleStartY = 620 - titleBlockHeight / 2 + titleLineHeight / 2;

    ctx.shadowColor = "rgba(184, 164, 255, 0.28)";
    ctx.shadowBlur = 34;
    ctx.fillStyle = "#f7f4ff";
    drawCenteredLines(ctx, titleLines, STORY_WIDTH / 2, titleStartY, titleLineHeight);
    ctx.shadowBlur = 0;

    const accentGradient = ctx.createLinearGradient(230, 0, 850, 0);
    accentGradient.addColorStop(0, "#ff9dce");
    accentGradient.addColorStop(0.5, "#b8a4ff");
    accentGradient.addColorStop(1, "#88d7ff");
    ctx.fillStyle = accentGradient;
    roundRect(ctx, 306, 758, 468, 6, 3);
    ctx.fill();

    ctx.font = 'italic 43px Georgia, "Times New Roman", serif';
    const taglineLines = wrapText(ctx, `“${archetype.tagline}”`, 770);
    const taglineLineHeight = 60;
    ctx.fillStyle = "#dcd5ec";
    drawCenteredLines(ctx, taglineLines, STORY_WIDTH / 2, 872, taglineLineHeight);

    ctx.restore();
  }

  function drawStat(ctx, label, value, x, y, maxWidth) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#ff9dce";
    ctx.font = '700 24px Arial, sans-serif';
    drawLetterSpacedText(ctx, label.toUpperCase(), x, y, 2.4);

    ctx.fillStyle = "#f7f4ff";
    ctx.font = '600 36px Arial, sans-serif';
    const valueLines = wrapText(ctx, value, maxWidth);
    const lineHeight = 47;

    valueLines.forEach((line, index) => {
      ctx.fillText(line, x, y + 54 + index * lineHeight);
    });

    ctx.restore();

    return y + 54 + valueLines.length * lineHeight;
  }

  function drawStats(ctx, answers) {
    const x = 112;
    const y = 1125;
    const width = 856;
    const height = 490;

    ctx.save();
    roundRect(ctx, x, y, width, height, 28);
    ctx.fillStyle = "rgba(10, 10, 14, 0.54)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.055)";
    roundRect(ctx, x + 18, y + 18, width - 36, height - 36, 20);
    ctx.fill();

    const contentX = x + 54;
    const contentWidth = width - 108;

    let cursorY = y + 76;
    cursorY = drawStat(
      ctx,
      "Love language",
      answers.loveLanguage,
      contentX,
      cursorY,
      contentWidth
    ) + 38;

    cursorY = drawStat(
      ctx,
      "Mindset",
      answers.mindset,
      contentX,
      cursorY,
      contentWidth
    ) + 38;

    drawStat(
      ctx,
      "Forever vision",
      shortenForeverVision(answers.foreverVision),
      contentX,
      cursorY,
      contentWidth
    );

    ctx.restore();
  }

  function drawFooter(ctx) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "rgba(247, 244, 255, 0.68)";
    ctx.font = '500 25px Arial, sans-serif';
    ctx.fillText("Listen to ‘Daydreaming’ out now on all platforms.", STORY_WIDTH / 2, 1742);

    const pillGradient = ctx.createLinearGradient(350, 0, 730, 0);
    pillGradient.addColorStop(0, "#ff9dce");
    pillGradient.addColorStop(0.5, "#b8a4ff");
    pillGradient.addColorStop(1, "#88d7ff");

    roundRect(ctx, 369, 1790, 342, 58, 29);
    ctx.fillStyle = pillGradient;
    ctx.fill();

    ctx.fillStyle = "#111116";
    ctx.font = '800 22px Arial, sans-serif';
    ctx.fillText("CHIRAI // DAYDREAMING", STORY_WIDTH / 2, 1820);
    ctx.restore();
  }

  function renderStoryAsset(answers, archetype) {
    if (!context) {
      throw new Error("Your browser could not create the story image.");
    }

    const seedText = `${answers.loveLanguage}|${answers.mindset}|${answers.foreverVision}`;

    drawBackground(context, seedText);
    drawHeader(context);
    drawArchetype(context, archetype);
    drawStats(context, answers);
    drawFooter(context);

    currentDataUrl = canvas.toDataURL("image/png");
    previewImage.src = currentDataUrl;
    previewImage.alt = `CHIRAI Daydreaming result: ${archetype.name}`;
  }

  function openResultDialog() {
    if (typeof resultDialog.showModal === "function") {
      if (!resultDialog.open) {
        resultDialog.showModal();
      }
    } else {
      resultDialog.setAttribute("open", "");
    }

    closeDialogButton.focus();
  }

  function closeResultDialog() {
    if (typeof resultDialog.close === "function") {
      resultDialog.close();
    } else {
      resultDialog.removeAttribute("open");
    }
  }

  function buildFileName() {
    return `chirai-daydreaming-${currentArchetype.name
      .toLowerCase()
      .replace(/^the\s+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.png`;
  }

  function downloadCurrentImage() {
    if (!currentDataUrl) {
      shareStatus.textContent = "Generate your story before downloading it.";
      return;
    }

    const link = document.createElement("a");
    link.href = currentDataUrl;
    link.download = buildFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    shareStatus.textContent = "Your 1080 × 1920 PNG is downloading.";
  }

  async function dataUrlToFile(dataUrl, fileName) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: "image/png",
      lastModified: Date.now()
    });
  }

  async function shareCurrentImage() {
    if (!currentDataUrl) {
      shareStatus.textContent = "Generate your story before sharing it.";
      return;
    }

    shareButton.disabled = true;
    shareStatus.textContent = "";

    try {
      const file = await dataUrlToFile(currentDataUrl, buildFileName());
      const shareData = {
        title: "Daydreaming with CHIRAI",
        text: `My CHIRAI Daydreaming archetype is ${currentArchetype.name}.`,
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
          text: `${shareData.text} Download your own result at ${window.location.href}`,
          url: window.location.href
        });
        shareStatus.textContent =
          "Your browser shared the page link. Download the PNG to share the image itself.";
        return;
      }

      downloadCurrentImage();
      shareStatus.textContent =
        "Image sharing is not supported in this browser, so the PNG was downloaded instead.";
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "";
    shareStatus.textContent = "";

    if (!form.reportValidity()) {
      formStatus.textContent = "Please answer all three questions.";
      return;
    }

    const answers = getFormAnswers();

    if (!answers.loveLanguage || !answers.mindset || !answers.foreverVision) {
      formStatus.textContent = "Please answer all three questions.";
      return;
    }

    currentArchetype = determineArchetype(
      answers.loveLanguage,
      answers.foreverVision
    );

    try {
      renderStoryAsset(answers, currentArchetype);
      openResultDialog();
    } catch (error) {
      console.error(error);
      formStatus.textContent =
        "Something went wrong while creating your image. Please try again.";
    }
  });

  downloadButton.addEventListener("click", downloadCurrentImage);
  shareButton.addEventListener("click", shareCurrentImage);
  closeDialogButton.addEventListener("click", closeResultDialog);

  startAgainButton.addEventListener("click", () => {
    closeResultDialog();
    form.querySelector('input[type="radio"]:checked')?.focus();
  });

  resultDialog.addEventListener("click", (event) => {
    const dialogBounds = resultDialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < dialogBounds.left ||
      event.clientX > dialogBounds.right ||
      event.clientY < dialogBounds.top ||
      event.clientY > dialogBounds.bottom;

    if (clickedOutside) {
      closeResultDialog();
    }
  });
})();
