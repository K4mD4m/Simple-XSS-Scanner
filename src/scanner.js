const puppeteer = require("puppeteer");
const fs = require("fs");

/**
 * Attempts to navigate to a given URL with retries in case of failure.
 * @param {object} page - Puppeteer page object.
 * @param {string} url - Target URL.
 * @param {number} retries - Number of retries before failing.
 * @returns {boolean} - Returns true if navigation succeeds, otherwise false.
 */
async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
      return true;
    } catch (error) {
      console.log(
        `⚠️ Navigation error: ${error.message}. Retrying (${
          i + 1
        }/${retries})...`
      );
    }
  }
  return false;
}

/**
 * Scans a given URL for XSS vulnerabilities by injecting payloads into input fields.
 * @param {string} targetUrl - The URL to scan.
 */
async function scanForXSS(targetUrl) {
  console.log(`🔍 Scanning ${targetUrl} for XSS vulnerabilities...\n`);

  // Load XSS payloads from a JSON file.
  const payloads = JSON.parse(
    fs.readFileSync("./payloads/xss_payloads.json", "utf8")
  );
  let results = [];
  let xssDetected = false;
  let detectedPayload = null;

  // Launch Puppeteer browser in headless mode.
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Event listener for JavaScript alert/dialog detection (possible XSS execution).
  page.on("dialog", async (dialog) => {
    console.log(`🚨 XSS Alert detected: ${dialog.message()}\n`);

    xssDetected = true;
    detectedPayload =
      results.length > 0 ? results[results.length - 1].payload : "UNKNOWN";

    results.push({
      url: targetUrl,
      payload: detectedPayload,
      type: "executed",
    });

    await dialog.accept();
  });

  // Navigate to the target URL.
  const navigated = await safeGoto(page, targetUrl);
  if (!navigated) {
    console.log("❌ Failed to load the target page after multiple attempts.");
    await browser.close();
    return;
  }

  // Retrieve all frames (including iframes) in the page.
  const frames = page.frames();

  for (const frame of frames) {
    try {
      const frameUrl = frame.url();

      // Skip frames without a URL or cross-origin frames.
      if (!frameUrl || frameUrl.startsWith("chrome-error://")) {
        console.log(`⏭️ Skipping inaccessible frame: ${frameUrl}`);
        continue;
      }

      console.log(`🔎 Checking frame: ${frameUrl}`);

      // Select all input fields in the frame.
      const inputFields = await frame.$$(
        "textarea, input, [contenteditable='true']"
      );
      if (inputFields.length === 0) {
        console.log("⚠️ No input fields found in this frame.\n");
        continue;
      }

      for (const payload of payloads) {
        if (xssDetected) {
          console.log(
            `✅ XSS already detected with payload: ${detectedPayload}, skipping further tests.`
          );
          break;
        }

        console.log(`🔹 Testing with payload: ${payload}...`);

        try {
          let payloadInjected = false;

          for (const inputField of inputFields) {
            console.log("✅ Found input field.");
            console.log("💉 Injecting payload...");
            await inputField.focus();
            await frame.evaluate((el) => (el.value = ""), inputField);
            await inputField.type(payload);
            payloadInjected = true;

            // Try to find a submit button and click it.
            const submitButton = await frame.$(
              "input[type=submit], button, form"
            );
            if (submitButton) {
              console.log("🖱️ Clicking submit button...");
              await submitButton.click();
            } else {
              console.log("🔄 No submit button found. Trying Enter key...");
              await inputField.press("Enter");
            }

            console.log(`⏳ Waiting to see if payload executes...\n`);
            await new Promise((r) => setTimeout(r, 3000));

            if (xssDetected) break;
          }

          if (payloadInjected) {
            results.push({
              url: targetUrl,
              payload: payload,
              type: xssDetected ? "executed" : "rejected",
            });
          }
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          if (error.message.includes("Execution context was destroyed")) {
            console.log("🔄 Re-navigating to the page...");
            await new Promise((r) => setTimeout(r, 2000));
            await safeGoto(page, targetUrl);
          }
        }
      }
    } catch (frameError) {
      console.log(`⚠️ Error accessing frame: ${frameError.message}`);
    }
  }

  await browser.close();

  // Save results to a JSON file.
  if (results.length > 0) {
    await fs.promises.writeFile(
      "report.json",
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    );
    console.log("📄 Report saved to report.json\n");
  } else {
    console.log("❌ No results to save. No XSS found.\n");
  }
}

// Export the function as a module.
module.exports = scanForXSS;
