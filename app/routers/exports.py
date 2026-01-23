from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import json
import io

from ..database import get_db
from ..models import Session as DBSession, DataRow, ProjectAssignment, User, Rating, Project, EvaluationQuestion
from ..dependencies import get_current_user


def format_multi_question_response(response: dict, question: dict) -> str:
    """Format a single question response for export."""
    if not response:
        return ""

    q_type = question.get("question_type", "")
    config = question.get("config", {})

    if q_type == "rating":
        return str(response.get("value", ""))
    elif q_type == "binary":
        value = response.get("value", "")
        # Try to get label from options
        options = config.get("options", [])
        for opt in options:
            if opt.get("value") == value:
                return opt.get("label", value)
        return value
    elif q_type == "multi_label":
        selected = response.get("selected", [])
        # Try to get labels from options
        options = config.get("options", [])
        labels = []
        for val in selected:
            for opt in options:
                if opt.get("value") == val:
                    labels.append(opt.get("label", val))
                    break
            else:
                labels.append(val)
        return ", ".join(labels)
    elif q_type == "text":
        return response.get("text", "")

    return str(response)

router = APIRouter(prefix="/api", tags=["exports"])


def format_response_for_export(rating, eval_type: str, eval_config: dict = None) -> dict:
    """Format rating response based on evaluation type for export."""
    result = {}

    # Parse response JSON if available
    response = json.loads(rating.response) if rating.response else None

    if eval_type == "rating":
        # For rating type, use rating_value
        result["value"] = rating.rating_value
    elif eval_type == "binary":
        # For binary, use the selected option
        if response and "value" in response:
            result["value"] = response["value"]
        else:
            result["value"] = ""
    elif eval_type == "multi_label":
        # For multi-label, join selected labels
        if response and "selected" in response:
            result["value"] = ", ".join(response["selected"])
        else:
            result["value"] = ""
    elif eval_type == "multi_criteria":
        # For multi-criteria, return each criterion as separate field
        if response and "criteria" in response:
            for key, value in response["criteria"].items():
                result[key] = value
        elif eval_config and "criteria" in eval_config:
            # Return empty values for each criterion
            for crit in eval_config["criteria"]:
                result[crit["key"]] = ""
    elif eval_type == "pairwise":
        # For pairwise, return winner and confidence
        if response:
            winner = response.get("winner", "")
            confidence = response.get("confidence", "")
            result["winner"] = winner.upper() if winner else ""
            result["confidence"] = confidence if confidence != "none" else ""
        else:
            result["winner"] = ""
            result["confidence"] = ""
    else:
        # Default fallback
        result["value"] = rating.rating_value

    return result


@router.get("/sessions/{session_id}/export")
async def export_session(
    session_id: str,
    format: str = "xlsx",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export session data with ratings as Excel or CSV."""
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check access
    project = session.project
    if current_user.role == "requester":
        if project.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        assignment = db.query(ProjectAssignment).filter(
            ProjectAssignment.project_id == project.id,
            ProjectAssignment.rater_id == current_user.id
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")

    # Get all rows with ratings
    rows = db.query(DataRow).filter(
        DataRow.session_id == session_id
    ).order_by(DataRow.row_index).all()

    # Get all unique raters who have rated in this session
    raters = db.query(User).join(Rating).filter(
        Rating.session_id == session_id
    ).distinct().all()
    rater_names = {r.id: r.username for r in raters}

    # Get project evaluation settings
    eval_type = project.evaluation_type or "rating"
    eval_config = json.loads(project.evaluation_config) if project.evaluation_config else None
    use_multi_questions = project.use_multi_questions or False

    # Get questions if multi-question mode
    questions = []
    if use_multi_questions:
        questions = db.query(EvaluationQuestion).filter(
            EvaluationQuestion.project_id == project.id
        ).order_by(EvaluationQuestion.order).all()
        questions = [
            {
                "key": q.key,
                "label": q.label,
                "question_type": q.question_type,
                "config": json.loads(q.config) if q.config else {}
            }
            for q in questions
        ]

    # Build data for export
    columns = json.loads(session.columns)
    export_data = []

    for row in rows:
        content = json.loads(row.content)
        row_data = {"Row #": row.row_index}

        # Add original columns
        for col in columns:
            row_data[col] = content.get(col, "")

        # Add rating columns for each rater
        ratings_by_rater = {r.rater_id: r for r in row.ratings}

        for rater_id, rater_name in rater_names.items():
            rating = ratings_by_rater.get(rater_id)
            if rating:
                # Multi-question mode
                if use_multi_questions and questions:
                    response = json.loads(rating.response) if rating.response else {}
                    for q in questions:
                        q_response = response.get(q["key"], {})
                        formatted = format_multi_question_response(q_response, q)
                        row_data[f"{q['label']} ({rater_name})"] = formatted
                else:
                    response_data = format_response_for_export(rating, eval_type, eval_config)

                    if eval_type == "multi_criteria" and eval_config and "criteria" in eval_config:
                        # For multi-criteria, add a column for each criterion
                        for crit in eval_config["criteria"]:
                            key = crit["key"]
                            label = crit.get("label", key)
                            row_data[f"{label} ({rater_name})"] = response_data.get(key, "")
                    elif eval_type == "pairwise":
                        # For pairwise, add winner and confidence columns
                        row_data[f"Winner ({rater_name})"] = response_data.get("winner", "")
                        row_data[f"Confidence ({rater_name})"] = response_data.get("confidence", "")
                    else:
                        # For other types, add a single value column
                        row_data[f"Rating ({rater_name})"] = response_data.get("value", "")

                row_data[f"Comment ({rater_name})"] = rating.comment or ""
            else:
                # Empty columns for rater with no rating
                if use_multi_questions and questions:
                    for q in questions:
                        row_data[f"{q['label']} ({rater_name})"] = ""
                elif eval_type == "multi_criteria" and eval_config and "criteria" in eval_config:
                    for crit in eval_config["criteria"]:
                        label = crit.get("label", crit["key"])
                        row_data[f"{label} ({rater_name})"] = ""
                elif eval_type == "pairwise":
                    row_data[f"Winner ({rater_name})"] = ""
                    row_data[f"Confidence ({rater_name})"] = ""
                else:
                    row_data[f"Rating ({rater_name})"] = ""
                row_data[f"Comment ({rater_name})"] = ""

        # Add average rating if there are multiple ratings (only for single rating type)
        if not use_multi_questions and eval_type == "rating" and row.ratings:
            valid_ratings = [r.rating_value for r in row.ratings if r.rating_value is not None]
            if valid_ratings:
                avg_rating = sum(valid_ratings) / len(valid_ratings)
                row_data["Avg Rating"] = round(avg_rating, 2)
            else:
                row_data["Avg Rating"] = ""
            row_data["# of Ratings"] = len(row.ratings)
        elif not use_multi_questions and eval_type == "rating":
            row_data["Avg Rating"] = ""
            row_data["# of Ratings"] = 0
        else:
            # For multi-question and non-rating types, just add count
            row_data["# of Ratings"] = len(row.ratings) if row.ratings else 0

        export_data.append(row_data)

    # Create DataFrame
    df = pd.DataFrame(export_data)

    # Generate file
    if format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)

        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={session.name}_rated.csv"
            }
        )
    else:
        # Default to Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Ratings")
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={session.name}_rated.xlsx"
            }
        )
