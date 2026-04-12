from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException

from models import Payment, User, Withdrawal


def calculate_payment_split(amount: float, commission_rate: float) -> tuple[float, float]:
    normalized_rate = min(max(commission_rate, 0), 100)
    platform_commission = round(amount * (normalized_rate / 100), 2)
    shipowner_amount = round(amount - platform_commission, 2)
    return platform_commission, shipowner_amount


async def get_shipowner_finance_summary(shipowner: User) -> dict[str, float]:
    completed_payments = await Payment.filter(
        status="completed",
        booking__route__ship__owner=shipowner,
    ).all()
    gross_earnings = round(sum(payment.amount for payment in completed_payments), 2)
    platform_commission = round(sum(payment.platform_commission_amount for payment in completed_payments), 2)
    shipowner_earnings = round(sum(payment.shipowner_amount for payment in completed_payments), 2)

    pending_withdrawals = round(
        sum(
            withdrawal.amount
            for withdrawal in await Withdrawal.filter(shipowner=shipowner, status="pending").all()
        ),
        2,
    )
    completed_withdrawals = round(
        sum(
            withdrawal.amount
            for withdrawal in await Withdrawal.filter(shipowner=shipowner, status="completed").all()
        ),
        2,
    )
    available_to_withdraw = round(max(shipowner_earnings - pending_withdrawals - completed_withdrawals, 0), 2)

    return {
        "gross_earnings": gross_earnings,
        "platform_commission": platform_commission,
        "shipowner_earnings": shipowner_earnings,
        "pending_withdrawals": pending_withdrawals,
        "completed_withdrawals": completed_withdrawals,
        "available_to_withdraw": available_to_withdraw,
    }


async def create_withdrawal_request(shipowner: User, amount: float, note: str | None = None) -> Withdrawal:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be greater than zero")

    summary = await get_shipowner_finance_summary(shipowner)
    if amount > summary["available_to_withdraw"]:
        raise HTTPException(status_code=400, detail="Withdrawal amount exceeds the available balance")

    return await Withdrawal.create(
        shipowner=shipowner,
        amount=round(amount, 2),
        status="pending",
        note=note.strip() if note else None,
    )


async def update_withdrawal_status(withdrawal: Withdrawal, status: str, note: str | None = None) -> Withdrawal:
    if status not in {"pending", "completed", "rejected"}:
        raise HTTPException(status_code=400, detail="Invalid withdrawal status")
    withdrawal.status = status
    withdrawal.note = note.strip() if note else withdrawal.note
    withdrawal.processed_at = datetime.utcnow() if status in {"completed", "rejected"} else None
    await withdrawal.save(update_fields=["status", "note", "processed_at"])
    return withdrawal
