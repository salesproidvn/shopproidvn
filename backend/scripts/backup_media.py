#!/usr/bin/env python3
"""Media backup script for Cloudflare R2.

Copies all objects under the uploads prefix (e.g. 'the-wi-shop/products/') to a
snapshot prefix 'backups/media-YYYYMMDD/'. Also saves a JSON manifest next to
the snapshot with all key names, sizes and content types for audit.

Usage:
    python3 backend/scripts/backup_media.py               # full backup
    python3 backend/scripts/backup_media.py --manifest     # manifest only (no copy)
"""
import os
import sys
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import boto3
from botocore.client import Config
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY")
R2_BUCKET = os.environ.get("R2_BUCKET")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT")
APP_NAME = os.environ.get("APP_NAME", "the-wi-shop")
UPLOAD_PREFIX = f"{APP_NAME}/products/"
BACKUP_PREFIX = "backups/media/"
KEEP_LAST_MEDIA = int(os.environ.get("MEDIA_BACKUP_KEEP_LAST", "4"))


def s3_client():
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def list_all_objects(s3, bucket: str, prefix: str):
    token = None
    while True:
        kwargs = {"Bucket": bucket, "Prefix": prefix}
        if token:
            kwargs["ContinuationToken"] = token
        resp = s3.list_objects_v2(**kwargs)
        for o in resp.get("Contents", []) or []:
            yield o
        if not resp.get("IsTruncated"):
            break
        token = resp.get("NextContinuationToken")


def run_media_backup(manifest_only: bool = False) -> dict:
    """Snapshot all media under UPLOAD_PREFIX to backups/media-YYYYMMDD/ + manifest."""
    s3 = s3_client()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    snapshot_prefix = f"{BACKUP_PREFIX}{ts}/"
    items = list(list_all_objects(s3, R2_BUCKET, UPLOAD_PREFIX))
    total_size = sum(o["Size"] for o in items)
    copied = 0
    failed = 0
    if not manifest_only:
        def _copy(o):
            src_key = o["Key"]
            rel = src_key[len(UPLOAD_PREFIX):]
            dst_key = f"{snapshot_prefix}{rel}"
            try:
                s3.copy_object(
                    Bucket=R2_BUCKET,
                    Key=dst_key,
                    CopySource={"Bucket": R2_BUCKET, "Key": src_key},
                )
                return True
            except Exception as e:
                print(f"[MEDIA-BACKUP] copy fail {src_key}: {e}", file=sys.stderr)
                return False
        with ThreadPoolExecutor(max_workers=20) as ex:
            results = list(ex.map(_copy, items))
        copied = sum(1 for r in results if r)
        failed = sum(1 for r in results if not r)

    # Save manifest to snapshot dir
    manifest = {
        "timestamp": ts,
        "upload_prefix": UPLOAD_PREFIX,
        "snapshot_prefix": snapshot_prefix if not manifest_only else None,
        "manifest_only": manifest_only,
        "file_count": len(items),
        "total_size_bytes": total_size,
        "files": [{"key": o["Key"], "size": o["Size"], "last_modified": o["LastModified"].isoformat()} for o in items],
    }
    manifest_key = f"{BACKUP_PREFIX}manifest-{ts}.json"
    s3.put_object(
        Bucket=R2_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )

    # Rotate: delete old media snapshots beyond KEEP_LAST_MEDIA.
    # Identify snapshot roots by listing "backups/media/YYYYMMDD-HHMMSS/" folders via a common list
    # We use the manifest-*.json files to decide the ordering.
    manifests = list(list_all_objects(s3, R2_BUCKET, BACKUP_PREFIX + "manifest-"))
    manifests.sort(key=lambda o: o["LastModified"], reverse=True)
    old_manifests = manifests[KEEP_LAST_MEDIA:]
    deleted_snaps = 0
    for m in old_manifests:
        # Parse ts from key: "backups/media/manifest-YYYYMMDD-HHMMSS.json"
        try:
            ts_of_old = Path(m["Key"]).stem.replace("manifest-", "")
            old_snapshot_prefix = f"{BACKUP_PREFIX}{ts_of_old}/"
            # Delete snapshot dir
            keys_to_delete = [{"Key": o["Key"]} for o in list_all_objects(s3, R2_BUCKET, old_snapshot_prefix)]
            if keys_to_delete:
                # Batch delete (max 1000 per call)
                for i in range(0, len(keys_to_delete), 1000):
                    s3.delete_objects(Bucket=R2_BUCKET, Delete={"Objects": keys_to_delete[i:i+1000]})
            # Delete the manifest itself
            s3.delete_object(Bucket=R2_BUCKET, Key=m["Key"])
            deleted_snaps += 1
        except Exception as e:
            print(f"[MEDIA-BACKUP] rotation err: {e}", file=sys.stderr)

    result = {
        "timestamp": ts,
        "snapshot_prefix": snapshot_prefix if not manifest_only else None,
        "manifest_key": manifest_key,
        "file_count": len(items),
        "total_size_mb": round(total_size / 1024 / 1024, 2),
        "copied": copied,
        "failed": failed,
        "manifest_only": manifest_only,
        "rotated": deleted_snaps,
    }
    print(f"[MEDIA-BACKUP][OK] {result}")
    return result


