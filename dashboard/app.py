"""
QAgent Dashboard

Interactive analytics dashboard built with Marimo.
Displays metrics, charts, and recent fixes from W&B Weave.

Run with: marimo run dashboard/app.py
Edit with: marimo edit dashboard/app.py
"""

import marimo

__generated_with = "0.10.0"
app = marimo.App(width="full")


@app.cell
def imports():
    import marimo as mo
    import pandas as pd
    import altair as alt
    from datetime import datetime, timedelta
    import os
    return mo, pd, alt, datetime, timedelta, os


@app.cell
def header(mo):
    """Dashboard header with title and branding"""
    return mo.Html("""
    <div style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
                padding: 2rem; border-radius: 12px; color: white; margin-bottom: 1rem;">
        <h1 style="margin: 0; font-size: 2.5rem;">QAgent Dashboard</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1.1rem;">
            Self-Healing QA Agent Analytics
        </p>
    </div>
    """)


@app.cell
def data_source(mo):
    """Toggle between mock data and live Weave data"""
    use_mock = mo.ui.checkbox(label="Use mock data (for demo)", value=True)
    return use_mock,


@app.cell
def fetch_data(pd, use_mock, os):
    """
    Fetch run data from W&B Weave or use mock data.
    In production, this connects to the Weave API.
    """
    if use_mock.value:
        # Mock data for demonstration
        runs = [
            {'run': 1, 'pass_rate': 0.33, 'fix_time': 180, 'iterations': 3, 'bugs_fixed': 1, 'bugs_found': 3, 'timestamp': '2024-01-15 10:00'},
            {'run': 2, 'pass_rate': 0.50, 'fix_time': 150, 'iterations': 2, 'bugs_fixed': 1, 'bugs_found': 2, 'timestamp': '2024-01-15 10:30'},
            {'run': 3, 'pass_rate': 0.67, 'fix_time': 120, 'iterations': 2, 'bugs_fixed': 1, 'bugs_found': 2, 'timestamp': '2024-01-15 11:00'},
            {'run': 4, 'pass_rate': 0.83, 'fix_time': 90, 'iterations': 1, 'bugs_fixed': 1, 'bugs_found': 1, 'timestamp': '2024-01-15 11:30'},
            {'run': 5, 'pass_rate': 1.00, 'fix_time': 60, 'iterations': 1, 'bugs_fixed': 1, 'bugs_found': 1, 'timestamp': '2024-01-15 12:00'},
        ]
        df = pd.DataFrame(runs)
    else:
        # Try to fetch from Weave
        try:
            import weave

            # Check for API key
            if not os.environ.get('WANDB_API_KEY'):
                raise ValueError("WANDB_API_KEY not set")

            client = weave.init('qagent')
            runs_list = list(client.runs(limit=50))

            data = []
            for i, run in enumerate(runs_list):
                summary = run.summary or {}
                data.append({
                    'run': i + 1,
                    'pass_rate': summary.get('pass_rate', 0),
                    'fix_time': summary.get('avg_fix_time_seconds', 0),
                    'iterations': summary.get('iterations_total', 0),
                    'bugs_fixed': summary.get('bugs_fixed', 0),
                    'bugs_found': summary.get('bugs_found', 0),
                    'timestamp': str(run.created_at) if hasattr(run, 'created_at') else '',
                })

            df = pd.DataFrame(data) if data else pd.DataFrame([{
                'run': 1, 'pass_rate': 0, 'fix_time': 0, 'iterations': 0,
                'bugs_fixed': 0, 'bugs_found': 0, 'timestamp': ''
            }])
        except Exception as e:
            # Fallback to mock data on error
            print(f"Error fetching Weave data: {e}")
            runs = [
                {'run': 1, 'pass_rate': 0.33, 'fix_time': 180, 'iterations': 3, 'bugs_fixed': 1, 'bugs_found': 3, 'timestamp': '2024-01-15 10:00'},
            ]
            df = pd.DataFrame(runs)

    return df,


