import tomllib
import os
from flask import Flask, request, jsonify
from supabase import create_client

app = Flask(__name__)

secrets_path = os.path.join(".streamlit", "secrets.toml")

try:
    with open(secrets_path, "rb") as f:
        secrets = tomllib.load(f)
except FileNotFoundError:
    print("Secrets file not found.")
    exit(1)

SUPABASE_URL = secrets["SUPABASE_URL"]
SUPABASE_KEY = secrets["SUPABASE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/whatsapp", methods=['POST'])
def whatsapp_reply():
    # Grab data from Ultramsg
    data = request.get_json(silent=True) or request.form.to_dict()
    
    print("\n--- INCOMING WEBHOOK ---")
    print(data) # This shows us the raw data in your terminal
    
    if data.get('event_type') == 'message_received':
        msg_data = data.get('data', {})
        incoming_msg = msg_data.get('body', '')
        sender_number = msg_data.get('from', '').replace('@c.us', '')
        
        try:
            supabase.table("messages").insert({
                "contact_info": sender_number,
                "direction": "inbound",
                "message_body": incoming_msg
            }).execute()
            print(f"✅ Successfully saved reply from {sender_number}: {incoming_msg}")
        except Exception as e:
            print(f"❌ Database Error: {e}")
    else:
        print("Received an event, but it was not a 'message_received' event.")

    return jsonify({"status": "success"}), 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)