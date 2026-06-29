import streamlit as st
import pandas as pd
from datetime import date, datetime, time
import time as time_module
import requests
from supabase import create_client, Client
import streamlit.components.v1 as components

# --- Setup ---
@st.cache_resource
def init_connection() -> Client:
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)

supabase = init_connection()

# --- Utility Functions ---
def log_to_db(level, message):
    """Safely logs system events to the app_logs table."""
    try:
        supabase.table("app_logs").insert({"source": "Streamlit_App", "level": level, "message": message}).execute()
    except Exception:
        pass # Fail silently if logging fails to prevent app crashes

def safe_fetch(table, select_query="*", order_col=None, order_desc=False):
    """Fetches data with a 3-try retry mechanism to handle network blips."""
    for i in range(3):
        try:
            query = supabase.table(table).select(select_query)
            if order_col:
                query = query.order(order_col, desc=order_desc)
            response = query.execute()
            return response.data
        except Exception as e:
            if i == 2:
                log_to_db("ERROR", f"Failed to fetch data from '{table}'. Error: {e}")
                st.error(f"⚠️ Failed to fetch data from '{table}'. Error: {e}")
            time_module.sleep(1)
    return []

st.set_page_config(page_title="Business CRM", layout="wide")
st.title("Business CRM")

# --- Dialogs (Popups) ---
@st.dialog("Manage Contact")
def contact_dialog(action, data=None):
    with st.form("c_form"):
        name = st.text_input("Name", value=data['name'] if data else "")
        info = st.text_input("WhatsApp Number (e.g., 447123456789)", value=data['contact_info'] if data else "")
        notes = st.text_area("Interaction Notes", value=data.get('last_notes', '') if data else "")
        
        if st.form_submit_button("Submit"):
            clean_info = "".join(filter(str.isdigit, str(info)))
            try:
                if action == "Add":
                    supabase.table("contacts").insert({"name": name, "contact_info": clean_info, "last_notes": notes}).execute()
                    log_to_db("INFO", f"Added contact: {name}")
                else:
                    supabase.table("contacts").update({"name": name, "contact_info": clean_info, "last_notes": notes}).eq("id", data['id']).execute()
                    log_to_db("INFO", f"Updated contact: {name}")
            except Exception as e:
                log_to_db("ERROR", f"Contact {action} failed: {e}")
                st.error(f"Error saving contact: {e}")
            st.rerun()

@st.dialog("Manage Category")
def category_dialog(action, data=None):
    with st.form("cat_form"):
        name = st.text_input("Category Name", value=data['name'] if data else "")
        if st.form_submit_button("Submit"):
            try:
                if action == "Add":
                    supabase.table("service_categories").insert({"name": name}).execute()
                    log_to_db("INFO", f"Added category: {name}")
                else:
                    supabase.table("service_categories").update({"name": name}).eq("id", data['id']).execute()
                    log_to_db("INFO", f"Updated category: {name}")
            except Exception as e:
                log_to_db("ERROR", f"Category {action} failed: {e}")
                st.error(f"Error saving category: {e}")
            st.rerun()

