Security Checklist & Implementation Path

Vectalogix / Nairobi CRM — React JSX + Node.js + MongoDB

Core PDF security principle: Make the PDF difficult to modify + make modification detectable + allow independent verification.

1. Security objectives

Protect:

User accounts and sessions

Client information

Quotations

Contracts

Proforma invoices

Tax invoices

Payments

Receipts

eTIMS credentials and responses

SMS credentials

Email credentials

Generated PDFs

Digital-signing keys

Audit records

Uploaded documents

Database credentials

Backups

For invoice/PDF security:

Prevent casual PDF editing.

Detect unauthorized modification.

Maintain an authoritative server-side invoice.

Provide independent invoice verification.

Keep signing keys out of the browser.

Maintain an audit trail.

Keep eTIMS information associated with the invoice.

2. Security architecture

Browser
  |
  | HTTPS
  v
React JSX Frontend
  |
  | HTTPS API
  v
Node.js / Express
  |
  +-- Authentication / Authorization
  +-- Validation
  +-- Rate Limiting
  +-- Audit Logging
  +-- Invoice Service
  +-- PDF Service
  |     +-- PDF permissions
  |     +-- Hash
  |     +-- Digital signature
  |     +-- QR verification
  +-- eTIMS Service
  +-- SMS Service
  +-- Email Service
  |
  v
MongoDB

Separate protected infrastructure:
- Secret storage
- Private file/object storage
- Backups
- Monitoring

Never put these in React

Database passwords

eTIMS credentials

SMS API keys

SMTP passwords

Private signing keys

Encryption master keys

JWT/session signing secrets

3. Phase 0 — Threat model

Identify assets.

Identify users and roles.

Identify external integrations.

Identify public endpoints.

Identify sensitive operations.

Identify what happens if an invoice is modified.

Identify what happens if a session is stolen.

Identify what happens if an API key is exposed.

Define backup and recovery requirements.

High-risk operations

Login
Password reset
Create invoice
Approve invoice
Submit invoice to eTIMS
Generate official PDF
Sign PDF
Change invoice
Cancel/credit invoice
Record payment
Upload document
Download document
Change user permissions

4. Environment and secrets

Create:

backend/.env
backend/.env.example

Example .env.example:

NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

MONGODB_URI=

SESSION_SECRET=

ETIMS_BASE_URL=
ETIMS_USERNAME=
ETIMS_PASSWORD=

SMS_API_URL=
SMS_API_KEY=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

PDF_SIGNING_KEY_PATH=
PDF_SIGNING_KEY_PASSWORD=

FILE_STORAGE_BUCKET=
FILE_STORAGE_REGION=
FILE_STORAGE_ACCESS_KEY=
FILE_STORAGE_SECRET_KEY=

Checklist:

.env is in .gitignore.

Secrets are never committed to Git.

Production secrets use protected server/secret-manager storage.

Development and production credentials are different.

Credentials can be rotated.

Signing keys are stored separately from source code.

5. Authentication

Implement:

Login

Logout

Password hashing

Password reset

Login rate limiting

Session expiration

Session revocation

Secure HTTP-only session cookies

Re-authentication for highly sensitive operations

MFA for privileged users where required

Avoid storing sensitive authentication tokens in ordinary browser storage when a secure HTTP-only session design can be used.

6. Authorization / RBAC

Suggested roles:

SUPER_ADMIN
ADMIN
FINANCE
SALES
STAFF
AUDITOR
READ_ONLY

Suggested permissions:

client.read
client.create
client.update

quotation.read
quotation.create
quotation.approve

contract.read
contract.create
contract.sign

proforma.read
proforma.create

invoice.read
invoice.create
invoice.approve
invoice.submit_etims
invoice.cancel

payment.read
payment.record

receipt.read
receipt.create

user.read
user.manage

audit.read

Checklist:

Backend checks permissions.

Frontend only controls presentation.

Users cannot access another user's restricted resource by changing an ID.

Every protected resource checks organization/ownership access.

Administrative actions are audited.

7. API security

Use:

helmet
cors
express-rate-limit
hpp
zod

Checklist:

HTTPS in production.

Strict CORS allowlist.

Security headers.

Rate limiting.

Request body size limits.

Input validation.

Safe error responses.

No stack traces in production responses.

No secrets in error messages.

Authentication on private APIs.

Authorization on sensitive endpoints.

Pagination on large lists.

Upload size limits.

External API timeouts.

Safe handling of external API failures.

8. Input validation

Validate on the backend even if React validates first.

Validate:

