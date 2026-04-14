from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pickle
import os

app = FastAPI(title="Campus Issue Predictor AI", version="1.0.0")

# Load model
MODEL_PATH = "model.pkl"

model = None
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)

class IssueRequest(BaseModel):
    description: str

class PredictionResponse(BaseModel):
    category: str

@app.post("/predict", response_model=PredictionResponse)
def predict_category(request: IssueRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model file not found. Please train the model first.")
    
    if not request.description or request.description.strip() == "":
        return PredictionResponse(category="Other")
        
    try:
        prediction = model.predict([request.description])
        return PredictionResponse(category=prediction[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class IssueInstance(BaseModel):
    title: str
    category: str
    priority: str

class AnalysisRequest(BaseModel):
    issues: list[IssueInstance]

@app.post("/analyze")
def analyze_issues(request: AnalysisRequest):
    issues = request.issues
    if not issues:
        return {"insight": "There are currently no active issues. The campus environment is stable."}

    # Generate heuristic AI text based on actual open issues
    total = len(issues)
    high_priority = [i for i in issues if i.priority == 'High']
    
    from collections import Counter
    categories = Counter([i.category for i in issues])
    top_cat = categories.most_common(1)[0]

    insight = f"There are currently {total} open issues requiring attention. "
    
    if len(high_priority) > 0:
        insight += f"CRITICAL PRIORITY: {len(high_priority)} issues need immediate resolution, including '{high_priority[0].title}'. "
    
    insight += f"The most prominent problem area is '{top_cat[0]}', making up {round(top_cat[1]/total*100)}% of open concerns. "
    
    if top_cat[0] == "Catering":
        insight += "Recommendation: Immediately inspect the hostel mess and kitchen hygiene facilities. Catering issues can severely disrupt student morale."
    elif top_cat[0] == "Electrical":
        insight += "Recommendation: Dispatch the electrical maintenance team to check the grid load. Frequent electrical faults may indicate aging infrastructure."
    elif top_cat[0] == "Plumbing":
        insight += "Recommendation: Check the central water supply lines and pipelines for general pressure blockages."
    elif top_cat[0] == "Network":
        insight += "Recommendation: Reboot the main library routers and check ISP connectivity in the host nodes."
    else:
        insight += "Recommendation: Organize a general maintenance sweep across the affected areas."

    return {"insight": insight}

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}
