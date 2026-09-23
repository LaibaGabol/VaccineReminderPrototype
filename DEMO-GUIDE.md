# VaxiCare – Client Demo Guide

A click-by-click script for presenting the prototype. It follows one story: **a nurse's morning at DOW Medical Hospital, then fast-forwarding through the next ten days.** Follow the steps in order and every feature gets shown.

**Time:** about 15 minutes, plus questions.
**Notation:** *Click* = what you do. 💬 = what to say. 👀 = what the client will see.

> **Works on any date.** Sample patients are built relative to today, so the same things happen whenever you present. Dates on screen will differ from the examples here.

---

## Before the meeting (5 minutes)

- [ ] Use **Chrome or Edge** on a laptop, in a **maximized window**, at **100% zoom** (Ctrl + 0).
- [ ] **Turn the volume on.** Reminders play a short chime.
- [ ] Open `index.html`. If the app opens already signed in, click **Log out** so you start at the login screen.
- [ ] Close other tabs and turn off desktop notifications.
- [ ] **Rehearse once** from start to finish. Then **refresh the page** (F5) to restore the starting data. Refreshing always gives a clean start.

> Don't refresh during the demo unless you want to start over: refreshing resets the data.

---

## Act 1 – Sign in (1 min)

1. 👀 The login screen shows the app name, "Vaccine Reminder System" and **DOW Medical Hospital**.
   💬 *"Staff sign in first. In this prototype it's a single demo account; the real system would have individual staff accounts."*
2. *Type* `staff` and a **wrong password**, then *click* **Sign in**.
   👀 "Incorrect username or password."
3. *Type* the correct password `vaxi123`, *click* **Show** to reveal it, then *click* **Sign in**.
   (Use the **Sign in** button: after clicking Show, pressing Enter would just hide the password again.)
   👀 The Patient Dashboard opens with **Nurse Fatima** in the header.

---

## Act 2 – The automatic morning reminder check (1 min)

**Don't click anything yet.** After about a second, notifications slide in at the bottom-right:

👀
- **Daily reminder check** · *3 reminders queued for guardians*
- 🔴 To **Sana Khan**: Ayesha Khan, *3 doses overdue, final notice*
- 🟡 To **Imran Ahmed**: Bilal Ahmed, *due soon*
- 🟡 To **Nadia Hussain**: Zara Hussain, *MMR Dose 1 due today*

👀 The **📱 Guardian phone** button shows a red badge: **3**.

💬 *"Every morning the system checks every registered patient and works out who needs a reminder. The nurse doesn't have to do anything. Here it found three guardians to contact today."*

---

## Act 3 – The dashboard (2 min)

1. **Demo date bar**: point to **Demo date … Real date**.
   💬 *"This bar is only for the demo. It lets us fast-forward time, which we'll do later."*
2. **Summary cards**: 1 **Overdue**, 2 **Due Soon**, 2 **Pending**, 5 **Total patients**.
3. **Patient table**: most urgent first, with color-coded statuses:
   - 🔴 **Ayesha Khan**: HepB Dose 2 · *about 70 days ago* · **Overdue** · *+2 more overdue*
   - 🟡 **Zara Hussain**: MMR Dose 1 · *today* · **Due Soon**
   - 🟡 **Bilal Ahmed**: DTaP Dose 2 · *in 1–3 days* · **Due Soon**
   - 🟢 **Omar Farooq**: HepB Dose 2 · *in about 10 days* · **Pending**
   - 🟢 **Hira Siddiqui**: DTaP Dose 5 · *in about 2 years* · **Pending**

   💬 *"Red means overdue, yellow means due within three days, green means coming up later. Every date is calculated automatically from the child's date of birth using the standard vaccine schedule."*
4. *Click* the **Overdue** card. 👀 Only Ayesha is shown. *Click* the **Due Soon** chip. 👀 Zara and Bilal. *Click* **All patients**.
5. *Type* `Imran` in the search box. 👀 Bilal is found by his guardian's name. *Clear the search.*

---

## Act 4 – A patient's full schedule (2 min)

1. *Click* **Ayesha Khan's row**.
2. 👀 **Left card**: age, date of birth, guardian **Sana Khan**, phone, registered vaccines, **Doses given 2 / 13**, **3 doses overdue**.
3. 👀 **Vaccine overview**: one row per vaccine and one colored cell per dose (Done / Overdue / Pending).
   💬 *"The whole vaccination plan at a glance: what's done, what was missed, what's next."*
4. 👀 **Dose timeline**: scroll through it.
   - Done doses at the top: *"Given [date] · scheduled [date]"*
   - Overdue doses in red: *"… days overdue"* and the recommended *"window until [date]"*
   - The dashed **TODAY** line
   - Upcoming doses below it, all the way to the **4–6 year** boosters
