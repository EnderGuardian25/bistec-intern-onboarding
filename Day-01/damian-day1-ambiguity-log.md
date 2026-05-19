# LearnLanka — Ambiguity Hunt Log

## Brief reference
"**LearnLanka connects** Sri Lankan **O/L and A/L students** with **vetted tutors** for **one-to-one online sessions**. Students should be able to **find tutors by subject, language, and price**; **book and pay**; **rate the tutor afterwards**. Tutors **set their availability** and **get paid weekly**. We want it to be **fast, secure, and ready before exam season**."

## Findings


| # | Quote | Why ambiguous | Clarification question | Priority |
|---|-------|---------------|------------------------|----------|
| 1 | "vetted tutors" | What does "vetted" imply? Does the platform conduct automated background checks, manual document verification by admins, or a third-party integration? | What specific criteria and documents (e.g., NIC, degree certificates) are required to mark a tutor as vetted? | High |
| 2 | "one-to-one online sessions" | It does not specify if the platform must host the video infrastructure natively or just share links to external tools like Zoom. | Will the video sessions happen natively within our web app, or should we integrate external links? | High |
| 3 | "book and pay" | Does the platform hold funds in escrow until the session ends, or pay out immediately? | Are funds released to the tutor before or after a successful session? | High |
| 4 | "get paid weekly" | "Weekly" doesn't define the exact day? | On which specific day of the week should the automated payout execut? | Medium |
| 5 | "ready before exam season" | "Exam season" is highly variable in Sri Lanka due to fseveral factors | What exactly would be the target launch date? | High |
| 6 | "rate the tutor" | It does not specify which scale the rating uses. | Should the rating system use a 5-star scale with text reviews, and do these require moderation before going public? | Medium |
| 7 | "set their availability" | Is there a specific time in which sessions can be conducted? | What are the slot increments for availability, and how many hours before a slot can a student make a valid booking? | Medium |
| 8 | "fast" | "Fast" is a subjective performance target. | What is the maximum acceptable page load and search API response time for users on a standard Sri Lankan 4G connection? | Low |
| 9 | "O/L and A/L students" | The platform does not clarify if minors (O/L students under 18) require parent/guardian account verification to handle payments. | Do accounts for students under the age of 18 require a linked parent or guardian profile to authorize billing? | Low |
| 10 | "secure" | "Secure" lacks explicit compliance and data privacy parameters for financial transactions and student data. | Do we need to adhere to specific local data privacy laws? | Medium |



## Results Summary


| Metric | Target | Achieved |
|:---|:----:|:----:|
| Items found | 10+ | 10 |
| High-priority items | 3+ | 4 |
| Items convertible to test cases | 5+ | 7 |

## Top 3 questions to ask the founders
1. **Video Architecture:** Will the platform require a custom, built-in interactive video classroom with whiteboard features?
2. **Payout & Refund Policy:** When a student pays for a booking, does LearnLanka hold the money until the session safely concludes, and how are disputes/no-shows handled for weekly payouts?
3. **Hard Deadline Specification:** Given that national O/L and A/L exam schedules frequently shift in Sri Lanka, what is the exact calendar date we must target for the Minimum Viable Product (MVP) launch?

## Reflection
*   **What kind of ambiguity tripped you up most?**  
    The subjective non-functional requirements like "fast" and "secure" were the most challenging. Without concrete business baselines or compliance benchmarks, it is easy  to over-engineer solutions or under-deliver on expectations.
*   **Which question is most likely to change the architecture if answered?**  
    The question regarding **video infrastructure**. Building a native, secure, WebRTC-based in-app classroom architecture requires completely different backend resources, media servers, and bandwidth scaling strategies compared to simply generating and passing third-party Zoom or Google Meet API links.