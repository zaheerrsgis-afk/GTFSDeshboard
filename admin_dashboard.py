import json
from pathlib import Path

import pandas as pd
import streamlit as st

st.set_page_config(page_title="Punjab Transit Admin Review", layout="wide")
st.title("Punjab Transit Admin Review")
st.caption("Internal GTFS inventory, Google readiness and Lahore PMA dataset status")
root = Path(__file__).parent
gtfs = root / "gtfs"

files = ["agency.txt","calendar.txt","calendar_dates.txt","fare_attributes.txt","fare_rules.txt","frequencies.txt","levels.txt","pathways.txt","routes.txt","shapes.txt","stop_times.txt","stops.txt","translations.txt","trips.txt"]
rows=[]
for f in files:
    p=gtfs/f
    if p.exists():
        try:
            n=len(pd.read_csv(p))
        except Exception:
            n=None
        rows.append({"file":f,"status":"available","records":n})
    else:
        rows.append({"file":f,"status":"missing","records":0})
st.subheader("Lahore PMA GTFS file inventory")
st.dataframe(pd.DataFrame(rows), use_container_width=True)

st.subheader("Google readiness")
cal = pd.read_csv(gtfs/"calendar.txt") if (gtfs/"calendar.txt").exists() else pd.DataFrame()
if not cal.empty:
    st.warning(f"Calendar end date in current feed: {cal['end_date'].max()}. Update to current/future dates before Google submission.")
else:
    st.error("calendar.txt not found")

st.subheader("Dataset scope")
st.info("Available data is Lahore PMA only. Lahore PTC, Multan, and Punjab EVs are marked as upcoming datasets.")
