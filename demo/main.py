from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from huggingface_hub import HfApi
import statistics
import uuid

# Initialize the FastAPI app and Hugging Face API client
app = FastAPI(title="HF Dataset Rating API Demo")
hf_api = HfApi()

# ----- Data Models -----

class Client(BaseModel):
    id: str
    name: str
    email: str

class Dataset(BaseModel):
    id: str
    hf_repo: str
    title: str
    description: Optional[str] = None
    client_id: Optional[str] = None
    raters: List[str] = []

class Rater(BaseModel):
    id: str
    name: str
    expertise: Optional[str] = None

class Rating(BaseModel):
    id: str
    dataset_id: str
    rater_id: str
    entry_id: str
    score: float

# ----- In-memory Stores -----
clients = {}
datasets = {}
raters = {}
ratings = []

# ----- Client APIs -----

@app.post("/clients/register")
def register_client(client: Client):
    clients[client.id] = client
    return {"message": "Client registered", "client": client}

@app.get("/clients/{client_id}")
def get_client(client_id: str):
    if client_id not in clients:
        raise HTTPException(404, detail="Client not found")
    return clients[client_id]

# ----- Dataset APIs -----

@app.post("/datasets/register")
def register_dataset(dataset: Dataset):
    dataset.id = dataset.id or str(uuid.uuid4())
    datasets[dataset.id] = dataset
    return {"message": "Dataset registered", "dataset": dataset}

@app.get("/datasets")
def list_datasets():
    return list(datasets.values())

@app.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str):
    if dataset_id not in datasets:
        raise HTTPException(404, "Dataset not found")
    return datasets[dataset_id]

@app.put("/datasets/{dataset_id}/assign-raters")
def assign_raters(dataset_id: str, rater_ids: List[str]):
    dataset = datasets.get(dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    dataset.raters = rater_ids
    return {"message": "Raters assigned successfully", "raters": dataset.raters}

# ----- Dataset Data Fetch -----

@app.get("/datasets/{dataset_id}/fetch")
def fetch_dataset_info(dataset_id: str):
    dataset = datasets.get(dataset_id)
    if not dataset:
        raise HTTPException(404, "Dataset not found")
    info = hf_api.dataset_info(repo_id=dataset.hf_repo)
    return {"repo": dataset.hf_repo, "siblings": len(info.siblings)}

# ----- Rater APIs -----

@app.post("/raters/register")
def register_rater(rater: Rater):
    raters[rater.id] = rater
    return {"message": "Rater registered", "rater": rater}

@app.get("/raters")
def list_raters():
    return list(raters.values())

# ----- Rating APIs -----

@app.post("/ratings")
def create_rating(rating: Rating):
    rating.id = rating.id or str(uuid.uuid4())
    ratings.append(rating)
    return {"message": "Rating submitted", "rating": rating}

@app.get("/ratings/{dataset_id}")
def get_ratings(dataset_id: str):
    dataset_ratings = [r for r in ratings if r.dataset_id == dataset_id]
    return {"count": len(dataset_ratings), "ratings": dataset_ratings}

@app.get("/ratings/{dataset_id}/summary")
def get_rating_summary(dataset_id: str):
    dataset_scores = [r.score for r in ratings if r.dataset_id == dataset_id]
    if not dataset_scores:
        raise HTTPException(404, "No ratings found for this dataset")
    return {
        "mean": statistics.mean(dataset_scores),
        "count": len(dataset_scores),
        "min": min(dataset_scores),
        "max": max(dataset_scores)
    }

# ----- Health Check -----

@app.get("/")
def root():
    return {"message": "Welcome to the Hugging Face Dataset Rating API Demo!"}
