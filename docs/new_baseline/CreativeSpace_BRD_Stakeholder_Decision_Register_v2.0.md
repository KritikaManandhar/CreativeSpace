# CreativeSpace — Stakeholder Decision Register v2.0

**Document Type:** Authoritative Stakeholder Decision Register  
**Project:** CreativeSpace  
**Version:** 2.0  
**Status:** Consolidated for BRD Reconciliation  
**Purpose:** Single source of truth for reconciling the complete CreativeSpace BRD v2.0.

---

# 1. Purpose and Authority of This Register

This register consolidates stakeholder-approved business decisions for CreativeSpace.

It is the authoritative reference for the business rules, workflows, restrictions, and scope decisions recorded below.

Antigravity MUST:

1. Treat every decision marked **APPROVED** as a final stakeholder requirement.
2. Update the complete BRD wherever an approved decision is missing, incomplete, contradictory, or incorrectly marked unresolved.
3. Maintain consistency across business requirements, workflows, diagrams, business rules, scope, assumptions, dependencies, decision registers, and glossary definitions.
4. Never change an approved decision based on its own interpretation, assumptions, or preferred implementation approach.
5. Never convert an OPEN or DEFERRED decision into an approved requirement without explicit stakeholder approval.
6. Never invent missing business rules, commercial policies, payment policies, retention periods, or operational procedures.
7. Preserve the distinction between business requirements and technical implementation decisions.
8. Maintain traceability between every decision and all affected BRD sections.

The complete BRD was supplied to ChatGPT in three messages because of message-length limitations. Those three messages represent three portions of ONE complete BRD v2.0. They are not separate BRD versions or separate documents. Antigravity must reconcile the entire original BRD as one document, using all three portions.

This register does not itself constitute approval of the BRD. The BRD remains subject to stakeholder review and explicit approval.

# 2. Decision Status Definitions

| Status | Meaning |
|---|---|
| APPROVED | Final stakeholder decision. Must be reflected accurately throughout the BRD. |
| OPEN | Stakeholder decision has not yet been made. Do not invent an answer. |
| DEFERRED | Intentionally postponed. It is not required to be finalized for the current BRD baseline unless it blocks an essential requirement. |
| REJECTED | Explicitly rejected. Must not be included as an approved feature or workflow. |

# 3. Approved Stakeholder Decisions

## 3.1 Revenue, Payments, and Financial Boundaries

### FIN-001 — CreativeSpace Revenue Model
**Status: APPROVED**

CreativeSpace generates platform revenue through paid promotional services.

The platform does not earn revenue through:
- Booking commissions.
- Booking service fees.
- Marketplace transaction commissions.
- Marketplace percentage cuts.
- User subscriptions.
- Idea collaboration commissions.
- Other user-to-user transaction fees.

Do not introduce additional revenue streams without stakeholder approval.

### FIN-002 — Khalti Payment Boundary
**Status: APPROVED**

Khalti is used exclusively for creator-to-platform payments for paid promotional services.

Khalti must not be used to collect or process:
- Client-to-creator booking payments.
- Idea collaboration compensation.
- Buyer-to-seller marketplace payments.

Do not represent Khalti as the platform's general-purpose payment gateway.

### FIN-003 — Service Booking Payments
**Status: APPROVED**

Booking payments take place directly between the client and creator outside CreativeSpace.

CreativeSpace does not:
- Collect booking payments.
- Process booking payments.
- Verify external payment transactions.
- Store booking payment details.
- Provide escrow.
- Process booking refunds.
- Track external payment transfers.

The creator independently checks whether the external payment arrangement has been completed and manually confirms the booking within CreativeSpace.

Manual booking confirmation is an operational action. It is NOT payment verification performed by CreativeSpace.

### FIN-004 — Idea Collaboration Compensation
**Status: APPROVED**

Any compensation arrangement between Idea owners and collaborators takes place externally.

CreativeSpace does not collect, process, verify, escrow, track, or refund Idea collaboration compensation.

### FIN-005 — Marketplace Payments
**Status: APPROVED**

Marketplace payments take place directly between buyers and sellers outside CreativeSpace.

CreativeSpace does not:
- Collect or process marketplace payments.
- Verify payment transactions.
- Store payment credentials or transaction details.
- Provide escrow.
- Process marketplace refunds.
- Take transaction commissions.

