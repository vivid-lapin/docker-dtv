# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-llvm:4c8a3a4 AS base

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y git locales libedit-dev zlib1g-dev libssl-dev build-essential

RUN printf "en_US.UTF-8 UTF-8\n" >> /etc/locale.gen && \
    locale-gen en_US.UTF-8 && \
    /usr/sbin/locale-gen

ENV LANG="en_US.UTF-8" \
    LANGUAGE="en_US.UTF-8" \
    LC_ALL="en_US.UTF-8"

ARG TSDUCK_VERSION=v3.43-4549

ADD https://api.github.com/repos/tsduck/tsduck/git/refs/tags/$TSDUCK_VERSION /tmp/git.json

RUN git clone --depth 1 -b $TSDUCK_VERSION https://github.com/tsduck/tsduck.git && \
    cd tsduck && \
    mkdir -p /usr/local/tsduck && \
    make SYSPREFIX=/usr/local/tsduck LLVM=1 NODEKTEC=1 NOHIDES=1 NOVATEK=1 NORIST=1 NOSRT=1 NOJAVA=1 NODOXYGEN=1 NODOC=1 NOTEST=1 NOGITHUB=1 -j"$(nproc)" && \
    make SYSPREFIX=/usr/local/tsduck LLVM=1 NODEKTEC=1 NOHIDES=1 NOVATEK=1 NORIST=1 NOSRT=1 NOJAVA=1 NODOXYGEN=1 NODOC=1 NOTEST=1 NOGITHUB=1 -j"$(nproc)" install

FROM scratch AS release
COPY --from=base /usr/local/tsduck /usr/local/tsduck
