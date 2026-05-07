import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
import numpy as np

# Load dataset
df = pd.read_csv("data/maintenance_dataset.csv")

# Convert date column to date format
df["date_reported"] = pd.to_datetime(df["date_reported"])

# Count number of faults per day
daily_faults = df.groupby("date_reported").size().reset_index(name="fault_count")

# Sort by date
daily_faults = daily_faults.sort_values("date_reported")

# Create a numeric day index for regression
daily_faults["day_number"] = range(1, len(daily_faults) + 1)

# X = day number, y = number of faults
X = daily_faults[["day_number"]]
y = daily_faults["fault_count"]

# Create and train the Linear Regression model
model = LinearRegression()
model.fit(X, y)

# Predict existing days for trend line
daily_faults["predicted_faults"] = model.predict(X)

# Predict next 7 days
future_days = np.array(range(len(daily_faults) + 1, len(daily_faults) + 8)).reshape(-1, 1)
future_predictions = model.predict(future_days)

print("Predicted fault counts for next 7 days:")
for i, prediction in enumerate(future_predictions, start=1):
    print(f"Day +{i}: {prediction:.2f} faults")

# Plot actual faults and regression trend
plt.figure(figsize=(10, 6))
plt.plot(daily_faults["date_reported"], daily_faults["fault_count"], marker="o", label="Actual Faults")
plt.plot(daily_faults["date_reported"], daily_faults["predicted_faults"], linestyle="--", label="Regression Trend")

plt.title("Linear Regression Prediction of Railway Faults")
plt.xlabel("Date Reported")
plt.ylabel("Number of Faults")
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()

# Save graph
plt.savefig("linear_regression_fault_prediction.png")
plt.show()
