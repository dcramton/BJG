from flask import Flask, request, jsonify, send_file, render_template
import boto3
import json
from dotenv import load_dotenv
import os
from functools import wraps
from warrant_lite import WarrantLite
from flask_cors import CORS
import hmac
import base64
import hashlib

load_dotenv('admin.env.dev')

print("Starting to initialize app...")  # Debug print 1

# Access environment variables
user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
admin_client_id = os.environ.get('COGNITO_ADMIN_CLIENT_ID')
admin_client_secret = os.environ.get('COGNITO_ADMIN_CLIENT_SECRET')
aws_region = os.environ.get('AWS_REGION')

print("Environment variables:")
print(f"User Pool ID: {user_pool_id}")
print(f"Client ID: {admin_client_id}")
print(f"Region: {aws_region}")

cognito_client = boto3.client('cognito-idp', region_name=aws_region)

app = Flask(__name__, 
    template_folder='templates',  # Adjust if needed based on your directory structure
    static_folder='static'        # Adjust if needed based on your directory structure
)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def get_secret_hash(username):
    msg = username + admin_client_id
    dig = hmac.new(
        bytes(admin_client_secret, 'utf-8'), 
        msg=bytes(msg, 'utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

@app.route('/')
def admin():
    print("Admin route hit!")
    return render_template('admin.html')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Token is missing'}), 401

        token = auth_header.split(" ")[1]
        
        try:
            # Verify the JWT token with Cognito
            cognito_client.get_user(
                AccessToken=token
            )
        except Exception as e:
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    print("Received request:", request.method)
    print("Headers:", request.headers)
    if request.method != 'POST':
        return jsonify({'message': f'Method {request.method} not allowed'}), 405
        
    if not request.is_json:
        return jsonify({'message': 'Missing JSON in request'}), 400
        
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data received'}), 400
        
    username = data.get('username')
    password = data.get('password')

    print(f"Login attempt for user: {username}")  # Debug print
    
    try:
        secret_hash = get_secret_hash(username)
        print("Generated secret hash")  # Debug print
        
        auth_params = {
            'USERNAME': username,
            'PASSWORD': password,
            'SECRET_HASH': secret_hash
        }
        print("Auth params prepared")  # Debug print
        
        auth_response = cognito_client.admin_initiate_auth(
            UserPoolId=user_pool_id,
            ClientId=admin_client_id,
            AuthFlow='ADMIN_USER_PASSWORD_AUTH',
            AuthParameters=auth_params
        )
        print("Auth response received:", auth_response)  # Debug print
        
        tokens = {
            'AccessToken': auth_response['AuthenticationResult']['AccessToken'],
            'IdToken': auth_response['AuthenticationResult']['IdToken'],
            'RefreshToken': auth_response['AuthenticationResult']['RefreshToken']
        }
        print(f"Login successful for user: {username}")
        return jsonify({"status": "success", "tokens": tokens})
        
    except cognito_client.exceptions.NotAuthorizedException as e:
        print(f"Auth failed: {str(e)}")
        return jsonify({"status": "error", "message": f"Invalid username or password: {str(e)}"}), 401
    except cognito_client.exceptions.UserNotFoundException as e:
        print(f"User not found: {str(e)}")
        return jsonify({"status": "error", "message": f"User not found: {str(e)}"}), 401
    except cognito_client.exceptions.UserNotConfirmedException as e:
        print(f"User not confirmed: {str(e)}")
        return jsonify({"status": "error", "message": f"User not confirmed: {str(e)}"}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"status": "error", "message": f"Login failed: {str(e)}"}), 401


@app.route('/api/dates', methods=['GET', 'POST'])
@token_required
def manage_dates():
    if request.method == 'POST':
        try:
            new_date = request.get_json()
            if not new_date:
                return jsonify({"status": "error", "message": "No date data received"}), 400

            dates_file_path = 'static/dates.json'
            try:
                with open(dates_file_path, 'r') as f:
                    data = json.load(f)
            except FileNotFoundError:
                data = {"dates": {"opening": None, "closing": None, "fedexStart": None, "exempt": [], "gameDays": None}}

            # Update the appropriate date based on type
            if new_date['type'] == 'Open':
                data['dates']['opening'] = new_date['date']
            elif new_date['type'] == 'Close':
                data['dates']['closing'] = new_date['date']
            elif new_date['type'] == 'FedEx':
                data['dates']['fedexStart'] = new_date['date']
            elif new_date['type'] == 'Exclude':
                if new_date['date'] not in data['dates']['exempt']:
                    data['dates']['exempt'].append(new_date['date'])
                    data['dates']['exempt'].sort()  # Keep exempt dates sorted
            elif new_date['type'] == 'gameDay':
                data['dates']['gameDay'] = new_date['date']

            with open(dates_file_path, 'w') as f:
                json.dump(data, f, indent=4)

            return jsonify({"status": "success", "message": f"{new_date['description']} added successfully"})

        except Exception as e:
            print(f"Error adding date: {str(e)}")
            return jsonify({"status": "error", "message": str(e)}), 400

    # GET method
    try:
        with open('static/dates.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"dates": {"opening": None, "closing": None, "fedexStart": None, "exempt": [], "gameDay": None}})




    
@app.route('/api/reset-test-user', methods=['POST'])
def reset_test_user():
    try:
        # Set permanent password for existing user
        cognito_client.admin_set_user_password(
            UserPoolId=user_pool_id,
            Username='testuser',
            Password='Test123!',
            Permanent=True
        )
        
        return jsonify({"status": "success", "message": "Test user password reset"})
    except Exception as e:
        print(f"Error resetting password: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route('/api/create-test-user', methods=['POST'])
def create_test_user():
    try:
        response = cognito_client.admin_create_user(
            UserPoolId=user_pool_id,
            Username='testuser',
            TemporaryPassword='Test123!',
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': 'your-email@example.com'  # replace with real email
                }
            ]
        )
        
        # Set permanent password
        cognito_client.admin_set_user_password(
            UserPoolId=user_pool_id,
            Username='testuser',
            Password='Test123!',
            Permanent=True
        )
        
        return jsonify({"status": "success", "message": "Test user created"})
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400



@app.route('/api/save-schedule', methods=['POST'])
@token_required
def save_schedule():
    data = request.get_json()
    
    try:
        with open('schedule.json', 'w') as f:
            json.dump(data, f, indent=4)
        return jsonify({'message': 'Schedule saved successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error saving schedule: {str(e)}'}), 500

@app.route('/test', methods=['POST'])
def test():
    return jsonify({'message': 'POST request received'})

if __name__ == '__main__':
    print("Starting server...")
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