The platform may maintain marketplace inquiry and operational records, but these must not be confused with financial transaction records.

### FIN-006 — Promotion Refund Management
**Status: APPROVED**

A dedicated promotion refund management feature is outside the current release scope.

This does not remove or override applicable legal obligations, payment-provider requirements, or statutory consumer protections.

Do not invent a refund policy or implement a refund workflow as an approved current-release requirement.

## 3.2 Booking Management

### BOOK-001 — Multiple Requests for the Same Slot
**Status: APPROVED**

Multiple clients may request the same creator availability slot.

Receiving multiple requests does not automatically reserve the slot for any particular client.

### BOOK-002 — Creator Selects One Client
**Status: APPROVED**

When multiple booking requests exist for the same slot:

1. The creator can select one client.
2. The selected request enters the selected state.
3. Other competing requests remain pending.
4. Selection alone does not close, reject, or decline competing requests.
5. The creator may subsequently confirm the selected booking or manually release the selection.

Only after the creator manually confirms the selected booking are competing requests for the occupied slot declined or closed.

Do not automatically decline competing requests immediately when the creator selects a client.

### BOOK-003 — Selection Is Not a Soft Hold
**Status: APPROVED**

A creator's selection of a client, before booking confirmation, does not create an exclusive soft hold on the slot.

New booking requests may still be submitted while a selected request remains unconfirmed.

The system must distinguish selection from confirmed booking.

### BOOK-004 — Selected Booking Reminder
**Status: APPROVED**

If a selected booking remains unconfirmed for 48 hours, the creator receives one informational reminder.

The reminder:
- Does not automatically cancel the booking request.
- Does not automatically release the selection.
- Does not decline competing requests.
- Does not create a new payment requirement.

The selected request remains selected until the creator confirms it or manually releases it.

### BOOK-005 — Manual Release
**Status: APPROVED**

The creator may manually release a selected booking request when the arrangement cannot proceed.

The system must update the request and relevant availability/selection state appropriately.

Do not invent an automatic release period.

### BOOK-006 — Alternative-Time Negotiation
**Status: APPROVED**

Alternative-time negotiation can occur before or after the creator selects a client.

Both the client and creator can initiate counter-proposals.

The negotiation is bidirectional:
- Creator may propose an alternative time.
- Client may accept, decline, or counter-propose.
- Client may propose an alternative time.
- Creator may accept, decline, or counter-propose.

The recipient of the latest proposal is the party expected to respond.

### BOOK-007 — Negotiation Response Timer
**Status: APPROVED**

Each alternative-time proposal has a 24-hour response window.

Every new counter-proposal or modification of the proposed time resets the 24-hour timer.

The timer applies to the recipient of the latest proposal, not necessarily the recipient of the original proposal.

The BRD must not describe this as a one-directional creator-only negotiation.

### BOOK-008 — Simultaneous Slot Holds During Negotiation
**Status: APPROVED**

During active alternative-time negotiation, both of the following slots are held:
- The original booking slot (S1).
- The currently proposed alternative slot (S2).

Both S1 and S2 remain held for the duration of active negotiation.

New inbound requests for either held slot may enter the pending queue, but they cannot be confirmed in conflict with the active negotiation holds.

Historical proposals that have been superseded must not indefinitely retain additional slot holds.

Only the original slot and the currently active proposed alternative are subject to the simultaneous-hold rule.

### BOOK-009 — Negotiation Acceptance
**Status: APPROVED**

When the recipient accepts the current alternative-time proposal:

1. The booking time changes to the accepted alternative.
2. The original slot is released.
3. The booking's previous selection state is preserved.

If the booking was already selected before negotiation, it remains selected.

If it had not been selected, it returns to the appropriate pending selection state.

### BOOK-010 — Negotiation Decline
**Status: APPROVED**

When a proposal is declined:

1. Negotiation ends.
2. The original booking arrangement is restored.
3. The alternative slot is released.
4. The booking's previous selection state is preserved.

Declining an alternative-time proposal does not automatically cancel the parent booking request.

### BOOK-011 — Negotiation Timeout
**Status: APPROVED**

If the recipient does not respond within 24 hours:

1. The proposal expires.
2. Negotiation ends.
3. The original booking arrangement is restored.
4. The alternative slot is released.
5. The booking's previous selection state is preserved.

