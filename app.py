import streamlit as st
import os
import subprocess
import threading
import http.server
import socketserver
import urllib.request
import time

# ====================== AUTO BUILD VITE FRONTEND ======================
if not os.path.exists("dist") and os.path.exists("package.json"):
    with st.spinner("Building Vedic AI frontend... (first time only, takes ~30–60 sec)"):
        subprocess.run("npm install", shell=True, check=True)
        subprocess.run("npm run build", shell=True, check=True)
    st.success("Frontend built successfully!")
    st.rerun()  # Refresh to see the app

# ====================== CONFIG ======================
BUILD_DIR = os.path.join(os.path.dirname(__file__), "dist")
STATIC_PORT = 3002
GITHUB_PAGES_URL = "https://deepaksharma596.github.io/vedic-Ai/"

# ====================== CHECK IF GITHUB PAGES IS LIVE ======================
def url_is_available(url, timeout=3.0):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status == 200
    except:
        return False

# ====================== START LOCAL SERVER (only if needed) ======================
def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("0.0.0.0", STATIC_PORT), handler) as httpd:
        os.chdir(BUILD_DIR)
        httpd.serve_forever()

if url_is_available(GITHUB_PAGES_URL):
    final_url = GITHUB_PAGES_URL
else:
    # Start local static server in background
    thread = threading.Thread(target=start_server, daemon=True)
    thread.start()
    time.sleep(1)  # give server time to start
    final_url = f"http://localhost:{STATIC_PORT}"

# ====================== STREAMLIT UI ======================
st.set_page_config(page_title="Vedic AI - Ancient Wisdom Meets AI", layout="centered")

st.title("🕌 Vedic AI")
st.markdown("### Ancient Vedic Wisdom Powered by Modern AI")

# Full-width iframe — looks beautiful on mobile too
st.components.v1.iframe(final_url, height=800, scrolling=True)

st.markdown("---")
st.caption("Made with ❤️ by Deepak Sharma • Deployed instantly on Streamlit Cloud")