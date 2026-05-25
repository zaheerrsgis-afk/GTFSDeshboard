# Punjab Transit Open Data Portal

Run public dashboard:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

This package contains Lahore PMA GTFS data only. Multan and Punjab EVs are represented as coming-soon datasets.


Update: Punjab Districts Map now uses the original uploaded Punjab.kml district boundaries converted to data/districts.geojson. Lahore is active; all other districts remain grey as coming soon.


## Latest refinements

- PITB logo background has been removed and saved with transparency.
- Lahore panel includes one Developer / Google / Admin button.
- Developer page includes Google readiness and admin review command.

Run public dashboard:

```bash
python -m http.server 8000
```

Run admin review:

```bash
python -m pip install -r requirements.txt
python -m streamlit run admin_dashboard.py
```
