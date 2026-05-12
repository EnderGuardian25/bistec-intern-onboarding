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

## 3. Functional Requirements
- Numbered list, grouped by persona, each requirement testable

## 4. Non-Functional Requirements
| Category | Metric | Target | How we'll measure it |
| :--- | :--- | :--- | :--- |

## 5. Assumptions
1. Tutors can also leave a review for students.
2. Students can cancel bookings 12 hours prior as well.
3. Definition of the platform being fast means that the tutor search results show up within a given time frame.
4. Definition of the platform being secure means that the website/app complies with data and banking relavant laws.
5. Daily.co is used for video conferencing on the platform.

## 6. Out of Scope
- What you are explicitly NOT building in this version