const stepButtons = [...document.querySelectorAll("[data-step-number]")];
const stepPanels = [...document.querySelectorAll("[data-step-panel]")];
const progressBar = document.querySelector("#law-progress");
const progressValue = document.querySelector("#law-progress-value");
const progressLabel = document.querySelector("#law-progress-label");
const previousButton = document.querySelector("#law-prev");
const nextButton = document.querySelector("#law-next");
const nextSteps = document.querySelector("#law-next-steps");
let currentStep = 0;

function showStep(index, moveFocus = false) {
  currentStep = Math.max(0, Math.min(stepPanels.length - 1, index));
  stepPanels.forEach((panel, panelIndex) => {
    panel.hidden = panelIndex !== currentStep;
  });
  stepButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === currentStep;
    button.classList.toggle("is-current", active);
    if (active) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  progressBar?.setAttribute("aria-valuenow", String(currentStep + 1));
  progressLabel.textContent = `${currentStep + 1} / ${stepPanels.length}`;
  progressValue.style.width = `${((currentStep + 1) / stepPanels.length) * 100}%`;
  previousButton.disabled = currentStep === 0;
  nextButton.hidden = currentStep === stepPanels.length - 1;
  nextSteps.hidden = currentStep !== stepPanels.length - 1;
  if (moveFocus) stepPanels[currentStep].querySelector("h2")?.focus({ preventScroll: true });
}

stepButtons.forEach((button) => {
  button.addEventListener("click", () => showStep(Number(button.dataset.stepNumber), true));
});
previousButton.addEventListener("click", () => showStep(currentStep - 1, true));
nextButton.addEventListener("click", () => showStep(currentStep + 1, true));
showStep(0);
