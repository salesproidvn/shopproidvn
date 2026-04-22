"""
One-time migration: rewrite stored /api/files/<id> image URLs to R2 public URLs.

Scans products, categories, shops, and blog posts. For every string field or
array element that matches /api/files/<uuid>, looks up the file in the `files`
collection by id, and rewrites it to {R2_PUBLIC_URL}/{storage_path}.

Usage (from backend/):
    python migrate_image_urls.py            # dry-run, reports counts only
    python migrate_image_urls.py --apply    # actually write updates

Requires MONGO_URL, DB_NAME, R2_PUBLIC_URL in the environment (same vars the
backend uses). Safe to re-run: rows that already hold absolute URLs are skipped.
"""
import os
import re
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")

if not R2_PUBLIC_URL:
    sys.exit("R2_PUBLIC_URL is not set — aborting. Configure it before running.")

API_FILES_RE = re.compile(r"^/api/files/([0-9a-fA-F-]{36})(?:\?.*)?$")

STRING_FIELDS = {
    "products": ["image_url"],
    "categories": ["image_url"],
    "shops": ["logo_url", "banner_url", "avatar_url"],
    "blog_posts": ["thumbnail"],
    "business_cards": ["logo_url", "avatar_url"],
}
ARRAY_FIELDS = {
    "products": ["images"],
    "shops": ["banners"],
    "blog_posts": ["images"],
}


async def resolve(db, url: str, cache: dict) -> str | None:
    """Return absolute R2 URL for /api/files/<id>, or None if unresolvable."""
    if not isinstance(url, str):
        return None
    m = API_FILES_RE.match(url)
    if not m:
        return None
    file_id = m.group(1)
    if file_id in cache:
        return cache[file_id]
    doc = await db.files.find_one({"id": file_id}, {"storage_path": 1})
    storage_path = (doc or {}).get("storage_path")
    new_url = f"{R2_PUBLIC_URL}/{storage_path.lstrip('/')}" if storage_path else None
    cache[file_id] = new_url
    return new_url


async def migrate_collection(db, coll_name, apply: bool, cache):
    coll = db[coll_name]
    str_fields = STRING_FIELDS.get(coll_name, [])
    arr_fields = ARRAY_FIELDS.get(coll_name, [])
    or_clauses = []
    for f in str_fields:
        or_clauses.append({f: {"$regex": r"^/api/files/"}})
    for f in arr_fields:
        or_clauses.append({f: {"$elemMatch": {"$regex": r"^/api/files/"}}})
    if not or_clauses:
        return 0, 0

    query = {"$or": or_clauses}
    scanned = 0
    updated = 0
    async for doc in coll.find(query):
        scanned += 1
        update_set = {}
        for f in str_fields:
            new = await resolve(db, doc.get(f), cache)
            if new:
                update_set[f] = new
        for f in arr_fields:
            arr = doc.get(f) or []
            if not isinstance(arr, list):
                continue
            new_arr = []
            changed = False
            for item in arr:
                resolved = await resolve(db, item, cache)
                if resolved:
                    new_arr.append(resolved)
                    changed = True
                else:
                    new_arr.append(item)
            if changed:
                update_set[f] = new_arr

        if update_set:
            updated += 1
            if apply:
                await coll.update_one({"_id": doc["_id"]}, {"$set": update_set})
            else:
                print(f"  [{coll_name}:{doc.get('_id')}] would set {list(update_set.keys())}")
    return scanned, updated


async def main():
    apply = "--apply" in sys.argv
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    cache: dict = {}
    print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
    print(f"R2_PUBLIC_URL = {R2_PUBLIC_URL}")
    print()
    total_updated = 0
    for coll_name in set(list(STRING_FIELDS.keys()) + list(ARRAY_FIELDS.keys())):
        try:
            scanned, updated = await migrate_collection(db, coll_name, apply, cache)
        except Exception as e:
            print(f"[{coll_name}] error: {e}")
            continue
        print(f"[{coll_name}] scanned={scanned} to_update={updated}")
        total_updated += updated
    print()
    print(f"Total docs {'updated' if apply else 'that would be updated'}: {total_updated}")
    if not apply:
        print("Re-run with --apply to write changes.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
