# VaxiCare – Hospital Vaccine Reminder Prototype

A clickable prototype of a hospital-side vaccine reminder system for **DOW Medical Hospital**. It loads sample patients, calculates each child's full vaccine schedule, flags doses as **Pending / Due Soon / Overdue / Done**, and shows the exact reminder messages that guardians would receive.

> **Demo only.** There is no backend, no database, no real login and **no messages are sent**. Everything runs in the browser with sample data.

"VaxiCare" is a placeholder name while the client chooses the final one (see [Configuration](#configuration)).

---

## Running it

1. Open `index.html` in **Google Chrome** or **Microsoft Edge**. Double-clicking the file works; there is nothing to install and no internet connection is needed.
2. Sign in with the demo staff account:

   | Username | Password |
   |---|---|
   | `staff` | `vaxi123` |

To present it to the client, follow the step-by-step script in **[DEMO-GUIDE.md](DEMO-GUIDE.md)**.

---

## Features

| Area | What it does |
|---|---|
| **Staff login** | Username/password screen with the demo account. Every other screen is locked until sign-in; logout returns to the login screen. |
| **Patient dashboard** | Lists every patient with their next due vaccine, due date and a color-coded status, most urgent first. Summary cards and filter chips filter by status, and there is search by name, ID or guardian. |
| **Patient detail** | Patient and guardian info, a vaccine-by-dose overview grid, and the full dose timeline (past and upcoming) with a "Today" marker. |
| **Simulate Reminder** | On any Due Soon or Overdue dose: a preview of the exact message on a phone mock-up, in SMS or WhatsApp style. |
| **Automatic daily reminder check** | Runs when staff sign in and on every simulated day. Pop-up notifications show each reminder "sent". |
| **Guardian phone** | Slide-out phone showing each guardian's inbox; new reminders pop in live. |
| **Date simulator** | **+1 day / +1 week** moves the demo date forward so statuses change and reminders fire as they would over time. **Reset demo** restores everything. |
| **Mark as Given** | Records a due dose as given on the demo date; the status updates, the next dose moves up, and reminders for that dose stop. |
| **Reminder Log** | Every simulated reminder, with filters, the full message text and **CSV download**. |

---

## How the schedule works

### Due dates
Every due date is calculated from the **date of birth** using the reference table (stored in `js/data/vaccineSchedule.js`):

| Vaccine | Dose 1 | Dose 2 | Dose 3 | Dose 4 | Dose 5 |
|---|---|---|---|---|---|
| HepB – Hepatitis B | Birth | 1–2 mo | 6–18 mo | – | – |
| DTaP – Diphtheria/Tetanus/Pertussis | 2 mo | 4 mo | 6 mo | 15–18 mo | 4–6 yr |
| IPV – Inactivated Polio | 2 mo | 4 mo | 6–18 mo | 4–6 yr | – |
| MMR – Measles/Mumps/Rubella | 12–15 mo | 4–6 yr | – | – | – |
| BCG | Birth | – | – | – | – |

For an age range, the **due date is the start of the range**. The end of the range is shown as the recommended window.

### Dose status
| Status | Rule | Color |
|---|---|---|
| **Done** | Dose recorded as given | Gray |
| **Overdue** | The due date has passed and the dose was not given | Red |
| **Due Soon** | Due today or within the next **3 days** | Yellow |
| **Pending** | Due more than 3 days from now | Green |

### Reminder rules (daily check)
| Reminder | Sent when |
|---|---|
| Due soon | 1–3 days before the due date |
| Due today | On the due date |
| Overdue | 3–6 days after the due date |
| Overdue – final notice | 7 or more days after the due date (the message says staff will call) |

- Each reminder is sent **at most once per dose**.
- A patient with several doses due gets **one combined message** rather than several.
- Nothing more is sent once the dose is marked as given.
- On the first check, only the latest applicable reminder goes out (no backlog of old ones).

---

## Sample patients

The sample patients' dates of birth are set **relative to today**, so every status appears whatever day the demo runs:

| ID | Patient | Guardian | Situation |
|---|---|---|---|
| P001 | Ayesha Khan (~3 months) | Sana Khan | **Overdue**: missed three doses |
| P002 | Bilal Ahmed (~4 months) | Imran Ahmed | **Due Soon**: 4-month doses due in 1–3 days (usually 2) |
| P003 | Zara Hussain (~1 year) | Nadia Hussain | **Due Soon**: MMR dose 1 due today |
| P004 | Omar Farooq (~20 days) | Ayesha Farooq | **Pending**: next dose in about 10 days |
| P005 | Hira Siddiqui (~2 years) | Kamran Siddiqui | **Pending**: up to date until age 4 |

All names and phone numbers are fictional.

---

## Configuration

Branding and rules are in **`js/config.js`**:

| Setting | Current value | Notes |
|---|---|---|
| `APP_NAME` | `VaxiCare` | Placeholder until the client chooses the name. Also update the `<title>` in `index.html`. |
| `HOSPITAL_NAME` | `DOW Medical Hospital` | Used in the header, login screen and every message. |
| `HOSPITAL_PHONE` | `+92 42 1234 5678` | **Placeholder.** Replace it with the real enquiry number. |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | `staff` / `vaxi123` | Demo account. |
| `DUE_SOON_DAYS` | `3` | Days before the due date when a dose becomes Due Soon. |

The vaccine schedule is data in `js/data/vaccineSchedule.js`. Changing the table changes every calculation.

---

## Project structure

```
index.html                  Single page; loads the scripts below in order
css/styles.css              All styling (design tokens, components, screens, mobile)
js/config.js                Branding, demo account, Due Soon window
js/engine/                  Pure logic, no UI (portable to Flutter/Dart)
  dateUtils.js              Timezone-safe date maths and formatting
  scheduleEngine.js         Due dates, statuses, next due dose
  reminderEngine.js         Reminder rules and message text
js/data/
  vaccineSchedule.js        Vaccine interval reference table
  samplePatients.js         Sample patients (relative to today)
js/state.js                 In-memory store: patients, session, demo date, reminder log
js/router.js                Screen navigation and login guard
js/app.js                   Start-up
js/views/                   Screens and UI components
  loginView.js, dashboardView.js, patientDetailView.js, reminderLogView.js
  header.js, dateSimulator.js, modal.js, reminderModal.js,
  phoneMock.js, guardianPhone.js, notifications.js, ui.js
```

**Porting to Flutter later:** `js/engine/` and `js/data/` contain no UI code, so they translate directly to Dart. The screens would be rebuilt as Flutter widgets.

---

## Prototype limits

- **Data resets on page refresh.** Doses marked as given, the simulated date and the reminder log live in memory only. The login session survives a refresh.
- **No real authentication.** Only the single demo account works.
- **No real messages.** SMS and WhatsApp are visual mock-ups.
- **No patient registration form.** Patients are built in, as the brief specifies.
- The notification chime is **on by default**; it can be switched off in the Guardian phone panel.

### What a production version would add
A backend and database; a scheduled server job that sends reminders every morning; an SMS gateway and/or the WhatsApp Business API; guardian consent and opt-out; Urdu message templates; real staff accounts; and a patient registration form.

---

## Open decisions for the client
https://vaccine-reminder-prototype.vercel.app/#/login
1. **Product name.** "VaxiCare" is a placeholder.
2. **Hospital contact number** to show in reminder messages.
3. **Recipient wording.** "Guardian" is currently used for the adult who receives reminders. "Parent/Guardian", with a relationship field (mother, father…), may read better.
4. **Due Soon window.** Currently 3 days. The "due soon" reminder timing is set separately in the reminder engine (also 3 days); if the window changes, the two should be linked.
5. **Channel and language.** SMS, WhatsApp or both; Urdu, English or both.
