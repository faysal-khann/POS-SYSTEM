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
from .routers import users
from .routers import roles
from .routers import permissions
from .routers import companies
from .routers import branches
from .routers import auth
from .routers import sales
from .routers import sale_returns
from .routers import cashier_shifts      
from .routers import loyalty        
from .routers import expenses

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
app.include_router(permissions.router)
app.include_router(roles.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(branches.router)
app.include_router(auth.router)
app.include_router(sales.router)
app.include_router(sale_returns.router)
app.include_router(cashier_shifts.router) 
app.include_router(loyalty.router)
app.include_router(expenses.router)



os.makedirs("uploads/products", exist_ok=True)
os.makedirs("uploads/companies", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "FastAPI is working"}