from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Role(Base):
    __tablename__ = "Roles"
    RoleID = Column(Integer, primary_key=True, autoincrement=True)
    RoleName = Column(String(50), nullable=False)
    Description = Column(String(255))
    Status = Column(String(20), default="Active")
    CreatedAt = Column(DateTime, server_default=func.now())


class User(Base):
    __tablename__ = "Users"
    UserID = Column(Integer, primary_key=True, autoincrement=True)
    FullName = Column(String(150), nullable=False)
    Username = Column(String(50), nullable=False)
    Email = Column(String(100), nullable=False)
    Phone = Column(String(50))
    PasswordHash = Column(String(255), nullable=False)
    RoleID = Column(Integer, ForeignKey("Roles.RoleID"), nullable=False)
    PrimaryBranchID = Column(Integer, ForeignKey("Branches.BranchID"), nullable=False)
    EmployeeID = Column(String(50))
    Designation = Column(String(100))
    Address = Column(String(500))
    Notes = Column(String)
    Status = Column(String(20), default="Active")
    LastLoginAt = Column(DateTime)
    CreatedAt = Column(DateTime, server_default=func.now())

    role = relationship("Role")
    branch = relationship("Branch")

class Permission(Base):
    __tablename__ = "Permissions"
    PermissionID = Column(Integer, primary_key=True, autoincrement=True)
    ParentPermissionID = Column(Integer, ForeignKey("Permissions.PermissionID"), nullable=True)
    PermissionKey = Column(String(100), nullable=False)
    PermissionName = Column(String(100), nullable=False)
    Description = Column(String(255))
    Module = Column(String(50), nullable=False)
    Status = Column(String(20), default="Active")
    SortOrder = Column(Integer, default=0)


class RolePermission(Base):
    __tablename__ = "RolePermissions"
    RolePermissionID = Column(Integer, primary_key=True, autoincrement=True)
    RoleID = Column(Integer, ForeignKey("Roles.RoleID"), nullable=False)
    PermissionID = Column(Integer, ForeignKey("Permissions.PermissionID"), nullable=False)


class UserPermission(Base):
    __tablename__ = "UserPermissions"
    UserPermissionID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    PermissionID = Column(Integer, ForeignKey("Permissions.PermissionID"), nullable=False)