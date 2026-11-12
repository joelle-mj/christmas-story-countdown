// The Christmas Story — Home Screen countdown widget for the free Scriptable app (iOS).
// Setup: install Scriptable, add a new script, paste this in, then add a Scriptable
// widget (small or medium) to the Home Screen and pick this script.
// Tapping the widget opens the countdown website.

/* ===================== SETTINGS (same as the website) ===================== */
const CONFIG = {
  siteUrl: "https://joelle-mj.github.io/christmas-story-countdown/",
  // Performance start, Pacific time. Time not set yet → start of Dec 23.
  performanceLocal: "2026-12-23T00:00:00",
  utcOffset: "-08:00",
  endsLocal: "2026-12-24T00:00:00",     // after this: "Merry Christmas!"
  schoolWeekdays: [1, 2, 3, 4],          // Mon–Thu (0 = Sun)
  lastSchoolDayCounted: "2026-12-22",    // counts school days AFTER today through this date
  noSchoolDates: ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"] // Thanksgiving week
};
/* ========================================================================== */

const TARGET = new Date(CONFIG.performanceLocal + CONFIG.utcOffset).getTime();
const ENDS = new Date(CONFIG.endsLocal + CONFIG.utcOffset).getTime();
const DAY = 864e5;

function pacificDate(ms) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(ms));
  const g = t => p.find(x => x.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

function schoolDaysLeft(ms) {
  const off = new Set(CONFIG.noSchoolDates);
  const [y, mo, da] = pacificDate(ms).split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1, da));
  const last = new Date(CONFIG.lastSchoolDayCounted + "T00:00:00Z").getTime();
  let count = 0;
  for (d.setUTCDate(d.getUTCDate() + 1); d.getTime() <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (CONFIG.schoolWeekdays.includes(d.getUTCDay()) && !off.has(iso)) count++;
  }
  return count;
}

// Next midnight in Pacific time (PST in Nov/Dec), as a Date.
function nextPacificMidnight(ms) {
  const [y, mo, da] = pacificDate(ms).split("-").map(Number);
  const offH = -parseInt(CONFIG.utcOffset, 10); // 8
  return new Date(Date.UTC(y, mo - 1, da + 1, offH, 0, 5));
}

// Background image: download once, cache with FileManager so it works offline.
async function getBackground(small) {
  const name = small ? "widget-bg-small.jpg" : "widget-bg.jpg";
  const fm = FileManager.local();
  const dir = fm.joinPath(fm.documentsDirectory(), "christmas-story");
  if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
  const path = fm.joinPath(dir, name);
  const age = fm.fileExists(path) ? Date.now() - fm.modificationDate(path).getTime() : Infinity;
  if (age > 7 * DAY) {
    try {
      const img = await new Request(CONFIG.siteUrl + "images/" + name).loadImage();
      fm.writeImage(path, img);
      return img;
    } catch (e) { /* offline: fall back to cache */ }
  }
  return fm.fileExists(path) ? fm.readImage(path) : null;
}

function text(stack, str, font, color, opacity = 1) {
  const t = stack.addText(str);
  t.font = font;
  t.textColor = color;
  t.textOpacity = opacity;
  t.shadowColor = new Color("#000000", 0.55);
  t.shadowRadius = 3;
  t.shadowOffset = new Point(0, 1);
  t.minimumScaleFactor = 0.6;
  t.lineLimit = 1;
  return t;
}

async function build() {
  const family = config.widgetFamily || "medium";
  const small = family === "small";
  const now = Date.now();
  const state = now < TARGET ? "countdown" : (now < ENDS ? "tonight" : "after");

  const w = new ListWidget();
  w.url = CONFIG.siteUrl;
  w.refreshAfterDate = nextPacificMidnight(now);
  w.setPadding(small ? 14 : 16, small ? 14 : 18, small ? 14 : 16, small ? 14 : 18);

  const bg = await getBackground(small);
  if (bg) w.backgroundImage = bg;
  else {
    const g = new LinearGradient();
    g.colors = [new Color("#2f4250"), new Color("#8d5a2e")];
    g.locations = [0, 1];
    w.backgroundGradient = g;
  }

  const cream = new Color("#fbf4e4");
  const gold = new Color("#f0cd78");
  const serif = s => new Font("Georgia", s);
  const serifBold = s => new Font("Georgia-Bold", s);
  const serifItalic = s => new Font("Georgia-Italic", s);

  const col = w.addStack();
  col.layoutVertically();

  text(col, "✦ THE CHRISTMAS STORY", new Font("Georgia-Bold", small ? 10 : 12), gold);
  col.addSpacer(small ? 2 : 3);
  text(col, small ? "Wed, Dec 23" : "Wednesday, December 23, 2026", serifItalic(small ? 11 : 13), cream, 0.92);
  col.addSpacer();

  if (state === "countdown") {
    const days = Math.floor((TARGET - now) / DAY);
    const row = col.addStack();
    row.layoutHorizontally();
    row.bottomAlignContent();
    text(row, String(days), serifBold(small ? 44 : 50), cream);
    row.addSpacer(6);
    const lbl = row.addStack();
    lbl.layoutVertically();
    text(lbl, days === 1 ? "day" : "days", serif(small ? 14 : 16), cream);
    text(lbl, "to go", serif(small ? 14 : 16), cream, 0.9);
    lbl.addSpacer(small ? 6 : 8);
    col.addSpacer(small ? 4 : 6);
    const sd = schoolDaysLeft(now);
    if (sd > 0) text(col, `${sd} school ${sd === 1 ? "day" : "days"} left`, serifBold(small ? 12 : 14), gold);
  } else if (state === "tonight") {
    text(col, "Tonight’s", serifItalic(small ? 24 : 30), cream);
    text(col, "the night!", serifItalic(small ? 24 : 30), gold);
  } else {
    text(col, "Merry", serifItalic(small ? 26 : 30), cream);
    text(col, "Christmas!", serifItalic(small ? 26 : 30), gold);
  }
  return w;
}

const widget = await build();
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
