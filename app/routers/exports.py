from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import json
import io

from ..database import get_db
from ..models import Session as DBSession, DataRow, ProjectAssignment, User, Rating
from ..dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["exports"])


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
                row_data[f"Rating ({rater_name})"] = rating.rating_value
                row_data[f"Comment ({rater_name})"] = rating.comment or ""
            else:
                row_data[f"Rating ({rater_name})"] = ""
                row_data[f"Comment ({rater_name})"] = ""

        # Add average rating if there are multiple ratings
        if row.ratings:
            avg_rating = sum(r.rating_value for r in row.ratings) / len(row.ratings)
            row_data["Avg Rating"] = round(avg_rating, 2)
            row_data["# of Ratings"] = len(row.ratings)
        else:
            row_data["Avg Rating"] = ""
            row_data["# of Ratings"] = 0

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