Timeout is a negotiation outcome, not an automatic booking cancellation.

### BOOK-012 — Separate Booking and Negotiation States
**Status: APPROVED**

Booking status, negotiation status, and booking activity/history are separate concepts.

Declined and Expired are negotiation outcomes. They must not be represented as automatic booking cancellation states.

A failed negotiation does not automatically cancel an otherwise valid booking request.

## 3.3 Idea Collaboration

### IDEA-001 — Idea Owner Invitations
**Status: APPROVED**

An Idea owner may proactively invite a specific creator to participate in an Idea collaboration.

Creator applications and owner invitations are separate workflows.

Both workflows may operate concurrently for the same Idea.

Do not make owner invitations dependent on a creator first applying.

### IDEA-002 — Application Acceptance
**Status: APPROVED**

A creator who applies to an Idea becomes a collaborator only after the Idea owner accepts the application.

A pending applicant is not yet a collaborator.

### IDEA-003 — Invitation Acceptance
**Status: APPROVED**

A creator who receives an invitation becomes a collaborator only after accepting that invitation.

A pending invitee is not yet a collaborator.

### IDEA-004 — Idea Messaging Permissions
**Status: APPROVED**

Idea collaboration messaging is available only to:
- The Idea owner.
- Accepted collaborators.

Pending applicants and pending invitees do not have Idea collaboration messaging access.

Do not grant messaging access simply because someone has applied or received an invitation.

### IDEA-005 — Idea Lifecycle Ownership
**Status: APPROVED**

Only the Idea owner can change the Idea lifecycle status.

The lifecycle statuses are:
- Draft.
- Recruiting.
- In Progress.
- Completed.
- Archived.

Joining collaborators does not automatically mark an Idea as Completed.

The owner may archive an Idea without first marking it Completed.

Archived Ideas are retained for reference; archiving does not automatically delete them.

### IDEA-006 — Reopening Completed or Archived Ideas (Existing DEC-015)
**Status: APPROVED**

The Idea owner may reopen an Idea in either Completed or Archived status.

When reopened:
- The status becomes In Progress.
- Previously accepted collaborators retain their membership.
- Existing applications, invitations, messages, and relevant history are preserved.
- Rejected applicants and rejected invitees are not automatically reactivated.
- Existing collaboration conversations become active again for accepted collaborators.
- No Project is automatically created.

The owner may subsequently move the reopened Idea from In Progress to Recruiting.

Do not leave this decision marked unresolved.

### IDEA-007 — In Progress to Recruiting (Existing DEC-019)
**Status: APPROVED**

The Idea owner may move an Idea from In Progress to Recruiting.

When this occurs:
- Existing accepted collaborators retain membership.
- Existing collaboration messages remain accessible.
- The Idea becomes available for new applications and invitations, subject to the approved visibility rules.
- New creators may apply.
- The owner may invite additional creators.
- Pending applicants and invitees do not receive messaging access.
- Existing collaboration history is preserved.

Do not leave this transition marked unresolved.

### IDEA-008 — No Automatic Idea-to-Project Conversion
**Status: APPROVED**

Ideas and Projects are independent entities and workflows.

CreativeSpace must not automatically:
- Convert an Idea into a Project.
- Create a Project when an Idea becomes In Progress or Completed.
- Transfer Idea collaborators into a Project.
- Copy Idea applications or invitations into a Project.
- Transfer Idea messages or collaboration history into a Project.

If an owner wants to create a Project based on an Idea, the owner must manually create a separate Project.

Project collaboration requires its own invitations and acceptance workflow.

## 3.4 Project Collaboration and Version Management

### PROJ-001 — Project Roles
**Status: APPROVED**

The Project collaboration model has two roles:

**Project Owner**
- Owns and manages the Project.
- Views and manages Project versions and assets.
- Creates versions and uploads assets.
- Edits Project information.
- Manages Project visibility.
- Invites and removes contributors.
- Archives or deletes the Project subject to applicable safeguards.

**Project Contributor**
- Accesses an invited Project after accepting membership.
- Views the Project and permitted draft content.
- Uploads assets.
- Creates new versions.
- Views other contributors' versions when permitted.

### PROJ-002 — Contributor Restrictions
**Status: APPROVED**

