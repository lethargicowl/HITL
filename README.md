# 🤗 Hugging Face Dataset Rating Demo (FastAPI)

A simple demo backend for dataset rating and rater assignment,
built with **FastAPI** and **HuggingFace Hub Integration**.

## How to Run

1. Install dependencies: pip install -r requirements.txt
2. Start the API server: uvicorn main:app --reload
3. Open the interactive UI: http://127.0.0.1:8000/docs


## Example Flow

1. **Register a client**
- POST `/clients/register`

2. **Register a dataset**
- POST `/datasets/register` with a valid `hf_repo` (e.g., `"imdb"`)

3. **Register raters**
- POST `/raters/register` several times

4. **Assign raters**
- PUT `/datasets/{id}/assign-raters`

5. **Give ratings**
- POST `/ratings`

6. **View summary**
- GET `/ratings/{dataset_id}/summary`

This API is designed for simplicity and frontend demos, not production use.
