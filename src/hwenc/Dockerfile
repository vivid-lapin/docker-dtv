# syntax=docker/dockerfile:1

# SPDX-License-Identifier: MIT
# Copyright (c) 2021-2026 tsukumi
# https://github.com/tsukumijima/KonomiTV/blob/c3661e5ab55016f04c325acb7064e36bfa7bee20/Dockerfile

# Ubuntu 22.04 LTS (with CUDA) をベースイメージとして利用
## NVEncC の動作には CUDA ライブラリが必要なため、CUDA 付きのイメージを使う
## RTX 5090 (Blackwell) 世代をサポートする最低バージョンである CUDA 12.8.0 を指定している
## cuda:x.x.x-runtime 系イメージだと NVEncC で使わない余計なライブラリが付属して重いので、base イメージを使う
FROM nvidia/cuda:12.8.0-base-ubuntu22.04

# タイムゾーンを東京に設定
ENV TZ=Asia/Tokyo

# apt-get に対話的に設定を確認されないための設定
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /root

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates curl git gpg tzdata unzip xz-utils locales && \
    # Intel GPU リポジトリ
    curl -fsSL https://repositories.intel.com/gpu/intel-graphics.key | gpg --yes --dearmor --output /usr/share/keyrings/intel-graphics-keyring.gpg && \
    echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/intel-graphics-keyring.gpg] https://repositories.intel.com/gpu/ubuntu jammy unified' > /etc/apt/sources.list.d/intel-gpu-jammy.list && \
    # AMD / ROCm リポジトリ
    curl -fsSL https://repo.radeon.com/rocm/rocm.gpg.key | gpg --yes --dearmor --output /usr/share/keyrings/rocm-keyring.gpg && \
    echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/rocm-keyring.gpg] https://repo.radeon.com/amdgpu/6.4.4/ubuntu jammy main' > /etc/apt/sources.list.d/amdgpu.list && \
    echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/rocm-keyring.gpg] https://repo.radeon.com/amdgpu/6.4.4/ubuntu jammy proprietary' > /etc/apt/sources.list.d/amdgpu-proprietary.list && \
    echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/rocm-keyring.gpg] https://repo.radeon.com/rocm/apt/6.4.4 jammy main' > /etc/apt/sources.list.d/rocm.list && \
    # リポジトリを更新し、この時点で利用可能なパッケージをアップグレード
    apt-get update && apt-get upgrade -y && \
    # 必要なパッケージをインストール
    apt-get install -y --no-install-recommends \
    # フォント関連のライブラリ
    libfontconfig1 libfreetype6 libfribidi0 \
    # Intel GPU 関連のライブラリ
    intel-media-va-driver-non-free intel-opencl-icd libigfxcmrt7 libmfx1 libmfxgen1 libva-drm2 libva-x11-2 ocl-icd-opencl-dev \
    # NVIDIA GPU 関連のライブラリ
    cuda-nvrtc-12-8 libnpp-12-8 \
    # AMD GPU 関連のライブラリ
    amf-amdgpu-pro libamdenc-amdgpu-pro libdrm2-amdgpu ocl-icd-libopencl1 rocm-opencl-runtime vulkan-amdgpu-pro && \
    printf "en_US.UTF-8 UTF-8\n" >> /etc/locale.gen && \
    locale-gen en_US.UTF-8 && \
    /usr/sbin/locale-gen

ENV LANG="en_US.UTF-8" \
    LANGUAGE="en_US.UTF-8" \
    LC_ALL="en_US.UTF-8"

# thirdparty
RUN curl -fsSL https://nightly.link/tsukumijima/KonomiTV/actions/runs/20725734876/thirdparty-linux.tar.xz.zip | funzip | tar -xJf - -C .