5. *Click* **← Back to dashboard** and open **Hira Siddiqui**.
   👀 *12 / 15 doses given* and nothing overdue; the next doses are at age 4.
   💬 *"A child who's fully up to date. The system already knows her next doses are years away."*
6. *Click* **← Back to dashboard**.

---

## Act 5 – Preview a reminder (1½ min)

1. On the dashboard, *click* **Simulate Reminder** on **Zara Hussain's** row.
2. 👀 **Reminder preview**:
   - To **Nadia Hussain**, with her phone number
   - The vaccine and due date
   - A phone showing the exact message:
     > *Reminder from DOW Medical Hospital – Dear Nadia Hussain, Zara Hussain's MMR Dose 1 vaccine is due today… For queries call …*
   - **Reminder: Due today**
   - The yellow note: **"Simulation only. No message has been sent."**
3. *Click* **WhatsApp** and then **SMS**. 👀 The phone switches between WhatsApp style (green, ✓✓ ticks) and SMS style.
   💬 *"The same message works for SMS or WhatsApp; the hospital can choose either or both."*
4. *Click* **Copy message** to show the text can be copied. Then *click* **Close** (or press Esc).
5. *Optional:* open **Ayesha** → *click* **Simulate Reminder** on **HepB – Dose 2** to show the **overdue** wording: *"…was due on [date] and is now … days overdue."*

---

## Act 6 – The guardian's phone (1 min)

1. *Click* the **📱 Guardian phone** button at the bottom-right.
2. 👀 A phone panel slides out, showing the guardian with the newest unread message.
3. *Use the dropdown* to switch between guardians. 👀 Unread counts show as *"(1 new)"*.
   💬 *"This is what each parent actually receives. For Ayesha's mother it's one combined message listing all three overdue doses, not three separate texts."*
4. Point out **SMS / WhatsApp** and **🔔 Sound on**.
5. **Leave the panel open** for the next act.

---

## Act 7 – A child is vaccinated (1 min)

💬 *"Zara's mother brings her in today for her MMR dose."*

1. Go back to the dashboard and *click* **Zara Hussain's row**. Find **MMR – Dose 1** in the timeline.
   (If the guardian phone panel covers the page on a small screen, close it first.)
2. *Click* **Mark as Given**. 👀 Confirmation: *"Record MMR – Dose 1 (Measles/Mumps/Rubella) for Zara Hussain as given on [today]?"* and *"Reminders for this dose will stop…"*
3. *Click* **Mark as given**.
4. 👀 The dose turns gray **Done** (*"Given [today]"*) and moves above the TODAY line; *Doses given* goes up by one.
   👀 A ✅ notification: *"Reminders for this dose stopped. Next due: …"*
   💬 *"The nurse records it in one click. The schedule updates and Zara won't get any more reminders for that dose."*
5. *Click* **Dashboard** in the header. 👀 Zara is no longer **Due Soon**.

> Mark as Given only appears on doses that are **due now** (Due Soon or Overdue), and only on the next dose of each vaccine, so a later dose can't be marked before an earlier one.

---

## Act 8 – Fast-forward time (3 min) ⭐ *the key moment*

💬 *"Now let's see what happens over the next ten days if nobody else comes in."*

1. Open the **📱 Guardian phone** panel (the page shifts left so both are visible).
2. *Click* **+1 day** three times, pausing after each click:
   - 👀 On one of these days **Bilal's** DTaP and IPV doses become **due today**: a notification appears, the chime plays, and the message **pops into the phone**.
   - 👀 Days with no reminders say *"no reminders were triggered"*.
   💬 *"The system sends the right message on exactly the right day."*
3. *Click* **+1 week**.
   👀 Several reminders arrive:
   - **Bilal**: an **Overdue** reminder, then an **Overdue – final notice** (*"Our staff will contact you…"*)
   - **Omar**: a **Due soon** reminder a few days before his next dose (sometimes also *due today*)
   - **Zara**: **nothing**, because her dose was given in Act 7.

   👀 The dashboard now shows Bilal as 🔴 **Overdue** and Omar as 🟡 **Due Soon**. The date bar reads **"Simulated · 10 days ahead"**.

   💬 *"The escalation: an advance notice, then on the day, then overdue, then a final notice that tells the family staff will call. Zara, who was vaccinated, gets nothing more. That's the whole reminder system working without anyone lifting a finger."*

4. **Pause for a few seconds** while the notifications finish arriving (they come one after another), then close the phone panel with **×**.

---

## Act 9 – The Reminder Log (1½ min)

