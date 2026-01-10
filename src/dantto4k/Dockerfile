# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-tsduck:08ef8d6 AS tsduck

FROM debian:bookworm-slim AS base

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y git make g++ libssl-dev libpcsclite-dev pcscd pkgconf libedit-dev zlib1g-dev

ARG DANTTO4K_VERSION=main

COPY --from=tsduck /usr/local/tsduck /usr/local/tsduck
RUN echo /usr/local/tsduck/lib > /etc/ld.so.conf.d/tsduck.conf && \
    ldconfig

RUN git clone --depth 1 --branch ${DANTTO4K_VERSION} --recurse-submodules https://github.com/nekohkr/dantto4k.git && \
    cd dantto4k && \
    sed -i 's/^CXXFLAGS = \(.*\)/CXXFLAGS = \1 -include cstddef -include cstdint/' Makefile && \
    PKG_CONFIG_PATH="/usr/local/tsduck/share/pkgconfig:${PKG_CONFIG_PATH}" make -j"$(nproc)" && \
    make install

FROM scratch AS release
COPY --from=base /usr/local/bin/dantto4k /bin/dantto4k
