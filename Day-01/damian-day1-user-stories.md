# LearnLanka — User Story Set v0.1

## Story 1: Tutor Filtering and Search
**As a** Student  
**I want** to filter and search tutors by subject, grade, language, and price band  
**So that** I can quickly find an affordable tutor who meets my exact educational needs.  

### Acceptance Criteria
- **Given** I am on the tutor search page, **when** I select a specific subject, grade, language, and price band, **then** the system displays a filtered list of matching tutors in under 800 ms.
- **Given** no tutors match my exact selected search filters, **when** the search executes, **then** the system displays a clear message stating "No tutors found matching your criteria" and suggests clearing filters.

### INVEST self-check
- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable

---

## Story 2: Hour-Long Session Booking & Payment
**As a** Student  
**I want** to book an hour-long session with a tutor and pay using card or eZ Cash via PayHere  
**So that** my slot is secured instantly and seamlessly through a trusted local gateway.  

### Acceptance Criteria
- **Given** I am on a tutor's profile page and have selected an open 1-hour slot, **when** I choose Card or eZ Cash on PayHere and complete the payment , **then** my booking status updates to "Confirmed" and a success message is shown.
- **Given** my payment fails or is declined on the PayHere interface, **when** I am redirected back to the platform, **then** the slot remains open and I see an error message mentioning the payment failure.

### INVEST self-check
- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable

---

## Story 3: Student Booking Cancellation & Refund
**As a** Student  
**I want** to cancel my confirmed booking at least 12 hours prior to the session start time  
**So that** I can get a full refund if my schedule changes unexpectedly.  

### Acceptance Criteria
- **Given** a booking scheduled to start more than 12 hours from now, **when** I click the "Cancel Booking" button, **then** the system updates the booking status to "Cancelled" and automatically initiates a full refund process via PayHere.
- **Given** a booking scheduled to start less than 12 hours from now, **when** I view the booking details, **then** the "Cancel Booking" button is disabled and I am notified that cancellation is no longer allowed.

### INVEST self-check
- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable

---

## Story 4: Tutor Availability Management & Calendar Updates
**As a** Tutor  
**I want** to publish my open time slots and have them automatically close when a booking is confirmed  
**So that** I don't get double-booked and receive instant automated notifications for new appointments.  

### Acceptance Criteria
- **Given** I am on my dashboard, **when** I select a date and time slot and click "Publish", **then** that slot immediately becomes visible to students on the platform.
- **Given** a student successfully pays for a specific time slot, **when** the payment is confirmed, **then** the slot status shifts from "Available" to "Booked" and sends me an immediate notification.

### INVEST self-check
- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable

---

## Story 5: Two-Way Review System
**As a** Student or Tutor  
**I want** to leave a 1-5 star rating and a single-line comment for the other party after an online video session concludes  
**So that** the platform maintains quality control, high engagement, and transparency for both sides.  

### Acceptance Criteria
- **Given** a Daily.co video session has concluded, **when** I visit my dashboard, **then** a feedback option appears requiring a 1-5 star selection and limiting text entry to a single line with a character limit.
- **Given** I submit the feedback form, **when** the database processes the transaction, **then** the target user's avaerage rating updates and the review becomes visible on their profile history.

### INVEST self-check
- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable

---

## Story 6: Automated Commission Extraction & Payouts
**As an** Operations Admin  
**I want** the system to deduct a 15% commission from each transaction and auto-execute the remaining payout to tutors every Monday at 8:00 AM  
**So that** platform revenue is securely collected and tutors get paid consistently without manual intervention.  

### Acceptance Criteria
- **Given** a booking payment of 2,000 LKR is captured, **when** the transaction splits, **then** 300 LKR (15%) is routed to the platform wallet and 1,700 LKR is assigned to the tutor's pending balance.
- **Given** it is Monday at 8:00 AM, **when** the automated payout job executes, **then** the system processes bank transfers for all tutors with a pending balance greater and resets their balance to zero.

### INVEST self-check
- [x] Independent
- [x] Negotiable
- [x] Valuable
- [x] Estimable
- [x] Small
- [x] Testable