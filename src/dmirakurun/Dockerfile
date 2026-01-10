# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-tsduck:08ef8d6 AS tsduck
FROM ghcr.io/vivid-lapin/docker-dtv-recdvb:d094387 AS recdvb
FROM ghcr.io/vivid-lapin/docker-dtv-dantto4k:6692f18 AS dantto4k

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
    make \
    vim \
    procps \
    htop \
    usbutils \
    ca-certificates \
    gcc \
    g++ \
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

COPY --from=recdvb /bin/recdvb /usr/local/bin/recdvb
COPY --from=tsduck /usr/local/tsduck /usr/local/tsduck
COPY --from=dantto4k /bin/dantto4k /usr/local/bin/dantto4k

RUN echo /usr/local/tsduck/lib > /etc/ld.so.conf.d/tsduck.conf && \
    ldconfig && \
    ln -sf /usr/local/tsduck/share/tsduck /usr/local/share/tsduck

CMD ["./docker/container-init.sh"]

EXPOSE 40772
