const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/compile', (req, res) => {
  const { code, fqbn = 'arduino:avr:uno' } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, error: 'No code provided' });
  }

  const sketchDir = `/tmp/sketch_${Date.now()}`;
  const sketchFile = path.join(sketchDir, 'sketch.ino');

  try {
    fs.mkdirSync(sketchDir, { recursive: true });
    fs.writeFileSync(sketchFile, code);

    exec(`arduino-cli compile --fqbn ${fqbn} --output-dir ${sketchDir}/build ${sketchDir}`, 
      (error, stdout, stderr) => {
        if (error) {
          return res.status(400).json({ 
            success: false, 
            error: stderr || error.message 
          });
        }

        const hexPath = path.join(sketchDir, 'build', 'sketch.ino.hex');
        
        if (fs.existsSync(hexPath)) {
          const hex = fs.readFileSync(hexPath, 'base64');
          res.json({ success: true, hex });
        } else {
          res.status(500).json({ success: false, error: 'Hex file not found' });
        }

        // Clean up
        try {
          fs.rmSync(sketchDir, { recursive: true, force: true });
        } catch (e) {}
      }
    );
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Arduino Compiler is running ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