Email
Phone number
Kenyan PIN
Invoice number
Amounts
Tax rates
Dates
Client IDs
Document IDs
File type
File size
SMS recipient
SMS content

Invoice rules:

Quantity cannot be negative.

Unit price cannot be negative.

Tax is calculated/validated server-side.

Total is calculated/validated server-side.

Client cannot submit an arbitrary trusted total.

Currency is controlled by the server.

Invoice status transitions are controlled by the server.

9. Database security

MongoDB:

Authentication enabled.

Database is not unnecessarily public.

Application user has least-privilege access.

Development and production databases are separated.

Backups enabled.

Backup restoration tested.

Encryption in transit.

Encryption at rest where supported/configured.

Appropriate indexes.

Sensitive fields protected appropriately.

Audit records protected from ordinary users.

Network access restricted.

Never expose MongoDB credentials to React.

10. Invoice lifecycle security

Recommended:

DRAFT
  |
  v
READY
  |
  v
SUBMITTING
  |
  +----> SUBMISSION_FAILED
  |
  v
SIGNED / FISCALIZED
  |
  +----> CREDIT_NOTED / CANCELLED

Rules:

Draft invoices can be edited.

Official/fiscalized invoice financial fields become immutable.

Corrections use the appropriate business process instead of silently changing the original.

eTIMS identifiers are immutable once received.

Every status change is logged.

User and timestamp are logged.

11. PDF security — core implementation

11.1 Generate official PDFs on the backend

Do not treat a browser-generated PDF as the authoritative document.

React
  |
  | Request invoice PDF
  v
Node.js
  |
  +--> Load authoritative invoice
  +--> Validate invoice status
  +--> Generate PDF
  +--> Apply PDF permissions/encryption
  +--> Calculate hash
  +--> Digitally sign where supported
  +--> Add verification information
  |
  v
Final PDF

12. PDF editing protection

PDF permission controls can make ordinary editing more difficult, but they are NOT an absolute guarantee that nobody can alter or recreate a PDF.

Implement where supported by the chosen PDF library:

Disable modification.

Disable annotations where appropriate.

Disable page assembly where appropriate.

Disable form modification where applicable.

Restrict copying where appropriate.

Encrypt the PDF using a strong supported encryption mode.

Keep permission/owner credentials server-side.

Never treat PDF permissions as the only integrity control.

Important distinction

PDF permissions
      =
Editing deterrence

Digital signature + hash + verification
      =
Integrity/authenticity controls

13. PDF cryptographic integrity

For each official PDF:

Invoice data
    |
    v
Canonical document representation
    |
    v
Cryptographic hash
    |
    v
Digital signature
    |
    v
Signed document / signature metadata

Store:

documentId
invoiceId
documentVersion
sha256
signatureAlgorithm
signatureMetadata
signedAt
signedBy
verificationId
storageLocation

Checklist:

Hash is calculated on the final document/version.

Signing key is outside source code.

Signing occurs server-side or in a protected signing service.

Signing-key access is restricted.

Signing events are audited.

Key rotation procedure exists.

Historical signatures remain verifiable after key rotation.

14. PDF SHA-256 hash

Each final PDF should have a cryptographic fingerprint.

Example record:

{
  "documentId": "DOC-8F72A1",
  "invoiceId": "INV-2026-0018",
  "version": 1,
  "algorithm": "SHA-256",
  "hash": "...",
  "createdAt": "...",
  "status": "VALID"
}

If the PDF is changed:

Original PDF
   |
SHA-256
   |
ABC123...

Modified PDF
   |
SHA-256
   |
9F88D...

The hashes differ.

15. Digital signature

A stronger implementation uses a real digital signature, not only a stored hash.

Concept:

Final PDF
   |
   v
Hash
   |
   v
Private signing key
   |
   v
Digital signature
   |
   v
Signed PDF

Requirements:

Private key never reaches React.

Private key never appears in Git.

Private key is encrypted/protected.

Access is restricted.

Signing operation is audited.

Signature verification is tested.

Key rotation is documented.

Do not write your own cryptographic algorithm.

Use a mature, audited cryptographic/PDF signing implementation.

16. QR verification

Every official invoice should have an opaque verification ID.

Example:

VER-7F3K-91XA

QR destination:

https://your-domain.com/verify/VER-7F3K-91XA

Do not place secrets inside the QR code.

Flow:

Scan QR
   |
   v
Public verification page
   |
   v
GET /api/public/verify/:verificationId
   |
   v
Authoritative database
   |
   v
Verification result

17. Public verification page

Example:

====================================

          INVOICE VERIFIED

              ✓ VALID

Invoice Number:
KRACU0200175372/18

