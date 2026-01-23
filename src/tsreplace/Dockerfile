# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-hwenc:350bd3d

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    sudo apt-get update && \
    sudo apt-get install -y --no-install-recommends \
    libavcodec-dev \
    libavutil-dev \
    libavformat-dev \
    libswresample-dev \
    libavfilter-dev

RUN curl -sLOJ https://github.com/rigaya/tsreplace/releases/download/0.17/tsreplace_0.17_Ubuntu22.04_amd64.deb && \
    sudo apt-get install ./tsreplace_0.17_Ubuntu22.04_amd64.deb && \
    rm tsreplace_0.17_Ubuntu22.04_amd64.deb
