"""
模型定价管理 API — DESIGN.md §4.5
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from shared_db.models import ModelPricing
from schemas import PricingCreate, PricingItem, PricingListResponse
from auth import get_current_user

router = APIRouter(prefix="/api/v1/pricing", tags=["pricing"])


@router.get("")
def list_pricing(
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    models = db.query(ModelPricing).order_by(ModelPricing.provider, ModelPricing.model_name).all()
    return {
        "success": True,
        "data": [
            {
                "id": m.id,
                "provider": m.provider,
                "model_name": m.model_name,
                "model_alias": m.model_alias,
                "input_price_per_1k": float(m.input_price_per_1k),
                "output_price_per_1k": float(m.output_price_per_1k),
                "is_active": m.is_active,
                "description": m.description,
            }
            for m in models
        ],
    }


@router.post("", status_code=201)
def create_pricing(
    req: PricingCreate,
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    existing = db.query(ModelPricing).filter(
        ModelPricing.provider == req.provider,
        ModelPricing.model_name == req.model_name,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="该模型定价已存在")

    pricing = ModelPricing(
        provider=req.provider,
        model_name=req.model_name,
        model_alias=req.model_alias,
        input_price_per_1k=req.input_price_per_1k,
        output_price_per_1k=req.output_price_per_1k,
        description=req.description,
    )
    db.add(pricing)
    db.commit()
    db.refresh(pricing)

    return {
        "success": True,
        "data": {
            "id": pricing.id,
            "provider": pricing.provider,
            "model_name": pricing.model_name,
        },
    }


@router.put("/{pricing_id}")
def update_pricing(
    pricing_id: int,
    req: PricingCreate,
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    pricing = db.query(ModelPricing).filter(ModelPricing.id == pricing_id).first()
    if not pricing:
        raise HTTPException(status_code=404, detail="定价记录不存在")

    pricing.provider = req.provider
    pricing.model_name = req.model_name
    pricing.model_alias = req.model_alias
    pricing.input_price_per_1k = req.input_price_per_1k
    pricing.output_price_per_1k = req.output_price_per_1k
    pricing.description = req.description
    db.commit()

    return {"success": True, "message": "已更新"}


@router.delete("/{pricing_id}")
def delete_pricing(
    pricing_id: int,
    db: Session = Depends(get_db),
    _= Depends(get_current_user),
):
    pricing = db.query(ModelPricing).filter(ModelPricing.id == pricing_id).first()
    if not pricing:
        raise HTTPException(status_code=404, detail="定价记录不存在")

    db.delete(pricing)
    db.commit()
    return {"success": True, "message": "已删除"}
