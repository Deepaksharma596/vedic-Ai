import threading
import http.server
import socketserver
import os
import time
import urllib.request
import streamlit as st

# Configuration
BUILD_DIR = os.path.join(os.path.dirname(__file__), "dist")  # Vite output (local)
STATIC_PORT = 3002

# Prefer the GitHub Pages URL for the repo (deployed by the workflow). Replace owner/repo as needed.
GITHUB_PAGES_URL = "https://Deepaksharma596.github.io/vedic-Ai/"


def start_static_server(directory: str, port: int):
    # Serve the provided directory without changing the process working directory.
    # Use the built-in handler's `directory` argument (Python 3.7+).
    handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(*args, directory=directory, **kwargs)
    with socketserver.TCPServer(("0.0.0.0", port), handler) as httpd:
        httpd.serve_forever()


# Try to use GitHub Pages first — this avoids running a local static server in hosted environments.
def url_is_available(check_url: str, timeout: float = 2.0) -> bool:
    try:
        with urllib.request.urlopen(check_url, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False

if url_is_available(GITHUB_PAGES_URL):
    url = GITHUB_PAGES_URL
else:
    # Fall back to local static server (useful for local dev)
    if not os.path.isdir(BUILD_DIR):
        st.error(f"Build directory not found: {BUILD_DIR}\nRun `npm run build` in the project root first.")
        st.stop()

    server_thread = threading.Thread(target=start_static_server, args=(BUILD_DIR, STATIC_PORT), daemon=True)
    server_thread.start()

    url = f"http://localhost:{STATIC_PORT}/"
    for _ in range(30):
        if url_is_available(url):
            break
        time.sleep(0.2)
    else:
        st.error(f"Failed to start static server at {url}. Check for port conflicts.")
        st.stop()

# Streamlit UI
st.set_page_config(page_title="Vedic Wisdom (Embedded)", layout="wide")
st.title("Vedic Wisdom — Embedded React App")
st.markdown("This page embeds the built Vite React app served locally on port {STATIC_PORT}.")

# Embed the app via iframe
st.components.v1.iframe(url, height=900, scrolling=True)

st.markdown("---")
st.caption("If the embedded app is blank, make sure you ran `npm run build` and no other process is using the static port.")
