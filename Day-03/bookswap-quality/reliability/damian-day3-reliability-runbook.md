# BookSwap — Reliability Runbook

This guide outlines how to handle system issues during our upcoming feature in The Sunday Times and manage the transition from 1 building to 200 buildings. It covers what happens when things break, how to spot the issue, and what steps to take.

---

## Failure 1: The Main Database Goes Down (Azure SQL)
What happens when our primary SQL database completely drops offline for 5 minutes.

### What the user sees
* **Browsing books:** Still works. Users see a blue banner stating: "Displaying cached results. You may experience a brief delay when posting."
* **Creating a post:** The app will not crash or show an unhandled error page. Instead, a loading wheel spins for up to 12 seconds. If the database remains unavailable, it displays: "We're experiencing high traffic. Your listing is saved and will appear shortly!"

### How to spot it (Detection)
* **The Main Alert:** An Azure Monitor alert fires if the database success rate drops below 99.5% for over 1 minute.
* **The Log Query:** You can run this KQL query in Azure Log Analytics to check for locked-up database connections (indented below):

    AzureDiagnostics
    | where ResourceProvider == "MICROSOFT.SQL" and Category == "BlocksAndDeadlocks"
    | where TimeGenerated > ago(2m)
    | summarize FailureCount = count() by Resource

* **Routing:** PagerDuty will immediately alert the On-Call Database Engineer (DBRE).

### Code & Design Fixes (Built-in Mitigations)
* **Fast Timeouts:** We configured the application connection string to stop waiting after 5 seconds instead of the default 30 seconds. This prevents our web servers from locking up.
* **Smart Retries:** We use Polly. If a database query fails, the app tries again exactly 3 times, spacing out the attempts (2 seconds, then 4 seconds, then 8 seconds) with random jitter timing so we do not overload the database as it recovers.
* **The Circuit Breaker:** If 5 requests fail in a row, a circuit breaker trips open for 60 seconds and stops hitting the dead database entirely.
* **The Backup Queue & Idempotency:** While the circuit breaker is open, new book posts are assigned a unique Idempotency-Key and placed into an Azure Storage Queue (listing-fallback-queue). Once the database recovers, a background worker processes them safely, using the key to ensure we do not create duplicate posts.

### Manual Response (What to do right now)
* **Who handles it:** The On-Call DBRE. If they do not answer within 5 minutes, it alerts the Infrastructure Lead.
* **Step-by-Step Instructions:**
  1. Open the Azure Portal, search for bookswap-sql-failover-group, and see if Azure is automatically moving our data to our backup region.
  2. If it is stuck and the database is still dead, run this command in the Azure Cloud Shell to force it to switch to our secondary backup region (indented below):

    az sql failover-group set-primary --group-name bookswap-failover-group --primary-office secondary-region --resource-group bookswap-prod-rg --server-name bookswap-primary-server

  3. Check the Azure Application Gateway dashboard to ensure users are getting a 202 Accepted code (meaning their posts are safely waiting in the backup queue).

### Post-Incident Actions
* File a support ticket with Microsoft within 48 hours to find out why the primary database died.
* Create a Jira ticket to upgrade our database from General Purpose to Business Critical so we get automated instant failovers in under 30 seconds.

---

## Failure 2: The Fast-Cache Goes Down (Azure Redis)
What happens when our memory cache crashes, forcing all traffic to look things up the slow way.

### What the user sees
* **Performance degradation:** The app still works and no data is lost, but loading book searches goes from an under 300 ms experience to a noticeably laggy 1.2 seconds.
* Clicking between pages inside the app might lag for a second while it pulls user data directly from the main database instead of the quick cache.

### How to spot it (Detection)
* **The Main Alert:** An Azure Monitor alert triggers if the number of connected clients on our Redis cache drops to 0 for more than 2 minutes.
* **The Log Query:** Run this in Log Analytics to see if the app is timing out when trying to talk to Redis (indented below):

    AzureDiagnostics
    | where ResourceType == "REDIS"
    | where Message contains "ConnectionMultiplexer" or Message contains "Timeout performing"
    | summarize FailureCount = count() by bin(TimeGenerated, 1m)

* **Routing:** PagerDuty sends a medium-priority alert to the On-Call Backend Software Engineer.

