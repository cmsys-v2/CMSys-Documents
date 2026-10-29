# Sri Lanka Navy Civil Engineering Department — CMSys Documents
## Consolidated Firebase Topology & Unified Architecture (`cmsys-v2`)

This document specifies the cloud database architecture, endpoints, real-time sync listeners, and consolidated schema for the Sri Lanka Navy Civil Engineering System (CMSys) ecosystem, centralized exclusively under the **`cmsys-v2`** target project.

---

## 1. Migration & Decommissioning Summary

In accordance with naval architectural consolidation directives, all 5 legacy/external Firebase project endpoints have been decommissioned and consolidated into **`cmsys-v2`**:
1. `ce-admin-panel2025` -> Consolidated into `cmsys-v2` (682 active sailors roster, personnel settings, drivers, vehicles)
2. `ncw-ps-operations` -> Consolidated into `cmsys-v2` (Naval detachments, work orders, site job cards)
3. `cmsys-v2-1fb05` -> Consolidated into `cmsys-v2` (Logistics, warehouse stores, materials)
4. `cmsys-projects` -> Consolidated into `cmsys-v2` (25 Capital projects, 63 procurement files, 17 special projects, 128 attachments)
5. `cmsys-documents` -> Consolidated into `cmsys-v2` (Document registry, BR 7 naval letters, job minutes, file registry, sequential prefixes)

---

## 2. CMSys Ecosystem Unified Topology Map

```mermaid
graph TB
  subgraph Target_Cluster["Unified Target Platform: cmsys-v2 (asia-southeast1)"]
    UNIFIED_RTDB[("cmsys-v2 Realtime Database<br/>• /document_registry & /naval_letters (BR 7 Correspondence)<br/>• /job_minutes & /work_orders (Tactical Operations)<br/>• /sailors (682 Active personnel roster)<br/>• /naval_projects (25 Capital vote projects)<br/>• /procurement_files (63 PR requisitions)<br/>• /special_projects & /attachments (EVM & CSR)<br/>• /inventory & /logistics (Stores & vouchers)<br/>• /file_registry & /registry_prefixes<br/>• /system_status & /metadata")]
  end

  subgraph System_Workspaces["Operational Workstations & Modules"]
    DOCS["CMSys Documents Suite<br/>(Master Workstation, Letter Studio, Minute Studio)"]
    V2["CMSys V2<br/>(Command Tactical Field ERP)"]
    LOG["CMSys Logistics / CE-Logistic-Panel-v3<br/>(Stores & Procurement)"]
    SPS["CMSys Projects / SP V1<br/>(Capital Infrastructure & Special Projects)"]
  end

  DOCS <== "Live Two-Way Sync" ==> UNIFIED_RTDB
  V2 <== "Live Two-Way Sync" ==> UNIFIED_RTDB
  LOG <== "Live Two-Way Sync" ==> UNIFIED_RTDB
  SPS <== "Live Two-Way Sync" ==> UNIFIED_RTDB
```

---

## 3. Configuration & Connection Matrix

| Cluster / Parameter | Production Value | Role in CMSys |
| :--- | :--- | :--- |
| **Target Project ID** | **`cmsys-v2`** | Central unified project container |
| **Database Instance** | **`cmsys-v2-default-rtdb`** | Primary high-speed JSON document tree (58 root collections) |
| **Primary Database URL** | **`https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app`** | Singapore edge region (`asia-southeast1`) |
| **Auth Domain** | **`cmsys-v2.firebaseapp.com`** | Google OAuth & service identity boundary |
| **Storage Bucket** | **`cmsys-v2.firebasestorage.app`** | Document attachments & technical drawings |
| **Web App ID** | **`1:743775137662:web:3f2fdd74cd06a31160cd2f`** | Client web SDK registration |
| **Web API Key** | **`AIzaSyD2taQsUz26yfLoqnFgs-ED6WcFveUXS8w`** | Client SDK authentication key |

---

## 4. Root Collections Master Directory (`cmsys-v2`)

The consolidated `cmsys-v2` database tree hosts **58 active collections**:
- **Naval Documents & Correspondence:** `/document_registry`, `/naval_letters`, `/job_minutes`, `/file_registry`, `/registry_prefixes`, `/minute_templates`, `/naval_letter_templates`
- **Capital & Special Projects:** `/naval_projects` (25), `/procurement_files` (63), `/special_projects` (17), `/special_project_attachments` (128), `/projects`, `/attachments`, `/documents`
- **Personnel & Naval Rosters:** `/sailors` (682), `/officers` (12), `/user_profiles` (12), `/sd_office_data` (57), `/sailor_project_history` (208), `/daily_tasks` (53), `/drivers`, `/vehicles`
- **Logistics & Inventory:** `/inventory` (2,146+), `/logistics`, `/nav254_vouchers`, `/estimates`, `/work_orders` (355), `/job_cards` (1,097+), `/daily_allocations` (1,714+), `/lmd_records`, `/locations` (87)
- **Settings & Status:** `/system_status`, `/system_settings`, `/dashboard_settings`, `/task_settings`, `/personnel_settings`, `/task_flow_settings`, `/pms_settings`
