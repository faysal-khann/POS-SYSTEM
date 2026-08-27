from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .routers import suppliers
from .routers import customers
from .routers import products
from .routers import categories
from .routers import brands
from .routers import units
from .routers import purchases
from .routers import stock
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(suppliers.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(purchases.router)
app.include_router(units.router)
app.include_router(brands.router)
app.include_router(categories.router)
os.makedirs("uploads/products", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "FastAPI is working"}