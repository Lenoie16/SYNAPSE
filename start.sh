#!/bin/bash

# Set terminal title (works on most Linux/Mac terminals)
echo -ne "\033]0;SYNAPSE Launcher\007"

# Go to the folder where this sh file is located
cd "$(dirname "$0")" || exit

echo "==============================="
echo "SYNAPSE Launcher"
echo "==============================="

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed."
    echo "Install from https://nodejs.org"
    echo ""
    echo "==============================="
    echo "Process finished"
    echo "==============================="
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Node detected:"
node -v

echo ""
echo "Installing dependencies..."
npm install --no-audit --no-fund

echo ""
echo "Starting server..."
npm start server

echo ""
echo "==============================="
echo "Process finished"
echo "==============================="
read -p "Press Enter to exit..."
