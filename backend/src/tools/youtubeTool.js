import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import ytSearch from "yt-search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const browserProfile = path.join(__dirname, "../../.jarvis-browser");
let context;
let page;

async function getBrowser() {
  // A user can close the visible Chromium window while the backend keeps
  // running. Discard that stale context before using it again.
  if (context) {
    try {
      const pages = context.pages();
      if (pages.length && pages.some((candidate) => !candidate.isClosed())) {
        page = pages.find((candidate) => !candidate.isClosed()) || page;
        return page;
      }
      await context.close().catch(() => {});
    } catch {
      // The context is already gone; create a fresh one below.
    }
    context = undefined;
    page = undefined;
  }

  if (!context) {
    console.log("Starting JARVIS browser...");
    context = await chromium.launchPersistentContext(browserProfile, { headless: false, args: ["--autoplay-policy=no-user-gesture-required"], viewport: { width: 1400, height: 900 } });
    page = context.pages()[0] || await context.newPage();
    console.log("JARVIS browser started.");
  }
  if (!page || page.isClosed()) {
    try {
      page = await context.newPage();
    } catch {
      context = undefined;
      page = undefined;
      return getBrowser();
    }
  }
  return page;
}

export async function playYoutube(query) {
  try {
    console.log(`Searching YouTube for: ${query}`);
    const results = await ytSearch(query);
    const video = results.videos?.[0];
    if (!video?.videoId) throw new Error(`No YouTube videos were found for "${query}".`);

    const browserPage = await getBrowser();
    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
    await browserPage.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    try { const consent = browserPage.getByRole("button", { name: /accept all|agree/i }).first(); if (await consent.isVisible({ timeout: 800 })) await consent.click(); } catch { /* optional dialog */ }
    const player = browserPage.locator("video").first();
    await player.waitFor({ state: "attached", timeout: 8000 });
    await browserPage.evaluate(() => { const media = document.querySelector("video"); if (media) { media.muted = false; media.volume = 1; media.play().catch(() => {}); } });
    return { success: true, action: "play_youtube", query, video: { id: video.videoId, title: video.title, url }, url, message: `Playing ${video.title}.` };
  } catch (error) { console.error("YouTube play error:", error); return { success: false, action: "play_youtube", error: error.message }; }
}

export async function pauseYoutube() { try { const p = await getBrowser(); await p.evaluate(() => document.querySelector("video")?.pause()); return { success: true, action: "pause_youtube", message: "YouTube playback paused." }; } catch (error) { return { success: false, action: "pause_youtube", error: error.message }; } }
export async function stopYoutube() { try { const p = await getBrowser(); await p.evaluate(() => { const video = document.querySelector("video"); if (video) { video.pause(); video.currentTime = 0; } }); return { success: true, action: "stop_youtube", message: "YouTube playback stopped." }; } catch (error) { return { success: false, action: "stop_youtube", error: error.message }; } }
export async function resumeYoutube() { try { const p = await getBrowser(); await p.evaluate(() => document.querySelector("video")?.play().catch(() => {})); return { success: true, action: "resume_youtube", message: "YouTube playback resumed." }; } catch (error) { return { success: false, action: "resume_youtube", error: error.message }; } }
export async function nextYoutube() { try { const p = await getBrowser(); const button = p.locator("button.ytp-next-button"); if (!(await button.isVisible().catch(() => false))) return { success: false, action: "next_youtube", message: "The YouTube next button was not available." }; await button.click(); return { success: true, action: "next_youtube", message: "Playing the next YouTube video." }; } catch (error) { return { success: false, action: "next_youtube", error: error.message }; } }
export async function setYoutubeVolume(level) { try { const numericLevel = Math.max(0, Math.min(100, Number(level))); if (!Number.isFinite(numericLevel)) throw new Error("Volume must be a number from 0 to 100."); const p = await getBrowser(); await p.evaluate((volume) => { const video = document.querySelector("video"); if (video) { video.volume = volume; video.muted = volume === 0; } }, numericLevel / 100); return { success: true, action: "set_youtube_volume", volume: numericLevel, message: `YouTube volume set to ${numericLevel} percent.` }; } catch (error) { return { success: false, action: "set_youtube_volume", error: error.message }; } }
