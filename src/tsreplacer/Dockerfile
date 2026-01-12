# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-tsreplace:0c05cfa

COPY tsreplacer.ts tsreplacer.ts

RUN curl -fsSL https://deno.land/install.sh | sh && \
    ./.deno/bin/deno compile --allow-env --allow-read --allow-write --allow-run tsreplacer.ts && \
    rm -rf ./.deno

CMD ["./tsreplacer"]
