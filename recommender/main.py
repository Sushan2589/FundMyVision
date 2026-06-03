from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scorer import get_recommendations

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/recommend/{investor_id}")
def recommend(investor_id: int):
    if investor_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid investor_id")
    
    idea_ids = get_recommendations(investor_id)
    return {"investor_id": investor_id, "idea_ids": idea_ids}