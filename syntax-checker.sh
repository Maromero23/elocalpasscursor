#!/bin/bash

echo "Checking for common JSX syntax issues..."

# Check for unmatched curly braces in JSX
echo "1. Looking for unmatched { } patterns..."
grep -n '\${[^}]*$' app/admin/qr-config/page.tsx || echo "No unmatched template literals"

# Check for unmatched parentheses in map functions
echo "2. Looking for map functions with parentheses issues..."
grep -n '\.map.*(' app/admin/qr-config/page.tsx

# Check for unmatched JSX tags
echo "3. Looking for JSX tag patterns..."
grep -n '<[a-zA-Z]' app/admin/qr-config/page.tsx | head -20

echo "4. Looking for template literal issues..."
grep -n '`[^`]*\${' app/admin/qr-config/page.tsx | head -10
