# 🏛️ Arkansas Fiscal Ledger Intelligence (AFLI)
### An Enterprise Risk Assessment & Program Procurement Analysis Data Engine
**Target Scope:** Fiscal Year 2026 Procurement Transactions (sourced from Transparency.Arkansas.gov)  
**Production Stack:** Python, Pandas Data Pipelines, Jamstack Asynchronous Architecture, Apache ECharts.

---

## 📊 Executive Financial Summary

An aggregate relational analysis across 94,000+ public sector line-item entries exposes massive system-wide procurement variance:

* **Statewide Approved Contract Base Cap:** $17,363,459,748.33 (~$17.3B)
* **Active Funds Allocated via Purchase Orders (POs):** $26,240,100,927.94 (~$26.2B)
* **Absolute Statewide Unplanned Overrun Variance:** **+$8,876,641,179.61**

### The Core Insight
The data demonstrates that statewide obligation tracking has expanded significantly beyond the base contract ceiling frameworks, resulting in an effective program footprint escalation of **151%**. 

---

## 🔬 High-Ex Exposure Agency Analysis (The 80/20 Rule)

Using an automated Pareto risk distribution layout, we isolated the top agencies driving the majority of public contract concentrations:

### 1. State-Wide Contracts
* **Primary Drivers:** The Boston Consulting Group Inc ($726M), Dell Marketing LP ($439M), SHI International Corp ($383M).
* **Concentration Ratios:** The top 5 vendors command **43.34%** of the total statewide enterprise allocation.

### 2. Arkansas Department of Human Services (ADHS)
* **Primary Drivers:** Deloitte Consulting LLP ($632M), Gainwell Technologies LLC ($434M), Verida Inc ($238M).
* **Concentration Ratios:** The top two vendor entities control nearly **a quarter (23.51%)** of the entire agency's multi-billion dollar budget space, representing an immense dependency profile on external cloud and operational advisory providers.

### 3. Department of Correction (ADC)
* **Primary Drivers:** National Food Group ($477M), Robbins Sales Company Inc ($243M).
* **Concentration Ratios:** Extreme concentration state. Just **two vendors** capture over **59.69%** of the absolute logistical budget footprint, presenting significant target-supply vulnerability.

---

## 💾 System Data Architecture

To ensure speed and scalability while bypassing typical server-side resource constraints, the platform implements a modern serverless design layout:

1. **Extraction (ETL):** Python scripts read disparate public ledgers, handling typings, mapping columns, and parsing blank spaces.
2. **Relational Synthesis:** Pandas models the complex One-to-Many relational structure using `Contract Number` keys.
3. **Data Lake Compression:** Outputs are compiled into static JSON files with 4-space formatting indentation.
4. **UI Execution Layer:** Global web states read compiled arrays dynamically, serving immediate multi-variable formula recalculations to client browsers within milliseconds.