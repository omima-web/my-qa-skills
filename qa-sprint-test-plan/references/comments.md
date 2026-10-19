# Test Plan comments — HTML templates (reference: CPD-32078)

Post with `addOrEditJiraIssueComment`, `contentFormat: "html"`. Replace `{…}`.
Links point at their saved filters 10732 / 10669 (their JQL is moved to the new sprint each START).

## Comment 1 — QA report (dashboard)
Find it later: body contains `Partners Sprints QA Report for Testers`.

Start (no image yet):
```html
<h1>Partners Sprints QA Report for Testers</h1>
<div data-type="embed-card" data-layout="wide" data-width="100"><iframe src="https://salla-dev.atlassian.net/jira/dashboards/10208"></iframe></div>
```
Close: same body + the report image appended at the end:
```html
<figure data-type="media-single" data-layout="align-start" data-width="80" data-width-type="percentage"><div data-type="media" data-media-type="file" data-id="{MEDIA_ID}" data-collection="{COLLECTION}" data-alt="qa-report.png"></div></figure>
```

## Comment 2 — QA Sign Off List
Find it later: body contains `QA Sign Off List`. At start every Value cell is empty (`<p></p>`).

```html
<h3>QA Sign Off List:</h3>
<table><thead><tr><th><p></p></th><th><p>Detail</p></th><th><p>Value</p></th></tr></thead><tbody>
<tr><td><p><strong>Test Plan Status</strong></p></td><td><p>Test Plan For Partners</p></td><td><p><a href="https://salla-dev.atlassian.net/browse/{PLAN_KEY}">{PLAN_KEY}</a></p></td></tr>
</tbody></table>
<h3>Testing Summary:</h3>
<table><thead><tr><th><p>Detail</p></th><th><p>Value</p></th><th><p>Links</p></th></tr></thead><tbody>
<tr><td><p>Total Test Cases</p></td><td><p>{TOTAL}</p></td><td><p><a href="https://salla-dev.atlassian.net/issues/?filter=10732">Total Test Cases link</a></p></td></tr>
<tr><td><p>Executed Test Cases</p></td><td><p>{EXECUTED}</p></td><td><p></p></td></tr>
<tr><td><p>Pending <strong>OR</strong> Blocked Test Cases</p></td><td><p>{PENDING}</p></td><td><p></p></td></tr>
<tr><td><p>Defects Found &amp; Solved</p></td><td><p>Total= {D_TOTAL}</p><p>solved= {D_SOLVED}</p><p>rejected= {D_REJECTED}</p></td><td><p><a href="https://salla-dev.atlassian.net/issues/?filter=10669">Defects Found &amp; Solved link</a></p></td></tr>
</tbody></table>
<table><thead><tr><th><p>Criteria</p></th></tr></thead><tbody>
<tr><td><p>All test cases in the test plan have been executed.</p></td></tr>
<tr><td><p>All high-priority and critical defects have been resolved and verified.</p></td></tr>
<tr><td><p>The test execution results meet the acceptance criteria.</p></td></tr>
<tr><td><p>The Xray <a href="https://salla-dev.atlassian.net/plugins/servlet/ac/com.xpandit.plugins.xray/test-coverage-report-page?project.key=CPD&amp;project.id=10146&amp;ac.reportId=6ac55c1d29dea6e107d2e65e">Test coverage</a> aligns with the sprint scope.</p>{COVERAGE_NOTE}{COVERAGE_IMAGE}</td></tr>
<tr><td><p>Regression testing has been successfully completed.</p></td></tr>
<tr><td><p>Performance testing, if applicable, meets the defined benchmarks. Any end point not exceed <strong>450</strong></p></td></tr>
</tbody></table>
```
- `{COVERAGE_NOTE}` at close: `<p>All sprint stories are covered and OK.</p>` or, when not all OK (Test Sets left out), `<ul><li><p><span style="color: #ff5630">All {n} stories that are not OK in the coverage (UNCOVERED, NOT RUN, NOK) are not finished on the development side, and all of them spilled over to Sprint {NEXT}. The gap is not on the QA side:</span></p></li><li><p><span style="color: #ff5630">KEY (UNCOVERED), KEY (NOT RUN), KEY (NOK).</span></p></li><li><p><span style="color: #ff5630">Test Sets are not counted in the coverage.</span></p></li></ul>` (reference: CPD-32982 Sign Off). Empty at start.
- `{COVERAGE_IMAGE}` at close: the media-single figure (coverage.png, `data-width="80"` percentage). Empty at start.
- Pending row: write `0` at close when nothing is pending (empty at start).
