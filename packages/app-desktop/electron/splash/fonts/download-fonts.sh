#!/bin/bash
# Baixar fontes Inter e Lora para uso offline no splash screen
# Execute este script uma vez para incluir as fontes no bundle

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Baixando Inter Regular (woff2)..."
curl -sL -o "$SCRIPT_DIR/Inter-Regular.woff2" \
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2"

echo "Baixando Lora SemiBold (woff2)..."
curl -sL -o "$SCRIPT_DIR/Lora-SemiBold.woff2" \
  "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.woff2"

echo "Fontes baixadas em: $SCRIPT_DIR"
ls -la "$SCRIPT_DIR"/*.woff2