A Project Contributor cannot:
- Edit Project-level information.
- Change Project visibility.
- Invite or remove contributors.
- Archive or delete the Project.
- Transfer Project ownership.
- Modify or delete another contributor's existing work.

Do not grant Project Owner permissions to contributors by default.

### PROJ-003 — Version Attribution and Protection
**Status: APPROVED**

Every contribution must retain its correct attribution.

Contributors may create new versions and upload assets, but they cannot silently overwrite, modify, or delete another contributor's existing work.

If a correction or revision is required, a new version should be created rather than silently overwriting another contributor's work.

Removing a contributor from a Project does not automatically delete that contributor's existing contributions.

Attribution must not be silently changed.

### PROJ-004 — Owner Removal of Individual Contributor Versions or Assets (Existing DEC-020)
**Status: APPROVED**

The Project Owner may remove or unpublish an individual contributor-uploaded version or asset from the active Project.

This permission is separate from a contributor's permission to manage their own contributions.

When the owner removes an individual item:
- The item is removed or unpublished from the active Project as appropriate.
- The original contributor attribution is preserved.
- The system records who removed the item.
- The system records when it was removed.
- The system identifies the specific version or asset affected.
- Relevant activity/history is preserved.

Additional restrictions:
- Contributors cannot remove or modify another contributor's work.
- Removing a contributor does not automatically remove their contributions.
- Removing an individual version or asset does not delete the entire Project.
- Removal from the active Project must be distinguished from permanent historical erasure or purge.

Do not leave DEC-020 unresolved.

### PROJ-005 — Entire Project Deletion
**Status: APPROVED WITH A SEPARATE OPEN QUESTION**

The Project Owner may delete the entire Project subject to applicable safeguards.

However, the treatment of contributor attribution and contribution history after entire Project deletion remains unresolved under DEC-021.

Do not use the approved individual-item removal rule (DEC-020) to assume the outcome of entire Project deletion.

Do not invent permanent deletion, anonymization, retention, or historical preservation rules for this unresolved matter.

## 3.5 Messaging and Conversation Access

### MSG-001 — Permitted Messaging Contexts
**Status: APPROVED**

Messaging is limited to:
- Active booking contexts.
- Accepted Idea collaboration contexts.

CreativeSpace does not provide general-purpose direct messaging in the current release.

### MSG-002 — No General Social DMs
**Status: APPROVED**

The following are outside the current messaging scope:
- General friend or connection requests.
- General-purpose direct messaging between arbitrary users.
- Marketplace buyer-seller chat.

### MSG-003 — Terminal Conversation Read-Only State
**Status: APPROVED**

When a booking or Idea collaboration reaches its applicable terminal state, its conversation becomes read-only.

Participants may view the conversation history, but cannot send new messages.

Do not delete the conversation automatically merely because the associated workflow has ended.

### MSG-004 — Message Deletion and Retention
**Status: APPROVED FOR CURRENT RELEASE**

The current release does not include:
- User-controlled deletion of individual messages in completed conversations.
- Automatic deletion after 180 days.

A specific retention period has not been finalized.

Conversation content may need to be preserved for legitimate moderation investigations, abuse reports, or legal obligations.

Do not invent a fixed retention period or an automatic deletion schedule.

### MSG-005 — Administrator Access to Conversations
**Status: APPROVED**

Administrators do not have unrestricted routine access to private conversations.

Inspection is permitted only for a legitimate moderation purpose, such as:
- A formal report.
- A documented investigation into a Terms of Service violation.

Access must follow:
- Minimum-necessary access.
- Authorized personnel restrictions.
- Documented justification.
- Appropriate audit logging.

Do not describe administrator access as unrestricted browsing of private conversations.

## 3.6 Marketplace

### MKT-001 — Completed Products Only
**Status: APPROVED**

The Marketplace focuses on listings for completed products.

Do not introduce unfinished-product sales or a project-progress marketplace unless separately approved.

### MKT-002 — Structured Marketplace Inquiry
**Status: APPROVED**

The Marketplace supports structured inquiries between buyers and sellers.

The inquiry captures relevant contact details and buyer notes.

Inquiry information is accessible only to the relevant buyer and seller.

### MKT-003 — No Marketplace Chat
**Status: APPROVED**

The current release does not include a dedicated buyer-seller chat system.

