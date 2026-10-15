const regimeCards = {
  new: document.getElementById("newRegimeCard"),
  old: document.getElementById("oldRegimeCard")
};

const taxableIncome = document.getElementById("taxableIncome");
const ageCategory = document.getElementById("ageCategory");
const residentialStatus = document.getElementById("residentialStatus");
const incomeError = document.getElementById("incomeError");
const oldRegimeNote = document.getElementById("oldRegimeNote");
const resultsSection = document.getElementById("resultsSection");

const resultRegime = document.getElementById("resultRegime");
const resultIncome = document.getElementById("resultIncome");
const resultIncomeTax = document.getElementById("resultIncomeTax");
const resultSurcharge = document.getElementById("resultSurcharge");
const resultCess = document.getElementById("resultCess");
const resultTotal = document.getElementById("resultTotal");
const resultEffectiveRate = document.getElementById("resultEffectiveRate");
const rebateMessage = document.getElementById("rebateMessage");
const slabTableBody = document.getElementById("slabTableBody");

function getRegime() {
  return document.querySelector('input[name="regime"]:checked').value;
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(value)));
}

function getOldSlabs(age) {
  if (age === "60to79") {
    return [
      { min: 0, max: 300000, rate: 0, label: "Up to ₹3,00,000" },
      { min: 300000, max: 500000, rate: 5, label: "₹3,00,001 – ₹5,00,000" },
      { min: 500000, max: 1000000, rate: 20, label: "₹5,00,001 – ₹10,00,000" },
      { min: 1000000, max: Infinity, rate: 30, label: "Above ₹10,00,000" }
    ];
  }

  if (age === "80plus") {
    return [
      { min: 0, max: 500000, rate: 0, label: "Up to ₹5,00,000" },
      { min: 500000, max: 1000000, rate: 20, label: "₹5,00,001 – ₹10,00,000" },
      { min: 1000000, max: Infinity, rate: 30, label: "Above ₹10,00,000" }
    ];
  }

  return [
    { min: 0, max: 250000, rate: 0, label: "Up to ₹2,50,000" },
    { min: 250000, max: 500000, rate: 5, label: "₹2,50,001 – ₹5,00,000" },
    { min: 500000, max: 1000000, rate: 20, label: "₹5,00,001 – ₹10,00,000" },
    { min: 1000000, max: Infinity, rate: 30, label: "Above ₹10,00,000" }
  ];
}

function getNewSlabs() {
  return [
    { min: 0, max: 400000, rate: 0, label: "Up to ₹4,00,000" },
    { min: 400000, max: 800000, rate: 5, label: "₹4,00,001 – ₹8,00,000" },
    { min: 800000, max: 1200000, rate: 10, label: "₹8,00,001 – ₹12,00,000" },
    { min: 1200000, max: 1600000, rate: 15, label: "₹12,00,001 – ₹16,00,000" },
    { min: 1600000, max: 2000000, rate: 20, label: "₹16,00,001 – ₹20,00,000" },
    { min: 2000000, max: 2400000, rate: 25, label: "₹20,00,001 – ₹24,00,000" },
    { min: 2400000, max: Infinity, rate: 30, label: "Above ₹24,00,000" }
  ];
}

function calculateSlabTax(income, slabs) {
  let tax = 0;

  for (const slab of slabs) {
    if (income > slab.min) {
      const taxableInSlab = Math.min(income, slab.max) - slab.min;
      tax += taxableInSlab * (slab.rate / 100);
    }
    if (income <= slab.max) break;
  }

  return tax;
}

function getSurchargeRate(income, regime) {
  // Basic surcharge framework. For the new regime, surcharge above ₹5 crore
  // is capped at 25% under the applicable rules.
  if (income <= 5000000) return 0;
  if (income <= 10000000) return 10;
  if (income <= 20000000) return 15;
  if (income <= 50000000) return 25;
  return regime === "new" ? 25 : 37;
}

function calculateTax(income, regime, age) {
  const slabs = regime === "new" ? getNewSlabs() : getOldSlabs(age);
  let incomeTax = calculateSlabTax(income, slabs);
  let rebate = 0;

  // Section 87A basic rebate handling for ordinary slab income.
  if (regime === "new" && income <= 1200000) {
    rebate = Math.min(incomeTax, 60000);
  } else if (regime === "old" && income <= 500000) {
    rebate = Math.min(incomeTax, 12500);
  }

  incomeTax = Math.max(0, incomeTax - rebate);

  const surchargeRate = getSurchargeRate(income, regime);
  const surcharge = incomeTax * surchargeRate / 100;
  const cess = (incomeTax + surcharge) * 0.04;
  const total = incomeTax + surcharge + cess;

  return {
    incomeTax,
    surcharge,
    cess,
    total,
    rebate,
    surchargeRate,
    slabs
  };
}

function updateRegimeUI() {
  const regime = getRegime();

  Object.values(regimeCards).forEach(card => card.classList.remove("selected"));
  regimeCards[regime].classList.add("selected");

  if (regime === "old") {
    oldRegimeNote.classList.add("show");
  } else {
    oldRegimeNote.classList.remove("show");
  }
}

document.querySelectorAll('input[name="regime"]').forEach(input => {
  input.addEventListener("change", updateRegimeUI);
});

document.getElementById("calculateBtn").addEventListener("click", () => {
  const income = Number(taxableIncome.value);
  const regime = getRegime();
  const age = ageCategory.value;
  const residence = residentialStatus.value;

  incomeError.textContent = "";

  if (!age) {
    incomeError.textContent = "Please select your age category.";
    ageCategory.focus();
    return;
  }

  if (!residence) {
    incomeError.textContent = "Please select your residential status.";
    residentialStatus.focus();
    return;
  }

  if (!Number.isFinite(income) || income < 0) {
    incomeError.textContent = "Please enter a valid taxable income.";
    taxableIncome.focus();
    return;
  }

  const result = calculateTax(income, regime, age);

  resultRegime.textContent = regime === "new" ? "New Tax Regime" : "Old Tax Regime";
  resultIncome.textContent = formatINR(income);
  resultIncomeTax.textContent = formatINR(result.incomeTax);
  resultSurcharge.textContent = formatINR(result.surcharge);
  resultCess.textContent = formatINR(result.cess);
  resultTotal.textContent = formatINR(result.total);

  const effectiveRate = income > 0 ? (result.total / income) * 100 : 0;
  resultEffectiveRate.textContent = `Effective rate: ${effectiveRate.toFixed(2)}%`;

  if (result.rebate > 0) {
    rebateMessage.textContent =
      `Rebate applied: ${formatINR(result.rebate)} under the applicable basic Section 87A threshold.`;
  } else {
    rebateMessage.textContent =
      "No basic Section 87A rebate has been applied for this calculation.";
  }

  slabTableBody.innerHTML = result.slabs.map(slab => `
    <tr>
      <td>${slab.label}</td>
      <td>${slab.rate}%</td>
    </tr>
  `).join("");

  resultsSection.classList.remove("hidden");
  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("ageCategory").value = "";
  document.getElementById("residentialStatus").value = "";
  taxableIncome.value = "";
  document.querySelector('input[name="regime"][value="new"]').checked = true;
  incomeError.textContent = "";
  updateRegimeUI();
  resultsSection.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const modal = document.getElementById("disclaimerModal");

document.getElementById("disclaimerBtn").addEventListener("click", () => {
  modal.classList.remove("hidden");
});

document.getElementById("modalClose").addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.classList.add("hidden");
});

updateRegimeUI();
