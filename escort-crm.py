import streamlit as st
import pandas as pd
from datetime import date, datetime, time, timedelta, timezone
import time as time_module
import requests
from supabase import create_client, Client

# --- Setup ---
@st.cache_resource
def init_connection() -> Client:
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)

supabase = init_connection()

# --- Utility Functions ---
def safe_fetch(table, select_query="*"):
    for i in range(3):
        try:
            response = supabase.table(table).select(select_query).execute()
            return response.data
        except Exception as e:
            if i == 2:
                st.error(f"⚠️ Failed to fetch data from '{table}'. Error: {e}")
            time_module.sleep(1)
    return []


def get_status_icon(status: str) -> str:
    if not status:
        return ""
    status_map = {
        "failed": "🚫",
        "unsent": "🚫",
        "pending": "🚫",
        "sent": "📤",
        "delivered": "📫",
        "read": "✅",
    }
    return status_map.get(str(status).strip().lower(), "")


def auto_refresh_messages(interval_seconds: int = 30, key: str = "messages_refresh"):
    refresh_func = getattr(st, "autorefresh", None) or getattr(st, "st_autorefresh", None)
    if callable(refresh_func):
        refresh_func(interval=interval_seconds * 1000, limit=None, key=key)
    else:
        if key not in st.session_state:
            st.session_state[key] = time_module.time()
        now = time_module.time()
        if now - st.session_state[key] >= interval_seconds:
            st.session_state[key] = now
            st.experimental_rerun()


st.set_page_config(page_title="Jack's CRM", layout="wide")
st.title("Jacks's CRM")

# --- Dialogs (Popups) ---
@st.dialog("Manage Contact")
def contact_dialog(action, data=None):
    with st.form("c_form"):
        name = st.text_input("Name", value=data['name'] if data else "")
        info = st.text_input("WhatsApp Number (e.g., 447123456789)", value=data['contact_info'] if data else "")
        notes = st.text_area("Interaction Notes", value=data.get('last_notes', '') if data else "")
        if st.form_submit_button("Submit"):
            clean_info = "".join(filter(str.isdigit, str(info)))
            if action == "Add":
                supabase.table("contacts").insert({"name": name, "contact_info": clean_info, "last_notes": notes}).execute()
            else:
                supabase.table("contacts").update({"name": name, "contact_info": clean_info, "last_notes": notes}).eq("id", data['id']).execute()
            st.rerun()

@st.dialog("Manage Service")
def service_dialog(action, data=None):
    with st.form("s_form"):
        t = st.text_input("Title", value=data['title'] if data else "")
        d = st.number_input("Hours", value=float(data['duration']) if data else 0.5, step=0.5)
        c = st.number_input("Cost (£)", value=float(data['cost']) if data else 0.0, step=10.0)
        a = st.number_input("Additional Costs (£)", value=float(data['additional_costs']) if data else 0.0, step=10.0)
        
        type_options = ["In-call", "Out-call", "Both"]
        ctype = st.selectbox("Type", type_options, index=type_options.index(data['call_type']) if data else 0)
        
        if st.form_submit_button("Submit"):
            payload = {"title": t, "duration": d, "call_type": ctype, "cost": c, "additional_costs": a}
            if action == "Add": 
                supabase.table("services").insert(payload).execute()
            else: 
                supabase.table("services").update(payload).eq("id", data['id']).execute()
            st.rerun()

