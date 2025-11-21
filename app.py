import streamlit as st
import os
import subprocess

# ==================== AUTO BUILD VITE (only on Streamlit Cloud) ====================
if not os.path.exists("dist") and os.path.exists("package.json"):
    with st.spinner("🛠️ Building Vedic AI frontend... (first deploy only, ~45 sec)"):
        subprocess.run("npm install --silent", shell=True, check=True)
        subprocess.run("npm run build --silent", shell=True, check=True)
    st.success("Frontend ready!")
    st.rerun()

# ==================== ALWAYS USE THE BUILT DIST FOLDER (NO localhost!) ====================
# On Streamlit Cloud → serve from ./dist (relative path)
# Locally → also works because dist exists after you run npm run build once
final_url = "./dist"

# ==================== STREAMLIT UI ====================
st.set_page_config(page_title="Vedic AI - Ancient Wisdom × AI", layout="centered")

st.title("🕉️ Vedic AI")
st.markdown("### Ancient Vedic Wisdom Powered by Modern AI")

# This magic line serves the entire dist folder correctly on Streamlit Cloud
st.components.v1.html(
    open("dist/index.html", "r", encoding="utf-8").read(),
    height=900,
    scrolling=True
)

st.caption("Made with ❤️ by DDG webtech • ")