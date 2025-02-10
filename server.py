from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs
import json
import boto3
from warrant_lite import WarrantLite
import os
from dotenv import load_dotenv

load_dotenv()

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.endswith('.html') or self.path.endswith('.js'):
            self.send_response(200)
            if self.path.endswith('.html'):
                self.send_header('Content-type', 'text/html')
            elif self.path.endswith('.js'):
                self.send_header('Content-type', 'application/javascript')
            self.end_headers()
            
            with open('.' + self.path, 'rb') as file:
                self.wfile.write(file.read())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/login':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            credentials = json.loads(post_data.decode('utf-8'))

            try:
                # Your existing login logic here
                # This should match what you have in your admin.py
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"message": "Login successful"}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {"message": str(e)}
                self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run(server_class=HTTPServer, handler_class=RequestHandler, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting server on port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