@app.cell
def metrics(mo, df):
    """Key metrics cards showing current status"""
    if len(df) == 0:
        return mo.md("No data available")

    latest = df.iloc[-1]
    first = df.iloc[0]

    # Calculate values
    pass_rate_val = latest['pass_rate'] * 100
    fix_time_val = latest['fix_time']
    total_bugs = df['bugs_fixed'].sum()

    # Calculate improvement
    if first['fix_time'] > 0:
        improvement = (1 - latest['fix_time'] / first['fix_time']) * 100
    else:
        improvement = 0

    # Create stat cards
    pass_rate = mo.stat(
        value=f"{pass_rate_val:.0f}%",
        label="Pass Rate",
        bordered=True
    )

    fix_time = mo.stat(
        value=f"{fix_time_val:.0f}s",
        label="Avg Fix Time",
        bordered=True
    )

    bugs_fixed = mo.stat(
        value=f"{total_bugs:.0f}",
        label="Bugs Fixed",
        bordered=True
    )

    speed_improvement = mo.stat(
        value=f"{improvement:.0f}%",
        label="Speed Improvement",
        bordered=True
    )

    return mo.hstack([pass_rate, fix_time, bugs_fixed, speed_improvement], gap=2, justify="center")


@app.cell
def pass_rate_chart(mo, alt, df):
    """Line chart showing pass rate over time"""
    if len(df) == 0:
        return mo.md("No data for pass rate chart")

    chart = alt.Chart(df).mark_line(
        point=alt.OverlayMarkDef(filled=True, size=100),
        strokeWidth=3,
        color='#10b981'
    ).encode(
        x=alt.X('run:O', title='Run #'),
        y=alt.Y('pass_rate:Q',
                title='Pass Rate',
                scale=alt.Scale(domain=[0, 1]),
                axis=alt.Axis(format='%')),
        tooltip=[
            alt.Tooltip('run:O', title='Run'),
            alt.Tooltip('pass_rate:Q', title='Pass Rate', format='.0%')
        ]
    ).properties(
        title='Test Pass Rate Over Time',
        width=550,
        height=300
    )

    return mo.ui.altair_chart(chart)


@app.cell
def fix_time_chart(mo, alt, df):
    """Bar chart showing fix time per run"""
    if len(df) == 0:
        return mo.md("No data for fix time chart")

    chart = alt.Chart(df).mark_bar(
        color='#3b82f6',
        cornerRadiusTopLeft=4,
        cornerRadiusTopRight=4
    ).encode(
        x=alt.X('run:O', title='Run #'),
        y=alt.Y('fix_time:Q', title='Fix Time (seconds)'),
        tooltip=[
            alt.Tooltip('run:O', title='Run'),
            alt.Tooltip('fix_time:Q', title='Fix Time', format='.0f')
        ]
    ).properties(
        title='Average Time to Fix',
        width=550,
        height=300
    )

    return mo.ui.altair_chart(chart)


@app.cell
def bug_types_data(pd):
    """Bug types data for pie chart"""
    bug_data = pd.DataFrame([
        {'type': 'UI Bug', 'count': 12},
        {'type': 'Backend Error', 'count': 8},
        {'type': 'Data Error', 'count': 5},
        {'type': 'Test Flaky', 'count': 3},
        {'type': 'Unknown', 'count': 2}
    ])
    return bug_data,


@app.cell
def bug_types_chart(mo, alt, bug_data):
    """Pie/donut chart showing bug types distribution"""
    chart = alt.Chart(bug_data).mark_arc(innerRadius=50, outerRadius=100).encode(
        theta=alt.Theta('count:Q'),
        color=alt.Color('type:N',
                       scale=alt.Scale(
                           domain=['UI Bug', 'Backend Error', 'Data Error', 'Test Flaky', 'Unknown'],
                           range=['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']
                       ),
                       legend=alt.Legend(title='Bug Type')),
        tooltip=['type:N', 'count:Q']
    ).properties(
        title='Bug Types Distribution',
        width=300,
        height=300
    )

    return mo.ui.altair_chart(chart)


