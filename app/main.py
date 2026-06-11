import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import OperationalError

from app.database.connection import Base, engine
from app.limiter import limiter
from app.models import diet as diet_model
from app.models import nutrition as nutrition_model
from app.models import patient as patient_model
from app.models import password_reset as password_reset_model
from app.models import user as user_model
from app.routes import ai, diet, nutrition, patient, password_reset, user
from app.services.nutrition_ai import seed_nutrition_database
from app.services.taco_seed import seed_taco_foods

app = FastAPI(title="NutriAI API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    from app.database.connection import SessionLocal

    last_error = None
    for _ in range(30):
        try:
            Base.metadata.create_all(bind=engine)
            seed_nutrition_database()

            db = SessionLocal()
            try:
                inserted = seed_taco_foods(db)
                if inserted > 0:
                    print(f"[startup] TACO: {inserted} alimentos importados.", flush=True)
            finally:
                db.close()

            return
        except OperationalError as error:
            last_error = error
            time.sleep(2)
    raise last_error


app.include_router(user.router)
app.include_router(patient.router)
app.include_router(diet.router)
app.include_router(ai.router)
app.include_router(nutrition.router)
app.include_router(password_reset.router)


@app.get("/")
def read_root():
    return {"message": "API NutriAI rodando"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