Structured inquiries must not be represented as a general messaging system.

### MKT-004 — External Payments and Independent Verification
**Status: APPROVED**

Buyers and sellers arrange payment externally.

Sellers independently verify their own external payment arrangements.

CreativeSpace does not verify or process the transaction.

### MKT-005 — External Fulfillment and Delivery
**Status: APPROVED**

All product fulfillment and delivery arrangements are entirely the responsibility of the creator/seller and buyer, outside CreativeSpace.

This includes, but is not limited to:
- Digital downloads.
- Shipping.
- Collection.
- Delivery arrangements.
- Other product handover methods.

CreativeSpace must not manage, prescribe, coordinate, or track fulfillment and delivery methods or workflows.

Do not add:
- Shipping management.
- Delivery tracking.
- Download delivery pipelines.
- Collection scheduling.
- Fulfillment status management.
- Delivery dispute resolution.

The Marketplace remains focused on completed-product listings, structured inquiries, and agreed purchase/order information and operational history.

### MKT-006 — Listing Availability
**Status: APPROVED**

A listing's Active/Inactive state is an independent catalog availability control.

It is not a payment status, order status, or delivery status.

Do not combine listing availability with external payment or fulfillment states.

### MKT-007 — Marketplace Inquiry Retention
**Status: DEFERRED**

A specific inquiry retention duration has not been finalized.

Do not invent a fixed retention period.

## 3.7 Paid Promotions

### PROMO-001 — Promotion Eligibility
**Status: APPROVED**

Paid promotions may be offered for eligible:
- Projects.
- Posts.
- Services.
- Products.

Only the owner of eligible content may promote that content.

Promotional eligibility must not bypass privacy, content moderation, or other applicable restrictions.

### PROMO-002 — Promotion Payments
**Status: APPROVED**

Creators purchase platform promotional services using Khalti.

This is the only approved Khalti payment use within CreativeSpace.

### PROMO-003 — Sponsored Disclosure
**Status: APPROVED**

Promoted content must carry a clear Sponsored label wherever it is displayed as promoted.

The disclosure must not be omitted merely because promoted content appears in a different feed, section, or placement.

### PROMO-004 — No Guaranteed Performance
**Status: APPROVED**

Purchasing a promotion does not guarantee:
- Reach.
- Impressions.
- Ranking.
- Engagement.
- Clicks.
- Conversions.
- Sales.

Do not represent promotional packages as guaranteeing these outcomes.

### PROMO-005 — Promotion Commercial Configuration
**Status: DEFERRED**

Final promotional package prices, durations, and commercial configurations must not be invented.

The BRD may describe the promotional capability without claiming unapproved final pricing or package details.

## 3.8 Profiles, Posts, Projects, and Landing Page

### CONTENT-001 — Projects and Posts Are Separate
**Status: APPROVED**

Projects and Posts are separate entities and workflows.

Creating a Project does not automatically create a Post.

Publishing a Post does not automatically create a Project.

Do not merge these entities or imply automatic conversion between them.

### CONTENT-002 — Public Creator Social Links
**Status: APPROVED**

Social links on creator profiles are publicly visible.

They do not require a connection, friendship, or follow relationship to be viewed.

### CONTENT-003 — Public Feedback Visibility
**Status: APPROVED**

Feedback visibility is set to everyone on publicly viewable versions.

However, public feedback visibility does not make private draft media publicly accessible.

Feedback visibility and version/media visibility must remain separate concepts.

### CONTENT-004 — Landing Page Preservation
**Status: APPROVED**

The existing landing page visual identity must be preserved.

Do not redesign or materially change its:
- Layout.
- Structure.
- Visual identity.
- Color scheme.
- Typography.
- Established aesthetic.

Internal pages may be harmonized with the existing design system, but this does not authorize an unsolicited landing page redesign.

# 4. Open Stakeholder Decisions

The following matters have not been finalized. They must remain explicitly unresolved until the stakeholder decides them.

## OPEN-001 — DEC-016: Notification to New Booking Requesters During Negotiation Holds
**Status: OPEN**

The underlying booking rule is approved:
- During active alternative-time negotiation, S1 and S2 are held.
- New inbound requests for those slots may enter the pending queue.
- Such requests cannot be confirmed in conflict with the active holds.