Supplier:
Your Company

Customer:
Client Name

Date:
10/09/2026

Amount:
KSh 150,000.00

eTIMS Status:
SIGNED

Document Version:
1

Document Integrity:
VALID

====================================

Only expose information intended for public verification.

Do not expose:

Database IDs that reveal internal structure

Private customer data

API credentials

Internal eTIMS secrets

Signing keys

Internal audit details

18. Detecting a modified PDF

Use two independent checks.

A. Document integrity

PDF
 ↓
Cryptographic signature/hash verification
 ↓
VALID / MODIFIED

B. Business record verification

QR
 ↓
Verification ID
 ↓
Database
 ↓
Original invoice record

Use both mechanisms.

19. Invoice versioning

Never silently overwrite an official invoice.

Store:

invoiceId
version
createdAt
createdBy
reason
previousVersion
documentHash
status

Example:

Invoice
  |
  +-- Version 1
  |     KSh 150,000
  |
  +-- Credit note
  |
  +-- Corrected business document

Once an official tax invoice is issued, preserve its original record.

20. Audit logging

Create an AuditLog model.

Record:

User
Action
Resource
Resource ID
Timestamp
IP address
User agent
Result
Reason

Examples:

FINANCE_USER
GENERATED_TAX_INVOICE
INV-2026-0018
SUCCESS

ADMIN
CHANGED_USER_ROLE
USER-102
SUCCESS

Rules:

Ordinary users cannot delete audit logs.

Sensitive actions are always audited.

Audit records are protected.

Audit timestamps are server-generated.

Never log:

Passwords

Private keys

API secrets

Database passwords

Full authentication tokens

21. eTIMS security

Protect:

eTIMS credentials.

eTIMS tokens/API keys.

Integration configuration.

eTIMS request/response records.

Retry logic.

Duplicate submission protection.

Timeouts.

Error handling.

Store an internal submission record:

invoiceId
submissionAttempt
submittedAt
requestReference
responseReference
status
errorCode
errorMessage

Never put eTIMS secrets into React/Vite public environment variables.

22. SMS security

SMS credentials remain backend-only.

Implement:

Provider abstraction.

Message templates.

Recipient validation.

Rate limiting.

Delivery tracking.

Provider response storage.

Retry policy.

Duplicate-send prevention.

Audit logging.

Architecture:

Invoice
   |
   v
Notification Service
   |
   v
SMS Service
   |
   v
Provider Adapter
   |
   v
SMS Provider

23. Email security

Implement:

SMTP/API credentials server-side only.

Email templates.

Recipient validation.

Attachment restrictions.

Server-generated PDF attachments.

Email audit logging.

Retry handling.

Bounce/failure tracking.

Never send directly from React using SMTP credentials.

24. File upload security

For contracts, receipts, documents and attachments:

File size limits.

MIME validation.

Extension validation.

Filename sanitization.

Random storage names.

Malware scanning where appropriate.

Private storage by default.

Authorization before download.

Executable uploads blocked.

Browser-provided filename not trusted.

25. PDF download security

Avoid unrestricted public files such as:

/files/invoice123.pdf

Prefer:

GET /api/invoices/:id/pdf

Backend flow:

Authenticate
    |
    v
Authorize
    |
    v
Load invoice
    |
    v
Check access/status
    |
    v
Return PDF

Public verification should be separate from private document download.

26. Rate limiting

Use different limits for different endpoint types:

Login              STRICT
Password reset     STRICT
Public verify      MODERATE
Invoice API        NORMAL
Admin API          NORMAL
SMS sending        VERY STRICT
eTIMS submission   VERY STRICT
PDF generation     CONTROLLED

PDF generation should be protected because it can consume CPU/memory.

*** Prevent duplicate eTIMS submissions

Before submission:

Check invoice status
       |
       +-- Already submitted?
       |       |
       |       YES
       |       |
       |       Stop duplicate submission
       |
       NO
       |
       v
Submit to eTIMS

Use an appropriate idempotency/reference strategy.

*** Background jobs

Use background jobs for expensive or asynchronous work:

PDF generation
Email
SMS
Large reports
eTIMS retries
Notifications

Recommended:

jobs/
├── invoice.job.js
├── pdf.job.js
├── email.job.js
├── sms.job.js
└── etims.job.js

*** Logging and monitoring

Log:

Authentication failures.

Authorization failures.

Invoice creation.

Invoice modifications.

eTIMS submissions.

PDF generation.

PDF signing.

Verification requests.

SMS failures.

Email failures.

Unexpected server errors.

Never log secrets.

*** Backup and recovery

Automated database backups.

