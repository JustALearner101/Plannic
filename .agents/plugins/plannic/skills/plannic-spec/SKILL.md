---
name: plannic-spec
description: Explore, inspect, or generate living system specifications and API contracts using Plannic. Render specifications into an Antigravity artifact for quick review. Activate when the user invokes `/plannic-spec`, `/spec`, or asks in natural language to view, inspect, or update system specs or API contracts.
---

# Plannic Living Specifications & API Contracts Explorer

This skill provides an interactive way to inspect, explore, and create living technical specifications and API contracts stored in `.docs/specs/`.

---

## When to Activate
- User invokes `/plannic-spec` or `/spec`.
- User asks in natural language:
  - *"tampilkan living specs"* / *"lihat spesifikasi sistem"*
  - *"buka API contracts"* / *"show api specs"*
  - *"buat spec baru untuk [modul]"*

---

## Execution Modes

### Mode A: Inspect a Specific Specification
When the user mentions a specific spec (e.g. `/plannic-spec mcp-protocol-architecture-spec` or *"lihat spec auth"*):

1. **Retrieve Spec Content**:
   Call `get_spec(cwd=".", slug=...)`.
   - If found: Extract frontmatter (version, status, category) and body content.
   - If not found: Call `list_specs(cwd=".")` to find closest fuzzy match or suggest creating it.

2. **Render Spec Artifact**:
   Use `write_to_file` to write `<appDataDir>\brain\<conversation-id>\plannic_spec_<slug>.md`:
   - **ArtifactMetadata**:
     - `UserFacing`: `true`
     - `RequestFeedback`: `false`
     - `Summary`: `Detailed Living Specification for ${spec.title}`

Structure:
```markdown
# Specification: [Title]

> Category: **[Category]** | Version: **v[Version]** | Status: **[Status]**  
> Last Updated: **[Timestamp]**

---

[Full Body Content with Headings, Schemas, Endpoints, and Mermaid Diagrams]

---
*To update this specification based on recent code changes, ask: "Update spec [slug] with [changes]".*
```

3. **Respond to User**:
   Summarize the core purpose and key endpoints/schemas defined in the spec, pointing to the artifact viewer.

---

### Mode B: Catalog of All Living Specifications
When the user runs `/plannic-spec` without arguments or asks to see all specs:

1. **List All Specs**:
   Call `list_specs(cwd=".")`.

2. **Render Catalog Artifact**:
   Use `write_to_file` to write `<appDataDir>\brain\<conversation-id>\plannic_specs.md`:
   - **ArtifactMetadata**:
     - `UserFacing`: `true`
     - `RequestFeedback`: `false`
     - `Summary`: "Catalog of all Living Specifications and API Contracts in the project."

Structure:
```markdown
# Living Specifications & API Contracts

> Permanent system blueprints for solo developers and AI coding agents

---

### System Architecture
- **[Title]** (`v[Version]`, `[Status]`) — `spec-[slug].md`  
  *[Description]*

### API & Integration Contracts
- **[Title]** (`v[Version]`, `[Status]`) — `spec-[slug].md`  
  *[Description]*

### Database & Data Models
- **[Title]** (`v[Version]`, `[Status]`) — `spec-[slug].md`  
  *[Description]*

---

### Quick Commands
- Inspect a spec: `/plannic-spec <slug>`
- Create a new spec: Ask me *"Buat spec baru untuk [Nama Modul]"*
```

3. **Respond to User**:
   Provide a concise overview of available specifications in chat.
