from flask import Blueprint, request, jsonify
from extensions import db, bcrypt
from flask_jwt_extended import create_access_token
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'name, email and password are required'}), 400

    name  = data['name'].strip()
    email = data['email'].strip().lower()
    password = data['password']

    if User.query.filter_by(name=name).first():
        return jsonify({'error': 'Name already taken'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user   = User(name=name, email=email, password_hash=hashed)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': f'Account created for {name}'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'email and password are required'}), 400

    # find user by email instead of name
    user = User.query.filter_by(email=data['email'].strip().lower()).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'access_token': token,
        'name': user.name
    }), 200