from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models import User, Withdrawal
from routers.auth import get_current_user
from services.finance import create_withdrawal_request, get_shipowner_finance_summary, update_withdrawal_status

router = APIRouter()


class WithdrawalCreate(BaseModel):
    amount: float
    note: str | None = None


class WithdrawalUpdate(BaseModel):
    status: str
    note: str | None = None


def serialize_withdrawal(withdrawal: Withdrawal) -> dict:
    return {
        "id": withdrawal.id,
        "shipowner_id": withdrawal.shipowner_id,
        "amount": withdrawal.amount,
        "status": withdrawal.status,
        "note": withdrawal.note,
        "created_at": withdrawal.created_at.isoformat() if withdrawal.created_at else None,
        "processed_at": withdrawal.processed_at.isoformat() if withdrawal.processed_at else None,
    }


@router.get("/finance/summary")
async def get_finance_summary(current_user: User = Depends(get_current_user)):
    if current_user.role == "shipowner":
        return await get_shipowner_finance_summary(current_user)
    if current_user.role == "admin":
        shipowners = await User.filter(role="shipowner").all()
        summaries = [await get_shipowner_finance_summary(shipowner) for shipowner in shipowners]
        return {
            "gross_earnings": round(sum(item["gross_earnings"] for item in summaries), 2),
            "platform_commission": round(sum(item["platform_commission"] for item in summaries), 2),
            "shipowner_earnings": round(sum(item["shipowner_earnings"] for item in summaries), 2),
            "pending_withdrawals": round(sum(item["pending_withdrawals"] for item in summaries), 2),
            "completed_withdrawals": round(sum(item["completed_withdrawals"] for item in summaries), 2),
            "available_to_withdraw": round(sum(item["available_to_withdraw"] for item in summaries), 2),
        }
    raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/withdrawals")
async def get_withdrawals(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        withdrawals = await Withdrawal.all().prefetch_related("shipowner").order_by("-created_at")
    elif current_user.role == "shipowner":
        withdrawals = await Withdrawal.filter(shipowner=current_user).order_by("-created_at")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    return [serialize_withdrawal(withdrawal) for withdrawal in withdrawals]


@router.post("/withdrawals")
async def create_withdrawal(payload: WithdrawalCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "shipowner":
        raise HTTPException(status_code=403, detail="Only shipowners can create withdrawals")
    withdrawal = await create_withdrawal_request(current_user, payload.amount, payload.note)
    return {"message": "Withdrawal request created successfully", "withdrawal": serialize_withdrawal(withdrawal)}


@router.put("/withdrawals/{withdrawal_id}")
async def update_withdrawal(
    withdrawal_id: int,
    payload: WithdrawalUpdate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update withdrawal requests")
    withdrawal = await Withdrawal.get_or_none(id=withdrawal_id)
    if withdrawal is None:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    updated_withdrawal = await update_withdrawal_status(withdrawal, payload.status, payload.note)
    return {"message": "Withdrawal request updated successfully", "withdrawal": serialize_withdrawal(updated_withdrawal)}
