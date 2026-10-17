from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from .schema import schema

app = FastAPI(title="BiblioTech GraphQL API (Python + Strawberry)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(GraphQLRouter(schema), prefix="/graphql")


@app.get("/")
def root():
    return {
        "message": "BiblioTech GraphQL API activa (Python FastAPI + Strawberry)",
        "graphql": "/graphql",
        "docs": "/docs"
    }
