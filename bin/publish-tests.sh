#!/bin/sh

REPORT_NAME="${1:-playwright-report}"
DIRECTORY="$PWD/$REPORT_NAME"

publish_report_zip() {
  zip_dir="$(mktemp -d)"
  zip_file="$zip_dir/report.zip"
  zip_target="${RESULTS_OUTPUT_S3_PATH%/}/report.zip"

  paths="$REPORT_NAME"
  for extra in test-results allure-results; do
    if [ -d "$extra" ]; then
      paths="$paths $extra"
    fi
  done

  if ! zip -qr "$zip_file" $paths; then
    echo "warning: could not create the test results zip from $paths"
  elif ! aws s3 cp --quiet "$zip_file" "$zip_target"; then
    echo "warning: could not upload the test results zip to $zip_target"
  else
    echo "Test results zip published to $zip_target"
  fi

  rm -rf "$zip_dir"
}

echo "Publishing test results to S3"

if [ -n "$RESULTS_OUTPUT_S3_PATH" ]; then
   if [ -d "$DIRECTORY" ]; then
      aws s3 cp --quiet "$DIRECTORY" "$RESULTS_OUTPUT_S3_PATH" --recursive
      echo "Test results published to $RESULTS_OUTPUT_S3_PATH"
      publish_report_zip
   else
      echo "$DIRECTORY is not found"
      exit 1
   fi
else
   echo "RESULTS_OUTPUT_S3_PATH is not set"
   exit 1
fi
