"""Build an Apidog-ready Postman v2.1 collection for one API story.

Usage from a story generator (<qa-workspace>\\apidog\\_gen\\<story>.py):
    import sys; sys.path.insert(0, r"<qa-workspace>\\skills-private\\qa-api-suite\\scripts")
    from suite_lib import *
    items = [("1. التوكن", [req("1.1 ...", path="/opportunities/links?per_page=1", tests=[st(200), LIST])])]
    write_suite("<اسم الستوري>", items, {"base": "...", "token": "", ...}, "وصف: المتغيرات + الفشل المعروف")

Rules learned on 2026-10-22:
- Query params MUST be in url.query (a raw "?a=b" alone is dropped by the Apidog import).
- Requests send {{token}} etc.; never put a real token in the file.
- Every test script starts with a safe JSON parse, so a non-JSON body does not throw a script error.
"""
import json
from urllib.parse import unquote

import os
OUT_DIR = os.environ.get("QA_APIDOG_DIR", "./apidog/")
BEARER = "Bearer {{token}}"


def _url(path):
    pth, _, qs = path.partition("?")
    url = {"raw": "{{base}}" + path, "host": ["{{base}}"], "path": [x for x in pth.split("/") if x]}
    if qs:
        url["query"] = [{"key": unquote(kv.partition("=")[0]), "value": unquote(kv.partition("=")[2])}
                        for kv in qs.split("&")]
    return url


def req(name, method="GET", path="/", auth=BEARER, lang="ar", body=None, tests=(), headers=()):
    """auth: full Authorization value, or None for no header."""
    h = [{"key": "Accept", "value": "application/json"}, {"key": "Accept-Language", "value": lang}]
    if auth is not None:
        h.append({"key": "Authorization", "value": auth})
    h += [{"key": k, "value": v} for k, v in headers]
    r = {"method": method, "header": h, "url": _url(path)}
    if body is not None:
        h.append({"key": "Content-Type", "value": "application/json"})
        r["body"] = {"mode": "raw", "raw": body, "options": {"raw": {"language": "json"}}}
    return {"name": name, "request": r, "event": [{"listen": "test", "script": {"type": "text/javascript",
            "exec": ["let j = {}; try { j = pm.response.json(); } catch (e) {}"] + list(tests)}}]}


def st(*c):
    return 'pm.test("status %s", () => pm.expect([%s]).to.include(pm.response.code));' % (
        "/".join(map(str, c)), ",".join(map(str, c)))


def fld(f):
    return 'pm.test("error on %s", () => pm.expect(j.error && j.error.fields).to.have.property("%s"));' % (f, f)


def code(c):
    return 'pm.test("code %s", () => pm.expect(j.error && j.error.code).to.eql("%s"));' % (c, c)


def every(cond, label):
    return 'pm.test("%s", () => (j.data || []).forEach(x => pm.expect(%s).to.be.true));' % (label, cond)


def count_max(n):
    return 'pm.test("at most %d items", () => pm.expect((j.data || []).length).to.be.at.most(%d));' % (n, n)


def time_max(ms, label=""):
    return 'pm.test("time ≤ %dms %s", () => pm.expect(pm.response.responseTime).to.be.at.most(%d));' % (ms, label, ms)


NOT500 = 'pm.test("no 5xx", () => pm.expect(pm.response.code).to.be.below(500));'
LIST = 'pm.test("data is a list", () => pm.expect(j.data).to.be.an("array"));'
EMPTY = 'pm.test("empty list", () => pm.expect(j.data).to.be.an("array").that.is.empty);'


def write_suite(story_name, items, variables, description):
    col = {"info": {"name": story_name, "description": description,
                    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
           "item": [{"name": n, "item": i} for n, i in items],
           "variable": [{"key": k, "value": v} for k, v in variables.items()]}
    out = OUT_DIR + story_name + " - سويت.postman_collection.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(col, f, ensure_ascii=False, indent=1)
    return out, sum(len(i) for _, i in items)
