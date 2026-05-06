import pandas as pd
import json

df = pd.read_csv("maintenance_dataset.csv")

df["date_reported"] = pd.to_datetime(df["date_reported"])

total_faults = len(df)

average_risk_score = df["risk_score"].mean()

open_faults = (df["status"] == "Open").sum()
closed_faults = (df["status"] == "Closed").sum()

open_fault_percentage = (open_faults / total_faults) * 100

most_common_fault = df["fault_type"].value_counts().idxmax()

average_resolution_days = df["days_to_resolve"].mean()

highest_risk_area = (
    df.groupby("asset_area")["risk_score"]
    .mean()
    .idxmax()
)

predicted_future_risk = df["risk_score"].tail(20).mean()

most_likely_severity = df["severity"].mode()[0]

high_risk_faults = df[df["risk_score"] >= 80]

high_risk_count = len(high_risk_faults)

recent_high_risk_faults = (
    high_risk_faults
    .sort_values(by="risk_score", ascending=False)
    .head(5)[
        ["fault_id", "fault_type", "location", "asset_area", "risk_score", "status"]
    ]
    .to_dict(orient="records")
)

faults_over_time = (
    df.groupby(df["date_reported"].dt.date)
    .size()
    .to_dict()
)

risk_trend_over_time = (
    df.groupby(df["date_reported"].dt.date)["risk_score"]
    .mean()
    .round(2)
    .to_dict()
)

severity_distribution = df["severity"].value_counts().to_dict()

faults_by_weather = df["weather_condition"].value_counts().to_dict()

faults_by_status = df["status"].value_counts().to_dict()

faults_by_area = df["asset_area"].value_counts().to_dict()

average_risk_by_area = (
    df.groupby("asset_area")["risk_score"]
    .mean()
    .round(2)
    .sort_values(ascending=False)
    .to_dict()
)

engineer_workload = (
    df["assigned_engineer"]
    .value_counts()
    .to_dict()
)

average_resolution_by_engineer = (
    df.groupby("assigned_engineer")["days_to_resolve"]
    .mean()
    .round(2)
    .fillna(0)
    .to_dict()
)

resolved_faults = df[df["status"] == "Closed"]

resolved_within_target = (
    (resolved_faults["days_to_resolve"] <= 5).mean()
) * 100

overdue_faults = df[
    (df["status"] == "Open") &
    (df["risk_score"] >= 80)
]

overdue_high_risk_count = len(overdue_faults)

dashboard_data = {
    "total_faults": total_faults,
    "average_risk_score": round(average_risk_score, 2),
    "open_faults": int(open_faults),
    "closed_faults": int(closed_faults),
    "open_fault_percentage": round(open_fault_percentage, 2),
    "most_common_fault": most_common_fault,
    "average_resolution_days": round(average_resolution_days, 2),
    "highest_risk_area": highest_risk_area,
    "predicted_future_risk": round(predicted_future_risk, 2),
    "most_likely_severity": most_likely_severity,
    "high_risk_count": high_risk_count,
    "overdue_high_risk_count": overdue_high_risk_count,
    "resolved_within_target_percentage": round(resolved_within_target, 2),
    "severity_distribution": severity_distribution,
    "faults_by_weather": faults_by_weather,
    "faults_by_status": faults_by_status,
    "faults_by_area": faults_by_area,
    "average_risk_by_area": average_risk_by_area,
    "engineer_workload": engineer_workload,
    "average_resolution_by_engineer": average_resolution_by_engineer,
    "faults_over_time": {str(k): v for k, v in faults_over_time.items()},
    "risk_trend_over_time": {str(k): v for k, v in risk_trend_over_time.items()},
    "recent_high_risk_faults": recent_high_risk_faults
}

print(json.dumps(dashboard_data, indent=4))