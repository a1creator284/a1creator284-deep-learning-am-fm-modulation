# Presentation Guide — Signal Modulation Lab

> Use this guide during your viva / college presentation. It explains every control, every button, and the exact values to set for AM, FM, and PM demonstrations.

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [Landing Page](#2-landing-page)
3. [Simulator Page — Complete Walkthrough](#3-simulator-page--complete-walkthrough)
4. [Recommended Values for Each Modulation](#4-recommended-values-for-each-modulation)
5. [Button-by-Button Explanation](#5-button-by-button-explanation)
6. [Other Pages](#6-other-pages)
7. [Presentation Flow Checklist](#7-presentation-flow-checklist)

---

## 1. Getting Started

1. Open the deployed app in your browser.
2. The **Landing Page** appears first.
3. Click **"Enter Laboratory"** to go to the Simulator.
4. The app defaults to **AM mode** with preset values already loaded.

---

## 2. Landing Page

| Element | What it does |
|---------|-------------|
| **Deep Learning Enhanced** badge | Shows this is an AI-powered project |
| **Stats row** | Highlights 85%+ accuracy, 3x faster inference, 3 modulation types |
| **Enter Laboratory** button | Primary CTA — takes you to the Simulator |
| **Explore Features** button | Secondary CTA — also takes you to the Simulator |

**Presentation tip:** Click "Enter Laboratory" and briefly mention the three modulation modes you will demonstrate.

---

## 3. Simulator Page — Complete Walkthrough

### Top Navigation Tabs

| Tab | Purpose |
|-----|---------|
| **Simulator** | Main signal control page (this is where you spend most time) |
| **Flow & Report** | Step-by-step communication flow timeline + report card |
| **Audio Lab** | Type text → convert to binary → play as modulated audio |
| **AI Analysis** | Train model, predict waveform, see accuracy comparison |
| **Backend & Tests** | Check if backend is online, run smoke tests |

### Header Buttons (Simulator page)

| Button | When to click |
|--------|---------------|
| **Dark / Light toggle** | Switch themes for readability |
| **Theory about AM/FM** | Opens a modal with formulas and theory — useful if examiner asks |
| **Export CSV** | Downloads the raw waveform data as a file |
| **Train Model** | Trains the deep-learning model (takes ~10-20 seconds) |
| **Predict Current Waveform** | Runs the trained model on current signal — shows AI classification |
| **Run Full Flow** | Opens the Flow page and auto-runs the 7-step timeline |
| **Download Report** | Generates a markdown report of current settings + results |
| **Page Help** | Opens help modal specific to the current page |

### Status Cards (Top Row)

These show the current state at a glance:
- **Current Mode** — AM / FM / PM
- **Signal Source** — Sine waveform (fixed)
- **Sample Rate** — 100,000 Hz (fixed)
- **Active Accuracy View** — Shows baseline accuracy before training

### Signal Controls Section

This is the **most important section** for your presentation.

#### Mode Preset Buttons
| Button | Action |
|--------|--------|
| **AM** | Switches to Amplitude Modulation |
| **FM** | Switches to Frequency Modulation |
| **PM** | Switches to Phase Modulation |

#### Quick Action Buttons
| Button | Action |
|--------|--------|
| **Load AM preset** | Resets all sliders to AM default values |
| **Load FM preset** | Resets all sliders to FM default values |
| **Load PM preset** | Resets all sliders to PM default values |
| **Randomize values** | Randomizes sliders for random signal exploration |
| **Reset current mode** | Resets to the default for currently selected mode |

#### Sliders (left to right, top to bottom)

| Slider | What it controls | Range |
|--------|----------------|-------|
| **Message Amplitude** | Height/strength of the message signal | 0.01 to 2.0 |
| **Message Frequency** | How fast the message signal oscillates | 1 Hz to 10,000 Hz |
| **Carrier Amplitude** | Height of the high-frequency carrier wave | 0.01 to 5.0 |
| **Carrier Frequency** | Frequency of the carrier wave | 100 Hz to 100,000 Hz |
| **Frequency Deviation** | How much FM/PM shifts from carrier frequency | 0 Hz to 50,000 Hz |
| **Phase** | Initial phase offset | 0° to 360° |
| **Noise Level** | Amount of channel noise added | 0.0 to 1.0 |
| **Duration** | Time span of the signal | 0.001s to 0.1s |

**Tip:** For a clean viva demo, keep **Noise Level at 0** and **Duration at 0.01s**.

---

## 4. Recommended Values for Each Modulation

### AM — Amplitude Modulation

Set these exact values for a textbook AM waveform:

| Parameter | Value | Why |
|-----------|-------|-----|
| Message Amplitude | **1.0** | Clear envelope visible |
| Message Frequency | **1000 Hz** | 1 kHz audio tone |
| Carrier Amplitude | **2.0** | Strong carrier |
| Carrier Frequency | **10000 Hz** | 10 kHz carrier (10x message) |
| Frequency Deviation | **0 Hz** | Not used in AM |
| Phase | **0°** | No offset |
| Noise Level | **0.0** | Clean signal for demo |
| Duration | **0.01s** | Short enough to see multiple cycles |

**What to explain:**
> "In AM, the amplitude of the carrier changes according to the message signal. You can see the message signal's shape forming an envelope around the carrier."

---

### FM — Frequency Modulation

Set these exact values for a textbook FM waveform:

| Parameter | Value | Why |
|-----------|-------|-----|
| Message Amplitude | **1.0** | Fixed amplitude in FM |
| Message Frequency | **1000 Hz** | 1 kHz tone |
| Carrier Amplitude | **2.0** | Constant amplitude |
| Carrier Frequency | **10000 Hz** | 10 kHz center frequency |
| Frequency Deviation | **3000 Hz** | 3 kHz shift — clearly visible |
| Phase | **0°** | No offset |
| Noise Level | **0.0** | Clean signal |
| Duration | **0.01s** | Short span |

**What to explain:**
> "In FM, the amplitude stays constant but the frequency changes. Look at the modulated signal — the waves get closer together (higher frequency) when the message is positive, and farther apart (lower frequency) when the message is negative."

---

### PM — Phase Modulation

Set these exact values for a textbook PM waveform:

| Parameter | Value | Why |
|-----------|-------|-----|
| Message Amplitude | **1.0** | Controls phase shift amount |
| Message Frequency | **1000 Hz** | 1 kHz tone |
| Carrier Amplitude | **2.0** | Constant amplitude |
| Carrier Frequency | **10000 Hz** | 10 kHz carrier |
| Frequency Deviation | **2000 Hz** | Controls maximum phase deviation |
| Phase | **0°** | No initial offset |
| Noise Level | **0.0** | Clean signal |
| Duration | **0.01s** | Short span |

**What to explain:**
> "In PM, the phase of the carrier changes proportionally to the message amplitude. Unlike FM where frequency changes, here the phase angle shifts. PM is related to FM but the phase changes directly with the message amplitude."

---

## 5. Button-by-Button Explanation

### Simulator Graph Buttons (under the three waveform cards)

| Button | Action | When to use |
|--------|--------|-------------|
| **Capture graph** | Saves current waveform as a snapshot | After tuning a clean signal |
| **Download CSV** | Exports data points to a CSV file | If examiner asks for raw data |
| **Open Flow** | Jumps to Flow & Report page | For the final summary |
| **Open Audio Lab** | Jumps to Audio Lab page | To show text-to-signal feature |

### Info Panel (under sliders)

Shows live calculated values:
- **Bandwidth** — Signal bandwidth in Hz
- **Modulation Index** — AM index (message amp / carrier amp)
- **Samples** — Total sample count
- **Nyquist** — Nyquist rate reminder

### Signal Recording Panel

| Button | Action |
|--------|--------|
| **Record** | Saves current signal state to memory (max 10) |
| **Clear** | Deletes all recorded states |
| **Replay** | Plays back recorded snapshots |
| **Export JSON** | Downloads recorded states as JSON |

### Right-Side Analysis Cards

| Card | What it shows |
|------|---------------|
| **Modulated Waveform** | The final AM/FM/PM signal graph |
| **FFT Spectrum** | Frequency domain view — peaks at carrier and sidebands |
| **Recovered Signal** | Estimated message signal after demodulation |
| **Eye Diagram** | Overlaid traces for signal quality |
| **Constellation Diagram** | I/Q scatter plot for phase visualization |
| **Predictions** | AI model output: AM/FM/PM probability bars |
| **Training Status** | Whether model is trained or not |
| **Mini Model Accuracy** | Current accuracy of the browser-side model |

---

## 6. Other Pages

### Flow & Report Page

Use this for the **final wrap-up** of your presentation.

Steps shown:
1. Prepare message source
2. Configure carrier
3. Generate modulation
4. Inspect channel/noise
5. Preview demodulation
6. Classify using deep learning
7. Generate final report

Click **Run Full Flow** to animate through all 7 steps automatically.

### Audio Lab Page

For an **interactive extra** during your presentation:
1. Type any text (e.g., "Hello")
2. The text converts to binary
3. Click **Play Original** to hear text-to-speech
4. Click **Play AM / FM / PM Audio** to hear the modulated signal

**Presentation tip:** Type your college name or project title and play the modulated audio — it sounds like a robotic buzz that changes with the text.

### AI Analysis Page

Use this to show the **deep learning aspect**:
1. Click **Train AM/FM/PM Model** — wait for training to finish
2. Go back to Simulator, tune a signal
3. Click **Predict Current Waveform** in the header
4. The prediction card shows probability bars for AM/FM/PM
5. Go back to AI Analysis page to see the comparison chart

**What to explain:**
> "Without deep learning, traditional analysis gives lower accuracy. After training the neural network, the model can classify the modulation type with 85%+ accuracy."

---

## 7. Presentation Flow Checklist

Use this exact sequence for your viva:

1. [ ] Open app — Landing Page shows
2. [ ] Click **Enter Laboratory**
3. [ ] Show AM preset (already loaded by default)
4. [ ] Point out the **three separate graphs**: message, carrier, modulated
5. [ ] Explain each slider briefly (Message Amp, Carrier Freq, etc.)
6. [ ] Click **FM** button → Load FM preset → show frequency changing
7. [ ] Click **PM** button → Load PM preset → show phase changing
8. [ ] Click **Predict Current Waveform** (train first if not trained)
9. [ ] Open **Flow & Report** → Click **Run Full Flow**
10. [ ] Open **Audio Lab** → type text → play modulated audio
11. [ ] Click **Download Report** to generate final markdown
12. [ ] Done

### Time estimate
- Full demo: **8–12 minutes**
- Quick demo (AM + FM only): **5 minutes**

---

## Quick Reference Card

| Modulation | Message Amp | Msg Freq | Carrier Amp | Carrier Freq | Freq Dev | Noise |
|-----------|-------------|----------|-------------|--------------|----------|-------|
| **AM** | 1.0 | 1000 Hz | 2.0 | 10000 Hz | 0 Hz | 0.0 |
| **FM** | 1.0 | 1000 Hz | 2.0 | 10000 Hz | 3000 Hz | 0.0 |
| **PM** | 1.0 | 1000 Hz | 2.0 | 10000 Hz | 2000 Hz | 0.0 |

**Always keep:** Noise = 0.0, Duration = 0.01s, Phase = 0° for clean demos.
