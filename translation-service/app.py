import os
import re
from contextlib import asynccontextmanager
from typing import List, Optional

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_NAME = os.environ.get("NLLB_MODEL_NAME", "facebook/nllb-200-distilled-600M")
MAX_TEXTS_PER_REQUEST = 25
MAX_CHARS_PER_TEXT = 5000
MAX_TOTAL_CHARS = 15000

SOURCE_LANG_MAP = {
    "en": "eng_Latn",
    "eng": "eng_Latn",
    "eng_latn": "eng_Latn",
    "tl": "tgl_Latn",
    "fil": "tgl_Latn",
    "tgl": "tgl_Latn",
    "tgl_latn": "tgl_Latn",
}

TAGALOG_MARKERS = {
    "ang", "ng", "mga", "sa", "na", "ay", "at", "o", "kung", "para",
    "ito", "iyan", "iyon", "bawat", "tanong", "sagot", "piliin", "basahin",
    "basahing", "mabuti", "tamang", "mali", "tama", "hindi", "oo", "wala",
    "may", "mayroon", "dahil", "upang", "nang", "paano", "bakit", "ano",
    "sino", "saan", "kailan", "alin", "ilan", "isulat", "ibigay", "tukuyin",
    "sumusunod", "alinman", "gawin", "aralin", "modyul", "pagsusulit",
    "pagkatapos", "bago", "iyong", "inyong", "natin", "nila", "niya", "siya",
    "ako", "ikaw", "kayo", "tayo", "sila", "mga", "dapat", "huwag", "gamitin",
}

ENGLISH_MARKERS = {
    "the", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "will", "would", "shall", "should", "can",
    "could", "may", "might", "must", "and", "or", "but", "if", "then",
    "which", "what", "who", "whom", "whose", "where", "when", "why", "how",
    "this", "that", "these", "those", "each", "every", "choose", "select",
    "read", "question", "answer", "correct", "incorrect", "following",
    "carefully", "true", "false", "write", "your", "you", "with", "from",
    "for", "about", "into", "after", "before", "between", "under", "above",
}

state = {
    "tokenizer": None,
    "model": None,
    "ready": False,
}


def detect_source_language(text: str) -> str:
    """
    Lightweight lexical classifier for English (eng_Latn) vs Filipino/Tagalog (tgl_Latn).
    """
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    if not tokens:
        return "eng_Latn"

    tl_score = sum(1 for tok in tokens if tok in TAGALOG_MARKERS)
    en_score = sum(1 for tok in tokens if tok in ENGLISH_MARKERS)

    if tl_score > en_score:
        return "tgl_Latn"
    return "eng_Latn"


def normalize_source_language(lang: Optional[str], text: str) -> str:
    if not lang or lang.strip().lower() == "auto":
        return detect_source_language(text)
    mapped = SOURCE_LANG_MAP.get(lang.strip().lower())
    if not mapped:
        raise HTTPException(
            status_code=400,
            detail="Unsupported source language. Supported: eng_Latn (en), tgl_Latn (tl), or auto.",
        )
    return mapped


@asynccontextmanager
async def lifespan(_app: FastAPI):
    print(f"[NLLB Service] Loading model '{MODEL_NAME}' on CPU...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model.to(torch.device("cpu"))
    model.eval()
    state["tokenizer"] = tokenizer
    state["model"] = model
    state["ready"] = True
    print(f"[NLLB Service] Model '{MODEL_NAME}' loaded and ready.")
    yield
    state["tokenizer"] = None
    state["model"] = None
    state["ready"] = False


app = FastAPI(title="ALS LMS Local NLLB-200 Translation Service", lifespan=lifespan)


class TranslateRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=MAX_TEXTS_PER_REQUEST)
    source_language: Optional[str] = "auto"
    target_language: str = "ceb_Latn"


@app.get("/health")
def health():
    return {
        "status": "ok" if state["ready"] else "loading",
        "model": MODEL_NAME,
        "ready": state["ready"],
    }


@app.post("/translate")
def translate(req: TranslateRequest):
    if not state["ready"] or state["tokenizer"] is None or state["model"] is None:
        raise HTTPException(status_code=503, detail="Translation model is still loading.")

    target = (req.target_language or "ceb_Latn").strip()
    if target not in ("ceb_Latn", "ceb"):
        raise HTTPException(status_code=400, detail="Only Cebuano (ceb_Latn) target is supported.")

    total_chars = 0
    cleaned_texts = []
    for raw in req.texts:
        t = str(raw or "").strip()
        if len(t) > MAX_CHARS_PER_TEXT:
            raise HTTPException(
                status_code=400,
                detail=f"Text exceeds maximum length of {MAX_CHARS_PER_TEXT} characters.",
            )
        total_chars += len(t)
        cleaned_texts.append(t)

    if total_chars > MAX_TOTAL_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Total payload exceeds maximum of {MAX_TOTAL_CHARS} characters.",
        )

    tokenizer = state["tokenizer"]
    model = state["model"]
    target_token_id = tokenizer.convert_tokens_to_ids("ceb_Latn")

    results = [None] * len(cleaned_texts)
    groups = {}

    for idx, text in enumerate(cleaned_texts):
        if not text:
            results[idx] = {
                "originalText": "",
                "translatedText": "",
                "detectedSourceLanguage": None,
                "alreadyTargetLanguage": False,
            }
            continue
        src_lang = normalize_source_language(req.source_language, text)
        groups.setdefault(src_lang, []).append((idx, text))

    for src_lang, items in groups.items():
        indices = [it[0] for it in items]
        batch_texts = [it[1] for it in items]
        tokenizer.src_lang = src_lang
        inputs = tokenizer(
            batch_texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        )
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=target_token_id,
                max_new_tokens=256,
            )
        decoded = tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)
        for idx, orig_text, trans_text in zip(indices, batch_texts, decoded):
            results[idx] = {
                "originalText": orig_text,
                "translatedText": trans_text.strip(),
                "detectedSourceLanguage": src_lang,
                "alreadyTargetLanguage": False,
            }

    return {"translations": results}
