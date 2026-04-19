#!/usr/bin/env python3
"""
MongoDB backup script.
- Runs mongodump on the current MongoDB (MONGO_URL / DB_NAME from backend/.env)
- Compresses the dump to a single .tar.gz file
- Uploads to Cloudflare R2 under the prefix "backups/db/"
- Rotates: keeps the last N backups (configurable, default 14)

Usage (from the repository root):
    python3 backend/scripts/backup_db.py

Cron example (daily at 2AM):
    0 2 * * * cd /app && python3 backend/scripts/backup_db.py >> /var/log/db_backup.log 2>&1
"""
import os
import sys
import shutil
import subprocess
import tarfile
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.client import Config
from dotenv import load_dotenv

# Load backend/.env
BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY")
R2_BUCKET = os.environ.get("R2_BUCKET")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT")
KEEP_LAST = int(os.environ.get("BACKUP_KEEP_LAST", "14"))
R2_PREFIX = os.environ.get("BACKUP_R2_PREFIX", "backups/db/")


def fail(msg: str) -> None:
    print(f"[BACKUP][FAIL] {msg}", file=sys.stderr)
    sys.exit(1)


def run_backup() -> dict:
    """Run a full mongodump, compress, upload to R2, rotate. Returns summary dict."""
    for k, v in {
        "MONGO_URL": MONGO_URL, "DB_NAME": DB_NAME,
        "R2_ACCESS_KEY": R2_ACCESS_KEY, "R2_SECRET_KEY": R2_SECRET_KEY,
        "R2_BUCKET": R2_BUCKET, "R2_ENDPOINT": R2_ENDPOINT,
    }.items():
        if not v:
            raise RuntimeError(f"{k} is not set in backend/.env")

    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    with tempfile.TemporaryDirectory(prefix="dbbackup-") as tmp:
        dump_dir = Path(tmp) / "dump"
        dump_dir.mkdir()
        print(f"[BACKUP] Dumping database '{DB_NAME}' ...")
        subprocess.run(
            ["mongodump", "--uri", MONGO_URL, "--db", DB_NAME, "--out", str(dump_dir)],
            check=True, capture_output=True,
        )

        archive_name = f"{DB_NAME}-{ts}.tar.gz"
        archive_path = Path(tmp) / archive_name
        print(f"[BACKUP] Compressing -> {archive_name}")
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(dump_dir, arcname=f"{DB_NAME}-{ts}")
        size_mb = archive_path.stat().st_size / (1024 * 1024)

        s3 = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
        key = f"{R2_PREFIX}{archive_name}"
        s3.upload_file(str(archive_path), R2_BUCKET, key, ExtraArgs={"ContentType": "application/gzip"})

        resp = s3.list_objects_v2(Bucket=R2_BUCKET, Prefix=R2_PREFIX)
        objs = resp.get("Contents", []) or []
        objs.sort(key=lambda o: o["LastModified"], reverse=True)
        to_delete = objs[KEEP_LAST:]
        if to_delete:
            s3.delete_objects(
                Bucket=R2_BUCKET,
                Delete={"Objects": [{"Key": o["Key"]} for o in to_delete]},
            )

        print(f"[BACKUP][OK] {archive_name} | {size_mb:.2f} MB | kept {min(len(objs), KEEP_LAST)} backup(s)")
        return {
            "archive": archive_name,
            "size_mb": round(size_mb, 2),
            "r2_key": key,
            "kept": min(len(objs), KEEP_LAST),
            "deleted": len(to_delete),
            "timestamp": ts,
        }


def run() -> None:
    try:
        run_backup()
    except subprocess.CalledProcessError as e:
        fail(f"mongodump failed: {e.stderr.decode() if e.stderr else e}")
    except Exception as e:
        fail(str(e))


if __name__ == "__main__":
    run()
