# syntax=docker/dockerfile:1

FROM debian:bookworm-slim AS recdvb

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y git automake autoconf build-essential

ADD https://api.github.com/repos/otya128/recdvb/git/refs/heads/master /tmp/git.json

RUN git clone --depth 1 --recursive https://github.com/otya128/recdvb.git && \
    cd recdvb && \
    ./autogen.sh && \
    mkdir -p /out/bin && \
    ./configure --prefix=/out && \
    make && \
    make install

FROM scratch AS release
COPY --from=recdvb /out /