Backup retention policy.

Encrypted backups.

Off-site backup.

Document/PDF backup.

Restoration tests.

Disaster recovery procedure.

Recovery Time Objective documented.

Recovery Point Objective documented.

A backup is not proven until restoration has been tested.

*** Production deployment

Before production:

HTTPS enabled.

HTTP redirects to HTTPS.

Secure cookies enabled.

Production secrets configured securely.

Database is not unnecessarily public.

Firewall/network controls configured.

Reverse proxy configured.

Rate limiting enabled.

Security headers enabled.

Production errors hide internal details.

Monitoring enabled.

Backups verified.

Health checks enabled.

Dependency vulnerabilities checked.

React build contains no secrets.

***  PDF production release gate

Do not mark official invoice PDF functionality production-ready until all applicable checks pass.

Generation

PDF generated server-side.

Authoritative invoice data loaded from the database.

Invoice totals validated server-side.

Official invoice status checked.

Editing deterrence

PDF modification permissions configured.

Annotation restrictions configured where appropriate.

Copy restrictions configured where appropriate.

Page assembly restrictions configured where appropriate.

PDF encryption configured where required.

Integrity

SHA-256 hash recorded.

Digital signature implemented.

Signing key secured.

Signature verification tested.

Verification

Unique verification ID generated.

QR code generated.

Public verification endpoint implemented.

Verification page implemented.

Modified-document test completed.

Audit

PDF creation logged.

PDF signing logged.

PDF download logged where appropriate.

Invoice changes logged.


*** PDF security testing

Test 1 — Normal editing

Generate an official invoice.

Open it in a PDF editor.

Attempt to modify the amount.

Confirm configured editing restrictions behave as expected.

Test 2 — Re-created PDF

Copy invoice information.

Create a separate PDF.

Make it visually similar.

Scan the genuine invoice QR.

Confirm verification points to the authoritative record.

Test 3 — Modify signed PDF

Generate a signed PDF.

Modify a financial field in a test copy.

Verify the signature.

Confirm the modified copy fails integrity verification.

Test 4 — Unauthorized invoice access

Log in as User A.

Attempt to download User B's restricted invoice.

Confirm authorization fails.

Test 5 — QR verification

Scan the genuine QR.

Confirm the correct invoice record appears.

Modify a test PDF.

Confirm the online authoritative record has not changed.

Test 6 — Duplicate eTIMS submission

Submit a test invoice.

Repeat the request.

Confirm duplicate submission is prevented/handled according to the integration design.

** Implementation order

PHASE 1
Environment + secrets
        ↓
PHASE 2
Authentication
        ↓
PHASE 3
Authorization / RBAC
        ↓
PHASE 4
API security
        ↓
PHASE 5
Input validation
        ↓
PHASE 6
Database security
        ↓
PHASE 7
Audit logging
        ↓
PHASE 8
Invoice lifecycle
        ↓
PHASE 9
Secure PDF generation
        ↓
PHASE 10
PDF editing restrictions
        ↓
PHASE 11
Document hashing
        ↓
PHASE 12
Digital signatures
        ↓
PHASE 13
QR verification
        ↓
PHASE 14
eTIMS integration
        ↓
PHASE 15
SMS + email security
        ↓
PHASE 16
File/document security
        ↓
PHASE 17
Monitoring + backups
        ↓
PHASE 18
Security testing
        ↓
PRODUCTION

** Recommended PDF service structure

backend/src/services/pdf/
│
├── pdf.generator.js
│       Generates the invoice PDF
│
├── pdf.permissions.js
│       Editing/annotation/copy restrictions
│
├── pdf.encryption.js
│       PDF encryption/password handling
│
├── pdf.hash.js
│       SHA-256 document fingerprint
│
├── pdf.signature.js
│       Digital signing
│
├── pdf.verification.js
│       Verification ID + QR
│
└── pdf.storage.js
        Secure document storage

  Final security model

                    OFFICIAL INVOICE
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
          eTIMS          PDF          Database
          record       security      authoritative
             |             |
             |       +-----+-----+
             |       |           |
             |       v           v
             |   Restrictions   Hash
             |                   |
             |                   v
             |              Signature
             |                   |
             +---------+---------+
                       |
                       v
                    QR Code
                       |
                       v
               Public verification
                       |
                       v
              Authoritative record

The security guarantee to design for

Do not promise:

"Nobody can ever edit this PDF."

A PDF can potentially be recreated or manipulated outside your system.

Instead, design for:

Unauthorized editing is discouraged, modification of the signed document is detectable, and the authoritative invoice can be independently verified against the server-side record.

