# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-hwenc:a296fa8

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    libavcodec-dev \
    libavutil-dev \
    libavformat-dev \
    libswresample-dev \
    libavfilter-dev

RUN curl -sLOJ https://github.com/rigaya/tsreplace/releases/download/0.17/tsreplace_0.17_Ubuntu22.04_amd64.deb && \
    apt-get install ./tsreplace_0.17_Ubuntu22.04_amd64.deb && \
    rm tsreplace_0.17_Ubuntu22.04_amd64.deb
