from pydantic import BaseModel


class LoginRequest(BaseModel):
    CompanyID: int
    UsernameOrEmail: str
    Password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    UserID: int
    FullName: str
    Username: str
    Email: str
    RoleID: int
    RoleName: str
    CompanyID: int
    CompanyName: str
    PrimaryBranchID: int
    BranchName: str