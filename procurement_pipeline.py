import os
import json
import pandas as pd

def run_arkansas_pipeline(contracts_path: str, pos_path: str, output_dir: str):
    """
    Ingests and merges both live Arkansas ledger files, handles the relational schema,
    and pre-computes advanced financial metrics with beautiful human-readable formatting.
    """
    print("Locating real procurement source sheets...")
    if not os.path.exists(contracts_path) or not os.path.exists(pos_path):
        raise FileNotFoundError(
            "CRITICAL: Data files missing from directory structure. Check names."
        )

    # 1. High-Performance Ingestion
    print("Streaming Contracts and Purchase Orders into memory...")
    df_contracts = pd.read_csv(contracts_path, low_memory=False)
    df_pos = pd.read_csv(pos_path, low_memory=False)

    # Clean unique identifiers to prevent relational join drops
    for df in [df_contracts, df_pos]:
        df["Contract Number"] = df["Contract Number"].astype(str).str.strip()
        df["Agency"] = df["Agency"].astype(str).str.strip()
        df["Vendor Name"] = df["Vendor Name"].astype(str).str.strip()

    # Cast transaction metrics to absolute numeric values
    df_contracts["Contract Value"] = pd.to_numeric(df_contracts["Contract Value"], errors='coerce').fillna(0.0)
    df_pos["Amount Ordered"] = pd.to_numeric(df_pos["Amount Ordered"], errors='coerce').fillna(0.0)
    df_pos["Amount Spent"] = pd.to_numeric(df_pos["Amount Spent"], errors='coerce').fillna(0.0)

    # 2. Relational Aggregation Engine
    print("Linking transactional records across tables...")
    po_summary = df_pos.groupby("Contract Number").agg(
        Total_PO_Ordered=("Amount Ordered", "sum"),
        Total_PO_Spent=("Amount Spent", "sum"),
        PO_Count=("Release PO", "count")
    ).reset_index()

    # Join transactional facts onto master contract blueprints
    master_ledger = pd.merge(df_contracts, po_summary, on="Contract Number", how="left")
    master_ledger["Total_PO_Ordered"] = master_ledger["Total_PO_Ordered"].fillna(0.0)
    master_ledger["Total_PO_Spent"] = master_ledger["Total_PO_Spent"].fillna(0.0)
    
    # Calculate Contract Variance (Overage Metrics)
    master_ledger["Contract_Variance"] = master_ledger["Total_PO_Ordered"] - master_ledger["Contract Value"]

    # 3. Macro Budget Funnel Aggregations
    print("Compiling macro-fiscal budget funnel metrics...")
    total_approved_budget = float(master_ledger["Contract Value"].sum())
    total_po_allocated = float(master_ledger["Total_PO_Ordered"].sum())
    total_actual_spent = float(master_ledger["Total_PO_Spent"].sum())
    total_overruns = float(master_ledger[master_ledger["Contract_Variance"] > 0]["Contract_Variance"].sum())

    budget_funnel_payload = {
        "gross_allocated": total_approved_budget,
        "stages": [
            {"value": total_approved_budget, "name": "Approved Contract Budget"},
            {"value": total_po_allocated, "name": "Purchase Orders Issued"},
            {"value": total_actual_spent, "name": "Liquid Capital Cashed Out"},
            {"value": total_overruns, "name": "Unplanned Fiscal Overruns"}
        ]
    }

    # 4. 80/20 Vendor Pareto Distribution per Mega-Agency
    print("Processing Pareto concentration matrices...")
    pareto_payload = {}
    top_agencies = master_ledger.groupby("Agency")["Contract Value"].sum().nlargest(6).index

    for agency in top_agencies:
        agency_df = master_ledger[master_ledger["Agency"] == agency]
        vendor_summary = agency_df.groupby("Vendor Name")["Contract Value"].sum().sort_values(ascending=False).reset_index()
        
        total_agency_val = vendor_summary["Contract Value"].sum()
        vendor_summary["CumulativeSpend"] = vendor_summary["Contract Value"].cumsum()
        vendor_summary["CumulativePercentage"] = (vendor_summary["CumulativeSpend"] / total_agency_val) * 100 if total_agency_val > 0 else 0
        
        top_slice = vendor_summary.head(5)
        pareto_payload[agency] = {
            "vendors": top_slice["Vendor Name"].tolist(),
            "spend": top_slice["Contract Value"].round(2).tolist(),
            "cumulative_percentage": top_slice["CumulativePercentage"].round(2).tolist()
        }

    # 5. Grouped Optimization for Slider Simulation Engine
    print("Grouping unique agency nodes to diversify metrics footprint...")
    grouped_ledger = master_ledger.groupby(["Agency", "Vendor Name"]).agg(
        ContractValue=("Contract Value", "sum"),
        POOrdered=("Total_PO_Ordered", "sum")
    ).reset_index()

    # Focus context on active records, sorting biggest allocations to the top
    grouped_ledger = grouped_ledger[(grouped_ledger["ContractValue"] > 0) | (grouped_ledger["POOrdered"] > 0)]
    grouped_ledger = grouped_ledger.sort_values(by="ContractValue", ascending=False)

    # Isolate a clean cross-section of the top 3,000 corporate state accounts
    mini_ledger_clean = grouped_ledger.head(3000)
    mini_ledger_clean.columns = ["Agency", "Vendor", "ContractValue", "POOrdered"]

    # 6. Exporting Target Files with Explicit 4-Space Indentation
    print("Committing clean, indented JSON files to dist/data/...")
    os.makedirs(output_dir, exist_ok=True)
    
    with open(os.path.join(output_dir, "budget_funnel.json"), "w") as f:
        json.dump(budget_funnel_payload, f, indent=4)
        
    with open(os.path.join(output_dir, "agency_pareto.json"), "w") as f:
        json.dump(pareto_payload, f, indent=4)

    with open(os.path.join(output_dir, "mini_ledger.json"), "w") as f:
        json.dump(mini_ledger_clean.to_dict(orient="records"), f, indent=4)

    print(f"Masterpiece pipeline complete! Data successfully mapped to {output_dir}")

if __name__ == "__main__":
    run_arkansas_pipeline(
        contracts_path="./data/Main_Contracts.csv",
        pos_path="./data/Purchase_Orders_Against_Contracts.csv",
        output_dir="./dist/data"
    )