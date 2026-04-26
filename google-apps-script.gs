/**
 * Poping — coming-soon waitlist intake.
 *
 * Paste this into a new Google Apps Script bound to a Google Sheet.
 * Header row of the sheet: `timestamp | email | source | user_agent | referrer`.
 *
 * Deploy steps:
 *   1. Create a new Google Sheet (e.g. "Poping waitlist"). Add the header row above.
 *   2. Sheet → Extensions → Apps Script. Paste this whole file. Save.
 *   3. Deploy → New deployment → Type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Authorize the prompts (Drive + Sheets access).
 *   5. Copy the Web app URL (ends in `/exec`).
 *   6. Paste it into `coming-soon/script.js` as SHEETS_ENDPOINT.
 *   7. Re-deploy any time you change this script (Deploy → Manage deployments → Edit → Version: New).
 *
 * The frontend posts a JSON body as text/plain (no CORS preflight needed).
 * `doPost` parses, validates, and appends a row.
 */

const SHEET_NAME = ''; // leave empty to use the active sheet, or set a tab name

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const email = String(body.email || '').trim().toLowerCase();
    const source = String(body.source || 'unknown').slice(0, 64);
    const ua = String(body.ua || '').slice(0, 256);
    const ref = String(body.ref || '').slice(0, 256);

    if (!isValidEmail(email)) {
      return jsonResponse({ ok: false, error: 'invalid_email' }, 400);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('spreadsheet_unbound'); // script must be bound to a sheet
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    if (!sheet) throw new Error('sheet_missing');

    // Idempotency — skip if email already present in column B.
    // Guard against empty sheet (only the header row exists): getRange
    // with numRows=0 throws, so short-circuit when lastRow <= 1.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existing = sheet
        .getRange(2, 2, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(String)
        .map((s) => s.trim().toLowerCase());
      if (existing.includes(email)) {
        return jsonResponse({ ok: true, dedup: true });
      }
    }

    sheet.appendRow([new Date(), email, source, ua, ref]);
    return jsonResponse({ ok: true });
  } catch (err) {
    Logger.log(err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'server' }, 500);
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'poping-waitlist' });
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function jsonResponse(obj /* , statusCode */) {
  // Apps Script's TextOutput can't set HTTP status — clients should
  // rely on the body's `ok` boolean. Status arg kept for readability.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
