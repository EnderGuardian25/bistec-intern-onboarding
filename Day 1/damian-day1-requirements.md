# LearnLanka — Requirements Document

## 1. Problem Statement
LearnLanka is a platform that connects Sri Lankan O/L and A/L students with vetted tutors for one-to-one online sessions (video calls). Students should be able to find tutors by subject, language and price; book and pay; the student should be able to rate the tutor afterwards and vice versa. Tutors set their availability in slots and get paid weekly. The platform should display tutor search results returned in under 800 ms at the 95th percentile from a Sri Lankan ISP. It must also follow security protocols and comply with the Sri Lanka Personal Data Protection Act 2022 and use a PCI-DSS compliant payment gateway.

## 2. Personas

### Student

#### Goals :
1. Find Tutors based on their language, subject and price.
2. Confirm a booking slot with a tutor and make the payment.
3. Review and leave comments for tutors after sessions.

#### Frustrations :
1. Tutors may cancel bookings.
2. Desired tutor may not have available time slots.
3. Video conferencing errors on the platform.

### Tutor

#### Goals :
1. Recieve and confirm bookings from students looking for tutors.
2. Recieve weekly payments on completed tutoring sessions.
3. Review and leave comments for students after sessions.

#### Frustrations :
1. Payment delays may occur.
2. Students may cancel bookings.
3. Video conferencing errors on the platform that can hinder teaching quality.

### Operations Admin

#### Goals :
1. Recieve 15% commissions from all tutor bookings.
2. Ensure platform rating systems function.
3. Improving usability to ensure returning tutors and students.

#### Frustrations :
1. Issues with payment gateways.
2. Video conferencing errots.
3. Constant end user support requests.
4. Video conferencing errors that cannot be handled as it is outsourced.

## 3. Functional Requirements
1. Ability for students to search and filter tutors based on subject, grade, language and price band.
2. Ability for students to book a an hour long session with tutors after paying using card or ez cash throguh the PayHere platform.
3. Ability for students to cancel their bookking and payment to be redunded.
4. Ability for Tutors to publish availability slots, accept and decline bookings and cancel at least 12 hours prior to a session.
5. Automatically update availability slots for tutors once bookings have been made and notifying the respective tutor.
6. Once a transfer has been confirmed a 15% commision needs to be charged before the payout.
7. Tutor payout must occur every Monday at 8.00 AM.
8. Both students and tutors have the ability to rate each other (1-5 stars) and leave a single line comment based on performance after the session.

## 4. Non-Functional Requirements
| Category | Metric | Target | How we'll measure it |
| :--- | :--- | :--- | :--- |
| Tutor Search results | latency | 95% of all search requests return in under 800ms | Scaled unit testing for search engine |
| Uptime | Month based | 99.5% platform uptime per month leaving only about 4 hours for meintenance | Ensure no bugs are implemented before launch to reduce meintenance | 

## 5. Assumptions
1. Tutors can also leave a review for students.
2. Students can cancel bookings 12 hours prior as well.
3. Definition of the platform being fast means that the tutor search results show up within a given time frame.
4. Definition of the platform being secure means that the website/app complies with data and banking relavant laws.
5. Daily.co is used for video conferencing on the platform.

## 6. Out of Scope
1. Tutor verification system.
2. Student verification system.
3. Session reminder notifier to student and tutor.