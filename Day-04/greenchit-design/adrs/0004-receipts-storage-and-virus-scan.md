# ADR 0004: Receipt Storage and Virus Scanning — Azure Blob Storage with Defender for Storage

## Status
Accepted (date: 2026-05-28)

## Context

- GreenChit accepts user-uploaded receipt files (images and PDFs) as part of every expense claim. These files are uploaded by staff on mobile devices and must be stored durably, accessible to line managers during approval, and exportable by finance.
- Accepting arbitrary file uploads from end-user devices is a meaningful security surface. A staff member (or a compromised device) could upload a file containing malware. If that file is later opened by a line manager or downloaded by a finance export script, it could compromise internal systems.
- The component diagram specifies that the Receipt Store Component "validates MIME formats, calculates hashes, pushes binaries to S3 bucket." The sequence diagram shows that a receipt upload failure causes the claim to revert to Draft status — meaning the upload path is on the critical flow, not a background task.
- We need: durable object storage, access control (only authenticated users should retrieve receipts), virus/malware scanning, and integration with the .NET backend.
- We do not yet know the average or maximum file size per claim, or whether staff will upload scanned PDFs (large) versus phone camera photos (variable). Storage costs are not yet modelled.
- Two concerns are in tension: **scanning must happen before the file is considered safe**, but **scanning introduces latency on the claim submission path**.

## Decision

We store receipt files in **Azure Blob Storage** in a private container. Files are never publicly accessible; the backend API generates short-lived Shared Access Signature (SAS) URLs when a line manager or finance user needs to view a receipt.

We enable **Microsoft Defender for Storage** on the storage account, which provides asynchronous malware scanning powered by Microsoft Defender Antivirus. Uploaded blobs are tagged with a `Malware Scanning Result` metadata tag (`Clean`, `Malicious`, or `No threats found`) once the scan completes.

Because the scan is asynchronous, we adopt the following safe-access policy in the Claims API: a receipt is only served to a downstream user (line manager, finance) after its blob metadata tag confirms a clean scan result. Blobs awaiting scanning or tagged as malicious are blocked from download. A malicious file triggers an immediate claim rejection and an audit log entry.

We do not block the claim submission itself waiting for scan completion — the claim moves to `Submitted` status once the blob is uploaded, but the approval action will not proceed until all attached receipts are confirmed clean. This is noted explicitly in the sequence diagram's happy path.

## Consequences

**Easier**
- Azure Blob Storage integrates natively with the .NET Azure SDK. Uploading, generating SAS URLs, and reading blob metadata are well-documented operations the team can implement without specialist knowledge.
- Defender for Storage handles signature updates, scanning infrastructure, and result reporting without any operational overhead from the team. We do not run or maintain a scanner ourselves.
- Private containers with SAS URLs mean receipts are never exposed via a guessable public URL. A malicious actor who intercepts a claim ID cannot directly access the receipt without a valid, time-limited token.
- Blob metadata tags make the scan result observable and auditable: the audit log can record when a receipt was cleared, and the fact of the scan is stored alongside the file.

**Harder**
- The asynchronous scan introduces a window between upload and approval readiness. A line manager who opens an approval request immediately after submission may see receipts in a "pending scan" state and be unable to approve. This is a real UX degradation that we are accepting as the cost of security correctness. The frontend must communicate this state clearly.
- If Defender for Storage marks a legitimate receipt as malicious (a false positive), the claimant's expense claim will be blocked with no automated resolution path. We need a manual override process involving a BISTEC IT administrator — this process does not yet exist and must be defined before go-live.
- Defender for Storage costs are per-GB scanned, charged on top of standard Blob Storage. At low receipt volumes this is negligible, but it is an ongoing cost that scales with adoption.
- We are tightly coupled to Azure Blob Storage. If BISTEC's cloud strategy changes, migrating stored receipts and replacing the SAS URL generation logic is a non-trivial effort.

**Different**
- The security boundary for receipts is now enforced at the infrastructure level (Defender for Storage + private container) rather than purely in application code. A bug in the API cannot accidentally expose a receipt that Blob Storage's access controls protect.

## Alternatives Considered

**Store receipts in Azure SQL as VARBINARY columns** — Keeps everything in one storage system and simplifies backup/restore. Rejected because storing binary blobs in a relational database inflates the database size, degrades query performance on unrelated tables, and makes streaming large files to the client awkward. Purpose-built object storage is the correct tool for binary files.

**Virus scanning via a self-hosted ClamAV container** — Open-source, no per-scan cost, and gives the team full control over the scanner. Rejected because running and maintaining a scanner (signature update jobs, scanner health monitoring, quarantine management) is operational work that does not differentiate GreenChit. Defender for Storage provides equivalent protection as a managed service.

**Scan synchronously before returning 201 to the client** — Would eliminate the "pending scan" UX state by blocking the upload response until the scan completes. Rejected because ClamAV and Defender scans can take several seconds to minutes for large files. Blocking the mobile HTTP request for that duration creates timeout risk and a poor user experience on slow mobile connections. The asynchronous model is the correct trade-off.

**Skip virus scanning entirely for initial release** — Technically simpler, and some internal tools do operate this way. Rejected because GreenChit receipts are opened by managers on corporate devices, and a single malicious file successfully delivered to a line manager's machine undermines the entire security posture of the tool. The risk is not hypothetical; it is a known attack vector for credential harvesting. Enabling Defender for Storage costs approximately ten minutes of configuration. There is no acceptable justification for skipping it.
