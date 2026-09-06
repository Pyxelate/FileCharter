FROM rust:1.97.1 AS builder
WORKDIR /backend
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /backend-app

# Create the runtime user in the FINAL image (debian syntax), then run as it.
RUN useradd --system --user-group --no-create-home appuser

COPY --from=builder --chown=appuser:appuser /backend/target/release/backend /backend-app/backend
USER appuser
EXPOSE 3000
CMD ["./backend"]