The unresolved question is whether a new requester should receive an informational notice explaining that the requested slot is temporarily held during another booking negotiation.

Do not assume that the notification is required or that it is excluded.

A possible wording has previously been suggested:

"This time slot is temporarily reserved while another booking request is being negotiated. You can still submit a request, but it cannot be confirmed until the slot becomes available."

This is a proposed message only, not an approved final requirement.

## OPEN-002 — DEC-018: Public Visibility Rules for Idea Lifecycle Statuses
**Status: OPEN**

The following visibility rules are confirmed:
- Draft Ideas are private.
- Recruiting Ideas are publicly discoverable.

The visibility of the following statuses has not been finalized:
- In Progress.
- Completed.
- Archived.

The BRD must not present proposed visibility rules for these statuses as approved decisions.

The following proposal has previously been discussed but has NOT been approved:

- In Progress: publicly discoverable.
- Completed: publicly viewable as completed collaboration.
- Archived: not publicly discoverable, with access retained for the owner and accepted collaborators.

This is a proposal only.

The BRD may document the confirmed Draft and Recruiting visibility rules, while clearly identifying the remaining status visibility rules as open.

Regardless of public visibility, public Idea pages must not expose private messages, private contact details, restricted assets, or internal collaboration activity.

## OPEN-003 — DEC-021: Contributor History After Entire Project Deletion
**Status: OPEN**

The Project Owner may delete an entire Project subject to safeguards.

However, the stakeholder has not finalized what happens to contributor attribution, contribution history, and related records when the entire Project is deleted.

Do not assume:
- All contributor history is permanently deleted.
- All contributor history is retained indefinitely.
- Contributor history is anonymized.
- Contributor assets are permanently purged.
- Contributor history is retained for a specific duration.

This decision is distinct from DEC-020, which only approves the removal or unpublishing of individual versions/assets from an active Project.

# 5. Deferred Decisions and Unfinalized Configurations

These items must not be invented or treated as current-release approved requirements.

| ID | Topic | Status |
|---|---|---|
| DEF-001 | Conversation retention duration | DEFERRED |
| DEF-002 | Marketplace inquiry retention duration | DEFERRED |
| DEF-003 | Final promotion prices and packages | DEFERRED |
| DEF-004 | Promotion duration and commercial configuration | DEFERRED |
| DEF-005 | Promotion refund policy and dedicated refund workflow | Outside current release scope; do not invent policy |
| DEF-006 | Operational KPI targets and thresholds not yet signed off | DEFERRED |
| DEF-007 | Other commercial, legal, or operational policies not explicitly approved | DEFERRED until stakeholder decision |

A deferred decision does not automatically block BRD baseline approval if the BRD can accurately define the current business capability and clearly document the deferred matter.

# 6. Explicitly Rejected or Prohibited Assumptions

Antigravity must not introduce the following as approved CreativeSpace requirements:

1. Booking commissions or booking transaction fees.
2. Marketplace commissions or percentage cuts.
3. User subscriptions as an approved revenue stream.
4. Khalti processing of user-to-user payments.
5. CreativeSpace verification of external booking, Idea, or Marketplace payments.
6. Platform-managed shipping, delivery, collection, or digital fulfillment.
7. Marketplace buyer-seller chat.
8. General-purpose direct messaging between arbitrary users.
9. Automatic cancellation of selected booking requests after 48 hours.
10. Automatic decline of competing booking requests immediately after creator selection.
11. Automatic cancellation of a booking because alternative-time negotiation is declined or expires.
12. Automatic conversion of Ideas into Projects.
13. Automatic transfer of Idea collaborators, messages, or applications into Projects.
14. Automatic completion of Ideas simply because collaborators have joined.
15. Automatic reactivation of rejected Idea applicants or invitees when an Idea is reopened.
16. Contributor permission to modify or delete another contributor's work.
17. Automatic deletion of a contributor's work when the contributor is removed.
18. Unrestricted administrator access to private conversations.
19. A fixed 180-day automatic message deletion policy.
20. Guaranteed promotion reach, ranking, impressions, engagement, or conversions.
21. Unapproved promotional prices, durations, or packages.
22. Unapproved public visibility rules for In Progress, Completed, and Archived Ideas.
23. Unapproved notification behavior for new booking requesters during active negotiation.
24. Unapproved historical deletion behavior following entire Project deletion.
25. A landing page redesign that changes the existing approved visual identity.

