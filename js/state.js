/**
 * App state — the single in-memory store (no backend).
 *
 * Holds the patients, the staff session, the simulated "today" used by the
 * date simulator, and the log of simulated reminders. Views read from here
 * and subscribe to be re-rendered when something changes.
 *
 * Only the login session survives a page refresh (sessionStorage);
 * demo data and the simulated date reset on reload, by design.
 */
var AppState = (function () {
  var SESSION_KEY = "vaxicare.session";

  var realToday = DateUtils.today();
  var demoToday = realToday;
  var patients = [];
  var reminderLog = [];
  var sentStages = {};
  var checkedDates = {};
  var nextLogId = 1;
  var session = null;
  var listeners = [];
  var reminderListeners = [];

  // ---------- change notification ----------

  function subscribe(fn) {
    listeners.push(fn);
    return function unsubscribe() {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
  }

  function notify() {
    listeners.forEach(function (fn) { fn(); });
  }

  /**
   * Listen for newly generated reminders: fn(entries, source), entries oldest
   * first; source is "daily-check" (login) or "fast-forward" (date simulator).
   */
  function onReminders(fn) {
    reminderListeners.push(fn);
  }

  function notifyReminders(entries, source) {
    if (!entries.length) return;
    reminderListeners.forEach(function (fn) { fn(entries, source); });
  }

  // ---------- session ----------

  function readStoredSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function storeSession(value) {
    try {
      if (value) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      // Storage unavailable (private mode etc.) — session stays in memory only.
    }
  }

  /** Check demo credentials. Returns { ok: true } or { ok: false, error }. */
  function login(username, password) {
    var user = (username || "").trim();
    if (!user || !password) {
      return { ok: false, error: "Please enter both username and password." };
    }
    if (user.toLowerCase() !== CONFIG.DEMO_USERNAME || password !== CONFIG.DEMO_PASSWORD) {
      return { ok: false, error: "Incorrect username or password." };
    }
    session = { username: CONFIG.DEMO_USERNAME, staffName: CONFIG.DEMO_STAFF_NAME };
    storeSession(session);
    notify();
    return { ok: true };
  }

  function logout() {
    session = null;
    storeSession(null);
    notify();
  }

  function isLoggedIn() {
    return session !== null;
  }

  function getSession() {
    return session;
  }

  // ---------- dates ----------

  function getToday() {
    return demoToday;
  }

  function getRealToday() {
    return realToday;
  }

  /** Days the simulator has moved ahead of the real date (0 = real today). */
  function getDayOffset() {
    return DateUtils.diffDays(realToday, demoToday);
  }

  // ---------- patients ----------

  function getPatients() {
    return patients;
  }

  function getPatient(id) {
    for (var i = 0; i < patients.length; i++) {
      if (patients[i].id === id) return patients[i];
    }
    return null;
  }

  /** Dashboard summaries for all patients, most urgent first. */
  function getSummaries() {
    return patients
      .map(function (p) { return ScheduleEngine.summarizePatient(p, demoToday); })
      .sort(ScheduleEngine.compareByUrgency);
  }

  function getSummary(id) {
    var patient = getPatient(id);
    return patient ? ScheduleEngine.summarizePatient(patient, demoToday) : null;
  }

  /**
   * Record a dose as given on the current (demo) date.
   * Only the earliest outstanding dose of a vaccine can be marked.
   */
  function markDoseGiven(patientId, vaccine, doseNumber) {
    var patient = getPatient(patientId);
    if (!patient) return { ok: false, error: "Patient not found." };

    var schedule = ScheduleEngine.computeSchedule(patient, demoToday);
    var dose = schedule.filter(function (d) {
      return d.vaccine === vaccine && d.doseNumber === doseNumber;
    })[0];
    if (!dose || !ScheduleEngine.canMarkGiven(schedule, dose)) {
      return { ok: false, error: "This dose cannot be marked as given yet." };
    }

    patient.dosesGiven.push({
      vaccine: vaccine,
      doseNumber: doseNumber,
      dateGiven: DateUtils.toISODate(demoToday)
    });
    notify();
    return { ok: true };
  }

  // ---------- reminders ----------

  /** Run the daily reminder job for one date (once per date). Returns new log entries. */
  function checkDate(date) {
    var iso = DateUtils.toISODate(date);
    if (checkedDates[iso]) return [];
    checkedDates[iso] = true;

    var reminders = ReminderEngine.getRemindersForDate(patients, date, sentStages);
    return reminders.map(function (reminder) {
      sentStages = ReminderEngine.recordSent(sentStages, reminder);
      var entry = {
        id: nextLogId++,
        date: iso,
        patientId: reminder.patient.id,
        patientName: reminder.patient.name,
        guardianName: reminder.patient.guardianName,
        phone: reminder.patient.phone,
        stage: reminder.stage,
        doses: reminder.items.map(function (item) {
          return { vaccine: item.dose.vaccine, doseNumber: item.dose.doseNumber, stage: item.stage };
        }),
        message: reminder.message,
        status: "Simulated"
      };
      reminderLog.push(entry);
      return entry;
    });
  }

  /** Run the reminder job for the current demo date. Returns new log entries. */
  function runReminderCheck() {
    var entries = checkDate(demoToday);
    if (entries.length) notify();
    notifyReminders(entries, "daily-check");
    return entries;
  }

  /**
   * Move the simulated date forward, running the daily reminder job for
   * every day passed (as a real server would). Returns all new log entries.
   */
  function advanceDays(days) {
    var entries = [];
    for (var i = 0; i < days; i++) {
      demoToday = DateUtils.addDays(demoToday, 1);
      entries = entries.concat(checkDate(demoToday));
    }
    notify();
    notifyReminders(entries, "fast-forward");
    return entries;
  }

  /** Reminder log, newest first. */
  function getReminderLog() {
    return reminderLog.slice().reverse();
  }

  // ---------- lifecycle ----------

  /** Restore sample data, the real date and an empty reminder log. */
  function resetDemo() {
    realToday = DateUtils.today();
    demoToday = realToday;
    patients = SamplePatients.build(realToday);
    reminderLog = [];
    sentStages = {};
    checkedDates = {};
    nextLogId = 1;
    notify();
  }

  function init() {
    session = readStoredSession();
    resetDemo();
  }

  return {
    init: init,
    subscribe: subscribe,
    onReminders: onReminders,
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getSession: getSession,
    getToday: getToday,
    getRealToday: getRealToday,
    getDayOffset: getDayOffset,
    getPatients: getPatients,
    getPatient: getPatient,
    getSummaries: getSummaries,
    getSummary: getSummary,
    markDoseGiven: markDoseGiven,
    runReminderCheck: runReminderCheck,
    advanceDays: advanceDays,
    getReminderLog: getReminderLog,
    resetDemo: resetDemo
  };
})();