@st.dialog("Manage Service")
def service_dialog(action, cat_dict, data=None):
    if not cat_dict:
        st.warning("Please add a category first.")
        if st.button("Close"): st.rerun()
        return

    with st.form("s_form"):
        cat_names = list(cat_dict.keys())
        cat_idx = 0
        if data and data.get('category_id'):
            for i, name in enumerate(cat_names):
                if cat_dict[name] == data['category_id']: cat_idx = i
                
        cat_sel = st.selectbox("Category", cat_names, index=cat_idx if cat_names else 0)
        t = st.text_input("Title", value=data['title'] if data else "")
        d = st.number_input("Hours", value=float(data['duration']) if data else 0.5, step=0.5)
        c = st.number_input("Cost (£)", value=float(data['cost']) if data else 0.0, step=10.0)
        a = st.number_input("Additional Costs (£)", value=float(data['additional_costs']) if data else 0.0, step=10.0)
        
        type_options = ["In-call", "Out-call", "Both"]
        ctype = st.selectbox("Type", type_options, index=type_options.index(data['call_type']) if data else 0)
        
        if st.form_submit_button("Submit"):
            payload = {
                "category_id": cat_dict[cat_sel],
                "title": t, 
                "duration": d, 
                "call_type": ctype, 
                "cost": c, 
                "additional_costs": a
            }
            try:
                if action == "Add": 
                    supabase.table("services").insert(payload).execute()
                    log_to_db("INFO", f"Added service: {t}")
                else: 
                    supabase.table("services").update(payload).eq("id", data['id']).execute()
                    log_to_db("INFO", f"Updated service: {t}")
            except Exception as e:
                log_to_db("ERROR", f"Service {action} failed: {e}")
                st.error(f"Error saving service: {e}")
            st.rerun()

@st.dialog("Manage Booking")
def booking_dialog(action, c_dict, s_dict, data=None):
    with st.form("b_form"):
        c_names = list(c_dict.keys())
        s_names = list(s_dict.keys())
        
        # Pre-fill dropdowns if editing an existing booking
        c_idx = 0
        s_idx = 0
        if data:
            for i, name in enumerate(c_names):
                if c_dict[name] == data['contact_id']: c_idx = i
            for i, name in enumerate(s_names):
                # We now look inside the service dictionary to match the ID
                if s_dict[name]['id'] == data['service_id']: s_idx = i
                
        c_sel = st.selectbox("Contact", c_names, index=c_idx if c_names else 0)
        s_sel = st.selectbox("Service", s_names, index=s_idx if s_names else 0)
        
        default_date = date.today()
        default_time = time(12, 0)
        
        # Handle Supabase ISO datetime parsing
        if data and 'booking_datetime' in data:
            dt_str = data['booking_datetime'].replace("Z", "+00:00")
            parsed_dt = datetime.fromisoformat(dt_str)
            default_date = parsed_dt.date()
            default_time = parsed_dt.time()

        b_date = st.date_input("Date", value=default_date)
        b_time = st.time_input("Time (24hr)", value=default_time)
        
        st.info("⏱️ Booking duration is automatically set by the selected service.")
        
        if st.form_submit_button("Submit"):
            dt = datetime.combine(b_date, b_time).isoformat()
            payload = {
                "contact_id": c_dict[c_sel], 
                "service_id": s_dict[s_sel]['id'], 
                "booking_datetime": dt, 
                "hours": s_dict[s_sel]['duration'] # Automatically pull the exact duration from the selected service
            }
            try:
                if action == "Add":
                    supabase.table("bookings").insert(payload).execute()
                    log_to_db("INFO", f"Scheduled booking for {c_sel}")
                else:
                    supabase.table("bookings").update(payload).eq("id", data['id']).execute()
                    log_to_db("INFO", f"Updated booking for {c_sel}")
            except Exception as e:
                log_to_db("ERROR", f"Booking {action} failed: {e}")
                st.error(f"Error saving booking: {e}")
            st.rerun()

# --- Main Tabs ---
tab1, tab2, tab3, tab4, tab5 = st.tabs(["📖 Bookings", "👥 Contacts", "✨ Services", "💬 Communication", "📊 System Logs"])

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
                log_to_db("INFO", f"Deleted contact: {selected_contact['name']}")
                st.rerun()
                
        st.divider()
        st.subheader("Client Bookings")
        
        # Filter bookings specifically for the selected contact
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
        # Pass the full service dictionary to the mapping so we can pull duration later
        s_mapping = {f"{sd['title']} ({sd['duration']} hrs)": sd for sd in s_data} if s_data else {}
        
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
                    log_to_db("INFO", f"Deleted future booking ID {b['id']}")
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
                    log_to_db("INFO", f"Deleted past booking ID {b['id']}")
                    st.rerun()
    else:
        st.info("No contacts found. Add one above.")

