import { expect, test, type Page, type Route } from "@playwright/test";

const backendRegex = /^https?:\/\/(127\.0\.0\.1|localhost):(8000|8001|8002|8010)\/.*/;

async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function mockBackend(page: Page) {
  await page.route(backendRegex, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === "GET" && path === "/") {
      return json(route, {
        service: "Deep Learning Signal Modulation Backend",
        version: "1.0.0",
        docs: "/docs",
        endpoints: [
          "/health",
          "/config",
          "/device",
          "/models",
          "/models/active",
          "/self-check",
          "/workflow/overview",
          "/report/summary",
          "/train",
          "/predict",
          "/predict/generated",
          "/upload/iq",
          "/predict/file",
        ],
      });
    }

    if (method === "GET" && path === "/health") {
      return json(route, {
        service: "Deep Learning Signal Modulation Backend",
        status: "ok",
        api_version: "1.0.0",
        device: "mps",
        model_ready: true,
        active_run_id: "run-e2e-001",
        last_model_path: "artifacts/models/run-e2e-001.pt",
      });
    }

    if (method === "GET" && path === "/config") {
      return json(route, {
        project_name: "Deep Learning Signal Modulation Backend",
        api_version: "1.0.0",
        host: "127.0.0.1",
        port: 8002,
        allow_origins: ["*"],
        artifact_dir: "backend/artifacts",
        models_dir: "backend/artifacts/models",
        uploads_dir: "backend/uploads",
        default_sample_rate: 1000000,
      });
    }

    if (method === "GET" && path === "/device") {
      return json(route, {
        active_device: "mps",
        mps_available: true,
        cuda_available: false,
      });
    }

    if (method === "GET" && path === "/models") {
      return json(route, [
        {
          run_id: "run-e2e-001",
          checkpoint_path: "backend/artifacts/models/run-e2e-001.pt",
          metadata_path: "backend/artifacts/metadata/run-e2e-001.json",
          created_at: "2026-01-01T10:00:00Z",
          best_val_accuracy: 0.88,
          sample_length: 128,
          sample_rate: 1200,
          device: "mps",
          is_active: true,
        },
      ]);
    }

    if (method === "GET" && path === "/models/active") {
      return json(route, {
        run_id: "run-e2e-001",
        checkpoint_path: "backend/artifacts/models/run-e2e-001.pt",
        metadata_path: "backend/artifacts/metadata/run-e2e-001.json",
        created_at: "2026-01-01T10:00:00Z",
        best_val_accuracy: 0.88,
        sample_length: 128,
        sample_rate: 1200,
        device: "mps",
        is_active: true,
      });
    }

    if (method === "GET" && path === "/self-check") {
      return json(route, {
        service: "Deep Learning Signal Modulation Backend",
        status: "ok",
        executed_at: "2026-01-01T10:00:00Z",
        overall_ok: true,
        active_model_ready: true,
        active_run_id: "run-e2e-001",
        results: [
          { id: "device", label: "Device detection", ok: true, detail: "MPS available." },
          { id: "waveform", label: "Waveform generation", ok: true, detail: "Generated waveform." },
          { id: "preprocess", label: "Waveform preprocessing", ok: true, detail: "Preprocessing ok." },
        ],
      });
    }

    if (method === "GET" && path === "/workflow/overview") {
      return json(route, {
        service: "Deep Learning Signal Modulation Backend",
        status: "ok",
        generated_at: "2026-01-01T10:00:00Z",
        active_model_ready: true,
        steps: [
          { id: "message", title: "Prepare message", detail: "Ready", ready: true },
          { id: "carrier", title: "Configure carrier", detail: "Ready", ready: true },
          { id: "modulation", title: "Generate modulation", detail: "Ready", ready: true },
          { id: "channel", title: "Apply channel", detail: "Ready", ready: true },
          { id: "demodulation", title: "Inspect recovered message", detail: "Ready", ready: true },
          { id: "ai", title: "Classify with AI", detail: "Ready", ready: true },
          { id: "report", title: "Generate report", detail: "Ready", ready: true },
        ],
      });
    }

    if (method === "POST" && path === "/report/summary") {
      const payload = request.postDataJSON() as { mode?: string };
      return json(route, {
        title: `${payload.mode ?? "AM"} backend summary`,
        generated_at: "2026-01-01T10:00:00Z",
        mode: payload.mode ?? "AM",
        signal_source: "analog",
        executive_summary: "Backend report generated successfully.",
        conventional_accuracy: 72,
        deep_learning_accuracy: 84,
        improvement: 12,
        modulation_index: 0.5,
        bandwidth: 200,
        estimated_snr: "34 dB",
        active_model_ready: true,
        sections: [{ heading: "Overview", body: "All backend report sections are available." }],
        viva_points: ["Backend report is available."],
        recommendations: ["Use deployed backend for prediction."],
        conclusion: "Backend summary route is working.",
      });
    }

    if (method === "POST" && path === "/train") {
      return json(route, {
        run_id: "run-e2e-001",
        device: "mps",
        epochs: 1,
        best_val_accuracy: 0.88,
      });
    }

    if (method === "POST" && (path === "/predict" || path === "/predict/generated" || path === "/predict/file")) {
      const label = path === "/predict/generated" ? "AM" : "FM";
      return json(route, {
        label,
        confidence: 0.91,
      });
    }

    if (method === "POST" && path === "/upload/iq") {
      const body = request.postDataBuffer()?.toString("utf-8") ?? "";
      if (body.includes("bad_waveform.txt")) {
        return json(route, { detail: "Uploaded waveform has too few numeric samples." }, 400);
      }
      return json(route, {
        sample_count: 96,
        file_name: "sample_waveform.csv",
      });
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ detail: `No mocked route for ${method} ${path}` }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
  await page.goto("/?e2e=1");
});