### Code & Design Fixes (Built-in Mitigations)
* **Cache-Aside Fallback:** Our code uses a try-catch block. If the app tries to read from Redis and fails, it catches the error, logs it, and automatically fetches the data from the Azure SQL database instead.
* **Redis Circuit Breaker:** If Redis times out 10 times in a row (using a 150 ms timeout per attempt), the app stops trying to touch Redis for 90 seconds so our server threads do not get stuck on broken network connections.
* **Database Protection:** Because all traffic will suddenly hammer the main database, we increased the database connection pool (Max Pool Size=500) so the SQL server does not run out of available slots.

### Manual Response (What to do right now)
* **Who handles it:** The On-Call Backend Engineer.
* **Step-by-Step Instructions:**
  1. Look at the Resource Health tab for bookswap-redis-prod in the Azure Portal. Check if it ran out of memory or if Azure is having a hardware issue.
  2. If the cache is frozen or acting weird because it is full, run this command to reboot it. This clears its memory and forces it to spin up a clean node (indented below):

    az redis reboot --name bookswap-redis-prod --resource-group bookswap-prod-rg --reboot-type PrimaryNode

  3. Keep an eye on the Main SQL Database CPU metrics. If database CPU goes over 85%, go to the API Gateway and turn on a temporary rate limit to slow down public users.

### Post-Incident Actions
* Open a Jira ticket to update our Redis settings via Terraform. Change maxmemory-policy to allkeys-lru. This makes Redis automatically delete old, unlooked-at book data when it gets full, rather than crashing the system.
* Set up an alert that pings the team if Redis hits 80% memory capacity.

---

## Failure 3: The Sunday Tabloid Traffic Spike (10x Sustained Traffic)
What happens when thousands of new readers find our app all at the same time on Sunday morning.

### What the user sees
* **Standard experience:** The vast majority of users get a fast experience because the system scales up automatically.
* **During peak surges:** If things get incredibly crowded, creating a listing might show a processing wheel that says: "High volume detected. We are processing your request securely; your place in line is preserved."
* **Rate-limited users:** Anyone refreshing the page excessively will be blocked and see a clean page stating: "Too many requests. Please wait 60 seconds before trying again."

### How to spot it (Detection)
* **The Main Alert:** Azure Application Gateway reports that current connections crossed 15,000, or our server cluster CPU percentage stays above 75% for over 3 minutes.
* **The Log Query:** Run this to see exactly how many requests are hitting us every minute and what HTTP status codes they receive (indented below):

    AzureDiagnostics
    | where ResourceProvider == "MICROSOFT.NETWORK" and Category == "ApplicationGatewayAccessLog"
    | summarize RequestsPerMinute = count() by bin(TimeGenerated, 1m), httpStatus_d

* **Routing:** An automated alert fires at 5x traffic. If it hits 10x and CPU becomes critical, PagerDuty calls the On-Call DevOps / SRE Team.

### Code & Design Fixes (Built-in Mitigations)
* **Autoscale Rules:** Our servers scale out automatically. If average CPU goes above 65% for 2 minutes, Azure automatically spins up 4 extra servers to share the load, up to a maximum cap of 32 servers.
* **Asynchronous Processing:** When a user creates a book listing, the app does not save it directly to the database or send an email right away. Instead, it throws the data into an Azure Service Bus Queue (listing-processing-queue) and tells the user "Got it!".
* **Worker Autoscale:** If the number of messages waiting in that queue passes 500, extra background worker instances automatically turn on to process the backlog.
* **Rate Limiting (Throttling):** Our API Gateway shuts down excessive traffic automatically:
  * Logged-in members get a max of 60 requests per minute.
  * Public guests get a max of 15 requests per minute.
  * Anyone going over gets a 429 Too Many Requests response.

### Manual Response (What to do right now)
* **Who handles it:** The On-Call DevOps/SRE Engineer.
* **Step-by-Step Instructions:**
  1. On Sunday morning at 06:00 AM before the newspaper hits the stands, run this command to pre-scale our servers to 12 instances so we are ready for the initial wave (indented below):

    az wp scale --resource-group bookswap-prod-rg --name api-scale-set --instance-count 12

  2. Open the Azure Service Bus dashboard. If the message queue is backed up and taking more than 15 seconds to process, manually deploy an extra pool of worker containers.
  3. If a malicious traffic surge occurs under the guise of the traffic spike, navigate to the Web Application Firewall (WAF) settings and toggle on the strict domestic-only traffic rule.

### Post-Incident Actions
* Once the 4-hour promotional window ends, double-check the Azure portal to make sure our servers safely scaled back down to the normal baseline (2 instances) to manage costs.
* Take the real data captured from this spike and use it to run a simulated 20x load test in our staging environment next week to reveal the next bottleneck.