# --- TAB 3: SERVICES ---
with tab3:
    st.header("Service Management")
    
    cat_data = safe_fetch("service_categories")
    cat_dict = {c['name']: c['id'] for c in cat_data} if cat_data else {}
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("➕ Add Category"): 
            category_dialog("Add")
    with col2:
        if st.button("➕ Add New Service"): 
            service_dialog("Add", cat_dict)
            
    st.divider()
    
    s_data = safe_fetch("services")
    
    if not cat_data:
        st.info("No categories found. Add one above to get started.")
    else:
        for cat in cat_data:
            with st.expander(f"📁 {cat['name']}", expanded=True):
                cat_services = [s for s in s_data if s.get('category_id') == cat['id']] if s_data else []
                
                # Category management buttons
                cat_btn_c1, cat_btn_c2, _ = st.columns([2, 2, 6])
                if cat_btn_c1.button("✏️ Edit Category", key=f"ecat_{cat['id']}", use_container_width=True):
                    category_dialog("Edit", cat)
                if cat_btn_c2.button("🗑️ Delete Category", key=f"dcat_{cat['id']}", use_container_width=True):
                    # Ensure no services exist before deleting to prevent database errors
                    if cat_services:
                        st.error("Cannot delete a category that still contains services. Delete or move the services first.")
                    else:
                        supabase.table("service_categories").delete().eq("id", cat['id']).execute()
                        log_to_db("INFO", f"Deleted category: {cat['name']}")
                        st.rerun()
                        
                st.write("---")
                
                if not cat_services:
                    st.write("*No services in this category.*")
                else:
                    for row in cat_services:
                        cols = st.columns([3, 1, 1])
                        cols[0].write(f"**{row['title']}** (£{row['cost']} | {row['duration']} hrs)")
                        if cols[1].button("Edit", key=f"es{row['id']}"): 
                            service_dialog("Edit", cat_dict, row)
                        if cols[2].button("Delete", key=f"ds{row['id']}"):
                            supabase.table("services").delete().eq("id", row['id']).execute()
                            log_to_db("INFO", f"Deleted service: {row['title']}")
                            st.rerun()

# --- TAB 1: BOOKINGS ---
with tab1:
    st.header("Booking Management")
    c_data = safe_fetch("contacts")
    s_data = safe_fetch("services")
    
    if c_data and s_data:
        c_mapping = {c['name']: c['id'] for c in c_data}
        # Pass the full service dictionary to the mapping so we can pull duration later
        s_mapping = {f"{s['title']} ({s['duration']} hrs)": s for s in s_data}
        if st.button("➕ Schedule Booking"): 
            booking_dialog("Add", c_mapping, s_mapping)
    elif c_data == [] or s_data == []:
        st.warning("Please add at least one Contact and one Service before scheduling a booking.")
    
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

