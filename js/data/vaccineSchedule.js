/**
 * Vaccine schedule reference table — pure data (portable to Dart/Flutter).
 *
 * Intervals are measured in months from the patient's date of birth.
 *   minMonths: the dose's due date (start of the recommended window).
 *   maxMonths: end of the recommended window; omitted when the dose has a
 *              single target age (e.g. "Birth", "2 mo").
 * Years are stored as months (4 yr = 48, 6 yr = 72).
 */
var VACCINE_SCHEDULE = [
  {
    code: "HepB",
    name: "Hepatitis B",
    doses: [
      { doseNumber: 1, minMonths: 0 },
      { doseNumber: 2, minMonths: 1, maxMonths: 2 },
      { doseNumber: 3, minMonths: 6, maxMonths: 18 }
    ]
  },
  {
    code: "DTaP",
    name: "Diphtheria/Tetanus/Pertussis",
    doses: [
      { doseNumber: 1, minMonths: 2 },
      { doseNumber: 2, minMonths: 4 },
      { doseNumber: 3, minMonths: 6 },
      { doseNumber: 4, minMonths: 15, maxMonths: 18 },
      { doseNumber: 5, minMonths: 48, maxMonths: 72 }
    ]
  },
  {
    code: "IPV",
    name: "Inactivated Polio",
    doses: [
      { doseNumber: 1, minMonths: 2 },
      { doseNumber: 2, minMonths: 4 },
      { doseNumber: 3, minMonths: 6, maxMonths: 18 },
      { doseNumber: 4, minMonths: 48, maxMonths: 72 }
    ]
  },
  {
    code: "MMR",
    name: "Measles/Mumps/Rubella",
    doses: [
      { doseNumber: 1, minMonths: 12, maxMonths: 15 },
      { doseNumber: 2, minMonths: 48, maxMonths: 72 }
    ]
  },
  {
    code: "BCG",
    name: "BCG (Tuberculosis)",
    doses: [
      { doseNumber: 1, minMonths: 0 }
    ]
  }
];

/**
 * Lookup helpers for the schedule table.
 */
var VaccineSchedule = (function () {
  var byCode = {};
  VACCINE_SCHEDULE.forEach(function (vaccine) {
    byCode[vaccine.code] = vaccine;
  });

  /** Vaccine definition for a short code like "DTaP", or null if unknown. */
  function getVaccine(code) {
    return byCode[code] || null;
  }

  /** All vaccine definitions in table order. */
  function getAll() {
    return VACCINE_SCHEDULE;
  }

  /** Human-readable age for a month count: 0 -> "Birth", 2 -> "2 mo", 48 -> "4 yr". */
  function formatAgeMonths(months) {
    if (months === 0) return "Birth";
    if (months >= 24 && months % 12 === 0) return (months / 12) + " yr";
    return months + " mo";
  }

  /** Recommended age for a dose, as in the reference table: "Birth", "1–2 mo", "4–6 yr". */
  function formatDoseAge(dose) {
    if (dose.maxMonths === undefined) {
      return formatAgeMonths(dose.minMonths);
    }
    var bothYears = dose.minMonths >= 24 && dose.minMonths % 12 === 0 && dose.maxMonths % 12 === 0;
    if (bothYears) {
      return (dose.minMonths / 12) + "–" + (dose.maxMonths / 12) + " yr";
    }
    return dose.minMonths + "–" + dose.maxMonths + " mo";
  }

  return {
    getVaccine: getVaccine,
    getAll: getAll,
    formatDoseAge: formatDoseAge
  };
})();
