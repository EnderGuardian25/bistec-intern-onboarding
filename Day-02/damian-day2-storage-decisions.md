## 1. Data Inventory

| Data Type | Example Record / Key Fields | Volume Estimate (1y) | Read/Write Ratio | Source of Truth |
| :--- | :--- | :--- | :--- | :--- |
| **Member Profiles** | `id` (UUID), `displayName`, `entraObjectId`, `apartmentNumber`, `phoneNumber` | ~2,500 rows | Read-Heavy (100:1) | **Azure SQL (`Users` table)** |
| **Book Listings** | `id` (UUID), `title`, `author`, `isbn`, `condition`, `status`, `ownerId` | ~50,000 rows | Read-Heavy (50:1) | **Azure SQL (`Books` table)** |
| **Book Photos** | Raw binary payload (JPEG/PNG up to 5 MB) | ~50,000 files (~250 GB) | Read-Heavy (20:1) | **Azure Blob Storage** |
| **Loan Transactions** | `id`, `bookId`, `borrowerId`, `status`, `requestedAt`, `startedAt`, `dueDate` | ~150,000 rows | Balanced (5:1) | **Azure SQL (`Loans` table)** |
| **In-App Notification Feed** | `id`, `recipientId`, `message`, `isRead`, `createdAt` | ~500,000 rows | Write-Heavy (1:2) | **Azure SQL (`Notifications` table)** |

---

## 2. Storage Selection

### Member Profiles & Book Listings
*   **Chosen Store:** Azure SQL Database
*   **Why This Store:** The business requirements demand rigid data integrity and strict privacy handling. Azure SQL lets you enforce foreign key constraints between books and users natively. It allows us to execute clean transactional state transitions—such as moving a book's status from `Available` to `Requested` only if no active loan record conflicts with it. 
*   **Why Not the Alternatives (Document DB):** A document store like Cosmos DB would require us to either duplicate user profiles inside every book document or handle relational joins programmatically in our Node.js application layer. Given our small dataset constraint of up to 5,000 books per building cluster, Cosmos DB's horizontal scaling advantages do not justify the loss of ACID transactional safety.

### Book Photos
*   **Chosen Store:** Azure Blob Storage
*   **Why This Store:** This service is purpose-built for cost-effective, unstructured binary large object (BLOB) processing. It allows our Node.js backend to serve short-lived Shared Access Signature (SAS) tokens so clients can upload 5 MB images directly. This completely unburdens our Express/Fastify application servers from handling heavy multi-part file streams.
*   **Why Not the Alternatives (SQL Database):** Storing 5 MB images directly inside Azure SQL via `VARBINARY(MAX)` would cause catastrophic database file bloat. It would exhaust our database buffer pool memory with image data during sequential index scans, severely degrade query performance for text searches, and exponentially increase backup restoration times and costs.

### In-App Notification Feed & Transaction History
*   **Chosen Store:** Azure SQL Database
*   **Why This Store:** Centralizing our transactional history (loans and alerts) in the same relational engine allows for straightforward, daily analytical reporting (e.g., automated checks for items overdue beyond 30 days) using basic SQL queries.
*   **Why Not the Alternatives (Azure Table Storage):** While Azure Table Storage is incredibly cheap for logs, it lacks complex secondary indexing capabilities out of the box. Searching a borrower's complete history across different books would force inefficient table scans, endangering our NFR target of sub-300 ms p95 response times.

---

## 3. Cache Plan

### What is Hot Enough to Cache?
We will cache the **global catalog search index queries** and the **individual book details pages**. In an apartment community network, users frequently browse the same recently listed local books, resulting in highly repetitive reading patterns.

### When NOT to Cache
We will **explicitly avoid caching active loan lifecycle states** (e.g., checking if a book is currently `Lent` or `Available` during a borrow request checkout flow). 

### Cache-Aside Implementation Pseudocode
The system implements the classic Cache-Aside pattern to read from Azure Cache for Redis before accessing the primary SQL database.

## 4. Queue Plan

### 1. What Goes on the Queue and Why?
Instead of making the user wait for slow, external tasks to finish, our API handles them in the background using **Azure Queue Storage**. 

| What is queued? | When does it trigger? | Why use a queue? |
| :--- | :--- | :--- |
| **In-App Notifications** | When a neighbor requests a book. | Delivers the alert to the owner's screen instantly (under 2 seconds) without lagging the borrower's app. |
| **Email Alerts** | When a request is made, accepted, or declined. | If the email service goes down, the app keeps working. Book listings and trades don't get blocked. |
| **Weekly Newsletter** | Automatically every Sunday morning. | Sending thousands of emails at once is heavy. The queue processes them safely in the background so the app stays fast. |

---

### 2. What Happens if the System Goes Down for 30 Minutes?
If the background worker that processes these tasks crashes or loses internet for 30 minutes, **no data is lost**. The system recovers automatically using a 3-step safety net:

#### Step 1: Safe Storage (The Backlog)
While the worker is offline, the API keeps running normally. It continues to drop new email and notification tasks into the Azure Queue. The queue holds onto the messages for up to 7 days until the worker comes back online.

#### Step 2: The 30-Second Safety Rule (Visibility Timeout)
When a worker grabs a task from the queue, that task is hidden from other workers for 30 seconds. If the worker crashes *while* sending an email, it won't be able to tell the queue "I'm done." After 30 seconds, the task automatically unhides itself so another healthy worker can pick it up and try again.

#### Step 3: The Broken Message Filter (Dead Letter Queue)
If a specific email task has corrupt data, it will fail over and over again. To stop a bad message from breaking the system in an endless loop, the queue counts the attempts. If a task fails **5 times**, it is kicked out of the main line and sent to a **Dead Letter Queue (DLQ)**. This sounds alarms for the developers to fix it manually, while letting all the other healthy emails go through.