test("navigation, help, theory, and frequency controls work", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Signal Modulation Lab" })).toBeVisible();

  await page.getByTestId("header-page-help").click();
  await expect(page.getByText("How to use the Simulator page")).toBeVisible();
  await page.getByRole("button", { name: "Close help" }).click();

  await page.getByTestId("header-theory").click();
  await expect(page.getByRole("button", { name: "Back to graph" })).toBeVisible();
  await page.getByRole("button", { name: "Back to graph" }).click();

  await page.getByTestId("message-frequency-number").fill("0");
  await expect(page.getByTestId("message-frequency-number")).toHaveValue("0");
  await page.getByTestId("message-frequency-number").fill("10000");
  await expect(page.getByTestId("message-frequency-number")).toHaveValue("10000");

  await page.getByTestId("carrier-frequency-number").fill("0");
  await expect(page.getByTestId("carrier-frequency-number")).toHaveValue("0");
  await page.getByTestId("carrier-frequency-number").fill("100000");
  await expect(page.getByTestId("carrier-frequency-number")).toHaveValue("100000");

  for (const pageId of ["flow", "audio", "analysis", "backend", "simulator"] as const) {
    await page.getByTestId(`nav-${pageId}`).click();
    await expect(page.getByTestId(`nav-${pageId}`)).toBeVisible();
  }
});

test("audio lab text workflow and toggle work", async ({ page }) => {
  await page.getByTestId("nav-audio").click();
  await expect(page.getByText("Text Message Modulation")).toBeVisible();

  await page.getByTestId("audio-message-text").fill("HELLO FROM PLAYWRIGHT");
  await page.getByRole("button", { name: "Use text in graph" }).click();
  await expect(page.getByRole("button", { name: "Back to sine graph" })).toBeVisible();
  await expect(page.getByText("Binary preview:")).toBeVisible();

  await page.getByRole("button", { name: "Help for this page" }).click();
  await expect(page.getByText("How to use the Audio Lab page")).toBeVisible();
  await page.getByRole("button", { name: "Close help" }).click();

  await page.getByRole("button", { name: "Back to sine graph" }).click();
  await expect(page.getByRole("button", { name: "Use text in graph" })).toBeVisible();
});

test("analysis training, prediction, flow, and report generation work", async ({ page }) => {
  await page.getByTestId("nav-analysis").click();
  await expect(page.getByText("AI Analysis & Training")).toBeVisible();

  await page.getByRole("button", { name: "Train AM/FM Model" }).click();
  await expect(page.getByText(/Training complete\./)).toBeVisible({ timeout: 45000 });

  const dlToggle = page.getByRole("button", { name: /Use Deep Learning/i });
  await expect(dlToggle).toBeEnabled();
  await dlToggle.click();
  await expect(page.getByText(/DL trained but OFF|DL active/)).toBeVisible();
  await dlToggle.click();

  await page.getByRole("button", { name: "Predict Current Signal" }).click();
  await expect(page.getByText(/Prediction complete\./)).toBeVisible();

  await page.getByTestId("nav-flow").click();
  await expect(page.getByText("Full communication flow")).toBeVisible();
  await page.getByRole("button", { name: "Generate Report" }).click();
  await expect(page.getByText(/Communication Flow Report/)).toBeVisible();

  await page.getByRole("button", { name: "Run Full Communication Flow" }).click();
  await expect(page.getByText(/Full communication flow completed successfully\./)).toBeVisible({ timeout: 45000 });
});

test("backend page can refresh API, run smoke test, and run self-check", async ({ page }) => {
  await page.getByTestId("nav-backend").click();
  await expect(page.getByText("Backend & endpoint testing")).toBeVisible();

  await page.getByRole("button", { name: "Check API" }).click();
  await expect(page.getByText("run-e2e-001")).toBeVisible();

  await page.getByRole("button", { name: "Run API smoke test" }).click();
  await expect(page.getByText(/Passed \d+\/\d+/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("GET /health")).toBeVisible();

  await page.getByRole("button", { name: "Run self-check" }).click();
  await expect(page.getByText(/Last check:/)).toBeVisible();
});
