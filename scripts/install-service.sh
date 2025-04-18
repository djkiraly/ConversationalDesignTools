#!/bin/bash

# Systemd Service Installation Script
# This script installs the application as a systemd service
# Usage: sudo ./install-service.sh [install_dir]

set -e  # Exit immediately if a command exits with a non-zero status

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root"
  echo "Please use: sudo $0"
  exit 1
fi

# Default installation directory
INSTALL_DIR=${1:-"/opt/conversational-ai-app"}

echo "Installing Conversational AI Workflow Builder as a systemd service..."

# Create installation directory if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
  echo "Creating installation directory: $INSTALL_DIR"
  mkdir -p $INSTALL_DIR
fi

# Create nodejs user if it doesn't exist
if ! id -u nodejs > /dev/null 2>&1; then
  echo "Creating nodejs user..."
  useradd -r -s /bin/false nodejs
fi

# Copy service file to systemd directory
echo "Installing systemd service file..."
cp conversational-ai-app.service /etc/systemd/system/

# Set proper permissions
echo "Setting permissions..."
chown -R nodejs:nodejs $INSTALL_DIR
chmod 755 $INSTALL_DIR

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

echo ""
echo "Installation completed!"
echo ""
echo "To start the service:"
echo "  sudo systemctl start conversational-ai-app"
echo ""
echo "To enable service on boot:"
echo "  sudo systemctl enable conversational-ai-app"
echo ""
echo "To check service status:"
echo "  sudo systemctl status conversational-ai-app"
echo ""
echo "To view logs:"
echo "  sudo journalctl -u conversational-ai-app"
echo ""