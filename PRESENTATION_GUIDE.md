# PRESENTATION GUIDE — Signal Modulation Lab

**For judges, viva, and live demonstrations**

This guide covers every feature, button, parameter, and recommended demo flow for presenting this project.

---

## TABLE OF CONTENTS

1. [Landing Page Walkthrough](#1-landing-page-walkthrough)
2. [Main Header — Every Button Explained](#2-main-header--every-button-explained)
3. [Simulator Page — Complete Guide](#3-simulator-page--complete-guide)
4. [Recommended Parameter Values](#4-recommended-parameter-values)
5. [Flow & Report Page](#5-flow--report-page)
6. [Audio Lab Page](#6-audio-lab-page)
7. [AI Analysis Page](#7-ai-analysis-page)
8. [Backend & Tests Page](#8-backend--tests-page)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Auto Demo Script](#10-auto-demo-script)
11. [Viva Q&A — Common Judge Questions](#11-viva-qa--common-judge-questions)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. LANDING PAGE WALKTHROUGH

### What judges see first

**Top badge**: "🔴 DEEP LEARNING ENHANCED · LIVE DEMO" — pulsing red dot shows it's a live system, not a static presentation.

**Title**: "Signal Modulation Using Deep Learning" — animated gradient text cycles through sky → violet → emerald colors.

**Description**: "Our AI-powered system achieves **85%+ accuracy** in modulation classification, outperforming traditional methods by up to **20%**."

**Three stat cards** (animated on load):
- **85%+** AI Accuracy (emerald glow)
- **3×** Faster Processing (sky glow)
- **3** Modulation Types (violet glow)

**Two CTA buttons**:
- **Enter Laboratory** (gradient sky-to-violet) — main entry point
- **Explore Features** (glass border) — same as Enter Laboratory

**"How It Works" section** (4 steps):
1. **Generate Signal** — A cosine message at 10 kHz rides on a 100 kHz carrier
2. **Modulate** — AM, FM, or PM math transforms the carrier waveform
3. **Add Noise** — AWGN, Rayleigh, or Impulse noise simulates a real channel
4. **AI Classifies** — 1D-CNN identifies the modulation type with 85%+ accuracy

**Mini waveform decoration** — 21 animated bars pulsing up and down at the bottom.

### What to say

> "This is a complete signal modulation laboratory built in the browser. It demonstrates three classical modulation techniques — AM, FM, and PM — and uses a deep learning classifier to identify them automatically. The system achieves 85% accuracy, which is 15 percentage points better than traditional rule-based analysis. Let me show you how it works."

---

## 2. MAIN HEADER — EVERY BUTTON EXPLAINED

After clicking "Enter Laboratory", you see the main app with a header containing:

### Navigation Tabs (5 tabs)

| Tab | What it does |
|---|---|
| **Simulator** | Main page — tune signal parameters, see live waveforms, capture snapshots |
| **Flow & Report** | Shows the full communication flow diagram + downloadable project report |
| **Audio Lab** | Type text messages, hear modulated audio, record and play back |
| **AI Analysis** | Train the deep learning model, see accuracy comparison, view proof of improvement |
| **Backend & Tests** | Connect to Python FastAPI backend for PyTorch training (optional) |

### Action Buttons (right side of header)

| Button | What it does | When to use it |
|---|---|---|
| **Page Help** (violet) | Opens a modal explaining the current page's features | When judges ask "what does this page do?" |
| **Light / Dark** (amber) | Toggles between dark mode (default) and light mode | If projector washes out dark backgrounds |
| **Theory about AM/FM** (sky) | Opens a modal with mathematical formulas and theory | When judges ask about the math behind modulation |
| **Export CSV** (amber) | Downloads current waveform data as CSV | To show raw data can be exported for analysis |
| **Auto Demo** (violet-sky gradient) | Runs a 30-second automated demo | **Use this first** — it shows everything automatically |
| **Train Model** (emerald) | Trains the deep learning classifier | After showing waveforms, before prediction |
| **Predict Current Waveform** (sky) | Runs the trained model on the current signal | After training, to show classification result |
| **Run Full Flow** (violet) | Executes the complete communication pipeline | To demonstrate end-to-end signal processing |
| **Download Report** (emerald) | Generates and downloads a PDF project report | For judges to take away documentation |

### Keyboard Shortcuts (press `?` to see full list)

- **A** — Switch to AM mode
- **F** — Switch to FM mode
- **P** — Switch to PM mode
- **T** — Train the AI model
- **Space** — Capture waveform snapshot
- **?** — Toggle keyboard shortcuts panel
- **Esc** — Close any open modal

---

## 3. SIMULATOR PAGE — COMPLETE GUIDE

### Top Section — Metric Cards (4 cards)

| Card | What it shows | Why it matters |
|---|---|---|
| **Current mode** | AM / FM / PM | Shows which modulation is active |
| **Signal source** | Text message / Sine waveform | Shows whether you're modulating typed text or a pure sine |
| **Sample rate** | 1,000,000 Hz (default) | Higher = more accurate waveform, but slower |
| **Active accuracy view** | 72.0% (traditional) or 87.3% (deep learning) | Live accuracy — updates as you change noise |

### Signal Controls Panel

**Mode Switcher** (3 tall cards):
- **AM** (sky) — Amplitude Modulation
- **FM** (emerald) — Frequency Modulation
- **PM** (violet) — Phase Modulation

Click any card to switch modes. The active mode has a colored glow and a sliding indicator.

**Parameter Sliders** (each has a number input + range slider + progress bar):

| Parameter | What it controls | Typical range | What happens when you change it |
|---|---|---|---|
| **Message Amplitude** | Height of the information signal | 0.5 – 2.0 V | Higher = stronger modulation depth |
| **Message Frequency** | Speed of the information signal | 5,000 – 20,000 Hz | Higher = faster oscillations in the message |
| **Carrier Amplitude** | Height of the high-frequency carrier | 1.0 – 4.0 V | Higher = louder transmitted signal |
| **Carrier Frequency** | Speed of the carrier wave | 50,000 – 150,000 Hz | Higher = more cycles per second in the carrier |
| **Frequency Deviation** (FM/PM only) | How much the frequency swings | 2,000 – 15,000 Hz | Higher = wider frequency spread |
| **Phase** | Starting angle of the carrier | 0 – 6.28 rad (0 – 2π) | Shifts the waveform left/right |
| **Noise Level** | Amount of random interference | 0.00 – 0.30 | Higher = more distortion, lower accuracy |
| **Duration** | Length of the waveform | 0.0005 – 0.003 s | Longer = more cycles visible |
| **Sample Rate** | Points per second | 500,000 – 2,000,000 Hz | Higher = smoother waveform |

**Action Buttons** (below sliders):
- **Capture Snapshot** — Saves current waveform as an orange dashed reference line
- **Clear Snapshot** — Removes the saved reference
- **Reset to Preset** — Restores default values for the current mode
- **Export CSV** — Downloads waveform data

### Waveform Preview Section

**Formula Card** (left):
- Shows the exact mathematical formula for the current mode
- Example for AM: `s(t) = Ac · [1 + μ·cos(2π·fm·t)] · cos(2π·fc·t)`
- Updates when you switch modes

**SNR Live Gauge** (right):
- **Big number** — SNR value in dB (e.g. "32.0 dB")
- **Color-coded badge** — Ideal (green) / Good (sky) / Degraded (amber) / Severe (red)
- **20-segment bar** — fills from left (red=bad) to right (green=good)
- **Quick nav buttons** — Flow & Report, AI Analysis, Audio Lab, Open theory

**Mode-Change Callout** (appears when you switch modes):
- Animated banner explaining what changed
- Example: "Switched AM to FM: Amplitude is now constant. Instantaneous frequency swings ±8000 Hz around the 100000 Hz carrier. Beta = 0.80."
- Auto-dismisses after 4.5 seconds or click X to close

### Three Individual Graphs (full-width stacked)

Each graph is 340px tall with:
- **Pulsing dot indicator** next to the title
- **Colored border** matching the signal (sky/emerald/violet)
- **Scan-line sweep** — a vertical beam sweeps across every 4 seconds
- **Axis labels** — "Time (s)" on X-axis, "Amplitude (V)" on Y-axis
- **Animated line drawing** — lines draw themselves in when the graph loads

| Graph | What it shows | Color | What to look for |
|---|---|---|---|
| **Message Signal — m(t)** | The information you want to send | Sky blue | A slow sine wave (10 kHz default) |
| **Carrier Signal — c(t)** | The high-frequency wave that carries the message | Emerald green (dashed) | A fast sine wave (100 kHz default) |
| **Modulated Signal — s(t)** | The final transmitted signal | Violet | The carrier "shaped" by the message |

**Snapshot overlay**: If you captured a snapshot, an orange dashed line appears on the modulated graph showing the saved waveform for comparison.

### Combined Signal View (full-width, 380px tall)

- Shows all three signals overlaid on one shared time axis
- **Legend** in the top-right corner labels each line
- **Dual-color glow shadow** (sky + violet) around the card
- Use this to see how the message "rides" on the carrier

---

## 4. RECOMMENDED PARAMETER VALUES

### For AM (Amplitude Modulation)

**Goal**: Show clear envelope variation — the amplitude of the carrier should visibly change with the message.

| Parameter | Recommended Value | Why |
|---|---|---|
| Message Amplitude | **1.2 V** | Creates visible modulation without over-modulation |
| Message Frequency | **10,000 Hz** | Slow enough to see envelope changes clearly |
| Carrier Amplitude | **2.6 V** | Twice the message amplitude → modulation index μ ≈ 0.46 (safe) |
| Carrier Frequency | **100,000 Hz** | 10× the message frequency → clear separation |
| Frequency Deviation | 8,000 Hz (not used in AM) | Ignored for AM |
| Phase | **0 rad** | Start at zero for simplicity |
| Noise Level | **0.05** (low) or **0.15** (medium) | 0.05 = clean demo, 0.15 = shows robustness |
| Duration | **0.0012 s** (1.2 ms) | Shows 12 message cycles, 120 carrier cycles |
| Sample Rate | **1,000,000 Hz** | Smooth waveform without lag |

**What judges will see**: The carrier's amplitude grows and shrinks in sync with the message. The envelope traces out the message waveform.

**Modulation index μ = Am / Ac = 1.2 / 2.6 ≈ 0.46** — this is safe (μ < 1 avoids over-modulation).

---

### For FM (Frequency Modulation)

**Goal**: Show the carrier frequency changing — the spacing between peaks should vary.

| Parameter | Recommended Value | Why |
|---|---|---|
| Message Amplitude | **1.2 V** | Standard reference |
| Message Frequency | **10,000 Hz** | Slow enough to see frequency changes |
| Carrier Amplitude | **2.6 V** | Constant amplitude (key FM property) |
| Carrier Frequency | **100,000 Hz** | Center frequency |
| Frequency Deviation | **8,000 Hz** | Carrier swings 92 kHz – 108 kHz |
| Phase | **0 rad** | Start at zero |
| Noise Level | **0.05** or **0.15** | Same as AM |
| Duration | **0.0012 s** | Same as AM for fair comparison |
| Sample Rate | **1,000,000 Hz** | Smooth waveform |

**What judges will see**: The carrier's amplitude stays constant, but the peaks get closer together (higher frequency) and farther apart (lower frequency) as the message changes.

**Modulation index β = Δf / fm = 8000 / 10000 = 0.8** — moderate deviation, easy to see.

---

### For PM (Phase Modulation)

**Goal**: Show the carrier phase shifting — the waveform shifts left/right in time.

| Parameter | Recommended Value | Why |
|---|---|---|
| Message Amplitude | **1.2 V** | Standard reference |
| Message Frequency | **10,000 Hz** | Slow enough to see phase shifts |
| Carrier Amplitude | **2.6 V** | Constant amplitude (like FM) |
| Carrier Frequency | **100,000 Hz** | Center frequency |
| Frequency Deviation | **8,000 Hz** | Used to compute phase sensitivity kp |
| Phase | **0 rad** | Start at zero |
| Noise Level | **0.05** or **0.15** | Same as AM/FM |
| Duration | **0.0012 s** | Same as AM/FM |
| Sample Rate | **1,000,000 Hz** | Smooth waveform |

**What judges will see**: The carrier's amplitude stays constant, but the waveform shifts horizontally (phase changes) as the message changes. Harder to see than AM/FM — use the combined graph.

**Phase sensitivity kp = Δf / Am = 8000 / 1.2 ≈ 6667 rad/V** — the phase shifts proportionally to the message voltage.

---

### Quick Comparison Table

| Property | AM | FM | PM |
|---|---|---|---|
| **What varies** | Amplitude | Frequency | Phase |
| **Carrier amplitude** | Changes | Constant | Constant |
| **Envelope shape** | Matches message | Flat | Flat |
| **Frequency spread** | Narrow | Wide (±Δf) | Wide (±kp·Am) |
| **Easiest to see** | Yes (envelope) | Medium (peak spacing) | Hard (phase shift) |
| **Traditional accuracy** | ~74% | ~72% | ~69% |
| **Deep learning accuracy** | ~89% | ~87% | ~85% |


---

## 5. FLOW & REPORT PAGE

### What it shows

**Top section**: A visual flowchart of the complete communication system:
1. Message Source → 2. Modulator → 3. Channel (with noise) → 4. Demodulator → 5. AI Classifier → 6. Output

**Bottom section**: A downloadable project report card with:
- Project title and description
- Key features list
- Technology stack (React, TypeScript, TensorFlow.js, Recharts)
- Accuracy comparison table
- Download Report button (generates PDF)

### What to say

> "This page shows the complete signal flow from message to classification. The message is modulated, transmitted through a noisy channel, demodulated, and then classified by our deep learning model. The report summarizes the entire project and can be downloaded as a PDF for documentation."

---

## 6. AUDIO LAB PAGE

### What it shows

**Text Message Input** (top):
- Large textarea where you type a message (e.g. "HELLO THIS IS AM MODULATION")
- Each character becomes 8 bits, each bit becomes a rectangular pulse
- **Live modulated text signal chart** below the textarea shows:
  - Purple line = AM/FM/PM modulated carrier
  - Blue dashed line = raw bit stream
  - Updates in real time as you type

**Audio Controls** (middle):
- **Play Modulated Audio** — converts the current waveform to sound and plays it through your speakers
- **Record Audio** — captures microphone input for X seconds
- **Stop Playback** — stops the audio
- **Download WAV** — saves the audio as a .wav file

**Recorded Waveform** (bottom):
- Shows the captured audio waveform if you recorded from the microphone
- Useful for demonstrating real-world signal capture

### What to say

> "In the Audio Lab, you can type a text message and see it modulated in real time. The purple waveform is the AM/FM/PM modulated carrier, and the blue dashed line is the raw bit stream. You can also play the modulated signal as audio — AM sounds like a tone with volume changes, FM sounds like a siren, and PM sounds like a warbling tone. This demonstrates how digital data is converted to analog signals for transmission."

### Recommended demo

1. Type "HELLO" in the textarea
2. Watch the live chart update — you'll see 40 bits (5 characters × 8 bits each)
3. Click "Play Modulated Audio" — you'll hear the modulated tone
4. Switch from AM to FM using the keyboard shortcut `F`
5. Click "Play Modulated Audio" again — the sound changes because the modulation changed

---

## 7. AI ANALYSIS PAGE

### What it shows

This is the **most important page for judges** — it proves the deep learning improvement.

**Top section**: Training Dataset Preview
- Three mini graphs showing synthetic AM, FM, and PM training samples
- Each graph is 120px tall, color-coded (sky/emerald/violet)

**Middle section**: Proof of Accuracy Improvement
- **Three big number cards**:
  - Without Deep Learning: ~72% (amber)
  - With Deep Learning: ~87% (emerald)
  - Improvement: +15% (sky)
- **Animated side-by-side bars**: Traditional (amber) vs Deep Learning (emerald/cyan)
- **Noise vs Accuracy proof table**: 6 rows showing accuracy at different noise levels
- **Per-class breakdown**: AM / FM / PM individual accuracy for both methods
- **Methodology comparison**: Why traditional fails vs why DL wins
- **Viva answer paragraph**: Ready-made answer you can read verbatim

**"Why 100% is impossible" panel** (red border):
- Explains the FM vs PM overlap problem
- Explains the noise floor limit
- Shows achievable accuracy by noise level
- Lists what was improved in this version (256 points, 300 samples, 15 epochs, 64 neurons, 2 layers, 8 engineered features)

**Right sidebar**: Training Status
- Progress bar during training
- Loss / Accuracy / Traditional / Deep learning tiles
- Backend training history chart (if using Python backend)

### What to say

> "This page proves that deep learning improves accuracy. Without AI, the system uses fixed rules and achieves 72% accuracy. After training a 2-layer convolutional neural network on 900 synthetic waveforms, accuracy jumps to 87% — a gain of 15 percentage points. The table shows that this improvement holds across all noise levels. The red panel explains why 100% accuracy is physically impossible — FM and PM signals overlap in feature space when noise is present, which is a fundamental information-theoretic limit."

### Recommended demo

1. Click **Train Model** in the header (or press `T`)
2. Watch the progress bar — training takes ~10 seconds for 15 epochs
3. Point out the accuracy climbing from ~0.33 (random) to ~0.87 (trained)
4. After training, click **Predict Current Waveform**
5. Show the prediction result — e.g. "AM (89.2%)"
6. Switch to FM mode (press `F`), click Predict again — it should correctly identify FM
7. Scroll down to the "Why 100% is impossible" panel and read the viva answer

---

## 8. BACKEND & TESTS PAGE

### What it shows

**Backend Integration** (top):
- Input field for FastAPI backend URL (default: http://localhost:8000)
- **Test Connection** button — pings the backend to check if it's running
- **Train on Backend** button — sends training data to Python and gets back a PyTorch-trained model
- Connection status indicator (green = connected, red = disconnected)

**Test Suite** (bottom):
- **Run All Tests** button — executes a suite of unit tests
- Test results table showing pass/fail for each test
- Tests cover: signal generation, modulation, noise addition, classifier prediction

### What to say

> "This page is optional. If you have a Python FastAPI backend running, you can train the model using PyTorch instead of the browser's TensorFlow.js. This is faster and more accurate for large datasets. The test suite validates that all signal processing functions work correctly."

### When to use it

- If judges ask "can this integrate with a real backend?"
- If you want to show PyTorch training (requires running `python backend/main.py` first)
- If judges ask about testing and validation

---

## 9. KEYBOARD SHORTCUTS

Press `?` at any time to see the full list. The shortcuts work on any page (except when typing in an input field).

| Key | Action | When to use it |
|---|---|---|
| **A** | Switch to AM mode | Quick mode switching during demo |
| **F** | Switch to FM mode | Quick mode switching during demo |
| **P** | Switch to PM mode | Quick mode switching during demo |
| **T** | Train the AI model | Faster than clicking the button |
| **Space** | Capture waveform snapshot | Quick snapshot during live demo |
| **?** | Toggle keyboard shortcuts panel | Show judges the shortcuts |
| **Esc** | Close any open modal | Quick exit from help/theory |

### Pro tip for live demo

Use keyboard shortcuts instead of clicking buttons — it looks more professional and is faster. For example:
1. Press `A` to load AM
2. Press `Space` to capture snapshot
3. Press `F` to switch to FM
4. Press `T` to train
5. Press `?` to show the shortcuts panel to judges

---

## 10. AUTO DEMO SCRIPT

### What it does

The **Auto Demo** button runs a fully automated 30-second demonstration. Use this at the start of your presentation to show everything without manual interaction.

### The 8-step sequence

| Step | What happens | Duration | What judges see |
|---|---|---|---|
| 1 | Load AM preset | 2s | Mode switches to AM, graphs update |
| 2 | Capture snapshot | 2s | Orange dashed reference line appears |
| 3 | Ramp noise 0.05 → 0.25 | 5s | Waveform visibly degrades, SNR gauge turns red |
| 4 | Switch to FM | 2s | Mode changes, callout banner explains the difference |
| 5 | Switch to PM | 2s | Mode changes again, callout explains phase modulation |
| 6 | Return to AM, reset noise | 2s | Clean signal restored for training |
| 7 | Train the AI model | 10s | Navigates to AI Analysis, training runs, accuracy appears |
| 8 | Predict current waveform | 3s | Prediction result shown with confidence |

**Total time**: ~30 seconds

### The live overlay

While the demo runs, a floating panel appears at the bottom of the screen showing:
- **Pulsing violet dot** — live indicator
- **Current step description** — e.g. "Step 3 / 8 — Increasing noise to simulate a real channel…"
- **Gradient progress bar** — violet → sky → emerald, fills from 0% to 100%
- **8 step dots** — fill as each stage completes
- **Stage labels** — AM preset / Noise / FM·PM / Train AI / Result
- **Stop button** — click to abort at any point

### When to use it

- **At the start of your presentation** — let judges watch the full demo first, then explain details
- **If time is limited** — the demo covers everything in 30 seconds
- **If judges are impatient** — they can see the result immediately without waiting for you to click through

### What to say

> "Let me show you the Auto Demo. This runs a complete demonstration automatically — it loads AM, captures a snapshot, increases noise to show degradation, switches to FM and PM, trains the deep learning model, and shows the prediction result. Watch the live overlay at the bottom — it shows the current step and progress. The entire demo takes 30 seconds."

---

## 11. VIVA Q&A — COMMON JUDGE QUESTIONS

### Q1: What is the difference between AM, FM, and PM?

**Answer**: 
- **AM (Amplitude Modulation)**: The amplitude of the carrier varies with the message. The envelope traces out the message waveform. Used in AM radio.
- **FM (Frequency Modulation)**: The instantaneous frequency of the carrier varies with the message. The amplitude stays constant. Used in FM radio and TV audio.
- **PM (Phase Modulation)**: The instantaneous phase of the carrier varies with the message. The amplitude stays constant. Used in digital communication systems.

**Show them**: Switch between AM/FM/PM modes and point to the graphs. The mode-change callout will explain what changed.

---

### Q2: How does deep learning improve accuracy?

**Answer**: Traditional methods use fixed mathematical rules — envelope detection for AM, zero-crossing rate for FM, spectral centroid for PM. These rules break down under noise. Deep learning trains a 2-layer convolutional neural network on 900 synthetic waveforms (300 per class) and learns to recognize modulation patterns directly from the signal shape. The model extracts 8 engineered features (envelope variance, zero-crossing rate, crest factor, instantaneous frequency variance) plus the raw waveform, giving it both pattern recognition and physics-based cues. This achieves 87% accuracy compared to 72% for traditional methods — a gain of 15 percentage points.

**Show them**: Go to AI Analysis page, scroll to the "Proof of Accuracy Improvement" section, and point to the three big number cards and the noise vs accuracy table.

---

### Q3: Why can't you achieve 100% accuracy?

**Answer**: 100% accuracy is physically impossible because AM, FM, and PM signals share the same carrier frequency and overlap in feature space when noise is present. Specifically, FM and PM are mathematically related — FM is the integral of PM. When noise is added, the instantaneous phase of an FM signal and the phase of a PM signal become indistinguishable at certain parameter combinations. At noise level 0.25, the SNR drops to ~20 dB, and the noise amplitude is 25% of the signal. At this level, the envelope of an FM signal can fluctuate enough to look like AM modulation to any classifier. This is a Shannon information-theoretic limit, not a model weakness.

**Show them**: Scroll to the red "Why 100% is impossible" panel on the AI Analysis page and read the viva answer paragraph.

---

### Q4: What signal are you modulating?

**Answer**: The message signal is a pure cosine wave at 10 kHz with amplitude 1.2 V. This represents the information we want to transmit — like an audio tone in a radio system. The carrier is also a cosine wave, but at a much higher frequency — 100 kHz with amplitude 2.6 V. The carrier is the high-frequency wave that actually gets transmitted. The message "rides" on the carrier through AM, FM, or PM modulation.

**Show them**: Point to the formula card on the Simulator page and the three individual graphs (message, carrier, modulated).

---

### Q5: How is the deep learning model trained?

**Answer**: The model is a 2-layer convolutional neural network with 64 neurons in the first hidden layer and 32 in the second. It takes 264 inputs — 256 raw waveform points plus 8 engineered features. The output is a 3-class softmax (AM / FM / PM). We train on 900 synthetic waveforms (300 per class) generated with randomized parameters and noise levels. Training uses 15 epochs with a learning rate of 0.008, decaying by 30% every 5 epochs. The model uses Leaky ReLU activation (to avoid dying neurons) and He weight initialization (optimal for ReLU). Training takes ~10 seconds in the browser using TensorFlow.js.

**Show them**: Click Train Model and watch the progress bar. Point out the epoch-by-epoch accuracy climbing from ~0.33 (random) to ~0.87 (trained).

---

### Q6: Can this work with real-world signals?

**Answer**: Yes, with modifications. The current system uses synthetic waveforms generated mathematically. For real-world signals, you would:
1. Capture RF signals using an SDR (Software Defined Radio) like HackRF or RTL-SDR
2. Downsample and normalize the captured IQ samples
3. Extract the same 8 engineered features
4. Feed the features + raw samples to the trained model
5. The model would classify the modulation type

The Audio Lab page demonstrates this — you can type text, modulate it, and play it as audio. You can also record from the microphone and see the captured waveform.

**Show them**: Go to Audio Lab, type "HELLO", and click Play Modulated Audio. Then switch to FM and play again — the sound changes.

---

### Q7: What is the sample rate and why does it matter?

**Answer**: The sample rate is 1,000,000 Hz (1 MHz) by default. This means we take 1 million measurements per second. The Nyquist theorem says the sample rate must be at least twice the highest frequency in the signal. Our carrier is 100 kHz, so we need at least 200 kHz. We use 1 MHz to have a safety margin and ensure smooth waveforms. Higher sample rates give more accurate waveforms but are slower to compute. Lower sample rates are faster but can cause aliasing (distortion).

**Show them**: Change the sample rate slider on the Simulator page and watch the waveform update. At 500 kHz it's still smooth. At 200 kHz it starts to look jagged.

---

### Q8: What is modulation index and why does it matter?

**Answer**: 
- **For AM**: Modulation index μ = Am / Ac (message amplitude / carrier amplitude). If μ > 1, the signal is over-modulated — the envelope goes negative, causing distortion. Our default is μ = 1.2 / 2.6 ≈ 0.46, which is safe.
- **For FM**: Modulation index β = Δf / fm (frequency deviation / message frequency). Higher β means wider frequency spread. Our default is β = 8000 / 10000 = 0.8, which is moderate.
- **For PM**: Phase sensitivity kp = Δf / Am. Higher kp means larger phase shifts. Our default is kp = 8000 / 1.2 ≈ 6667 rad/V.

**Show them**: Point to the formula card on the Simulator page. The modulation index is shown in the mode-change callout when you switch modes.

---

### Q9: How do you add noise?

**Answer**: We support three noise types:
1. **AWGN (Additive White Gaussian Noise)**: Random Gaussian noise added to each sample. This simulates thermal noise in electronic circuits.
2. **Rayleigh**: Each sample is multiplied by a Rayleigh-distributed fade factor. This simulates multipath fading in wireless channels.
3. **Impulse**: 5% chance of a large spike (±8× noise level) at each sample. This simulates lightning strikes or motor interference.

The noise level slider controls the amplitude of the noise. At 0.00 the signal is clean. At 0.30 the noise is 30% of the signal amplitude, which is severe.

**Show them**: Set noise to 0.00 (clean), then slowly increase to 0.30 (severe). Watch the waveform degrade and the SNR gauge turn from green to red.

---

### Q10: What are the engineered features?

**Answer**: The model uses 8 hand-crafted features that are mathematically discriminative for AM/FM/PM:
1. **Envelope variance** — high for AM (amplitude varies), low for FM/PM (amplitude constant)
2. **Envelope range** — max-min of |x|, large for AM, small for FM/PM
3. **Zero-crossing rate** — high for FM with large β (frequency varies), low for AM/PM
4. **Mean absolute value** — average signal strength
5. **RMS power** — root-mean-square power
6. **Crest factor** — peak-to-average ratio, high for AM, low for FM/PM
7. **Instantaneous frequency variance** — high for FM (frequency varies), low for AM/PM
8. **Spectral centroid** — center of mass of the frequency spectrum

These features give the model physics-based cues that complement the raw waveform pattern recognition.

**Show them**: Go to AI Analysis page and scroll to the "Methodology Comparison" section. It lists all 8 features and explains why they matter.

---

### Q11: How long does training take?

**Answer**: Training takes approximately 10 seconds in the browser using TensorFlow.js. This includes:
- Generating 900 synthetic waveforms (300 per class)
- Extracting 8 engineered features from each waveform
- Training a 2-layer CNN for 15 epochs
- Validating on a held-out test set

If you use the Python backend with PyTorch, training is faster (~3 seconds) because PyTorch is optimized for CPU/GPU computation.

**Show them**: Click Train Model and watch the progress bar. The epoch counter shows 1/15, 2/15, ... 15/15, and the accuracy climbs from ~0.33 to ~0.87.

---

### Q12: What happens when you increase noise?

**Answer**: As noise increases, the signal-to-noise ratio (SNR) decreases, and the waveform becomes more distorted. The SNR gauge shows this visually:
- **0.00 noise** → SNR ~40 dB (Ideal, green)
- **0.05 noise** → SNR ~32 dB (Good, sky blue)
- **0.15 noise** → SNR ~24 dB (Degraded, amber)
- **0.25 noise** → SNR ~20 dB (Severe, red)

At high noise levels, the classifier accuracy drops because the signal features are buried in noise. Traditional methods drop faster than deep learning — at 0.25 noise, traditional accuracy is ~55% while deep learning maintains ~72%.

**Show them**: Set noise to 0.00, then slowly increase to 0.25. Watch the waveform degrade and the SNR gauge change color. Then go to AI Analysis and show the "Noise vs Accuracy" table.

---

### Q13: Can you explain the CNN architecture?

**Answer**: The model is a 1D convolutional neural network with this architecture:
- **Input layer**: 264 features (256 waveform points + 8 engineered features)
- **Hidden layer 1**: 64 neurons, Leaky ReLU activation, He initialization
- **Hidden layer 2**: 32 neurons, Leaky ReLU activation, He initialization
- **Output layer**: 3 neurons (AM / FM / PM), softmax activation

The model uses:
- **Adam optimizer** with learning rate 0.008, decaying by 30% every 5 epochs
- **Categorical cross-entropy loss** (standard for multi-class classification)
- **Batch size 32** (processes 32 waveforms at a time)
- **15 epochs** (15 passes through the training data)

**Show them**: Go to AI Analysis page and scroll to the "Model Architecture" section (if visible), or explain verbally while training runs.

---

### Q14: Why use Leaky ReLU instead of regular ReLU?

**Answer**: Leaky ReLU allows a small negative slope (0.01) for negative inputs, which prevents "dying neurons" — neurons that get stuck outputting zero and never recover. Regular ReLU outputs zero for all negative inputs, which can cause neurons to stop learning if they receive large negative gradients. Leaky ReLU is more robust for small datasets like ours (900 samples).

**Show them**: This is a technical detail — mention it if judges ask about activation functions.

---

### Q15: What is the training/test split?

**Answer**: We use an 80/20 split:
- **Training set**: 720 waveforms (240 per class) — used to update model weights
- **Test set**: 180 waveforms (60 per class) — used to measure final accuracy

The test set is never seen during training, so the accuracy is a true measure of generalization. We also use 10% of the training set as a validation set during training to monitor overfitting.

**Show them**: This is a technical detail — mention it if judges ask about validation.

---

## 12. TROUBLESHOOTING

### Problem: Graphs are not visible or look blank

**Solution**: 
- Check that you've clicked "Enter Laboratory" to load the main app
- Try switching modes (press `A`, `F`, or `P`)
- Refresh the page (Cmd+R on Mac, Ctrl+R on Windows)
- Check browser console for errors (F12 → Console tab)

---

### Problem: Training takes too long or freezes

**Solution**:
- Training should take ~10 seconds. If it takes longer, your browser may be slow.
- Close other tabs to free up memory
- Try using Chrome or Edge (faster than Firefox/Safari for TensorFlow.js)
- Reduce the number of training samples (requires code change)

---

### Problem: Prediction is always wrong

**Solution**:
- Make sure you've trained the model first (click Train Model or press `T`)
- Check that the current mode matches the waveform (e.g., don't predict AM when you're in FM mode)
- Try increasing the signal duration or decreasing noise
- Retrain the model — sometimes random initialization causes poor results

---

### Problem: Audio doesn't play

**Solution**:
- Check that your browser allows audio playback (some browsers block autoplay)
- Click "Play Modulated Audio" again — the first click may be blocked
- Check your system volume and speaker settings
- Try a different browser (Chrome/Edge have better Web Audio API support)

---

### Problem: CSV export doesn't work

**Solution**:
- Check that your browser allows downloads
- Try clicking "Export CSV" again
- Check your Downloads folder — the file may have downloaded silently
- Try a different browser

---

### Problem: Backend connection fails

**Solution**:
- Make sure the Python backend is running (`python backend/main.py`)
- Check that the URL is correct (default: http://localhost:8000)
- Check that port 8000 is not blocked by a firewall
- Try accessing http://localhost:8000/docs in your browser — you should see the FastAPI docs

---

### Problem: Light mode is hard to read

**Solution**:
- Click the "Light / Dark" button in the header to toggle back to dark mode
- If text is still hard to read, try adjusting your projector brightness
- Use dark mode for presentations — it's easier on the eyes

---

### Problem: Keyboard shortcuts don't work

**Solution**:
- Make sure you're not typing in an input field (click outside the input first)
- Press `?` to see the full list of shortcuts
- Try pressing the key again — sometimes the first press is ignored
- Use the mouse buttons instead if shortcuts don't work

---

### Problem: Auto Demo doesn't start

**Solution**:
- Make sure you're on the Simulator page (not Flow & Report or Audio Lab)
- Click "Auto Demo" again — the first click may be ignored
- Check browser console for errors (F12 → Console tab)
- Try refreshing the page and clicking "Auto Demo" again

---

### Problem: Waveforms look jagged or pixelated

**Solution**:
- Increase the sample rate (try 1,500,000 Hz or 2,000,000 Hz)
- Increase the duration (try 0.002 s or 0.003 s)
- Check that your browser supports high-resolution canvas rendering
- Try zooming out (Cmd+- on Mac, Ctrl+- on Windows)

---

## FINAL TIPS FOR JUDGES

1. **Start with Auto Demo** — it shows everything in 30 seconds
2. **Use keyboard shortcuts** — faster and more professional than clicking
3. **Show the AI Analysis page** — this is the most important proof of improvement
4. **Explain the "Why 100% is impossible" panel** — judges love technical depth
5. **Demonstrate Audio Lab** — hearing the modulated signals is impressive
6. **Export CSV** — shows that raw data can be analyzed externally
7. **Switch modes live** — shows the system is interactive, not pre-recorded
8. **Increase noise gradually** — shows robustness and SNR degradation
9. **Train and predict live** — shows the AI is real, not fake
10. **Answer questions confidently** — use this guide as a reference

---

**Good luck with your presentation!** 🚀
