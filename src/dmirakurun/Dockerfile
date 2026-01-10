# syntax=docker/dockerfile:1

FROM node:22.14.0-bookworm-slim AS base
FROM base AS build

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y git

ADD https://api.github.com/repos/neneka/DMirakurun/git/refs/heads/master /tmp/git.json

WORKDIR /app

ENV DOCKER=YES NODE_ENV=production

RUN \
    git clone --depth 1 --recursive https://github.com/neneka/DMirakurun.git . && \
    npm ci --include=dev && \
    npm run build && \
    npm ci --omit=dev

FROM base AS release

WORKDIR /app

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y \
    vim \
    procps \
    htop \
    usbutils \
    ca-certificates \
    pkg-config \
    pcscd \
    libpcsclite-dev \
    libccid \
    libdvbv5-dev \
    pcsc-tools \
    dvb-tools \
    libedit2 \
    libcurl4

COPY --from=build /app /app

CMD ["./docker/container-init.sh"]

EXPOSE 40772
