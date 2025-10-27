import requests
import json
import os

API_URL = "https://datasets-server.huggingface.co/first-rows?dataset=cornell-movie-review-data/rotten_tomatoes&config=default&split=train"

def extract_data(dataset_name, config="default", split="train"):
    API_URL = f"https://datasets-server.huggingface.co/first-rows?dataset={dataset_name}&config={config}&split={split}"
    response = requests.get(API_URL)
    data = response.json()
    rows = data['rows']
    # download into datasets folder
    os.makedirs("datasets", exist_ok=True)
    # sanitize dataset name for filename (replace / with _)
    safe_dataset_name = dataset_name.replace("/", "_")
    filename = f"datasets/{safe_dataset_name}_{config}_{split}.json"
    # make file if not exists
    if not os.path.exists(filename):
        with open(filename, "w") as f:
            json.dump(rows, f)
    else:
        with open(filename, "r") as f:
            rows = json.load(f)
    print(f"Downloaded {len(rows)} rows to {filename}")
    return rows

print(extract_data("cornell-movie-review-data/rotten_tomatoes", "default", "train"))