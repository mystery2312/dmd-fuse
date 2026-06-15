# 📌 DMD FUSE 

**DMD FUSE** is a lightweight, dual-component solution (Node.js Server + Android App) designed to capture the raw DMD (Dot Matrix Display) stream from **VPX Standalone** and display it beautifully on an Android device. 

Perfect for virtual pinball cabinets (pincabs), Samsung DeX environments, or dual-screen Android setups!

---

## ✨ Features
* **Real-Time Streaming:** Captures VPX TCP streams and forwards them instantly via WebSockets to the Android display.
* **Standard & HD Support:** Easily toggle between Standard (128x32) and ColorDMD HD (256x64) resolutions directly from the app.
* **Custom Backglass:** Choose from built-in classic table presets or upload your own custom animated (MP4/GIF) or static (JPG/PNG) backglass.
* **Surgical Alignment:** Fine-tune the horizontal and vertical pixel offsets independently for SD and HD tables in the server code.
* **100% Android Compatible:** The server can be run on a PC or completely natively on your Android device using Termux for a standalone arcade experience.

---

## 🛠️ Prerequisites

1. **VPX Standalone** installed and working.
2. An **Android Device** (Tablet, Phone, or Android TV box).
3. **Node.js** installed on the device hosting the server (PC or Android via Termux).

---

## 🚀 Installation & Setup

DMD FUSE works in two parts: the **Server** (which listens to VPX) and the **Android App** (which displays the visuals).

### Part 1: The Server (`server.js`)
The server acts as a bridge between VPX and the App.

1. Download the `server.js` file and place it in a dedicated folder.
2. Open a terminal/command prompt in that folder and install the required WebSocket library by running:
   `npm install ws`
3. Start the server:
   `node server.js`
   *(The console will display your Server IP and the ports used. By default: TCP 6789 and WS 8080).*

### Part 2: The Android App
1. Download the latest `DMD_FUSE.apk` from the Releases tab.
2. Transfer the APK to your Android device and install it (you may need to allow "Installation from unknown sources" in your Android settings).

---

## 🎮 How to Use

### 1. Configure VPX Standalone
In your VPX Standalone settings, you need to route the DMD output to the DMD FUSE Server.
* **IP Address:** Enter the IP address of the machine running `server.js` (Use `127.0.0.1` if you are running the server via Termux directly on the same Android device).
* **Port:** `6789` (Default TCP port).

### 2. Connect the App
1. Open the **DMD FUSE** app on your Android device.
2. In the top connection bar, enter the **IP Address** of the machine running the server.
3. Tap **Connexion**. 
4. The server console should display `📱 Android APK connected successfully.`

### 3. Customize Your Display (Settings Menu)
Tap the **⚙️ (Gear Icon)** in the bottom right corner of the app to open the Settings:
* **Classic Tables:** Tap any preset thumbnail to instantly load a classic backglass.
* **Custom Backglass:** Tap "Choose File" to upload your own image. *(Note: MP4 animations can be added to the source code before compiling the APK, or uploaded per-session).*
* **DMD Resolution:** Toggle between **Standard (128x32)** for classic tables and **HD (256x64)** for modern/ColorDMD tables (e.g., Ghostbusters).

---

## 📱 Advanced: Running 100% Standalone on Android (No PC needed)

If you run VPX Standalone on your Android device, you can run the DMD FUSE server on the exact same device using **Termux**, resulting in zero network latency!

1. Install **Termux** from F-Droid (Do not use the Google Play Store version).
2. Open Termux and grant storage access:
   `termux-setup-storage`
3. Install Node.js:
   `pkg install nodejs`
4. Navigate to the folder where you saved `server.js` (e.g., Downloads folder):
   `cd storage/shared/Download`
5. Run the server:
   `node server.js`
6. In both VPX Standalone and the DMD FUSE App, use `127.0.0.1` as the IP address.

---

## ⚙️ Advanced Configuration (Offsets)

If the DMD image is slightly misaligned (cut off or shifted), you can adjust the surgical offset directly in `server.js`. Open the file in any text editor and modify these lines:

```javascript
// -> Settings for Standard DMD (128x32)
const pixels_h_sd = 59; // Horizontal shift
const lignes_v_sd = 1;  // Vertical shift

// -> Settings for HD DMD (256x64)
const pixels_h_hd = 118; 
const lignes_v_hd = 2;   