@app.cell
def recent_fixes_data(pd):
    """Recent fixes table data"""
    fixes = pd.DataFrame([
        {'status': '✓', 'bug': 'Missing onClick handler', 'file': 'app/cart/page.tsx', 'time': '2m ago', 'iterations': 1},
        {'status': '✓', 'bug': 'Wrong API route /api/payments', 'file': 'app/api/checkout/route.ts', 'time': '5m ago', 'iterations': 2},
        {'status': '✓', 'bug': 'Null reference on newsletter', 'file': 'app/signup/page.tsx', 'time': '8m ago', 'iterations': 1},
        {'status': '⟳', 'bug': 'Timeout in checkout flow', 'file': 'app/checkout/page.tsx', 'time': 'now', 'iterations': 3},
    ])
    return fixes,


@app.cell
def recent_fixes_table(mo, fixes):
    """Table showing recent fixes"""
    return mo.vstack([
        mo.md("### Recent Fixes"),
        mo.ui.table(fixes, selection=None)
    ])


@app.cell
def iterations_chart(mo, alt, df):
    """Area chart showing iterations per run"""
    if len(df) == 0:
        return mo.md("No data for iterations chart")

    chart = alt.Chart(df).mark_area(
        color='#8b5cf6',
        opacity=0.6,
        line={'color': '#8b5cf6', 'strokeWidth': 2}
    ).encode(
        x=alt.X('run:O', title='Run #'),
        y=alt.Y('iterations:Q', title='Iterations'),
        tooltip=[
            alt.Tooltip('run:O', title='Run'),
            alt.Tooltip('iterations:Q', title='Iterations')
        ]
    ).properties(
        title='Iterations per Run',
        width=550,
        height=200
    )

    return mo.ui.altair_chart(chart)


@app.cell
def comparison_table(mo, df, pd):
    """Before/After comparison"""
    if len(df) < 2:
        return mo.md("Need at least 2 runs for comparison")

    first = df.iloc[0]
    latest = df.iloc[-1]

    comparison_data = pd.DataFrame([
        {'Metric': 'Pass Rate', 'Before': f"{first['pass_rate']*100:.0f}%", 'After': f"{latest['pass_rate']*100:.0f}%", 'Change': f"+{(latest['pass_rate'] - first['pass_rate'])*100:.0f}%"},
        {'Metric': 'Fix Time', 'Before': f"{first['fix_time']:.0f}s", 'After': f"{latest['fix_time']:.0f}s", 'Change': f"{latest['fix_time'] - first['fix_time']:.0f}s"},
        {'Metric': 'Iterations', 'Before': f"{first['iterations']:.0f}", 'After': f"{latest['iterations']:.0f}", 'Change': f"{latest['iterations'] - first['iterations']:.0f}"},
    ])

    return mo.vstack([
        mo.md("### Before vs After"),
        mo.ui.table(comparison_data, selection=None)
    ])


@app.cell
def charts_row(mo, pass_rate_chart, fix_time_chart):
    """Row with pass rate and fix time charts"""
    return mo.hstack([pass_rate_chart, fix_time_chart], gap=4, justify="center")


@app.cell
def bottom_row(mo, bug_types_chart, recent_fixes_table):
    """Row with bug types chart and recent fixes table"""
    return mo.hstack([bug_types_chart, recent_fixes_table], gap=4, justify="center")


@app.cell
def footer(mo):
    """Dashboard footer with credits"""
    return mo.Html("""
    <div style="text-align: center; padding: 1rem; color: #6b7280; font-size: 0.9rem; margin-top: 2rem;">
        <p>QAgent - Self-Healing QA Agent | Powered by Browserbase, Redis, Vercel, W&B Weave</p>
        <p>Built for WeaveHacks 2024</p>
    </div>
    """)


@app.cell
def layout(mo, header, data_source, metrics, charts_row, iterations_chart, bottom_row, comparison_table, footer):
    """Main dashboard layout"""
    return mo.vstack([
        header,
        mo.hstack([data_source], justify="end"),
        mo.md("---"),
        metrics,
        mo.md("---"),
        charts_row,
        mo.md("---"),
        iterations_chart,
        mo.md("---"),
        bottom_row,
        mo.md("---"),
        comparison_table,
        footer
    ], gap=2)


if __name__ == "__main__":
    app.run()
