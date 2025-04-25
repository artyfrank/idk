const express = require('express');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const stat = promisify(fs.stat);

const app = express();
const port = 3000; // You can change this to any available port

// Serve static files (HTML, CSS, JavaScript, etc.) from the 'public' directory
app.use(express.static('public'));

// Serve audio files from the 'audio' directory
app.use('/audio', express.static('audio'));

// Route to the main page (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to list audio files
app.get('/api/audio-files', async (req, res) => {
    const audioDir = path.join(__dirname, 'audio');

    try {
        const files = await fs.promises.readdir(audioDir);
        const audioFiles = [];

        for (const file of files) {
            const filePath = path.join(audioDir, file);
            const fileStats = await stat(filePath);
            if (fileStats.isFile() && /\.(mp3|wav|ogg)$/i.test(file)) {
                audioFiles.push({
                    name: file,
                    url: `/audio/${file}`, // Corrected URL path
                    size: fileStats.size,
                    // Add more metadata if needed (e.g., duration, using a library like 'node-id3')
                });
            }
        }
        res.json(audioFiles);
    } catch (err) {
        console.error('Error reading audio files:', err);
        res.status(500).json({ error: 'Failed to retrieve audio files' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Create 'public' and 'audio' directories if they don't exist
const createDirectories = async () => {
  try {
    await fs.promises.mkdir(path.join(__dirname, 'public'), { recursive: true });
    await fs.promises.mkdir(path.join(__dirname, 'audio'), { recursive: true });
     // Create a simple index.html if it doesn't exist
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (!fs.existsSync(indexPath)){
        fs.writeFileSync(indexPath, `
<!DOCTYPE html>
<html>
<head>
    <title>Audio Player</title>
    <link rel="stylesheet" type="text/css" href="/style.css">
</head>
<body>
    <div class="container">
        <h1>Audio Player</h1>
        <ul id="audio-list"></ul>
    </div>
    <script src="/script.js"></script>
</body>
</html>
        `);
    }
     // Create a simple style.css if it doesn't exist
    const stylePath = path.join(__dirname, 'public', 'style.css');
    if (!fs.existsSync(stylePath)){
        fs.writeFileSync(stylePath, `
body {
    font-family: sans-serif;
    background-color: #f0f0f0;
}
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
}
ul {
    list-style: none;
    padding: 0;
}
li {
    margin-bottom: 10px;
}
button {
    padding: 10px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}
button:hover {
    background-color: #0056b3;
}
        `);
    }

    // Create a simple script.js if it doesn't exist
    const scriptPath = path.join(__dirname, 'public', 'script.js');
    if (!fs.existsSync(scriptPath)){
        fs.writeFileSync(scriptPath, `
const audioList = document.getElementById('audio-list');

fetch('/api/audio-files')
    .then(response => response.json())
    .then(audioFiles => {
        audioFiles.forEach(file => {
            const listItem = document.createElement('li');
            const audio = document.createElement('audio');
            audio.src = file.url;
            audio.controls = true;
            audio.preload = 'metadata'; // Load metadata to get duration, etc.
            listItem.textContent = file.name + \` (\${(file.size / 1024).toFixed(2)} KB)\`; //Added file size
            listItem.appendChild(audio);
            audioList.appendChild(listItem);
        });
    })
    .catch(error => console.error('Error fetching audio files:', error));
        `);
    }


    console.log("Directories created successfully.");
  } catch (error) {
    console.error("Error creating directories:", error);
  }
};

// Call createDirectories to ensure the directories exist
createDirectories();