# 7. Mandatory BRD Reconciliation Requirements

Antigravity must reconcile the entire BRD against this register.

This is not a request to append the register to the BRD and leave existing contradictions untouched.

## 7.1 Reconcile Existing Decision Register Entries

At minimum, update the existing decision register as follows:

| Existing Decision | Required Status |
|---|---|
| DEC-015 — Reopening Completed/Archived Ideas | APPROVED |
| DEC-016 — Booking negotiation requester notification | OPEN |
| DEC-017 — Bidirectional alternative-time negotiation | APPROVED |
| DEC-018 — Idea lifecycle visibility | OPEN |
| DEC-019 — In Progress to Recruiting transition | APPROVED |
| DEC-020 — Owner removal of individual contributor versions/assets | APPROVED |
| DEC-021 — Contributor history after entire Project deletion | OPEN |

Do not renumber these existing decisions.

## 7.2 Reconcile Booking Sections

Review all relevant sections, including:
- Booking lifecycle.
- Multiple requests for the same slot.
- Creator selection.
- Booking confirmation.
- Manual release.
- Alternative-time negotiation.
- Negotiation timers.
- Simultaneous slot holds.
- New inbound requests during holds.
- Negotiation acceptance, decline, and timeout.
- Booking and negotiation state diagrams.
- Business Rules Repository.
- Inter-module dependencies.
- Glossary.

Ensure all sections express the same rules.

The alternative-time negotiation diagram must show bidirectional counter-proposals, not merely a creator proposal followed by a client decision.

## 7.3 Reconcile Idea Sections

Review:
- Idea lifecycle.
- Applications.
- Owner invitations.
- Acceptance and rejection.
- Messaging permissions.
- Reopening.
- In Progress to Recruiting.
- Public visibility.
- State transition diagrams.
- Business Rules Repository.
- Inter-module dependencies.
- Glossary.

Ensure DEC-015 and DEC-019 are approved everywhere.

Ensure DEC-018 remains open only for the statuses that have not been decided.

## 7.4 Reconcile Project and Version Sections

Review:
- Project Owner permissions.
- Project Contributor permissions.
- Version creation.
- Asset uploads.
- Attribution.
- Individual version removal.
- Individual asset removal.
- Contributor removal.
- Project deletion.
- Version history.
- Audit/activity records.
- Business Rules Repository.
- Decision Register.
- Glossary.

Ensure DEC-020 is approved everywhere.

Correct any rule that states that the Project Owner can never remove a contributor's individual work.

The correct distinction is:
- Contributors cannot modify or delete another contributor's work.
- The Project Owner can remove/unpublish an individual item from the active Project with attribution and relevant history preserved.
- Permanent historical erasure and entire Project deletion are separate matters.
- DEC-021 remains open.

## 7.5 Reconcile Marketplace Sections

Ensure all Marketplace descriptions consistently state:
- Completed products only.
- Structured inquiries.
- Buyer/seller-only inquiry access.
- External payment arrangements.
- Independent seller payment verification.
- No platform payment processing or verification.
- No marketplace chat.
- No platform-managed delivery or fulfillment.
- No shipping, tracking, collection, or download-delivery management.
- Listing availability is independent of payment and delivery status.

The Marketplace workflow diagram and written workflow must describe the same stages.

If the diagram and written workflow currently have different numbers of stages, reconcile them.

Do not remove legitimate inquiry or operational-record steps merely to make the diagrams shorter.

## 7.6 Reconcile Promotion and Financial Sections

Ensure:
- Khalti is used exclusively for creator-to-platform promotion payments.
- Other payment arrangements are external.
- Sponsored disclosures are consistent wherever promoted content appears.
- No guaranteed promotion outcomes are claimed.
- Unapproved prices and package configurations remain unfinalized.
- No unapproved refund workflow is introduced.

## 7.7 Reconcile Messaging and Retention Sections

Ensure:
- Messaging is restricted to approved contexts.
- Pending Idea applicants and invitees cannot message.
- Terminal conversations are read-only.
- No automatic 180-day deletion rule appears.
- No fixed retention duration is invented.
- Administrator access restrictions are consistently documented.

# 8. Required Cross-Document Consistency Checks

Antigravity must not validate only the Decision Register or one section of the BRD.

