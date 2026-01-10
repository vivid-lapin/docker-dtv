# syntax=docker/dockerfile:1

FROM debian:bookworm-slim AS base

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y git build-essential python3 python-is-python3 libssl-dev locales libedit-dev zlib1g-dev curl gpg lsb-release software-properties-common

RUN \
    curl -o llvm.sh https://apt.llvm.org/llvm.sh && \
    chmod +x llvm.sh && \
    ./llvm.sh 19 && \
    update-alternatives --install /usr/bin/clang clang /usr/bin/clang-19 100 && \
    update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-19 100 && \
    update-alternatives --install /usr/bin/llvm-config llvm-config /usr/bin/llvm-config-19 100

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
    mkdir -p /out && \
    make SYSPREFIX=/out LLVM=1 NODEKTEC=1 NOHIDES=1 NOVATEK=1 NORIST=1 NOSRT=1 NOJAVA=1 NODOXYGEN=1 NODOC=1 NOTEST=1 NOGITHUB=1 -j"$(nproc)" && \
    make SYSPREFIX=/out LLVM=1 NODEKTEC=1 NOHIDES=1 NOVATEK=1 NORIST=1 NOSRT=1 NOJAVA=1 NODOXYGEN=1 NODOC=1 NOTEST=1 NOGITHUB=1 -j"$(nproc)" install

FROM scratch AS release
COPY --from=base /out /out
