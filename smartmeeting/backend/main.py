import os
import uuid
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Tuple

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client

from processor import process_audio_file

load_dotenv()

SUPABASE_URL: str      = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
ADMIN_EMAIL: str       = os.getenv("ADMIN_EMAIL", "gunavera2020@gmail.com")
FFMPEG_PATH: str       = os.getenv("FFMPEG_PATH", "")

if FFMPEG_PATH:
    os.environ["PATH"] += os.pathsep + FFMPEG_PATH

# Base anon client — used only for supabase.auth.get_user() token verification
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# CORS — set ALLOWED_ORIGINS env var to comma-separated list in production
# e.g. "https://meetiq.vercel.app,https://www.meetiq.com"
# Leave as "*" for open access (fine during dev/testing)
ALLOWED_ORIGINS: list = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if o.strip()
]

app = FastAPI(title="MeetIQ API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_BUFFER_DIR = Path(tempfile.gettempdir()) / "meetiq_sessions"
SESSION_BUFFER_DIR.mkdir(parents=True, exist_ok=True)


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_token(authorization: str) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    return authorization.split(" ", 1)[1]


def get_authed_client(authorization: str) -> Tuple[Client, str]:
    token = extract_token(authorization)
    c = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    c.postgrest.auth(token)
    return c, token


def get_current_user(authorization: str):
    token = extract_token(authorization)
    try:
        res = supabase.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return res.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_admin(authorization: str):
    user = get_current_user(authorization)
    if user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


def _safe_delete(path: Path):
    try:
        if path and path.exists():
            path.unlink()
    except Exception:
        pass


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/signup")
async def signup(data: dict):
    email     = data.get("email", "").strip()
    password  = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    try:
        res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {"data": {"full_name": full_name}},
        })
        return {
            "message": "Signup successful! Check your email to confirm.",
            "user_id": str(res.user.id) if res.user else None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login")
async def login(data: dict):
    email    = data.get("email", "").strip()
    password = data.get("password", "")
    try:
        res     = supabase.auth.sign_in_with_password({"email": email, "password": password})
        user    = res.user
        session = res.session
        role    = "admin" if user.email == ADMIN_EMAIL else "user"
        return {
            "access_token":  session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id":        str(user.id),
                "email":     user.email,
                "full_name": user.user_metadata.get("full_name", ""),
                "role":      role,
            },
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@app.post("/auth/logout")
async def logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass
    return {"message": "Logged out"}


# ── Meetings ──────────────────────────────────────────────────────────────────

@app.post("/meetings/upload")
async def upload_meeting(
    file:          UploadFile = File(...),
    title:         str        = Form("Untitled Meeting"),
    authorization: str        = Header(None),
):
    user       = get_current_user(authorization)
    user_id    = str(user.id)
    user_email = user.email
    client, _  = get_authed_client(authorization)

    meeting_id = str(uuid.uuid4())
    safe_name  = (file.filename or "meeting.webm").replace(" ", "_")
    temp_path  = SESSION_BUFFER_DIR / f"{meeting_id}_{safe_name}"

    file_bytes = await file.read()
    with open(temp_path, "wb") as fh:
        fh.write(file_bytes)

    try:
        result       = process_audio_file(str(temp_path))
        transcript   = result.get("transcript", "") or ""
        summary      = result.get("summary", "")    or ""
        action_items = result.get("action_items", []) or []
        tags         = result.get("tags", [])         or []
        duration_min = float(result.get("duration_min", 0) or 0)
        word_count   = int(result.get("word_count", 0)     or 0)

        storage_path = f"{user_id}/{meeting_id}/{safe_name}"
        content_type = file.content_type or "video/webm"
        try:
            supabase.storage.from_("meetings").upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": content_type},
            )
        except Exception as se:
            print(f"[storage] upload warning: {se}")
            storage_path = ""

        public_url = ""
        if storage_path:
            try:
                public_url = supabase.storage.from_("meetings").get_public_url(storage_path)
            except Exception:
                pass

        row = {
            "id":           meeting_id,
            "user_id":      user_id,
            "user_email":   user_email,
            "title":        title.strip() or "Untitled Meeting",
            "filename":     safe_name,
            "storage_path": storage_path,
            "public_url":   public_url,
            "transcript":   transcript,
            "summary":      summary,
            "action_items": action_items,
            "tags":         tags,
            "duration_min": duration_min,
            "word_count":   word_count,
            "created_at":   datetime.utcnow().isoformat(),
        }
        ins = client.table("meetings").insert(row).execute()
        if not ins.data:
            raise RuntimeError(
                "DB insert returned no data — "
                "run supabase_schema.sql in the Supabase SQL Editor."
            )

        return {
            "meeting_id":   meeting_id,
            "message":      "Processed successfully",
            "transcript":   transcript,
            "summary":      summary,
            "action_items": action_items,
            "tags":         tags,
            "duration_min": duration_min,
            "word_count":   word_count,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        _safe_delete(temp_path)


@app.get("/meetings")
async def get_my_meetings(authorization: str = Header(None)):
    user      = get_current_user(authorization)
    client, _ = get_authed_client(authorization)
    res = (
        client.table("meetings")
        .select("id,user_id,title,summary,tags,action_items,transcript,duration_min,word_count,created_at,public_url")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return {"meetings": res.data or []}


@app.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str, authorization: str = Header(None)):
    user      = get_current_user(authorization)
    client, _ = get_authed_client(authorization)
    q = client.table("meetings").select("*").eq("id", meeting_id)
    if user.email != ADMIN_EMAIL:
        q = q.eq("user_id", str(user.id))
    res = q.execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return res.data[0]


@app.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str, authorization: str = Header(None)):
    user      = get_current_user(authorization)
    client, _ = get_authed_client(authorization)
    res = (
        client.table("meetings")
        .select("storage_path")
        .eq("id", meeting_id)
        .eq("user_id", str(user.id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Meeting not found")
    sp = res.data[0].get("storage_path")
    if sp:
        try:
            supabase.storage.from_("meetings").remove([sp])
        except Exception:
            pass
    client.table("meetings").delete().eq("id", meeting_id).execute()
    return {"message": "Deleted"}


# ── Admin ─────────────────────────────────────────────────────────────────────

@app.get("/admin/stats")
async def admin_stats(authorization: str = Header(None)):
    require_admin(authorization)
    client, _ = get_authed_client(authorization)
    res = client.table("meetings").select(
        "user_id,duration_min,word_count,user_email"
    ).execute()
    meetings = res.data or []
    unique_users = {m["user_id"] for m in meetings}
    return {
        "total_users":             len(unique_users),
        "total_meetings":          len(meetings),
        "total_minutes_processed": round(sum(float(m.get("duration_min") or 0) for m in meetings), 1),
        "total_words_transcribed": sum(int(m.get("word_count") or 0) for m in meetings),
    }


@app.get("/admin/meetings")
async def admin_all_meetings(authorization: str = Header(None)):
    require_admin(authorization)
    client, _ = get_authed_client(authorization)
    res = client.table("meetings").select("*").order("created_at", desc=True).execute()
    return {"meetings": res.data or []}


@app.get("/admin/users")
async def admin_users(authorization: str = Header(None)):
    require_admin(authorization)
    client, _ = get_authed_client(authorization)
    res = client.table("meetings").select(
        "user_id,user_email,created_at,duration_min,word_count"
    ).execute()
    meetings = res.data or []
    users: dict = {}
    for m in meetings:
        uid = m["user_id"]
        if uid not in users:
            users[uid] = {
                "id":             uid,
                "email":          m.get("user_email", ""),
                "total_meetings": 0,
                "total_minutes":  0.0,
                "total_words":    0,
                "last_activity":  m.get("created_at", ""),
            }
        users[uid]["total_meetings"] += 1
        users[uid]["total_minutes"]  += float(m.get("duration_min") or 0)
        users[uid]["total_words"]    += int(m.get("word_count") or 0)
        if (m.get("created_at") or "") > users[uid]["last_activity"]:
            users[uid]["last_activity"] = m["created_at"]
    return {"users": list(users.values())}


@app.get("/admin/users/{user_id}/meetings")
async def admin_user_meetings(user_id: str, authorization: str = Header(None)):
    require_admin(authorization)
    client, _ = get_authed_client(authorization)
    res = (
        client.table("meetings")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"meetings": res.data or []}


@app.get("/")
def root():
    return {"message": "MeetIQ API is running"}
