from __future__ import annotations

from datetime import datetime, timezone

from ..schemas import (
    ReportSection,
    ReportSummaryRequest,
    ReportSummaryResponse,
    WorkflowOverviewResponse,
    WorkflowStep,
)


def _estimate_snr(carrier_amplitude: float, noise_level: float) -> str:
    if noise_level <= 0:
        return "Ideal"
    import math

    return f"{20 * math.log10(carrier_amplitude / max(noise_level, 1e-3)):.1f} dB"


def _estimate_modulation_index(request: ReportSummaryRequest) -> float:
    if request.mode == "AM":
        return request.params.message_amplitude / max(request.params.carrier_amplitude, 1e-4)
    return request.params.frequency_deviation / max(request.params.message_frequency, 1e-4)


def _estimate_bandwidth(request: ReportSummaryRequest) -> float:
    if request.mode == "AM":
        return 2 * request.params.message_frequency
    return 2 * (request.params.frequency_deviation + request.params.message_frequency)


def build_workflow_overview(active_model_ready: bool) -> WorkflowOverviewResponse:
    steps = [
        WorkflowStep(
            id="message",
            title="Prepare message source",
            detail="Choose a sine-wave or text-driven message source to carry information.",
            ready=True,
        ),
        WorkflowStep(
            id="carrier",
            title="Configure carrier",
            detail="Select a high-frequency carrier amplitude and frequency.",
            ready=True,
        ),
        WorkflowStep(
            id="modulation",
            title="Generate AM/FM waveform",
            detail="Apply AM or FM to combine the message and carrier into one transmitted signal.",
            ready=True,
        ),
        WorkflowStep(
            id="channel",
            title="Apply channel effect",
            detail="Add noise or distortion to demonstrate real communication conditions.",
            ready=True,
        ),
        WorkflowStep(
            id="demodulation",
            title="Recover message preview",
            detail="Estimate the original message from the received waveform.",
            ready=True,
        ),
        WorkflowStep(
            id="classification",
            title="Deep-learning classification",
            detail="Classify the waveform as AM or FM with the active trained model.",
            ready=active_model_ready,
        ),
        WorkflowStep(
            id="report",
            title="Generate presentation report",
            detail="Summarize the experiment, AI improvement, and viva points.",
            ready=True,
        ),
    ]

    return WorkflowOverviewResponse(
        service="Signal Modulation Backend",
        status="ok",
        generated_at=datetime.now(timezone.utc).isoformat(),
        active_model_ready=active_model_ready,
        steps=steps,
    )


def build_report_summary(request: ReportSummaryRequest, active_model_ready: bool) -> ReportSummaryResponse:
    generated_at = datetime.now(timezone.utc).isoformat()
    snr = _estimate_snr(request.params.carrier_amplitude, request.params.noise_level)
    modulation_index = _estimate_modulation_index(request)
    bandwidth = _estimate_bandwidth(request)
    dl_accuracy = request.deep_learning_accuracy
    improvement = None if dl_accuracy is None else max(0.0, dl_accuracy - request.conventional_accuracy)

    executive_summary = (
        f"The project generated a {request.mode} signal using a {'text-driven' if request.signal_source == 'text' else 'continuous analog'} message source. "
        f"Traditional analysis is estimated at {request.conventional_accuracy:.1f}% accuracy. "
        + (
            f"After deep learning, the accuracy improves to {dl_accuracy:.1f}%, which is {improvement:.1f} percentage points higher."
            if dl_accuracy is not None
            else "Deep-learning improvement will appear after model training."
        )
    )

    sections = [
        ReportSection(
            heading="Signal setup",
            body=(
                f"Message frequency is {request.params.message_frequency:.0f} Hz and carrier frequency is {request.params.carrier_frequency:.0f} Hz. "
                f"Sample rate is {request.sample_rate:.0f} Hz with estimated bandwidth {bandwidth:.1f} Hz."
            ),
        ),
        ReportSection(
            heading="Channel condition",
            body=f"Noise level is {request.params.noise_level:.2f}, giving an estimated SNR of {snr}.",
        ),
        ReportSection(
            heading="AI comparison",
            body=(
                f"Traditional accuracy: {request.conventional_accuracy:.1f}%. "
                + (
                    f"Deep-learning accuracy: {dl_accuracy:.1f}%. Improvement: +{improvement:.1f}%."
                    if dl_accuracy is not None
                    else "Deep-learning accuracy is pending because training has not been completed yet."
                )
            ),
        ),
        ReportSection(
            heading="Prediction",
            body=(
                f"Current prediction: {request.prediction_label} at {(request.prediction_confidence or 0) * 100:.1f}% confidence."
                if request.prediction_label
                else "No prediction result was included in this report request."
            ),
        ),
    ]

    viva_points = [
        f"{request.mode} demonstrates how information is placed onto a high-frequency carrier.",
        "Without deep learning, the system depends on simpler analysis and can become less reliable in noisy conditions.",
        "With deep learning, the model learns waveform patterns automatically and improves AM/FM recognition.",
        f"Current modulation factor summary: index {modulation_index:.2f}, bandwidth {bandwidth:.1f} Hz, estimated SNR {snr}.",
        f"Backend active model ready: {'yes' if active_model_ready else 'no'}.",
    ]

    recommendations = [
        "Train the model locally on the Mac M3 for the strongest demonstration of AI improvement.",
        "Use the full communication flow page to explain the project step by step.",
        "Show both the waveform graph and the generated report during viva for a complete presentation.",
    ]

    conclusion = (
        f"Deep learning changes the project from a basic modulation visualizer into a smarter signal-understanding system by lifting accuracy from {request.conventional_accuracy:.1f}%"
        + (f" to {dl_accuracy:.1f}%" if dl_accuracy is not None else " once the model is trained")
        + "."
    )

    return ReportSummaryResponse(
        title=f"{request.mode} Signal Modulation Summary",
        generated_at=generated_at,
        mode=request.mode,
        signal_source=request.signal_source,
        executive_summary=executive_summary,
        conventional_accuracy=request.conventional_accuracy,
        deep_learning_accuracy=dl_accuracy,
        improvement=improvement,
        modulation_index=modulation_index,
        bandwidth=bandwidth,
        estimated_snr=snr,
        active_model_ready=active_model_ready,
        sections=sections,
        viva_points=viva_points,
        recommendations=recommendations,
        conclusion=conclusion,
    )