1. *Click* **Reminder Log** in the header.
2. 👀 Every reminder "sent", newest first, with the date, patient, guardian, phone, doses, type and status **Simulated**.
3. *Click* the **Final notice** chip. 👀 Only final notices are shown (Ayesha, Bilal). *Click* **All**.
4. *Choose* **Bilal Ahmed** in the patient dropdown.
   👀 His full sequence: *due soon → due today → overdue → final notice.* Set the dropdown back to **All patients**.
5. *Click* **Show message** on any row to see the full text. *Click* **View on phone** to open that guardian's phone.
6. *Click* **Download CSV**. 👀 A spreadsheet of the log downloads; open it in Excel if time allows.
   💬 *"A complete record for auditing: who was contacted, when, and what they were told."*

---

## Act 10 – Wrap-up (1 min)

1. *Optional:* go to the dashboard and mark **Ayesha's** three overdue doses as given (open her record → **Mark as Given** on each).
   👀 She changes from 🔴 Overdue to 🟢 Pending and the **Overdue** count drops.
2. *Click* **Reset demo** → 👀 the confirmation dialog explains what is restored → *click* **Reset demo**.
   👀 The real date returns and today's reminder check runs again.
3. *Click* **Log out**. 👀 Back to the login screen; the patient screens can't be opened without signing in.

💬 *"Everything you've seen runs on the same scheduling logic we'd use in the real app. The next step is connecting it to a real SMS or WhatsApp service and the hospital's patient records."*

---

## Optional: show it works on mobile (1 min)

Press **F12** → *click* the **phone/tablet icon** (device toolbar) → choose a phone such as *iPhone 12*. Then refresh (the demo resets) and sign in again.
👀 The dashboard turns into cards, the guardian phone fills the screen, and everything stays usable.

---

## Feature checklist

Tick these off as you go:

| ✔ | Feature | Act |
|---|---|---|
| ☐ | Staff login, wrong-password error, show password | 1 |
| ☐ | Automatic daily reminder check with notifications | 2 |
| ☐ | Dashboard: urgency order, color-coded statuses, next due vaccine and date | 3 |
| ☐ | Summary cards, filter chips, search (including by guardian) | 3 |
| ☐ | Patient info card, overview grid, full timeline (past + upcoming, TODAY marker) | 4 |
| ☐ | Fully up-to-date patient (Hira) | 4 |
| ☐ | Simulate Reminder: exact message, "not sent" notice | 5 |
| ☐ | SMS ⇄ WhatsApp style, copy message | 5 |
| ☐ | Due-today and overdue message wording | 5 |
| ☐ | Guardian phone: inbox, unread counts, combined messages, sound toggle | 6 |
| ☐ | Mark as Given: confirmation, status update, next dose, reminders stop | 7 |
| ☐ | Fast-forward: statuses change, reminders pop in live | 8 |
| ☐ | Reminder escalation: due soon → due today → overdue → final notice | 8 |
| ☐ | Vaccinated child gets no more reminders (Zara) | 8 |
| ☐ | Reminder Log: filters, full message, view on phone, CSV download | 9 |
| ☐ | Reset demo, logout and login protection | 10 |
| ☐ | Mobile layout (optional) | – |

---

## Likely client questions

| Question | Answer |
|---|---|
| *Are messages really sent?* | No. The prototype shows exactly what would be sent. Real sending needs an SMS gateway or the WhatsApp Business API plus a server. |
| *Who receives the reminder?* | The child's parent or guardian, since the patients are children. The wording can change to "Parent/Guardian" or include the relationship (mother, father…). |
| *When is a dose "Due Soon"?* | From 3 days before the due date. This is one setting and can be changed. |
| *What if a child is vaccinated late?* | Staff mark it as given on the day. The record shows how late it was, and later doses keep their normal schedule. |
| *Can it send in Urdu?* | Yes. Urdu templates would be added in the production version. |
| *Can the schedule be changed (e.g. the national EPI schedule)?* | Yes. The schedule is a single table; changing it updates every calculation. |
| *How are patients added?* | The prototype uses built-in sample patients. The real system would have a registration form or connect to hospital records. |
| *Will it be a mobile app?* | The scheduling logic is kept separate from the screens so it can move to a Flutter app. |
| *What's the name?* | "VaxiCare" is a placeholder; you choose the final name. |

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Notifications cover a button | Click **×** on a notification, or wait about 7 seconds for it to disappear. |
| No sound | Check the system volume and the **🔔 Sound on** switch in the Guardian phone panel. |
| You clicked too far ahead or lost your place | **Reset demo** (or press F5) and continue from Act 2. |
| The guardian phone panel is in the way | Close it with **×** or Esc; the unread badge keeps count. |
| The page looks cramped | Maximize the window and set zoom to 100% (Ctrl + 0). |
