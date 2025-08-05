#!/bin/bash

# SSL Certificate Setup Script
# This script helps generate or use existing SSL certificates for HTTPS
# Options:
#   1. Generate self-signed certificate (for testing only)
#   2. Use Let's Encrypt certificates (recommended for production)
#
# Usage: ./setup-ssl.sh [--self-signed | --lets-encrypt] [domain]

set -e  # Exit immediately if a command exits with a non-zero status

SSL_DIR="../nginx/ssl"
DOMAIN=${2:-example.com}

function generate_self_signed {
    echo "Generating self-signed SSL certificate for $DOMAIN..."
    
    # Create SSL directory if it doesn't exist
    mkdir -p $SSL_DIR
    
    # Generate private key
    openssl genrsa -out $SSL_DIR/privkey.pem 2048
    
    # Generate CSR (Certificate Signing Request)
    openssl req -new -key $SSL_DIR/privkey.pem -out $SSL_DIR/csr.pem -subj "/CN=$DOMAIN"
    
    # Generate self-signed certificate valid for 365 days
    openssl x509 -req -days 365 -in $SSL_DIR/csr.pem -signkey $SSL_DIR/privkey.pem -out $SSL_DIR/fullchain.pem
    
    # Remove CSR as it's no longer needed
    rm $SSL_DIR/csr.pem
    
    echo "Self-signed certificate generated successfully!"
    echo "WARNING: Self-signed certificates should only be used for testing environments."
    echo "         For production, use Let's Encrypt or a trusted CA."
}

function setup_lets_encrypt {
    echo "Setting up Let's Encrypt SSL certificate for $DOMAIN..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "Certbot not found. Installing certbot..."
        apt-get update
        apt-get install -y certbot
    fi
    
    # Create SSL directory if it doesn't exist
    mkdir -p $SSL_DIR
    
    # Obtain SSL certificate using certbot
    certbot certonly --standalone -d $DOMAIN --agree-tos --email admin@$DOMAIN --non-interactive
    
    # Copy certificates to nginx ssl directory
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/
    
    echo "Let's Encrypt certificate setup successfully!"
    echo "Certificate will auto-renew using certbot's timer service"
    
    # Set up renewal cron job
    echo "Setting up auto-renewal cron job..."
    echo "0 3 * * * certbot renew --quiet && systemctl reload nginx" > /etc/cron.d/certbot-renew
    chmod 644 /etc/cron.d/certbot-renew
}

case "$1" in
    --self-signed)
        generate_self_signed
        ;;
    --lets-encrypt)
        setup_lets_encrypt
        ;;
    *)
        echo "Usage: $0 [--self-signed | --lets-encrypt] [domain]"
        echo "Example: $0 --lets-encrypt example.com"
        exit 1
        ;;
esac

# Update nginx configuration to use SSL
sed -i 's/#\s*listen 443 ssl http2;/listen 443 ssl http2;/' ../nginx/default.conf
sed -i 's/#\s*listen \[::\]:443 ssl http2;/listen [::]:443 ssl http2;/' ../nginx/default.conf
sed -i 's/#\s*server_name _;/server_name '"$DOMAIN"';/' ../nginx/default.conf
sed -i 's/#\s*ssl_certificate/ssl_certificate/' ../nginx/default.conf
sed -i 's/#\s*ssl_certificate_key/ssl_certificate_key/' ../nginx/default.conf
sed -i 's/#\s*ssl_protocols/ssl_protocols/' ../nginx/default.conf
sed -i 's/#\s*ssl_prefer_server_ciphers/ssl_prefer_server_ciphers/' ../nginx/default.conf
sed -i 's/#\s*ssl_ciphers/ssl_ciphers/' ../nginx/default.conf
sed -i 's/#\s*ssl_session_cache/ssl_session_cache/' ../nginx/default.conf
sed -i 's/#\s*ssl_session_timeout/ssl_session_timeout/' ../nginx/default.conf
sed -i 's/#\s*ssl_session_tickets/ssl_session_tickets/' ../nginx/default.conf

# Reload nginx to apply changes if it's running
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
    echo "Nginx reloaded successfully."
else
    echo "Nginx is not running. Please start it to apply SSL configuration."
fi

echo "SSL setup completed successfully!"