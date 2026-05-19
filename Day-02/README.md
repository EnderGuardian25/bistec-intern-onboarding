### Container Diagram (C4 Level 2) Walkthrough

This diagram illustrates the high-level logical architecture of the BookSwap platform, detailing how data flows sequentially across system containers:

* **User Interaction Tier:** Members sit at the top of the execution sequence, interacting exclusively with the **React Native Mobile App** container via secure HTTPS channels to browse books and request trades.
* **Decoupled API Logic:** The **Node.js Express API Service** handles all incoming frontend queries, acting as the centralized business logic controller that insulates internal storage layers from direct client exposure.
* **Symmetrical Storage Architecture:** High-speed infrastructure operations split horizontally across an enterprise-grade relational database (**Azure SQL**), an in-memory hot-path cache (**Azure Cache for Redis**), and un-structured asset storage (**Azure Blob Storage**).
* **Asynchronous Queue Buffering:** Non-blocking backend events (like transactional alerts and newsletter compilations) consolidate directly downstream into the **Azure Service Bus Queue** engine to prevent system lag during heavy operational traffic.
* **External Core Dependencies:** The architecture securely terminates into decoupled external cloud providers — **Microsoft Entra External ID** for robust JWT identity authorization and **Azure Communication Services** for reliable outbound email execution.