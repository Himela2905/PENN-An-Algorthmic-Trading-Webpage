from extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'   # points to your existing table

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(80), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)