It must check consistency across the entire document, including:

1. Executive Summary.
2. Product Overview.
3. Stakeholders and User Roles.
4. Business Objectives.
5. Scope and Out-of-Scope.
6. Functional Business Requirements.
7. Business Workflows.
8. State Transition Diagrams.
9. Business Rules Repository.
10. Business Constraints and Assumptions.
11. Risks and Mitigation.
12. KPIs.
13. Inter-Module Dependencies.
14. Decision Register.
15. Glossary.

The same business rule must not have different meanings in different sections.

For example:
- An approved rule must not be marked unresolved in the Decision Register.
- A rejected feature must not appear in the scope as an approved capability.
- An open decision must not be described as a final business rule.
- A diagram must not contradict the corresponding written workflow.
- A glossary definition must not describe an outdated workflow.

# 9. Required Deliverables From Antigravity

Antigravity must complete the following deliverables in order.

### Deliverable 1 — Decision Reconciliation Matrix

Create a matrix with:

| Decision ID | Register Status | BRD Section(s) | Current BRD Representation | Required Correction | Final Reconciliation Status |
|---|---|---|---|---|---|

Include every decision in this register.

Use the following reconciliation statuses:
- Consistent.
- Corrected.
- Missing.
- Contradictory.
- Open — correctly preserved.
- Deferred — correctly preserved.

Do not mark a decision Consistent without checking all relevant sections.

### Deliverable 2 — Complete Revised BRD v2.0

Revise the existing complete BRD, not isolated sections.

Requirements:
- Preserve the original document's overall structure where possible.
- Preserve valid requirements that do not conflict with this register.
- Correct all contradictions.
- Update diagrams and written workflows together.
- Update all affected decision references and glossary definitions.
- Keep genuinely open and deferred decisions clearly identified.
- Do not add unapproved functionality.
- Do not remove valid business requirements simply to shorten the document.

### Deliverable 3 — Independent Consistency Audit

After revising the complete BRD, perform a separate audit.

Do not simply repeat the editing process or claim that the document is consistent because the changes were made.

Check:
- Every approved decision is represented correctly.
- Every approved decision is consistently represented across relevant sections.
- All open decisions remain open.
- All deferred decisions remain deferred.
- No rejected assumption has reappeared.
- Diagrams match written workflows.
- No contradictory business rules remain.
- No stale decision references remain.
- No incorrect cross-references remain.
- Scope, business rules, and dependencies agree.

### Deliverable 4 — Final Audit Report

Provide:

1. Number of approved decisions checked.
2. Number correctly represented before revision.
3. Number corrected.
4. Number of missing requirements added.
5. Number of contradictions resolved.
6. Number of open decisions preserved.
7. Number of deferred decisions preserved.
8. Any remaining inconsistencies.
9. Any BRD issues that genuinely require stakeholder clarification.

If no issues remain, explicitly state that no further inconsistencies were identified in the audit.

Do not claim that the BRD is stakeholder-approved.

# 10. Restrictions on Antigravity

During this task:

- Do not generate the PRD.
- Do not generate the TRD.
- Do not create an implementation plan.
- Do not modify application source code.
- Do not modify the database schema.
- Do not implement features.
- Do not silently change approved business decisions.
- Do not resolve open decisions through assumptions.
- Do not treat suggested wording as approved policy.
- Do not create new requirements merely because they are technically convenient.

The task is exclusively to reconcile, revise, and audit the complete BRD v2.0 against this authoritative register.

# 11. Completion Criteria

The revised BRD may be submitted for stakeholder approval only when:

1. Every approved decision is accurately reflected.
2. Every relevant BRD section has been reconciled.
3. All affected diagrams and written workflows agree.
4. DEC-015, DEC-017, DEC-019, and DEC-020 are approved throughout the document.
5. DEC-016, DEC-018, and DEC-021 remain open with their unresolved questions clearly stated.
6. Deferred decisions have not been invented or incorrectly finalized.
7. No rejected assumptions have been introduced.
8. The independent consistency audit has been completed.
9. The final audit report identifies any remaining issues honestly.

**Final instruction:** Submit the complete revised BRD and the reconciliation/audit reports for stakeholder review. Do not mark the BRD Approved, Final, or Stakeholder-Signed-Off. The stakeholder will make the final approval decision.
