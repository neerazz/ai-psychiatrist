#!/bin/bash
# Generate self-signed certificates for development

CERT_DIR="memory_directory/config/certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -newkey rsa:4096 \
  -keyout "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.crt" \
  -days 365 \
  -nodes \
  -subj "/CN=localhost"

echo "Certificates generated in $CERT_DIR"
