## 🛡️ Simple XSS Scanner – Basic XSS Vulnerability Scanner

### 📌 Description

This is a simple and basic script that uses Puppeteer to detect Cross-Site Scripting (XSS) vulnerabilities on a given website. It injects test payloads into input fields and checks for potential JavaScript execution.

### ⚡ Installation

#### 1️⃣ Clone the repository

```bash
git clone https://github.com/K4mD4m/Simple-XSS-Scanner.git
cd Simple-XSS-Scanner
```

#### 2️⃣ Install dependencies

```bash
npm install
```

### 🚀 Usage

To scan a website, run:

```bash
node index.js <URL>
```

#### 📌 Example:

```bash
node index.js https://example.com
```

After the scan, the report will be saved in the `report.json` file.

### 📄 Report Output

The scan results are stored in `report.json` in the following format:

```json
{
  "timestamp": "2025-02-15T12:34:56.789Z",
  "results": [
    {
      "url": "https://example.com",
      "payload": "<script>alert('XSS')</script>",
      "type": "executed"
    }
  ]
}
```

- **"executed"** → XSS vulnerability detected
- **"rejected"** → No execution detected

### 🛠️ Technologies Used

- **Node.js**
- **Puppeteer**

### ⚠️ Disclaimer

This tool is intended for **educational and security testing purposes only**. Do not use it without explicit permission from the website owner. The author is **not responsible for any misuse**.
