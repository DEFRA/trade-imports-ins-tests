FROM zaproxy/zap-stable:2.17.0 AS zap

# Client Side Integration tries to create a Firefox profile on every daemon
# startup; this image never ships Firefox (only /zap gets copied below), so
# it fails every time — harmless but noisy. zap.sh -addonuninstall only
# writes state into ~/.ZAP, which isn't part of the final image and is fresh
# in every container anyway, so it doesn't stick. Deleting the add-on's
# bundled plugin file does: ZAP loads add-ons straight from /zap/plugin/*.zap
# at startup, and won't re-fetch a removed one via auto-update (confirmed —
# auto-update only updates add-ons that are already installed).
RUN rm -f /zap/plugin/client-alpha-*.zap

FROM mcr.microsoft.com/playwright:v1.63.0-jammy

ENV TZ="Europe/London"
ENV CI=true

USER root

# System dependencies needed by tests and tools (curl/zip/Java)
RUN apt-get update -qq \
    && apt-get install -qqy \
    curl \
    zip \
    openjdk-17-jre-headless

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

# ZAP daemon for the security profile (see zap/README.md, entrypoint.sh) —
# reuses the same image already proven locally, rather than a second install
# mechanism.
COPY --from=zap --chown=pwuser:pwuser /zap /zap
ENV PATH="/zap:${PATH}"

WORKDIR /app

# Install Node dependencies from lockfile; skip lifecycle scripts for security
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy the rest of the project
COPY . .

# Use the non-root Playwright user provided by the base image
RUN chown -R pwuser:pwuser /app
USER pwuser

ENTRYPOINT [ "./entrypoint.sh" ]

# AWS CLI v2 is linux/amd64; on Apple Silicon build with:
#   docker build --platform=linux/amd64 .
