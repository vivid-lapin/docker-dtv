# syntax=docker/dockerfile:1

FROM debian:bookworm-slim AS base

WORKDIR /work

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y git make g++ gcc libssl-dev libpcsclite-dev pcscd pkgconf libedit-dev zlib1g-dev cmake

RUN git clone --depth 1 https://github.com/mmttmte/arib-b61-stream-test.git && \
    cd arib-b61-stream-test && \
    cmake -B build -S . -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build

FROM scratch AS release
COPY --from=base /work/arib-b61-stream-test/build/arib-b61-stream-test/arib-b61-stream-test /bin/arib-b61-stream-test
