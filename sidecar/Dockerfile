FROM rust:1.98.1-bullseye AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock* ./
COPY src ./src

RUN cargo test --locked --release && cargo build --locked --release

FROM debian:trixie-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/world-id-simulator-sidecar /usr/local/bin/sidecar

ENV CONFIG_PATH=/config.json
ENV PORT=3001
EXPOSE 3001

ENTRYPOINT ["sidecar"]
