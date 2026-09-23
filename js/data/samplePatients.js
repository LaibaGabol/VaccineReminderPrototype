/**
 * Sample patients (hardcoded demo data — no backend).
 *
 * Dates of birth are calculated relative to "today" so the demo always
 * shows every status, whatever day it is run:
 *   P001 Ayesha Khan    — Overdue   (spec example patient, missed 2-month doses)
 *   P002 Bilal Ahmed    — Due Soon  (4-month DTaP/IPV due in ~2 days)
 *   P003 Zara Hussain   — Due Soon  (12-month MMR due today)
 *   P004 Omar Farooq    — Pending   (newborn, 1-month HepB coming up)
 *   P005 Hira Siddiqui  — Pending   (toddler, up to date until age 4)
 * Every patient also has Done doses in their timeline.
 *
 * Guardian names and phone numbers are fictional.
 *
 * Depends on: DateUtils, VaccineSchedule.
 */
var SamplePatients = (function () {
  /**
   * DOB such that dose at `months` falls `preferredOffset` days from today,
   * or as close as possible within [minOffset, maxOffset]. Needed because
   * month arithmetic clamps at month ends (e.g. no DOB gives a 1-month
   * due date of 30 Mar), so an exact offset is not always reachable.
   */
  function dobForDoseDue(today, months, preferredOffset, minOffset, maxOffset) {
    var anchor = DateUtils.addMonths(today, -months);
    var best = null;
    var bestDistance = Infinity;
    for (var shift = -40; shift <= 40; shift++) {
      var dob = DateUtils.addDays(anchor, shift);
      var offset = DateUtils.diffDays(today, DateUtils.addMonths(dob, months));
      if (offset < minOffset || offset > maxOffset) continue;
      var distance = Math.abs(offset - preferredOffset);
      if (distance < bestDistance) {
        best = dob;
        bestDistance = distance;
      }
    }
    return best;
  }

  /**
   * dosesGiven records for the listed doses, each given on its scheduled date.
   * `doses` is like { HepB: [1, 2], BCG: [1] }.
   */
  function givenOnSchedule(dob, doses) {
    var records = [];
    Object.keys(doses).forEach(function (code) {
      var vaccine = VaccineSchedule.getVaccine(code);
      doses[code].forEach(function (doseNumber) {
        var doseDef = vaccine.doses[doseNumber - 1];
        records.push({
          vaccine: code,
          doseNumber: doseNumber,
          dateGiven: DateUtils.toISODate(DateUtils.addMonths(dob, doseDef.minMonths))
        });
      });
    });
    return records;
  }

  function patient(fields, dob, doses) {
    var iso = DateUtils.toISODate(dob);
    return {
      id: fields.id,
      name: fields.name,
      dob: iso,
      registrationDate: iso,
      guardianName: fields.guardianName,
      phone: fields.phone,
      registeredVaccines: fields.registeredVaccines,
      dosesGiven: givenOnSchedule(dob, doses)
    };
  }

  /** Build a fresh copy of the sample patients relative to `today`. */
  function build(today) {
    var ayeshaDob = DateUtils.addDays(today, -100);           // ~3 months old
    var bilalDob = dobForDoseDue(today, 4, 2, 1, 3);           // 4-month doses due in ~2 days
    var zaraDob = dobForDoseDue(today, 12, 0, 0, 3);           // MMR 1 due today
    var omarDob = DateUtils.addDays(today, -20);               // HepB 2 due in ~8–11 days
    var hiraDob = DateUtils.addDays(DateUtils.addMonths(today, -24), -10); // just over 2 years old

    return [
      patient({
        id: "P001",
        name: "Ayesha Khan",
        guardianName: "Sana Khan",
        phone: "+92 300 1234567",
        registeredVaccines: ["HepB", "DTaP", "IPV", "BCG"]
      }, ayeshaDob, { HepB: [1], BCG: [1] }),

      patient({
        id: "P002",
        name: "Bilal Ahmed",
        guardianName: "Imran Ahmed",
        phone: "+92 301 2345678",
        registeredVaccines: ["HepB", "DTaP", "IPV", "BCG"]
      }, bilalDob, { HepB: [1, 2], DTaP: [1], IPV: [1], BCG: [1] }),

      patient({
        id: "P003",
        name: "Zara Hussain",
        guardianName: "Nadia Hussain",
        phone: "+92 302 3456789",
        registeredVaccines: ["HepB", "DTaP", "IPV", "MMR", "BCG"]
      }, zaraDob, { HepB: [1, 2, 3], DTaP: [1, 2, 3], IPV: [1, 2, 3], BCG: [1] }),

      patient({
        id: "P004",
        name: "Omar Farooq",
        guardianName: "Ayesha Farooq",
        phone: "+92 303 4567890",
        registeredVaccines: ["HepB", "DTaP", "IPV", "BCG"]
      }, omarDob, { HepB: [1], BCG: [1] }),

      patient({
        id: "P005",
        name: "Hira Siddiqui",
        guardianName: "Kamran Siddiqui",
        phone: "+92 304 5678901",
        registeredVaccines: ["HepB", "DTaP", "IPV", "MMR", "BCG"]
      }, hiraDob, { HepB: [1, 2, 3], DTaP: [1, 2, 3, 4], IPV: [1, 2, 3], MMR: [1], BCG: [1] })
    ];
  }

  return {
    build: build
  };
})();
