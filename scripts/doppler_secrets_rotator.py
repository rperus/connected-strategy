#!/usr/bin/env python3
"""
doppler_secrets_rotator.py — Surgical Secret Rotation Automation.
"""
import os
import sys
import json
import subprocess
from pathlib import Path

DOPPLER_CONFIGS = ["dev", "stg", "prd"]
PROJECT = "connected-strategy"

def run_command(cmd, cwd=None, capture=True):
    if capture:
        res = subprocess.run(cmd, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8")
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    else:
        res = subprocess.run(cmd, shell=True, cwd=cwd)
        return res.returncode, "", ""

def test_doppler_cli():
    code, stdout, stderr = run_command("doppler --version")
    if code != 0:
        print("[ERROR] Doppler CLI is not installed or not in PATH.")
        return False
    code, stdout, stderr = run_command("doppler configs --json")
    if code != 0 or PROJECT not in stdout:
        print(f"[ERROR] Doppler CLI is not authenticated or not linked to project '{PROJECT}'.")
        return False
    return True

def main():
    print("==================================================")
    print("            DOPPLER SECRETS ROTATOR               ")
    print("==================================================")
    
    if not test_doppler_cli():
        sys.exit(1)
        
    input_file = Path("rotated_secrets.json")
    if input_file.exists():
        try:
            with open(input_file, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to parse {input_file}: {e}")
            sys.exit(1)
    else:
        print(f"[INFO] Template '{input_file}' not found.")
        data = {}

    secrets_to_set = {}
    
    # Variables de entorno específicas del proyecto Connected Strategy
    if data.get("GEMINI_API_KEY"): 
        secrets_to_set["GEMINI_API_KEY"] = data["GEMINI_API_KEY"]
        
    if not secrets_to_set:
        print("[WARNING] No rotated secrets found in JSON. Ensure 'GEMINI_API_KEY' is present in rotated_secrets.json")
        sys.exit(0)

    for config in DOPPLER_CONFIGS:
        cmd_args = []
        for k, v in secrets_to_set.items():
            escaped_v = v.replace('"', '\\"')
            cmd_args.append(f'{k}="{escaped_v}"')
        
        set_cmd = f"doppler secrets set {' '.join(cmd_args)} --config {config} --project {PROJECT}"
        code, stdout, stderr = run_command(set_cmd)
        if code == 0:
            print(f"[OK] Config '{config}' updated successfully in Doppler.")
        else:
            print(f"[ERROR] Failed to update config '{config}'. Error: {stderr}")

if __name__ == "__main__":
    main()
