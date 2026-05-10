"""
SentinelAR — Fault Analysis Dashboard
This script generates a series of graphs analyzing the maintenance fault data from 'maintenance_dataset.csv'.
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec

df = pd.read_csv(os.path.join(os.path.dirname(__file__), "../data/maintenance_dataset.csv"))

# ── Config ────────────────────────────────────────────────────────────────────
# Hlaksjdnwd wjdnadwadj ahwdajdajhdwwad 
CSV_PATH   = "data/maintenance_dataset.csv"
OUTPUT_DIR = "graphs"

COLORS = {
    "Dry":        "#378ADD",
    "Rain":       "#1D9E75",
    "Cold":       "#7F77DD",
    "Windy":      "#D85A30",
    "Hot":        "#EF9F27",
    "High":       "#D85A30",
    "Medium":     "#EF9F27",
    "Low":        "#1D9E75",
    "Open":       "#D85A30",
    "In Progress":"#EF9F27",
    "Closed":     "#1D9E75",
    "Morning":    "#EF9F27",
    "Afternoon":  "#378ADD",
    "Night":      "#7F77DD",
}

AREA_COLOR  = "#7F77DD"
TIME_COLOR  = "#378ADD"

plt.rcParams.update({
    "font.family":        "DejaVu Sans",
    "axes.spines.top":    False,
    "axes.spines.right":  False,
    "axes.grid":          True,
    "axes.grid.axis":     "y",
    "grid.color":         "#e8e8e8",
    "grid.linewidth":     0.6,
    "figure.facecolor":   "white",
    "axes.facecolor":     "white",
    "font.size":          11,
})

# ── Load data ─────────────────────────────────────────────────────────────────

def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["date_reported"] = pd.to_datetime(df["date_reported"])
    return df


# ── Helper ────────────────────────────────────────────────────────────────────

def save(fig: plt.Figure, name: str) -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, name)
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    print(f"  Saved → {path}")


def doughnut(ax, values, labels, colors, title):
    wedges, texts, autotexts = ax.pie(
        values,
        labels=None,
        colors=colors,
        autopct="%1.0f%%",
        pctdistance=0.78,
        startangle=90,
        wedgeprops=dict(width=0.55, edgecolor="white", linewidth=2),
    )
    for at in autotexts:
        at.set_fontsize(10)
        at.set_color("white")
        at.set_fontweight("bold")
    legend_labels = [f"{l}  ({v})" for l, v in zip(labels, values)]
    ax.legend(
        wedges,
        legend_labels,
        loc="center",
        fontsize=10,
        frameon=False,
        bbox_to_anchor=(0.5, -0.12),
    )
    ax.set_title(title, fontsize=13, fontweight="bold", pad=14)


# ── Individual graph functions ────────────────────────────────────────────────

def graph_weather_count(df: pd.DataFrame) -> plt.Figure:
    order  = ["Dry", "Rain", "Cold", "Windy", "Hot"]
    counts = df["weather_condition"].value_counts().reindex(order, fill_value=0)
    colors = [COLORS[w] for w in order]

    fig, ax = plt.subplots(figsize=(7, 4.5))
    bars = ax.bar(order, counts.values, color=colors, width=0.55, zorder=3)

    for bar, val in zip(bars, counts.values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.4,
            str(val),
            ha="center", va="bottom", fontsize=11, fontweight="bold",
        )

    ax.set_title("Faults by weather condition", fontsize=13, fontweight="bold")
    ax.set_xlabel("Weather condition", fontsize=11)
    ax.set_ylabel("Number of faults", fontsize=11)
    ax.set_ylim(0, counts.max() + 5)
    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False)
    fig.tight_layout()
    return fig


def graph_severity_pie(df: pd.DataFrame) -> plt.Figure:
    order  = ["High", "Medium", "Low"]
    counts = df["severity"].value_counts().reindex(order, fill_value=0)
    colors = [COLORS[s] for s in order]

    fig, ax = plt.subplots(figsize=(6, 5))
    doughnut(ax, counts.values, order, colors, "Faults by severity")
    fig.tight_layout()
    return fig


def graph_faults_over_time(df: pd.DataFrame) -> plt.Figure:
    daily = df.groupby(df["date_reported"].dt.date).size()
    dates = pd.to_datetime(daily.index)
    counts = daily.values

    rolling_avg = pd.Series(counts).rolling(window=3, min_periods=1).mean()

    fig, ax = plt.subplots(figsize=(11, 4))
    ax.fill_between(dates, counts, alpha=0.15, color=TIME_COLOR)
    ax.plot(dates, counts, color=TIME_COLOR, linewidth=1.8,
            marker="o", markersize=3.5, label="Daily faults")
    ax.plot(dates, rolling_avg, color="#D85A30", linewidth=2,
            linestyle="--", label="3-day rolling avg")

    ax.set_title("Faults reported over time  (Mar – Apr 2026)",
                 fontsize=13, fontweight="bold")
    ax.set_xlabel("Date", fontsize=11)
    ax.set_ylabel("Number of faults", fontsize=11)
    ax.legend(fontsize=10, frameon=False)
    ax.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%d %b"))
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha="right")
    ax.set_ylim(0, counts.max() + 2)
    fig.tight_layout()
    return fig


def graph_area_count(df: pd.DataFrame) -> plt.Figure:
    counts = df["asset_area"].value_counts().sort_values()

    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.barh(counts.index, counts.values, color=AREA_COLOR,
                   height=0.6, zorder=3)

    for bar, val in zip(bars, counts.values):
        ax.text(
            bar.get_width() + 0.2,
            bar.get_y() + bar.get_height() / 2,
            str(val),
            va="center", fontsize=11, fontweight="bold",
        )

    ax.set_title("Faults by asset area (location)", fontsize=13, fontweight="bold")
    ax.set_xlabel("Number of faults", fontsize=11)
    ax.set_xlim(0, counts.max() + 6)
    ax.grid(axis="x")
    ax.grid(axis="y", visible=False)
    ax.spines["bottom"].set_visible(False)
    ax.tick_params(bottom=False)
    fig.tight_layout()
    return fig


def graph_shift_count(df: pd.DataFrame) -> plt.Figure:
    order  = ["Morning", "Afternoon", "Night"]
    counts = df["shift"].value_counts().reindex(order, fill_value=0)
    colors = [COLORS[s] for s in order]

    fig, ax = plt.subplots(figsize=(6, 4.5))
    bars = ax.bar(order, counts.values, color=colors, width=0.5, zorder=3)

    for bar, val in zip(bars, counts.values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.3,
            str(val),
            ha="center", va="bottom", fontsize=11, fontweight="bold",
        )

    ax.set_title("Faults by shift (time of day)", fontsize=13, fontweight="bold")
    ax.set_xlabel("Shift", fontsize=11)
    ax.set_ylabel("Number of faults", fontsize=11)
    ax.set_ylim(0, counts.max() + 5)
    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False)
    fig.tight_layout()
    return fig


def graph_avg_risk_weather(df: pd.DataFrame) -> plt.Figure:
    order   = ["Dry", "Rain", "Cold", "Windy", "Hot"]
    avg_risk = (
        df.groupby("weather_condition")["risk_score"]
        .mean()
        .reindex(order, fill_value=0)
        .round(1)
    )
    std_risk = (
        df.groupby("weather_condition")["risk_score"]
        .std()
        .reindex(order, fill_value=0)
        .round(1)
    )
    colors = [COLORS[w] for w in order]

    fig, ax = plt.subplots(figsize=(7, 4.5))
    bars = ax.bar(order, avg_risk.values, color=colors, width=0.55,
                  yerr=std_risk.values, capsize=5, error_kw={"linewidth": 1.2,
                  "ecolor": "#888"}, zorder=3)

    for bar, val in zip(bars, avg_risk.values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + std_risk[order[list(avg_risk.values).index(val)]] + 1.5,
            f"{val:.0f}",
            ha="center", va="bottom", fontsize=11, fontweight="bold",
        )

    ax.axhline(df["risk_score"].mean(), color="#333", linewidth=1.2,
               linestyle="--", zorder=4)
    ax.text(len(order) - 0.4, df["risk_score"].mean() + 1,
            f"Overall avg: {df['risk_score'].mean():.0f}",
            fontsize=9, color="#333")

    ax.set_title("Average risk score by weather condition",
                 fontsize=13, fontweight="bold")
    ax.set_xlabel("Weather condition", fontsize=11)
    ax.set_ylabel("Average risk score (0–100)", fontsize=11)
    ax.set_ylim(0, 110)
    ax.spines["left"].set_visible(False)
    ax.tick_params(left=False)
    fig.tight_layout()
    return fig


def graph_status_pie(df: pd.DataFrame) -> plt.Figure:
    order  = ["Open", "In Progress", "Closed"]
    counts = df["status"].value_counts().reindex(order, fill_value=0)
    colors = [COLORS[s] for s in order]

    fig, ax = plt.subplots(figsize=(6, 5))
    doughnut(ax, counts.values, order, colors, "Fault status breakdown")
    fig.tight_layout()
    return fig


# ── Combined summary figure ───────────────────────────────────────────────────

def graph_summary_dashboard(df: pd.DataFrame) -> plt.Figure:
    """
    All 6 key charts on a single A3-style figure — useful for the report.
    """
    fig = plt.figure(figsize=(16, 14))
    fig.suptitle(
        "SentinelAR — Fault Analysis Dashboard\n120 maintenance records  |  Mar – Apr 2026",
        fontsize=15, fontweight="bold", y=0.98,
    )
    gs = GridSpec(3, 3, figure=fig, hspace=0.55, wspace=0.4)

    # 1. Weather bar (top left)
    ax1 = fig.add_subplot(gs[0, 0])
    order = ["Dry", "Rain", "Cold", "Windy", "Hot"]
    counts = df["weather_condition"].value_counts().reindex(order, fill_value=0)
    ax1.bar(order, counts.values, color=[COLORS[w] for w in order], width=0.55, zorder=3)
    ax1.set_title("Faults by weather", fontsize=11, fontweight="bold")
    ax1.set_ylabel("Count", fontsize=9)
    ax1.tick_params(axis="x", labelsize=8)
    ax1.spines["left"].set_visible(False); ax1.spines["top"].set_visible(False); ax1.spines["right"].set_visible(False)
    ax1.tick_params(left=False)

    # 2. Severity doughnut (top centre)
    ax2 = fig.add_subplot(gs[0, 1])
    sev_order = ["High", "Medium", "Low"]
    sev_counts = df["severity"].value_counts().reindex(sev_order, fill_value=0)
    wedges, _, autotexts = ax2.pie(
        sev_counts.values, colors=[COLORS[s] for s in sev_order],
        autopct="%1.0f%%", pctdistance=0.78, startangle=90,
        wedgeprops=dict(width=0.55, edgecolor="white", linewidth=2),
    )
    for at in autotexts: at.set_fontsize(9); at.set_color("white"); at.set_fontweight("bold")
    ax2.set_title("Severity distribution", fontsize=11, fontweight="bold")
    ax2.legend(wedges, [f"{l} ({v})" for l,v in zip(sev_order, sev_counts)],
               loc="lower center", fontsize=8, frameon=False, bbox_to_anchor=(0.5,-0.12), ncol=3)

    # 3. Status doughnut (top right)
    ax3 = fig.add_subplot(gs[0, 2])
    stat_order = ["Open", "In Progress", "Closed"]
    stat_counts = df["status"].value_counts().reindex(stat_order, fill_value=0)
    wedges3, _, autotexts3 = ax3.pie(
        stat_counts.values, colors=[COLORS[s] for s in stat_order],
        autopct="%1.0f%%", pctdistance=0.78, startangle=90,
        wedgeprops=dict(width=0.55, edgecolor="white", linewidth=2),
    )
    for at in autotexts3: at.set_fontsize(9); at.set_color("white"); at.set_fontweight("bold")
    ax3.set_title("Fault status", fontsize=11, fontweight="bold")
    ax3.legend(wedges3, [f"{l} ({v})" for l,v in zip(stat_order, stat_counts)],
               loc="lower center", fontsize=8, frameon=False, bbox_to_anchor=(0.5,-0.12), ncol=3)

    # 4. Faults over time (middle, full width)
    ax4 = fig.add_subplot(gs[1, :])
    daily = df.groupby(df["date_reported"].dt.date).size()
    dates = pd.to_datetime(daily.index)
    rolling = pd.Series(daily.values).rolling(3, min_periods=1).mean()
    ax4.fill_between(dates, daily.values, alpha=0.15, color=TIME_COLOR)
    ax4.plot(dates, daily.values, color=TIME_COLOR, linewidth=1.8, marker="o",
             markersize=3, label="Daily faults")
    ax4.plot(dates, rolling, color="#D85A30", linewidth=2, linestyle="--",
             label="3-day rolling avg")
    ax4.set_title("Faults reported over time", fontsize=11, fontweight="bold")
    ax4.set_ylabel("Count", fontsize=9)
    ax4.legend(fontsize=9, frameon=False)
    ax4.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter("%d %b"))
    plt.setp(ax4.xaxis.get_majorticklabels(), rotation=45, ha="right", fontsize=8)
    ax4.spines["left"].set_visible(False); ax4.spines["top"].set_visible(False); ax4.spines["right"].set_visible(False)
    ax4.tick_params(left=False)

    # 5. Asset area horizontal bar (bottom left + centre)
    ax5 = fig.add_subplot(gs[2, :2])
    area_counts = df["asset_area"].value_counts().sort_values()
    ax5.barh(area_counts.index, area_counts.values, color=AREA_COLOR, height=0.6, zorder=3)
    for i, val in enumerate(area_counts.values):
        ax5.text(val + 0.2, i, str(val), va="center", fontsize=9, fontweight="bold")
    ax5.set_title("Faults by asset area", fontsize=11, fontweight="bold")
    ax5.set_xlabel("Count", fontsize=9)
    ax5.set_xlim(0, area_counts.max() + 8)
    ax5.grid(axis="x"); ax5.grid(axis="y", visible=False)
    ax5.spines["bottom"].set_visible(False); ax5.spines["top"].set_visible(False); ax5.spines["right"].set_visible(False)
    ax5.tick_params(bottom=False, labelsize=9)

    # 6. Shift bar (bottom right)
    ax6 = fig.add_subplot(gs[2, 2])
    shift_order = ["Morning", "Afternoon", "Night"]
    shift_counts = df["shift"].value_counts().reindex(shift_order, fill_value=0)
    ax6.bar(shift_order, shift_counts.values,
            color=[COLORS[s] for s in shift_order], width=0.5, zorder=3)
    ax6.set_title("Faults by shift", fontsize=11, fontweight="bold")
    ax6.set_ylabel("Count", fontsize=9)
    ax6.tick_params(axis="x", labelsize=9)
    ax6.spines["left"].set_visible(False); ax6.spines["top"].set_visible(False); ax6.spines["right"].set_visible(False)
    ax6.tick_params(left=False)

    return fig


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print(f"\nLoading data from '{CSV_PATH}' ...")
    try:
        df = load_data(CSV_PATH)
    except FileNotFoundError:
        print(f"\n  ERROR: Could not find '{CSV_PATH}'")
        print("  Make sure this script is in the same folder as the 'data/' directory.")
        return

    print(f"  Loaded {len(df)} records.\n")
    print("Generating graphs ...")

    graphs = [
        (graph_weather_count,    "01_faults_by_weather.png"),
        (graph_severity_pie,     "02_faults_by_severity.png"),
        (graph_faults_over_time, "03_faults_over_time.png"),
        (graph_area_count,       "04_faults_by_area.png"),
        (graph_shift_count,      "05_faults_by_shift.png"),
        (graph_avg_risk_weather, "06_avg_risk_by_weather.png"),
        (graph_status_pie,       "07_fault_status.png"),
        (graph_summary_dashboard,"00_summary_dashboard.png"),
    ]

    figs = []
    for fn, filename in graphs:
        fig = fn(df)
        save(fig, filename)
        figs.append(fig)

    print(f"\nAll graphs saved to '{OUTPUT_DIR}/' folder.")
    print("Displaying graphs now ...\n")
    plt.show()


if __name__ == "__main__":
    main()
