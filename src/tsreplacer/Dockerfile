# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-tsreplace:8cd17f1

RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    sudo apt-get update && \
    sudo apt-get install -y --no-install-recommends tini

COPY tsreplacer.ts tsreplacer.ts

RUN curl -fsSL https://deno.land/install.sh | sh && \
    ~/.deno/bin/deno compile --allow-env --allow-read --allow-write --allow-run tsreplacer.ts

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["./tsreplacer"]
