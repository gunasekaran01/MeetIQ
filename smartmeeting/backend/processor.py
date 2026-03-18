import os
import pathlib
import shutil

from dotenv import load_dotenv
load_dotenv()

# Set FFmpeg path before any imports that might need it
FFMPEG_PATH = os.getenv("FFMPEG_PATH", "")
if FFMPEG_PATH:
    os.environ["PATH"] += os.pathsep + FFMPEG_PATH

import nltk
nltk.download("punkt",     quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

from nltk import sent_tokenize
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer

# ── Load heavy models ONCE at startup ────────────────────────────────────────
print("[processor] Loading NLP models...")
_SENTENCE_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
_KW_MODEL       = KeyBERT(model=_SENTENCE_MODEL)
print("[processor] NLP models ready.")

# Whisper cached after first use
_WHISPER_MODEL = None

def _get_whisper():
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        import whisper
        print("[processor] Loading Whisper base model...")
        _WHISPER_MODEL = whisper.load_model("base")
        print("[processor] Whisper ready.")
    return _WHISPER_MODEL


# ── NLP helpers ───────────────────────────────────────────────────────────────

def extract_tags(text: str, top_n: int = 8) -> list:
    if not text or not text.strip():
        return []
    try:
        kws = _KW_MODEL.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words="english",
            top_n=top_n,
        )
        return [k[0] for k in kws if k[1] > 0.1]
    except Exception:
        words = [w.lower() for w in text.split() if len(w) > 4]
        freq: dict = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        return [t[0] for t in sorted(freq.items(), key=lambda x: -x[1])[:6]]


def extract_action_items(text: str) -> list:
    if not text or not text.strip():
        return []
    triggers = [
        "will ", "shall ", "need to", "should ", "must ",
        "going to", "action:", "todo:", "to-do:",
        "assign", "deadline", "due by", "due on",
        "follow up", "follow-up", "next step",
    ]
    seen:  set  = set()
    items: list = []
    for s in sent_tokenize(text):
        low = s.lower()
        if any(t in low for t in triggers) and s not in seen:
            items.append(s.strip())
            seen.add(s)
    return items


def generate_summary(text: str) -> str:
    """Extractive summary in original sentence order."""
    if not text or not text.strip():
        return ""
    sents = sent_tokenize(text)
    total = len(sents)
    if total <= 4:
        return text.strip()

    keep = max(3, min(8, total // 4))
    tags = extract_tags(text, top_n=12)
    if not tags:
        return " ".join(sents[:keep])

    scored = []
    for idx, s in enumerate(sents):
        low   = s.lower()
        score = sum(low.count(t.lower()) for t in tags)
        bonus = 1.2 if idx < total * 0.2 else (1.1 if idx > total * 0.8 else 1.0)
        scored.append((score * bonus, idx, s))

    top_indices = sorted(
        [idx for _, idx, _ in sorted(scored, key=lambda x: -x[0])[:keep]]
    )
    summary = " ".join(sents[i] for i in top_indices)
    return summary.strip() or " ".join(sents[:keep])


# ── Main pipeline ─────────────────────────────────────────────────────────────

def process_audio_file(filepath: str) -> dict:
    """
    1. Extract WAV audio from video via MoviePy (if needed)
    2. Transcribe with cached Whisper base model
    3. Summarise, tag, extract action items
    Returns plain dict — no DB calls.
    """
    src        = pathlib.Path(filepath)
    audio_path = src
    wav_created = False

    # ── Step 1: extract audio ─────────────────────────────────────────────────
    video_exts = {".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv"}
    if src.suffix.lower() in video_exts:
        audio_path = src.with_suffix(".wav")
        wav_created = True
        try:
            try:
                from moviepy.editor import VideoFileClip
                clip = VideoFileClip(str(src))
                if clip.audio is None:
                    clip.close()
                    raise ValueError(
                        "The recording has no audio track. "
                        "Please ensure 'Share system audio' is enabled when recording."
                    )
                clip.audio.write_audiofile(str(audio_path), verbose=False, logger=None)
                clip.close()
            except ImportError:
                # Fallback to ffmpeg binary if moviepy isn't installed.
                import subprocess
                if not shutil.which("ffmpeg"):
                    raise RuntimeError(
                        "ffmpeg is required for audio extraction but was not found. "
                        "Install ffmpeg and ensure it's on PATH, or install moviepy."
                    )
                cmd = ["ffmpeg", "-y", "-i", str(src), "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", str(audio_path)]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception as exc:
            # Clean up partial WAV on failure
            if audio_path.exists():
                try:
                    audio_path.unlink()
                except Exception:
                    pass
            raise RuntimeError(f"Audio extraction failed: {exc}") from exc

    # ── Step 2: transcribe ────────────────────────────────────────────────────
    try:
        model  = _get_whisper()
        result = model.transcribe(str(audio_path), fp16=False)
    finally:
        # Always clean up temp WAV
        if wav_created and audio_path.exists():
            try:
                audio_path.unlink()
            except Exception:
                pass

    transcript: str  = (result.get("text") or "").strip()
    segments:   list = result.get("segments") or []

    duration_min = round(segments[-1]["end"] / 60, 2) if segments else 0.0
    word_count   = len(transcript.split()) if transcript else 0

    # ── Step 3: NLP ───────────────────────────────────────────────────────────
    return {
        "transcript":   transcript,
        "summary":      generate_summary(transcript),
        "tags":         extract_tags(transcript),
        "action_items": extract_action_items(transcript),
        "duration_min": duration_min,
        "word_count":   word_count,
    }
