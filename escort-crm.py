import streamlit as st
import pandas as pd
from datetime import date, datetime, time
import time as time_module
import requests
from supabase import create_client, Client
import streamlit.components.v1 as components

@st.cache_resource
def init_connection() -> Client:
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)

supabase = init_connection()

def log_to_db(level, message):
    try:
        supabase.table("app_logs").insert({"source": "Streamlit_App", "level": level, "message": message}).execute()
    except Exception:
        pass

def safe_fetch(table, select_query="*", order_col=None, order_desc=False):
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

@st.dialog("Add Main Category")
def add_main_category_dialog():
    with st.form("main_cat_form"):
        name = st.text_input("Category Name")
        if st.form_submit_button("Submit"):
            try:
                supabase.table("service_categories").insert({"name": name, "parent_id": None}).execute()
                log_to_db("INFO", f"Added main category: {name}")
            except Exception as e:
                log_to_db("ERROR", f"Failed to add category: {e}")
                st.error(f"Error: {e}")
            st.rerun()

@st.dialog("Category Explorer", width="large")
def category_explorer_dialog(main_cat_id):
    cat_data = safe_fetch("service_categories")
    s_data = safe_fetch("services")
    main_cats = [c for c in cat_data if not c.get('parent_id')] if cat_data else []
    
    main_cat = next((c for c in main_cats if c['id'] == main_cat_id), None)
    if not main_cat:
        st.error("Category not found or deleted.")
        return

    # Setup isolated view state for this specific dialog session
    if st.session_state.get('active_explorer_cat') != main_cat_id:
            if c3.button("🗑️ Delete", use_container_width=True):
                sub_cats = [c for c in cat_data if c.get('parent_id') == main_cat['id']]
                cat_services = [s for s in s_data if s.get('category_id') == main_cat['id']]
                if sub_cats or cat_services:
                    st.error("Remove sub-categories and services before deleting.")
                else:
                    supabase.table("service_categories").delete().eq("id", main_cat['id']).execute()
                    st.rerun()

        st.divider()
        sub_cats = [c for c in cat_data if c.get('parent_id') == main_cat['id']]
        if not sub_cats:
            st.info("No sub-categories found. Click 'Add Sub-Category' above.")
        else:
            st.write("#### Select a Sub-Category:")
            sc_cols = st.columns(2)
            for i, scat_row in enumerate(sub_cats):
                with sc_cols[i % 2]:
                    if st.button(f"📂 {scat_row['name']}", key=f"sc_btn_{scat_row['id']}", use_container_width=True):
                        st.session_state.explorer_view = 'services'
                        st.session_state.explorer_sub_cat = scat_row
                        st.rerun()

        main_cat_services = [s for s in s_data if s.get('category_id') == main_cat['id']]
        if main_cat_services:
            st.divider()
            st.write("#### Services Directly in this Category")
            for row in main_cat_services:
                with st.container(border=True):
                    cols = st.columns([4, 1, 1])
                    cols[0].write(f"**{row['title']}**<br>£{row['cost']} | {row['duration']} hrs", unsafe_allow_html=True)
                    if cols[1].button("Edit", key=f"es_main_{row['id']}", use_container_width=True):
                        st.session_state.explorer_service = row
                        st.session_state.explorer_sub_cat = main_cat 
                        st.session_state.explorer_view = 'edit_service'
                        st.rerun()
                    if cols[2].button("Delete", key=f"ds_main_{row['id']}", use_container_width=True):
                        supabase.table("services").delete().eq("id", row['id']).execute()
                        st.rerun()

    elif view == 'edit_main':
        st.markdown(f"### ✏️ Edit {main_cat['name']}")
        if st.button("⬅️ Back"):
            st.session_state.explorer_view = 'sub_cats'
            st.rerun()
        with st.form("edit_main_form"):
            new_name = st.text_input("Category Name", value=main_cat['name'])
            if st.form_submit_button("Save"):
                supabase.table("service_categories").update({"name": new_name}).eq("id", main_cat['id']).execute()
                st.session_state.explorer_view = 'sub_cats'
                st.rerun()

    elif view == 'add_sub':
        st.markdown(f"### ➕ Add Sub-Category to {main_cat['name']}")
        if st.button("⬅️ Back"):
            st.session_state.explorer_view = 'sub_cats'
            st.rerun()
        with st.form("add_sub_form"):
            scat_name = st.text_input("Sub-Category Name")
            if st.form_submit_button("Save"):
                supabase.table("service_categories").insert({"name": scat_name, "parent_id": main_cat['id']}).execute()
                st.session_state.explorer_view = 'sub_cats'
                st.rerun()

    elif view == 'services':
        st.markdown(f"### 📂 {main_cat['name']} > {scat['name']}")
        c1, c2, c3, c4 = st.columns([1, 1.5, 1, 1])
        if c1.button("⬅️ Back"):
            st.session_state.explorer_view = 'sub_cats'
            st.rerun()
        if c2.button("➕ Add Service"):
            st.session_state.explorer_view = 'add_service'
            st.rerun()
        if c3.button("✏️ Edit"):
            st.session_state.explorer_view = 'edit_sub'
            st.rerun()
        if c4.button("🗑️ Delete"):
            scat_services_check = [s for s in s_data if s.get('category_id') == scat['id']]
            if scat_services_check:
                st.error("Remove services before deleting.")
            else:
                supabase.table("service_categories").delete().eq("id", scat['id']).execute()
                st.session_state.explorer_view = 'sub_cats'
                st.rerun()

        st.divider()
        scat_services = [s for s in s_data if s.get('category_id') == scat['id']]
        if not scat_services:
            st.info("No services found in this sub-category.")
        else:
            for row in scat_services:
                with st.container(border=True):
                    cols = st.columns([4, 1, 1])
                    cols[0].write(f"**{row['title']}**<br>£{row['cost']} | {row['duration']} hrs", unsafe_allow_html=True)
                    if cols[1].button("Edit", key=f"es_sub_{row['id']}", use_container_width=True):
                        st.session_state.explorer_service = row
                        st.session_state.explorer_view = 'edit_service'
                        st.rerun()
                    if cols[2].button("Delete", key=f"ds_sub_{row['id']}", use_container_width=True):
                        supabase.table("services").delete().eq("id", row['id']).execute()
                        st.rerun()

    elif view == 'edit_sub':
        st.markdown(f"### ✏️ Edit {scat['name']}")
        if st.button("⬅️ Back"):
            st.session_state.explorer_view = 'services'
            st.rerun()
        with st.form("edit_sub_form"):
            new_name = st.text_input("Sub-Category Name", value=scat['name'])
            if st.form_submit_button("Save"):
                supabase.table("service_categories").update({"name": new_name}).eq("id", scat['id']).execute()
                st.session_state.explorer_sub_cat['name'] = new_name 
                st.session_state.explorer_view = 'services'
                st.rerun()

    elif view in ['add_service', 'edit_service']:
        is_edit = (view == 'edit_service')
        srv_data = st.session_state.explorer_service if is_edit else None
        title_prefix = "✏️ Edit" if is_edit else "➕ Add"
        st.markdown(f"### {title_prefix} Service")
        
        if st.button("⬅️ Back"):
            st.session_state.explorer_view = 'services' if scat.get('parent_id') else 'sub_cats'
            st.rerun()
            
        cat_options = []
        for c in cat_data:
            if c.get('parent_id'):
                parent = next((p for p in cat_data if p['id'] == c['parent_id']), None)
                p_name = parent['name'] if parent else "Unknown"
                cat_options.append({"id": c['id'], "label": f"📁 {p_name} > 📂 {c['name']}"})
            else:
                cat_options.append({"id": c['id'], "label": f"📁 {c['name']}"})
                
        cat_options.sort(key=lambda x: x['label'])
        cat_labels = [opt['label'] for opt in cat_options]
        
        current_cat_id = srv_data['category_id'] if srv_data else scat['id']
        current_idx = 0
        for i, opt in enumerate(cat_options):
            if opt['id'] == current_cat_id:
                current_idx = i
                break
            
        with st.form("service_form"):
            selected_cat_label = st.selectbox("Location / Category", cat_labels, index=current_idx)
            selected_cat_id = next(opt['id'] for opt in cat_options if opt['label'] == selected_cat_label)
            
            t = st.text_input("Title", value=srv_data['title'] if srv_data else "")
            d = st.number_input("Hours", value=float(srv_data['duration']) if srv_data else 0.5, step=0.5)
            c = st.number_input("Cost (£)", value=float(srv_data['cost']) if srv_data else 0.0, step=10.0)
            a = st.number_input("Additional Costs (£)", value=float(srv_data['additional_costs']) if srv_data else 0.0, step=10.0)
            type_options = ["In-call", "Out-call", "Both"]
            ctype = st.selectbox("Type", type_options, index=type_options.index(srv_data['call_type']) if srv_data else 0)
            
            if st.form_submit_button("Save"):
                payload = {
                    "category_id": selected_cat_id,
                    "title": t, "duration": d, "call_type": ctype, "cost": c, "additional_costs": a
                }
                if is_edit:
                    supabase.table("services").update(payload).eq("id", srv_data['id']).execute()
                else:
                    supabase.table("services").insert(payload).execute()
                st.session_state.explorer_view = 'services' if scat.get('parent_id') else 'sub_cats'
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
                if s_dict[name]['id'] == data['service_id']: s_idx = i
                
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
        
        st.info("⏱️ Booking duration is automatically set by the selected service.")
        
        if st.form_submit_button("Submit"):
            dt = datetime.combine(b_date, b_time).isoformat()
            payload = {
                "contact_id": c_dict[c_sel], 
                "service_id": s_dict[s_sel]['id'], 
                "booking_datetime": dt, 
                "hours": s_dict[s_sel]['duration'] 
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

tab1, tab2, tab3, tab4, tab5 = st.tabs(["📖 Bookings", "👥 Contacts", "✨ Services", "💬 Communication", "📊 System Logs"])

with tab2:
    st.header("Contact Management")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("➕ Add New Contact", use_container_width=True): 
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
        s_mapping = {f"{sd['title']} ({sd['duration']} hrs)": sd for sd in s_data} if s_data else {}
        
        st.write("### Upcoming Bookings")
        if not future_bookings:
            st.info("No upcoming bookings.")
        else:
            for b in future_bookings:
                with st.container(border=True):
                    bc1, bc2, bc3 = st.columns([4, 1, 1])
                    svc_title = b['services']['title'] if b.get('services') else "Unknown Service"
                    bc1.write(f"📅 **{b['dt_obj'].strftime('%Y-%m-%d %H:%M')}** | {svc_title} ({b['hours']} hrs)")
                    if bc2.button("Edit", key=f"eb_f_{b['id']}", use_container_width=True):
                        booking_dialog("Edit", c_mapping, s_mapping, b)
                    if bc3.button("Delete", key=f"db_f_{b['id']}", use_container_width=True):
                        supabase.table("bookings").delete().eq("id", b['id']).execute()
                        log_to_db("INFO", f"Deleted future booking ID {b['id']}")
                        st.rerun()

        st.write("### Past Bookings")
        if not past_bookings:
            st.info("No past bookings.")
        else:
            for b in past_bookings:
                with st.container(border=True):
                    bc1, bc2, bc3 = st.columns([4, 1, 1])
                    svc_title = b['services']['title'] if b.get('services') else "Unknown Service"
                    bc1.write(f"📅 **{b['dt_obj'].strftime('%Y-%m-%d %H:%M')}** | {svc_title} ({b['hours']} hrs)")
                    if bc2.button("Edit", key=f"eb_p_{b['id']}", use_container_width=True):
                        booking_dialog("Edit", c_mapping, s_mapping, b)
                    if bc3.button("Delete", key=f"db_p_{b['id']}", use_container_width=True):
                        supabase.table("bookings").delete().eq("id", b['id']).execute()
                        log_to_db("INFO", f"Deleted past booking ID {b['id']}")
                        st.rerun()
    else:
        st.info("No contacts found. Add one above.")

with tab3:
    st.header("Service Management")
    
    cat_data = safe_fetch("service_categories")
    main_cats = [c for c in cat_data if not c.get('parent_id')] if cat_data else []
    
    if st.button("➕ Add Main Category", use_container_width=True): 
        add_main_category_dialog()
            
    st.divider()
    
    if not main_cats:
        st.info("No categories found. Click 'Add Main Category' to get started.")
    else:
        st.write("#### Select a Category:")
        # Render a clean grid of buttons for the Main Categories
        cols = st.columns(3)
        for i, cat in enumerate(main_cats):
            with cols[i % 3]:
                if st.button(f"📁 {cat['name']}", key=f"mc_btn_{cat['id']}", use_container_width=True):
                    category_explorer_dialog(cat['id'])

with tab1:
    st.header("Booking Management")
    c_data = safe_fetch("contacts")
    s_data = safe_fetch("services")
    
    if c_data and s_data:
        c_mapping = {c['name']: c['id'] for c in c_data}
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

        chat_history = safe_fetch("messages", "*")
        chat_history = [msg for msg in chat_history if msg['contact_info'] == clean_target]
        chat_history.sort(key=lambda x: x['timestamp'])
        
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
                url = f"https://api.ultramsg.com/{ULTRAMSG_INSTANCE}/messages/chat"
                payload = {
                    "token": ULTRAMSG_TOKEN,
                    "to": f"{clean_target}@c.us",
                    "body": new_message
                }
                response = requests.post(url, data=payload)
                response.raise_for_status()
                
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

with tab5:
    st.header("System Logs")
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Logs"):
            st.rerun()
    with col2:
        if st.button("🗑️ Clear Logs"):
            try:
                supabase.table("app_logs").delete().neq("id", 0).execute()
            except Exception:
                pass
            st.rerun()

    logs_data = safe_fetch("app_logs", "*", order_col="created_at", order_desc=True)
    if logs_data:
        logs_df = pd.DataFrame(logs_data)
        logs_df['created_at'] = pd.to_datetime(logs_df['created_at']).dt.strftime('%Y-%m-%d %H:%M:%S')
        st.dataframe(logs_df[['created_at', 'source', 'level', 'message']], use_container_width=True)
    else:
        st.info("No logs recorded yet.")