@st.dialog("Manage Booking")
def booking_dialog(action, c_dict, s_dict, data=None):
    with st.form("b_form"):
        c_names = list(c_dict.keys())
        s_names = list(s_dict.keys())
        
        c_idx = 0
        s_idx = 0
        if data:
            for i, name in enumerate(c_names):
                if c_dict[name] == data['contact_id']: c_idx = i
            for i, name in enumerate(s_names):
                if s_dict[name] == data['service_id']: s_idx = i
                
        c_sel = st.selectbox("Contact", c_names, index=c_idx if c_names else 0)
        s_sel = st.selectbox("Service", s_names, index=s_idx if s_names else 0)
        
        default_date = date.today()
        default_time = time(12, 0)
        if data and 'booking_datetime' in data:
            dt_str = data['booking_datetime'].replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(dt_str)
            default_date = parsed_dt.date()
            default_time = parsed_dt.time()

        b_date = st.date_input("Date", value=default_date)
        b_time = st.time_input("Time (24hr)", value=default_time)
        b_hours = st.number_input("Duration (Hours)", 0.5, step=0.5, value=float(data['hours']) if data else 0.5)
        
        if st.form_submit_button("Submit"):
            dt = datetime.combine(b_date, b_time).isoformat()
            payload = {
                "contact_id": c_dict[c_sel], 
                "service_id": s_dict[s_sel], 
                "booking_datetime": dt, 
                "hours": b_hours
            }
            if action == "Add":
                supabase.table("bookings").insert(payload).execute()
            else:
                supabase.table("bookings").update(payload).eq("id", data['id']).execute()
            st.rerun()

# --- Main Tabs ---
tab1, tab2, tab3, tab4 = st.tabs(["📖 Bookings", "👥 Contacts", "✨ Services", "💬 Messaging"])

# --- TAB 2: CONTACTS ---
with tab2:
    st.header("Contact Management")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("➕ Add New Contact"): 
            contact_dialog("Add")
            
    c_data = safe_fetch("contacts")
    s_data = safe_fetch("services")
    
    if c_data:
        c_dict_display = {f"{c['name']} ({c['contact_info']})": c for c in c_data}
        selected_name = st.selectbox("Select a Contact to view details", options=list(c_dict_display.keys()))
        selected_contact = c_dict_display[selected_name]
        
        st.divider()
        
        d_col1, d_col2 = st.columns([3, 1])
        with d_col1:
            st.subheader(selected_contact['name'])
            st.write(f"📞 **Number:** {selected_contact['contact_info']}")
            st.write(f"📝 **Notes:** {selected_contact.get('last_notes', 'No notes added')}")
        with d_col2:
            if st.button("✏️ Edit Contact", use_container_width=True):
                contact_dialog("Edit", selected_contact)
            if st.button("🗑️ Delete Contact", use_container_width=True):
                supabase.table("contacts").delete().eq("id", selected_contact['id']).execute()
                st.rerun()
                
        st.divider()
        st.subheader("Client Bookings")
        
        bookings_data = safe_fetch("bookings", "*, services(title, cost)")
        contact_bookings = [b for b in bookings_data if b['contact_id'] == selected_contact['id']] if bookings_data else []
        
        now = datetime.now()
        past_bookings = []
        future_bookings = []
        
        for b in contact_bookings:
            b_dt_str = b['booking_datetime'].replace("Z", "+00:00")
            b_dt = datetime.fromisoformat(b_dt_str).replace(tzinfo=None)
            b['dt_obj'] = b_dt
            if b_dt < now:
                past_bookings.append(b)
            else:
                future_bookings.append(b)
                
        past_bookings.sort(key=lambda x: x['dt_obj'], reverse=True)
        future_bookings.sort(key=lambda x: x['dt_obj'])

        c_mapping = {cd['name']: cd['id'] for cd in c_data}
        s_mapping = {sd['title']: sd['id'] for sd in s_data} if s_data else {}
        
        st.write("### Upcoming Bookings")
        if not future_bookings:
            st.info("No upcoming bookings.")
        else:
            for b in future_bookings:
                bc1, bc2, bc3 = st.columns([4, 1, 1])
                svc_title = b['services']['title'] if b.get('services') else "Unknown Service"
                bc1.write(f"📅 **{b['dt_obj'].strftime('%Y-%m-%d %H:%M')}** | {svc_title} ({b['hours']} hrs)")
                if bc2.button("Edit", key=f"eb_f_{b['id']}"):
                    booking_dialog("Edit", c_mapping, s_mapping, b)
                if bc3.button("Delete", key=f"db_f_{b['id']}"):
                    supabase.table("bookings").delete().eq("id", b['id']).execute()
                    st.rerun()

        st.write("### Past Bookings")
        if not past_bookings:
            st.info("No past bookings.")
        else:
            for b in past_bookings:
                bc1, bc2, bc3 = st.columns([4, 1, 1])
                svc_title = b['services']['title'] if b.get('services') else "Unknown Service"
                bc1.write(f"📅 **{b['dt_obj'].strftime('%Y-%m-%d %H:%M')}** | {svc_title} ({b['hours']} hrs)")
                if bc2.button("Edit", key=f"eb_p_{b['id']}"):
                    booking_dialog("Edit", c_mapping, s_mapping, b)
                if bc3.button("Delete", key=f"db_p_{b['id']}"):
                    supabase.table("bookings").delete().eq("id", b['id']).execute()
                    st.rerun()
    else:
        st.info("No contacts found. Add one above.")

