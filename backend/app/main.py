from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import puzzles, wikipedia

app = FastAPI(title="Catfishify")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(puzzles.router, prefix="/api")
app.include_router(wikipedia.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
