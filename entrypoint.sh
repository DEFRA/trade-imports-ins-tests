#!/bin/sh
#
# PROFILE selects the test suite to run (case-sensitive, defaults to 'default').
# Allowed values:
#   default (or unset)  — standard run via npm test
#   a11y                — accessibility suite via npm run test:a11y
#   browserstack        — not implemented (exits 1)
#   security            — ZAP passive scan (broad e2e suite) via npm run test:security, safe to run routinely
#   security:active     — refused; the @active suite is destructive, so it only
#                         runs against the disposable docker-compose stack

echo "run_id: $RUN_ID"

# automation-*.yaml reference these via ${ENV_VAR} substitution (ZAP's
# own Automation Framework mechanism) instead of hardcoding localhost — ZAP
# resolves them from its own process environment, so they have to be
# exported before zap.sh starts, not computed by the Node/tsx side (that
# would only land in the Playwright child process's own env, never back up
# to this shell). All four are reached directly, built straight from the
# same ENVIRONMENT CDP already sets — unlike cdpServiceUrl() (used by the
# laptop-targeting-CDP path outside this script), there's no CDP_LOCAL
# branch here: this script only ever runs as a CDP-hosted job, already
# inside CDP's network, where the direct per-service subdomain always
# resolves.
configure_zap_urls() {
  export ZAP_TRADE_IMPORTS_ANIMALS_FRONTEND_URL="https://trade-imports-animals-frontend.${ENVIRONMENT}.cdp-int.defra.cloud"
  export ZAP_TRADE_IMPORTS_ANIMALS_ADMIN_URL="https://trade-imports-animals-admin.${ENVIRONMENT}.cdp-int.defra.cloud"
  export ZAP_TRADE_IMPORTS_INS_FRONTEND_URL="https://trade-imports-ins-frontend.${ENVIRONMENT}.cdp-int.defra.cloud"
  export ZAP_TRADE_IMPORTS_ANIMALS_BACKEND_URL="https://trade-imports-animals-backend.${ENVIRONMENT}.cdp-int.defra.cloud"
  export ZAP_TRADE_IMPORTS_ADDRESS_BOOK_URL="https://trade-imports-address-book.${ENVIRONMENT}.cdp-int.defra.cloud"
}

# CDP's report viewer looks for index.html inside whichever directory gets
# published, so every early-exit path below needs one even though the real
# scan never produced its own. $1: title/heading, $2: explanation, $3:
# optional extra paragraph (e.g. links to zap-log.html/playwright-report).
write_fallback_report_html() {
  title="$1"
  message="$2"
  links="$3"
  cat > "$REPORT_DIR/index.html" <<EOF
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h1>${title}</h1>
<p>${message}</p>
${links:+<p>${links}</p>}
</body>
</html>
EOF
}

