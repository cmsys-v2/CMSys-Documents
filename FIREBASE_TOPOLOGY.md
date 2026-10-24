# Sri Lanka Navy Civil Engineering Department — CMSys Documents
## Multi-Cluster Firebase Topology & Cross-Ecosystem Architecture

This document specifies the cloud database architecture, endpoints, federated sync flows, and schema for the **`cmsys-documents`** platform within the Sri Lanka Navy Civil Engineering System (CMSys) ecosystem.

---

## 1. CMSys Ecosystem Interconnection Map

```mermaid
graph TB
  subgraph Cluster_Docs["1. Major Platform: cmsys-documents (Active Target)"]
    DOCS_RTDB[("cmsys-documents RTDB<br/>• /document_registry (Master registry entries)<br/>• /job_minutes (Directed minute sheets)<br/>• /naval_letters (BR 7 correspondence)<br/>• /file_registry (Official file index)<br/>• /registry_prefixes (Sequential prefix counters)<br/>• /minute_templates (Minute sheet structures)<br/>• /naval_letter_templates (BR 7 templates)<br/>• /system_settings (Designations & tones)<br/>• /system_status (Health & heartbeat)")]
  end

  subgraph Cluster_V2["2. Main Logistics & Productivity: cmsys-v2 (asia-southeast1)"]
    V2_RTDB[("cmsys-v2 RTDB<br/>• /job_minutes (Mirrored work minutes)<br/>• /work_orders & /job_cards<br/>• /estimates & /inventory")]
  end

  subgraph Cluster_Personnel["3. Personnel Master: ce-admin-panel2025 (us-central1)"]
    PERS_RTDB[("ce-admin-panel2025 RTDB<br/>• /sailors (661 Active sailors master)<br/>• Official numbers, ranks, trades")]
  end

  subgraph Cluster_Projects["4. Capital Projects Platform: cmsys-projects (asia-southeast1)"]
    PRJ_RTDB[("cmsys-projects RTDB<br/>• /naval_projects (25 Capital vote projects)<br/>• /procurement_files (63 Requisitions)<br/>• /special_projects (7 CSR/EVM)")]
  end

  subgraph Satellite_Clients["5. Desk Client Terminals"]
    SAT_REG["Satellite: CMSys Document Register<br/>(CCED Writer Desk, Admin, Drawing)"]
    MAIN_HUB["Major Hub: CMSys Documents Suite<br/>(Full Registry, Minute Studio, Letter Studio)"]
  end

  MAIN_HUB <== "Bi-directional Live RTDB Sync" ==> DOCS_RTDB
  SAT_REG <== "Lightweight Satellite Sync" ==> DOCS_RTDB

  DOCS_RTDB ==> "Directed Minutes & Work Orders Sync" ==> V2_RTDB
  PERS_RTDB ==> "Live Sailor Roster & Transliteration Feed" ==> MAIN_HUB
  PRJ_RTDB ==> "Active Project Codes & Names Feed" ==> MAIN_HUB
```

---

## 2. Configuration & Connection Matrix

| Cluster / Project ID | Primary Endpoint | Region | Scope & Role in CMSys |
| :--- | :--- | :--- | :--- |
| **`cmsys-documents`** *(Target)* | `https://cmsys-documents-default-rtdb.asia-southeast1.firebasedatabase.app`<br/>*(Fallback: `https://cmsys-documents-default-rtdb.firebaseio.com`)* | `asia-southeast1` / `us-central1` | **Dedicated Naval Documents, Minutes & Letter Platform**<br/>• Master correspondence records across all 4 operational offices<br/>• Full Navy BR 7 letter drafts and register linkages<br/>• Sequential numbering counters and file index |
| **`cmsys-v2`** | `https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app` | `asia-southeast1` (Singapore) | **Ecosystem Core (Work Orders & Logistics)**<br/>• Receives mirrored `/job_minutes` whenever a minute sheet is directed to `A-Zone`, `BC-Zone`, `D-Zone`, or workshops |
| **`ce-admin-panel2025`** | `https://ce-admin-panel2025-default-rtdb.firebaseio.com` | `us-central1` (Default) | **Master Personnel Roster**<br/>• Feeds 661 active sailors directly into the Sailor Search & Sinhala Transliteration engine |
| **`cmsys-projects`** | `https://cmsys-projects-default-rtdb.asia-southeast1.firebasedatabase.app` | `asia-southeast1` (Singapore) | **Capital Projects Roster**<br/>• Feeds all 25 active naval capital projects and vote codes into the project assignment dropdown |