# --- TAB 3: SERVICES ---
with tab3:
    st.header("Service Management")
    if st.button("➕ Add New Service"): 
        service_dialog("Add")
        
    s_data = safe_fetch("services")
    if s_data:
        for row in s_data:
            cols = st.columns([3, 1, 1])
            cols[0].write(f"**{row['title']}** (£{row['cost']} | {row['duration']} hrs)")
            if cols[1].button("Edit", key=f"es{row['id']}"): 
                service_dialog("Edit", row)
            if cols[2].button("Delete", key=f"ds{row['id']}"):
                supabase.table("services").delete().eq("id", row['id']).execute()
                st.rerun()
    elif s_data == []:
        st.info("No services found. Add one above.")

# --- TAB 1: BOOKINGS ---
with tab1:
    st.header("Booking Management")
    c_data = safe_fetch("contacts")
    s_data = safe_fetch("services")
    
    if c_data and s_data:
        if st.button("➕ Schedule Booking"): 
            booking_dialog("Add", {c['name']: c['id'] for c in c_data}, {s['title']: s['id'] for s in s_data})
    
    bookings = safe_fetch("bookings", "*, contacts(name), services(title)")
    if bookings:
        df = pd.DataFrame(bookings)
        df['Client'] = df['contacts'].apply(lambda x: x['name'] if x else "Unknown")
        df['Service'] = df['services'].apply(lambda x: x['title'] if x else "Unknown")
        df['booking_datetime'] = pd.to_datetime(df['booking_datetime']).dt.strftime('%Y-%m-%d %H:%M')
        
        if st.radio("View Mode", ["Table", "Calendar (Grouped)"], horizontal=True) == "Table":
            st.dataframe(df.drop(columns=['contacts', 'services']), use_container_width=True)
        else:
            for d, g in df.groupby(df['booking_datetime'].str[:10]):
                st.subheader(d)
                st.dataframe(g.drop(columns=['booking_datetime', 'contacts', 'services']), use_container_width=True)
    elif bookings == []:
        st.info("No bookings found.")

