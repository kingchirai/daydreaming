# Day Dreaming with CHIRAI — Multi-Image + Audio + Video Export Update

This package adds the latest requested changes.

## Included updates

- Each Day Dreaming ID result now uses a different full-screen CHIRAI press image:
  - **The Lifelong Romantic** → warm close-up portrait
  - **The Sanctuary Seeker** → black-and-white studio shot
  - **The Eternal Adventurer** → playful floor / telephone shot
  - **The Daydreamer** → piano / headphones shot
- Added landing-page audio using the supplied WAV file
- The page attempts to autoplay audio on load
- Added a floating audio toggle button
- Added **Download PNG**
- Added **Download VIDEO** which creates a **15-second MP4** using:
  - the generated story artwork as the visual
  - the supplied audio as the soundtrack

## Important note about autoplay

Modern browsers sometimes block autoplay with sound until the user interacts with the page.  
This build attempts to autoplay immediately, and if blocked, it will resume after the first click or key press.

## Important note about MP4 export

The MP4 export runs fully in the browser using **ffmpeg.wasm** loaded from a CDN.  
The first video export can take a little longer because the video engine needs to load. Chrome or Edge will usually provide the best experience.

## Files included

- `index.html`
- `styles.css`
- `app.js`
- `chirai-romantic.jpg`
- `chirai-sanctuary.jpg`
- `chirai-adventurer.jpg`
- `chirai-daydreamer.jpg`
- `homepage-audio.mp3`
- `README.md`
- `.nojekyll`

## Upload to GitHub

1. Open your `daydreaming` repository.
2. Click **Add file → Upload files**.
3. Upload every file from this ZIP.
4. Replace the existing files.
5. Commit directly to `main`.
6. Wait 1–2 minutes for GitHub Pages to redeploy.
7. Hard refresh the live site.


## File-size optimisation

The supplied WAV has been converted to a 192 kbps MP3 so every individual
file remains below GitHub's 25 MB browser-upload limit. The audio remains
suitable for landing-page playback and the 15-second MP4 export.


## MP4 export fix

This build self-hosts `ffmpeg.js` and `814.ffmpeg.js` beside the website files.
That prevents the FFmpeg class worker from being created on a different CDN
origin. The large FFmpeg core is still fetched on demand for the first video
export so the GitHub repository remains below the upload-size limit.

The static story artwork is encoded at one frame per second. It remains a
15-second 1080 × 1920 MP4, but requires far less browser memory than encoding
450 identical frames at 30 fps.


## Archetype audio update

This build now uses:
- `homepage-audio.mp3` for the landing page / quiz experience
- `archetype-romantic.mp3` for **The Lifelong Romantic**
- `archetype-sanctuary.mp3` for **The Sanctuary Seeker**
- `archetype-adventurer.mp3` for **The Eternal Adventurer**
- `archetype-daydreamer.mp3` for **The Daydreamer**

The homepage track plays while fans fill out the quiz, and each exported 15-second MP4 now uses the matching archetype-specific audio snippet.
