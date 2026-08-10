from fastapi import FastAPI
from dotenv import load_dotenv
from .routers import suppliers

load_dotenv()

app = FastAPI()

app.include_router(suppliers.router)


@app.get("/")
def root():
    return {"message": "FastAPI is working"}