---

## 3. Realtime Database Schema (`cmsys-documents`)

```json
{
  "document_registry": {
    "doc_id": {
      "id": "doc_20261023_211035",
      "office_section": "cced_writer | admin_office | drawing_office | minute_sheet",
      "flow_type": "INCOMING | OUTGOING",
      "doc_type": "LETTER | MINUTE | SIGNAL | DRAWING",
      "ref_no": "CCED/NHQ/2026/0012",
      "sender_ref_no": "NHQ/05/2026/042",
      "sender_source_category": "NHQ",
      "sender_or_recipient": "Director General Civil Engineering - NHQ",
      "date_letter": "2026-10-23",
      "date_recorded": "2026-10-23",
      "subject": "Quarterly Progress Report on Floating Dock Civil Installations",
      "scope_description": "Submitting structural foundation test reports...",
      "directed_type": "Approved Project",
      "directed_to": "Floating Dock",
      "project_id": "NP-001",
      "project_name": "CONSTRUCTION OF NO.03 SLIPWAY HANGAR",
      "priority": "Normal | High | Urgent",
      "security_class": "RESTRICTED | CONFIDENTIAL | SECRET | UNCLASSIFIED",
      "present_position": "Received | Under Scrutiny | Dispatched / Outed",
      "action_officer": "Command Civil Engineering Officer (East)",
      "file_no": "CE/01/01",
      "file_box_ref": "CAB-01/DRAWER-A",
      "folio_no": "Folio 92",
      "dispatch_mode": "Dispatch Rider (DR)",
      "dispatch_book_ref": "DB/2026/0219",
      "contact_no": "0714455667",
      "position_trail": [
        {
          "date": "2026-10-23 21:10",
          "officer": "Planning Desk",
          "stage": "Received / In Registry",
          "remarks": "Received from NHQ"
        }
      ],
      "status": "Active",
      "updated_at": "2026-10-23 21:10:35"
    }
  },
  "naval_letters": {
    "letter_id": {
      "id": "ltr_20261023_001",
      "letter_ref": "CCED/NHQ/2026/0014",
      "file_no": "CE/01/01",
      "letter_date": "2026-10-23",
      "security_class": "RESTRICTED",
      "precedence": "ROUTINE",
      "letterhead_office": "COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)",
      "letterhead_station": "SLN DOCKYARD, TRINCOMALEE",
      "addressee_to": "The Commander of the Navy...",
      "channel_through": "Through: The Commander Eastern Naval Area",
      "subject": "ESTIMATE FOR JETTY BOLLARD REINFORCEMENT",
      "references_list": ["(a) NHQ Letter NHQ/CE/2026/089"],
      "br7_tone": "senior",
      "salutation": "Sir / Commander,",
      "paragraphs": [
        { "num": "1.", "text": "I have the honour to submit..." }
      ],
      "complimentary_close": "I have the honour to be, Sir, Your obedient Servant,",
      "signatory_name": "K A KAHANDAWA",
      "signatory_rank": "Commander (CE)",
      "signatory_appointment": "Command Civil Engineering Officer (East)",
      "is_registered_outgoing": 1,
      "registered_doc_id": "doc_20261023_182241_82b5",
      "status": "Registered"
    }
  },
  "job_minutes": { /* Directed job minute sheets */ },
  "file_registry": { /* 16 official naval file records */ },
  "registry_prefixes": { /* Outgoing sequential counters */ },
  "minute_templates": { /* Reusable minute sheet structures */ },
  "naval_letter_templates": { /* Reusable BR 7 letter formats */ },
  "system_settings": { /* Designations, addresses, tone library */ },
  "system_status": {
    "system": "Sri Lanka Navy Civil Engineering — CMSys Documents",
    "version": "1.0.0",
    "status": "online",
    "last_sync": "2026-10-23T22:20:00Z"
  }
}
```