# --- TAB 4: COMMUNICATION ---
with tab4:
    st.header("Direct Messaging & Calls")
    
    ULTRAMSG_INSTANCE = st.secrets.get("ULTRAMSG_INSTANCE", "YOUR_INSTANCE")
    ULTRAMSG_TOKEN = st.secrets.get("ULTRAMSG_TOKEN", "YOUR_TOKEN")
    
    c_data = safe_fetch("contacts")
    if c_data:
        msg_dict = {f"{c['name']} ({c['contact_info']})": c['contact_info'] for c in c_data}
        sel = st.selectbox("Select Contact", options=list(msg_dict.keys()))
        target_number = msg_dict[sel]
        
        clean_target = "".join(filter(str.isdigit, str(target_number)))
        
        # Jitsi Video Integration
        with st.expander("📹 Video / Voice Call (Jitsi Meet)"):
            room_url = f"https://meet.jit.si/CRM_Meeting_{clean_target}"
            
            if st.button("📤 Send Call Link via WhatsApp"):
                try:
                    url = f"https://api.ultramsg.com/{ULTRAMSG_INSTANCE}/messages/chat"
                    payload = {
                        "token": ULTRAMSG_TOKEN,
                        "to": f"{clean_target}@c.us",
                        "body": f"Please join my secure video call here: {room_url}"
                    }
                    response = requests.post(url, data=payload)
                    response.raise_for_status()
                    
                    supabase.table("messages").insert({
                        "contact_info": clean_target,
                        "direction": "outbound",
                        "message_body": f"Please join my secure video call here: {room_url}"
                    }).execute()
                    
                    log_to_db("INFO", f"Sent Jitsi link to {clean_target}")
                    st.success("Link sent successfully!")
                    time_module.sleep(1)
                    st.rerun()
                except Exception as e:
                    log_to_db("ERROR", f"Failed to send Jitsi link: {e}")
                    st.error(f"Failed to send link: {e}")

            st.write("Join the call below:")
            components.html(
                f"""
                <iframe allow="camera; microphone; fullscreen; display-capture; autoplay" 
                        src="{room_url}" 
                        style="height: 600px; width: 100%; border: 0px; border-radius: 8px;">
                </iframe>
                """,
                height=600,
            )

        # Chat History Integration
        try:
            chat_history = supabase.table("messages").select("*").eq("contact_info", clean_target).order("timestamp", desc=False).execute().data
        except Exception as e:
            chat_history = []
            log_to_db("ERROR", f"Failed to load chat history: {e}")
        
        st.divider()
        st.subheader(f"Chat History with {sel.split(' (')[0]}")
        
        if st.button("🔄 Refresh Messages"):
            st.rerun()

        chat_container = st.container(height=400)
        with chat_container:
            if not chat_history:
                st.info("No messages yet.")
            for msg in chat_history:
                if msg['direction'] == "inbound":
                    st.chat_message("user", avatar="👤").write(msg['message_body'])
                else:
                    st.chat_message("assistant", avatar="💼").write(msg['message_body'])
        
        if new_message := st.chat_input("Type your message here..."):
            try:
                # Send via Ultramsg
                url = f"https://api.ultramsg.com/{ULTRAMSG_INSTANCE}/messages/chat"
                payload = {
                    "token": ULTRAMSG_TOKEN,
                    "to": f"{clean_target}@c.us",
                    "body": new_message
                }
                response = requests.post(url, data=payload)
                response.raise_for_status()
                
                # Save outgoing message to DB
                supabase.table("messages").insert({
                    "contact_info": clean_target,
                    "direction": "outbound",
                    "message_body": new_message
                }).execute()
                
                log_to_db("INFO", f"Sent message to {clean_target}")
                st.rerun() 
                
            except Exception as e:
                log_to_db("ERROR", f"Failed to send message: {e}")
                st.error(f"Failed to send message: {e}")
    else:
        st.info("Please add contacts in the Contact Management tab first.")

# --- TAB 5: SYSTEM LOGS ---
with tab5:
    st.header("System Logs")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Logs"):
            st.rerun()
    with col2:
        if st.button("🗑️ Clear Logs"):
            try:
                # Safely delete logs by targeting an impossible condition
                supabase.table("app_logs").delete().neq("id", -1).execute()
            except Exception as e:
                st.error("⚠️ Failed to clear logs. Please disable RLS on the `app_logs` table in Supabase.")
                time_module.sleep(3)
            st.rerun()

    logs_data = safe_fetch("app_logs", "*", order_col="created_at", order_desc=True)
    if logs_data:
        logs_df = pd.DataFrame(logs_data)
        logs_df['created_at'] = pd.to_datetime(logs_df['created_at']).dt.strftime('%Y-%m-%d %H:%M:%S')
        st.dataframe(logs_df[['created_at', 'source', 'level', 'message']], use_container_width=True)
    else:
        st.info("No logs recorded yet.")
