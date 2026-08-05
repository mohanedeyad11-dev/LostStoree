import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Verify PayPal Order from Server
  app.post("/api/verify-paypal", async (req, res) => {
    const { orderId, expectedAmount, currency } = req.body;

    let clientId = (process.env.VITE_PAYPAL_CLIENT_ID || "").trim();
    let clientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();

    console.log("PAYPAL SERVER CONFIG CHECK:");
    console.log("- Client ID:", clientId ? `${clientId.substring(0, 5)}...` : "MISSING");
    console.log("- Secret Key:", clientSecret ? `${clientSecret.substring(0, 5)}...` : "MISSING");

    if (!clientId || !clientSecret) {
      console.error("PayPal credentials missing in server environment");
      return res.status(500).json({ 
        success: false, 
        error: "Server Configuration Error",
        message: "Missing PayPal Secret or Client ID in Settings -> Environment Variables. Please add PAYPAL_CLIENT_SECRET." 
      });
    }

    // DIAGNOSTIC CORE: Detect common swap or duplication mistakes
    if (clientId === clientSecret) {
      return res.status(400).json({
        success: false,
        error: "Configuration Error",
        message: "Your Client ID and Secret are identical. Please ensure you copied TWO different strings from PayPal."
      });
    }

    if (clientId.startsWith('E') && clientSecret.startsWith('A')) {
      return res.status(400).json({
        success: false,
        error: "Credential Swap Detected",
        message: "It looks like you put the 'Client Secret' in the 'Client ID' field and vice versa. Please swap them in Settings -> Environment Variables."
      });
    }

    try {
      // Improved Environment Detection
      let baseUrl = "https://api-m.paypal.com";
      
      const isSandboxId = clientId.startsWith('AZ') || clientId === 'sb' || clientId.length < 30 || clientId.startsWith('A_');
      if (isSandboxId) {
        baseUrl = "https://api-m.sandbox.paypal.com";
      }

      console.log(`Attempting PayPal Auth with ClientID: ${clientId.substring(0, 5)}... on ${baseUrl}`);

      // 1. Get Access Token from PayPal
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      
      async function getAuthToken(targetUrl: string) {
        try {
          return await fetch(`${targetUrl}/v1/oauth2/token`, {
              method: "POST",
              body: "grant_type=client_credentials",
              headers: {
                Authorization: `Basic ${authHeader}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            });
        } catch (e) {
          return null;
        }
      }

      let authResponse = await getAuthToken(baseUrl);

      // AUTOMATIC MODE DETECTION: If production fails with invalid_client, try sandbox
      if ((!authResponse || (!authResponse.ok)) && baseUrl === "https://api-m.paypal.com") {
        const checkRes = authResponse ? await authResponse.clone() : null;
        const errorText = checkRes ? await checkRes.text() : "";
        
        if (!authResponse || errorText.includes('invalid_client') || errorText.includes('UNAUTHORIZED')) {
            console.log("Production auth rejected/failed, trying Sandbox bridge...");
            const sandboxRes = await getAuthToken("https://api-m.sandbox.paypal.com");
            if (sandboxRes && sandboxRes.ok) {
              baseUrl = "https://api-m.sandbox.paypal.com";
              authResponse = sandboxRes;
              console.log("Successfully shifted to Sandbox mode.");
            }
        }
      }

      if (!authResponse || !authResponse.ok) {
        const errorData = authResponse ? await authResponse.json() : { error: "Network Error" };
        console.error("PayPal Auth Final Failure:", errorData);
        return res.status(401).json({ 
            success: false, 
            error: "Authentication Failed", 
            message: "PayPal rejected your Client ID or Client Secret. Please double-check them in Settings -> Environment Variables. Make sure you are using 'Client ID' and 'Secret' from the SAME PayPal App.",
            debug: { baseUrl, error: errorData }
        });
      }

      const authData = await authResponse.json();
      const access_token = authData.access_token;

      // 2. Fetch Order Details from PayPal REST API
      const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!orderResponse.ok) {
        return res.status(400).json({ success: false, error: "Order not found on PayPal" });
      }

      const orderData = await orderResponse.json();

      // 3. SECURE VERIFICATION
      const isCompleted = orderData.status === 'COMPLETED';
      const capture = orderData.purchase_units?.[0]?.payments?.captures?.[0];
      const captureStatus = capture?.status === 'COMPLETED';
      const actualAmount = parseFloat(capture?.amount?.value || "0");
      const actualCurrency = capture?.amount?.currency_code;
      
      const expectedAmountNum = parseFloat(expectedAmount);
      const expectedCurrency = currency === 'JOD' ? 'USD' : currency;

      const isAmountCorrect = Math.abs(actualAmount - expectedAmountNum) < 0.05;
      const isCurrencyCorrect = actualCurrency === expectedCurrency;

      console.log("SERVER SIDE AUDIT:", {
        orderId,
        status: orderData.status,
        captureStatus: capture?.status,
        amount: actualAmount,
        expected: expectedAmountNum,
        isAmountCorrect,
        isCurrencyCorrect
      });

      if (isCompleted && captureStatus && isAmountCorrect && isCurrencyCorrect) {
        return res.json({ success: true, message: "Order Verified and Settled" });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: "Verification Failed: Funds not settled or amount mismatch.",
          details: { isCompleted, captureStatus, isAmountCorrect, isCurrencyCorrect }
        });
      }
    } catch (error) {
      console.error("PayPal Verification Error:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
