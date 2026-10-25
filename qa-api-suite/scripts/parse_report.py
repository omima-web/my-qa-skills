"""Read an Apidog HTML test report and list every failed assertion per request.

Usage: python -I parse_report.py "<report.html>"   (newest in <qa-workspace>\\apidog\\reports when omitted)
Output (UTF-8): one line per request with a failed assertion, then totals.
The report has no response bodies; ask her for the Body (Raw) of a request when the assertion text is not enough.
"""
import glob
import html
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
path = sys.argv[1] if len(sys.argv) > 1 else max(glob.glob(os.environ.get("QA_APIDOG_DIR", "./apidog/") + "reports/*.html"), key=os.path.getmtime)
t = html.unescape(open(path, encoding="utf-8").read())
cards = re.split(r'<h5 class="card-header">', t)[1:]
print("report:", os.path.basename(path), "| requests:", len(cards))
failed = 0
for c in cards:
    title = re.sub(r"\s+", " ", c.split("</h5>")[0]).strip()
    fails = re.findall(r'<td>([^<]{1,80})</td>\s*<td class="text-danger">Failed\s*</td>\s*<td>([^<]{0,200})', c)
    if fails:
        failed += 1
        print("FAIL |", title[:70], "|", " ; ".join(
            f[0].strip() + ": " + re.sub(r"\s+", " ", f[1]).split(" at ")[0].strip()[:120] for f in fails))
print("failed requests:", failed, "of", len(cards))
