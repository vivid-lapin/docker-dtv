# syntax=docker/dockerfile:1

FROM ghcr.io/vivid-lapin/docker-dtv-tsreplace:8cd17f1

COPY tsreplacer.ts tsreplacer.ts

RUN curl -fsSL https://deno.land/install.sh | sh && \
    ~/.deno/bin/deno compile --allow-env --allow-read --allow-write --allow-run tsreplacer.ts

CMD ["./tsreplacer"]
