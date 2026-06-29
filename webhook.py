import tomllib
import os
from flask import Flask, request, jsonify
from supabase import create_client

app = Flask(__name__)

try:
    with open(".streamlit/secrets.toml", "rb") as f:
        secrets = tomllib.load(f)
    SUPABASE_URL = secrets["SUPABASE_URL"]
    SUPABASE_KEY = secrets["SUPABASE_KEY"]
except FileNotFoundError:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials in environment variables.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/whatsapp", methods=['POST'])
def whatsapp_reply():
    data = request.get_json(silent=True) or request.form.to_dict()
    
    if data.get('event_type') == 'message_received':
        msg_data = data.get('data', {})
        incoming_msg = msg_data.get('body', '')
        sender_number = msg_data.get('from', '').replace('@c.us', '')
        
        try:
            supabase.table("messages").insert({
                "contact_info": sender_number,
                "direction": "inbound",
                "message_body": incoming_msg,
                "message_status": "received"
            }).execute()
        except Exception:
            pass

    return jsonify({"status": "success"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