# --- TAB 4: MESSAGING ---
with tab4:
    st.header("Direct Messaging")
    auto_refresh_messages(30, key="messages_refresh")
    
    ULTRAMSG_INSTANCE = st.secrets.get("ULTRAMSG_INSTANCE", "YOUR_INSTANCE")
    ULTRAMSG_TOKEN = st.secrets.get("ULTRAMSG_TOKEN", "YOUR_TOKEN")
    
    c_data = safe_fetch("contacts")
    if c_data:
        if "selected_message_contact" not in st.session_state:
            st.session_state["selected_message_contact"] = None
        if "last_seen_messages" not in st.session_state:
            st.session_state["last_seen_messages"] = {}

        def parse_timestamp(ts):
            if not ts:
                return None
            if isinstance(ts, str):
                try:
                    parsed = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    return None
            elif isinstance(ts, datetime):
                parsed = ts
            else:
                return None
            if parsed.tzinfo is not None:
                parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
            return parsed

        all_messages = supabase.table("messages").select("*").order("timestamp", desc=False).execute().data or []
        cutoff = datetime.utcnow() - timedelta(days=3)
        recent_messages = [msg for msg in all_messages if parse_timestamp(msg.get("timestamp")) and parse_timestamp(msg.get("timestamp")) >= cutoff]

        contacts = {"".join(filter(str.isdigit, str(c["contact_info"]))): c for c in c_data}
        recent_by_contact = {}
        for msg in recent_messages:
            contact_info = "".join(filter(str.isdigit, str(msg.get("contact_info", ""))))
            if contact_info not in recent_by_contact:
                recent_by_contact[contact_info] = []
            recent_by_contact[contact_info].append(msg)

        st.subheader("Recent Messages")
        if not recent_by_contact:
            st.info("No recent messages from the last 3 days.")
        else:
            for contact_info, messages in recent_by_contact.items():
                contact = contacts.get(contact_info, {"name": contact_info})
                latest = max(messages, key=lambda x: parse_timestamp(x.get("timestamp")) or datetime.min)
                status_icon = get_status_icon(latest.get("status") or latest.get("message_status") or "")
                direction = "You" if latest.get("direction") == "outbound" else contact.get("name", "Contact")
                snippet = latest.get("message_body", "")
                if len(snippet) > 60:
                    snippet = snippet[:57] + "..."
                message_time = parse_timestamp(latest.get("timestamp"))
                time_str = message_time.strftime("%Y-%m-%d %H:%M") if message_time else ""

                row = st.columns([3, 4, 1, 1])
                row[0].markdown(f"**{contact.get('name', contact_info)}**<br><span style='color: gray;'>{time_str}</span>", unsafe_allow_html=True)
                row[1].write(f"{direction}: {snippet}")
                row[2].markdown(f"{status_icon}")
                if row[3].button("Open", key=f"recent_{contact_info}"):
                    st.session_state["selected_message_contact"] = contact_info
                    st.experimental_rerun()

        selected_contact = st.session_state["selected_message_contact"]
        if selected_contact:
            contact = contacts.get(selected_contact, {"name": selected_contact})
            st.divider()
            st.subheader(f"Message History with {contact.get('name')}")
            if st.button("← Back to Recent Messages", type="secondary"):
                st.session_state["selected_message_contact"] = None
                st.experimental_rerun()

            contact_messages = [msg for msg in all_messages if "".join(filter(str.isdigit, str(msg.get("contact_info", "")))) == selected_contact]
            if not contact_messages:
                st.info("No message history for this contact.")
            else:
                for msg in contact_messages:
                    icon = get_status_icon(msg.get("status") or msg.get("message_status") or "")
                    message_text = msg.get('message_body', '')
                    if icon:
                        message_text = f"{message_text} {icon}"
                    if msg.get('direction') == "inbound":
                        st.chat_message("user", avatar="👤").write(message_text)
                    else:
                        st.chat_message("assistant", avatar="💼").write(message_text)

            if new_message := st.chat_input("Type your message here..."):
                try:
                    url = f"https://api.ultramsg.com/{ULTRAMSG_INSTANCE}/messages/chat"
                    payload = {
                        "token": ULTRAMSG_TOKEN,
                        "to": f"{selected_contact}@c.us",
                        "body": new_message
                    }
                    response = requests.post(url, data=payload)
                    response.raise_for_status()

                    supabase.table("messages").insert({
                        "contact_info": selected_contact,
                        "direction": "outbound",
                        "message_body": new_message,
                        "status": "sent"
                    }).execute()

                    st.rerun()

                except Exception as e:
                    supabase.table("messages").insert({
                        "contact_info": selected_contact,
                        "direction": "outbound",
                        "message_body": new_message,
                        "status": "failed"
                    }).execute()
                    st.error(f"Failed to send message: {e}")
    else:
        st.info("Please add contacts in the Contact Management tab first.")
