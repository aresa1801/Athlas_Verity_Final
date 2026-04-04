#!/usr/bin/env python3
import sys

file_path = "/vercel/share/v0-project/app/results/page.tsx"

# Read all lines
with open(file_path, 'r') as f:
    lines = f.readlines()

# Keep only first 1076 lines
clean_lines = lines[:1076]

# Write back
with open(file_path, 'w') as f:
    f.writelines(clean_lines)

print(f"[v0] File truncated: Kept 1076 lines, removed {len(lines) - 1076} lines of garbage")
