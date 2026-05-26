import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import LOG_LEVEL
from app.routers.domain import router as domain_router
from app.routers.paper_files import router as paper_files_router

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="Domain generation (standalone bundle)",
    version="1.0.0",
    description="POST /api/v1/remake/domain + paper file endpoints for generated images",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(domain_router)
app.include_router(paper_files_router)


@app.get("/health")
async def health():
    return {"status": "healthy"}