# Starts ZAP as a background process (CDP has no separate container to run
# it in, unlike local's docker-compose setup), points the security specs and
# the gate at it, then shuts it down. Shared by both security profiles below
# — both the ZAP plan file (see config/zap.ts) and, just below, which npm
# script runs are picked up from PROFILE itself, not passed in here.
run_security_profile() {
  configure_zap_urls

  export ZAP_API_KEY="$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')"
  # Absolute, not relative: zap.sh cd's to its own install directory (/zap)
  # before running, regardless of where it was launched from, so a relative
  # path here would resolve against the wrong base entirely.
  export ZAP_PLAN_DIR="/app/zap"

  # CDP's own "Report" link is driven by whichever directory gets published
  # (it looks for index.html inside it) — see the final publish step below.
  export REPORT_DIR="zap-report"

  # automation-*.yaml hardcode reportDir: /zap/wrk/zap-report — locally
  # that's a bind mount onto ../zap-report; here there's no separate
  # container to mount across, so symlink it to where run-and-gate.ts
  # actually reads reports from instead of changing either side.
  mkdir -p /app/zap-report /zap/wrk
  ln -sfn /app/zap-report /zap/wrk/zap-report

  # Compose-only. The @active suite deletes real data and the scan re-fires
  # those deletes with fuzzed payloads; this script only ever runs on CDP,
  # against a shared environment. Returning here is safe — ZAP has not
  # started yet, so there is nothing to shut down or collect.
  if [ "$PROFILE" = "security:active" ]; then
    echo "PROFILE=security:active is not supported on CDP; run it against the workspace docker-compose stack" >> FAILED
    write_fallback_report_html "Security scan — refused" \
      "security:active is destructive and only runs against the workspace docker-compose stack."
    return
  fi

  # CDP has no internet route, so ZAP's check-for-updates/news/telemetry
  # calls would otherwise stall instead of failing fast. -silent is ZAP's
  # own documented flag for all three (zaproxy.org/faq/what-calls-home-
  # does-zap-make).
  zap.sh -daemon -silent -host 127.0.0.1 -port "${ZAP_PORT:-9095}" \
    -config api.key="$ZAP_API_KEY" \
    -config api.addrs.addr.name=.* \
    -config api.addrs.addr.regex=true \
    -config anticsrf.tokens.token.name=crumb &
  zap_pid=$!

  # Mirrors the workspace repo's docker/stack/security.compose.yml healthcheck
  # timing (5s interval, 10 retries).
  zap_ready=false
  i=0
  while [ $i -lt 10 ]; do
    if curl --silent --output /dev/null --fail "http://127.0.0.1:${ZAP_PORT:-9095}/"; then
      zap_ready=true
      break
    fi
    i=$((i + 1))
    sleep 5
  done

  if [ "$zap_ready" = "true" ]; then
    # Chained, not two independent statements: the gate (and any active scan
    # it triggers) must never run against a spec run that failed or refused
    # to start — e.g. the prod guard in shared-config.ts, which only
    # test:security/test:security:active go through, not this gate step on
    # its own.
    if [ "$PROFILE" = "security:active" ]; then
      # Unreachable on CDP — refused at the top of this function.
      npm run test:security:active && npm run _zap_run_and_gate
    else
      npm run test:security && npm run _zap_run_and_gate
    fi
    security_exit_code=$?
    if [ $security_exit_code -ne 0 ]; then
      echo "security profile exited $security_exit_code before completing" >> FAILED
    fi

    # run-and-gate.ts always writes index.html before it can throw, so its
    # absence means the && above short-circuited — specs failed before the
    # gate ran. Don't run the gate to recover (see the && comment above);
    # just give the published report a landing page and the Playwright
    # report instead of a bare zap-log.html.
    if [ ! -f "$REPORT_DIR/index.html" ]; then
      [ -d playwright-report ] && cp -r playwright-report "$REPORT_DIR/playwright-report"
      write_fallback_report_html "Security scan — specs failed" \
        "The Playwright specs failed before the ZAP gate could run, so no ZAP scan took place." \
        "See <a href=\"playwright-report/index.html\">the Playwright report</a> for the failing spec(s), and <a href=\"zap-log.html\">zap.log</a> for ZAP's own diagnostics."
    fi
  else
    # Still fall through to kill/cp below — ZAP did start (just never became
    # ready), and the readiness failure itself is exactly the kind of thing
    # zap.log explains. Returning early here used to skip both.
    echo "ZAP did not become ready before timing out" >> FAILED

    # No scan ran, so run-and-gate.ts's index.html (which needs a
    # completed scan's alert data) never gets written either.
    write_fallback_report_html "ZAP security scan — FAILED" \
      "ZAP did not become ready before timing out — no scan ran." \
      "See <a href=\"zap-log.html\">zap.log</a> for diagnostics."
  fi

  # wait, not just kill: zap.log is only complete once the process has
  # actually exited, so copying right after kill (no wait) could grab it
  # mid-flush.
  kill "$zap_pid" 2>/dev/null
  wait "$zap_pid" 2>/dev/null

  # ZAP's own internal log — separate from what it prints to stdout, and
  # the only place some of its own errors ever get written ("ZAP errors
  # logged - see the zap.log file for details"). run-and-gate.ts wraps this
  # same file as HTML too (see wrapAsHtml there for why), but it runs
  # before this point, while ZAP is still alive and the log incomplete —
  # this is the one place that runs after kill+wait, so it's the version
  # that actually ships.
  if [ -f "$HOME/.ZAP/zap.log" ]; then
    {
      echo '<!doctype html><meta charset="utf-8"><title>zap.log</title><pre>'
      sed -e 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g' "$HOME/.ZAP/zap.log"
      echo '</pre>'
    } > "$REPORT_DIR/zap-log.html"
  else
    echo "could not find ZAP's own log (zap.log) to publish into $REPORT_DIR"
  fi

  # security-scan-json.html already carries this (see run-and-gate.ts's
  # wrapAsHtml) — the raw copy is just clutter on an already access-gated
  # portal, not a security concern the way it is on GitHub Actions' public
  # Pages site.
  rm -f "$REPORT_DIR/security-scan.json"
}

case "${PROFILE:-default}" in
  default)
    # Record a non-zero npm test exit in the FAILED marker: a run that dies
    # before Playwright starts must not report a pass.
    npm test || echo "npm test exited $? before completing" >> FAILED
    ;;
  a11y)
    npm run test:a11y || echo "npm run test:a11y exited $? before completing" >> FAILED
    ;;
  browserstack)
    echo "browserstack profile runs are not implemented yet."
    exit 1
    ;;
  security | security:active)
    run_security_profile
    ;;
  *)
    echo "unknown PROFILE: '${PROFILE}'. Allowed values: default, a11y, browserstack, security, security:active (unset defaults to default)."
    exit 1
    ;;
esac

# security profiles publish zap-report/ (their index.html is the ZAP
# summary, not the Playwright report) and skip the allure-generate step,
# which has nothing to do with ZAP output. Every other profile keeps the
# existing report:publish sequence unchanged.
if [ "${REPORT_DIR:-playwright-report}" = "zap-report" ]; then
  ./bin/publish-tests.sh "$REPORT_DIR"
  publish_exit_code=$?
else
  npm run report:publish
  publish_exit_code=$?
fi

if [ $publish_exit_code -ne 0 ]; then
  echo "failed to publish test results"
  exit $publish_exit_code
fi

# At the end of the test run, if the suite has failed we write a file called 'FAILED'
if [ -f FAILED ]; then
  echo "test suite failed"
  cat ./FAILED
  exit 1
fi

echo "test suite passed"
exit 0