def run_media_restore(snapshot_ts: str) -> dict:
    """Restore media files from a snapshot back to UPLOAD_PREFIX.
    Copies objects from backups/media/{snapshot_ts}/ back to {APP_NAME}/products/.
    DOES NOT delete extra files that exist in uploads/ but not in snapshot (additive restore).
    """
    s3 = s3_client()
    snapshot_prefix = f"{BACKUP_PREFIX}{snapshot_ts}/"
    items = list(list_all_objects(s3, R2_BUCKET, snapshot_prefix))
    if not items:
        raise RuntimeError(f"Snapshot empty or not found: {snapshot_prefix}")
    restored = 0
    failed = 0
    def _copy(o):
        src_key = o["Key"]
        rel = src_key[len(snapshot_prefix):]
        dst_key = f"{UPLOAD_PREFIX}{rel}"
        try:
            s3.copy_object(
                Bucket=R2_BUCKET,
                Key=dst_key,
                CopySource={"Bucket": R2_BUCKET, "Key": src_key},
            )
            return True
        except Exception as e:
            print(f"[MEDIA-RESTORE] copy fail {src_key}: {e}", file=sys.stderr)
            return False
    with ThreadPoolExecutor(max_workers=20) as ex:
        results = list(ex.map(_copy, items))
    restored = sum(1 for r in results if r)
    failed = sum(1 for r in results if not r)
    return {"snapshot_ts": snapshot_ts, "restored": restored, "failed": failed}


def list_media_backups() -> list:
    """List all media snapshots by their manifests."""
    s3 = s3_client()
    manifests = list(list_all_objects(s3, R2_BUCKET, BACKUP_PREFIX + "manifest-"))
    manifests.sort(key=lambda o: o["LastModified"], reverse=True)
    out = []
    for m in manifests:
        ts = Path(m["Key"]).stem.replace("manifest-", "")
        try:
            body = s3.get_object(Bucket=R2_BUCKET, Key=m["Key"])["Body"].read()
            data = json.loads(body)
            out.append({
                "timestamp": ts,
                "created_at": m["LastModified"].isoformat(),
                "file_count": data.get("file_count", 0),
                "total_size_mb": round(data.get("total_size_bytes", 0) / 1024 / 1024, 2),
                "manifest_only": data.get("manifest_only", False),
                "manifest_key": m["Key"],
                "snapshot_prefix": data.get("snapshot_prefix"),
            })
        except Exception:
            pass
    return out


if __name__ == "__main__":
    manifest_only = "--manifest" in sys.argv
    run_media_backup(manifest_only=manifest_only)
