# recoNmap

A simple web app for viewing Nmap scan results and tracking vulnerabilities.

<img width="1228" height="1021" alt="image" src="https://github.com/user-attachments/assets/3e7912a4-cd5f-40de-8cd5-a4b9bdd09af7" />


## What does it do?

- **Upload Nmap scans** - Drag and drop your `.xml` or `.gnmap` scan files
- **Browse hosts & ports** - See all discovered hosts, open ports, and services
- **Track vulnerabilities** - Log security findings with severity, CVSS scores, and evidence (including screenshots)
- **Works offline** - Everything runs in your browser, data stays on your machine

## Installation

### Step 1: Install Node.js

If you don't have Node.js installed:

- **Windows/Mac**: Download from [nodejs.org](https://nodejs.org/) (choose the LTS version)
- **Linux**: Run `sudo apt install nodejs npm`

To check if it's installed, open a terminal and run:
```bash
node --version
```
If you see a version number, you're good.

### Step 2: Download this project

Option A - If you have git:
```bash
git clone https://github.com/mbb5546/reconmap.git
cd reconmap
```

Option B - No git? Click the green "Code" button on GitHub, then "Download ZIP". Unzip it and open a terminal in that folder.

### Step 3: Install dependencies

This downloads the packages the app needs (only required once):
```bash
npm install
```

### Step 4: Run the app

```bash
npm run dev
```

You'll see something like:
```
  VITE v6.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. That's it!

## How to use

1. **Upload a scan** - Drag and drop an Nmap XML or gnmap file onto the drop zone
2. **Browse results** - Use the tabs to view Hosts, Ports, Web URLs
3. **Track vulnerabilities** - Go to the Vulnerabilities tab to log findings
   - Add a title, description, severity, and affected hosts
   - Paste screenshots directly into the evidence field
4. **Data persists** - Your data saves automatically. Refresh the page and it's still there.

## Tips

- Use the **filter controls** to search hosts by IP, port, or service
- **Paste multiple IPs** into the affected assets field (one per line)
- **Paste screenshots** (Ctrl+V) into the evidence text area
- Click **"Evidence"** on a vulnerability to expand and view attachments
- Click the **sun/moon icon** to toggle dark/light mode

## Troubleshooting

**"npm: command not found"**
Node.js isn't installed. See Step 1.

**"npm install" shows errors**
Try deleting the `node_modules` folder and running `npm install` again.

**Page is blank**
Make sure you're opening the URL shown in the terminal (usually http://localhost:5173), not a file path.

## License

MIT - Use it however you want.
