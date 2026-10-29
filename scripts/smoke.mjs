// End-to-end smoke test against a running production build.
//
//   BASE_URL=http://localhost:3000 node scripts/smoke.mjs
//   BASE_URL=https://your-domain node scripts/smoke.mjs     (after a deploy)
//
// Checks the paths that only work when every piece is wired up: the database
// answers, a PostGIS radius search runs, symptom routing answers, and the
// pages render. EXPECT_DOCTORS=true also requires the search to find someone,
// which CI sets after loading the sample doctors.
const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`ok    ${name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL  ${name}: ${e.message}`);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

await check("GET /api/health is ok with a reachable database", async () => {
  const res = await fetch(`${base}/api/health`);
  const body = await res.json();
  expect(res.status === 200, `status ${res.status}, body ${JSON.stringify(body)}`);
  expect(body.database === "ok", `database is "${body.database}", expected "ok"`);
});

await check("GET /api/doctors runs a PostGIS radius search", async () => {
  // Edappal, Malappuram, where the sample doctors are. Against a real database
  // the point is that the query runs; finding someone is EXPECT_DOCTORS.
  const res = await fetch(`${base}/api/doctors?specialty=general&lat=10.986&lng=76.011&radius=25`);
  const body = await res.json();
  expect(res.status === 200, `status ${res.status}, body ${JSON.stringify(body).slice(0, 200)}`);
  expect(Array.isArray(body.doctors), "response has no doctors array");
  if (process.env.EXPECT_DOCTORS === "true") {
    expect(body.doctors.length > 0, "search found no doctors");
  }
});

await check("POST /api/route-symptom routes a complaint", async () => {
  const res = await fetch(`${base}/api/route-symptom`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "itchy red rash on my arm for a week" }),
  });
  const body = await res.json();
  expect(res.status === 200, `status ${res.status}, body ${JSON.stringify(body).slice(0, 200)}`);
});

for (const path of ["/", "/find", "/privacy", "/robots.txt", "/sitemap.xml"]) {
  await check(`GET ${path} renders`, async () => {
    const res = await fetch(`${base}${path}`);
    expect(res.status === 200, `status ${res.status}`);
  });
}

if (failed) {
  console.error(`\n${failed} smoke check(s) failed against ${base}`);
  process.exit(1);
}
console.log(`\nAll smoke checks passed against ${base}`);
