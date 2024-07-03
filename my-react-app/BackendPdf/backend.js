/*const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const dbURI = 'mongodb+srv://golusulaneethuchandra:meenag@cluster0.uj8kyom.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error(err));



// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});
const UserModel = mongoose.model('User', userSchema);

// Media Model
const Media = mongoose.model('Media', new mongoose.Schema({
  name: { type: String, required: true },
  videos: [{ type: String }] // Array of video URLs
}));

// Audio Schema and Model
const audioSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  audioPath: { type: String, required: true }
});
const Audio = mongoose.model('Audio', audioSchema);


// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// Transcription Function
async function transcribeVideo(videoPath, textFilePath, mediaId) {
    try {
        // Convert video to audio
        const audioPath = 'output_audio.mp3';
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .audioBitrate(128)
                .save(audioPath)
                .on('end', () => {
                    console.log('Audio extraction complete.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Error during audio extraction:', err);
                    reject(err);
                });
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

// Routes
// GET all media
app.get('/api/v1/media/all', async (req, res) => {
  try {
    const medias = await Media.find();
    res.json(medias);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST upload media
app.post('/api/v1/media/upload', upload.array('videos', 12), async (req, res) => {
  try {
    const { name } = req.body;
    const videoPaths = req.files.map(file => `/${file.path}`);

    // Save uploaded videos to the database
    const newMedia = new Media({
      name,
      videos: videoPaths
    });
    await newMedia.save();

    // Convert uploaded videos to audio and store in the database
    const audioPromises = videoPaths.map((videoPath) => {
      return new Promise(async (resolve, reject) => {
        try {
          const videoFullPath = path.join(__dirname, videoPath);
          const audioOutput = path.join(__dirname, 'audios', path.basename(videoPath).replace(/\.[^.]+$/, '.mp3'));
          
          console.log(`Converting video: ${videoFullPath} to audio: ${audioOutput}`);
          
          ffmpeg(videoFullPath)
            .on('end', async () => {
              const audioPath = `/audios/${path.basename(audioOutput)}`;
              const newAudio = new Audio({
                mediaId: newMedia._id,
                audioPath
              });

              try {
                await newAudio.save();
                console.log(`Saved audio: ${audioPath}`);
                resolve(newAudio);
              } catch (dbError) {
                console.error('Error saving audio to database:', dbError);
                reject(dbError);
              }

              // Transcribe the audio and save transcription
              const textFilePath = path.join(__dirname, 'transcriptions', `${path.basename(videoPath, path.extname(videoPath))}.txt`);
              await transcribeVideo(audioOutput, textFilePath, newMedia._id);
            })
            .on('error', (error) => {
              console.error('Error during FFmpeg processing:', error);
              reject(error);
            })
            .save(audioOutput);
        } catch (error) {
          console.error('Error processing video:', error);
          reject(error);
        }
      });
    });

    await Promise.all(audioPromises);

    res.json(newMedia);
  } catch (err) {
    console.error('Error in /api/v1/media/upload route:', err);
    res.status(500).send('Server Error');
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audios', express.static(path.join(__dirname, 'audios')));
app.use('/transcriptions', express.static(path.join(__dirname, 'transcriptions')));
app.use('/files', express.static(path.join(__dirname, 'files')));

// Additional code for PDFs
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files');
  },
  filename: function (req, file, cb
  ) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const pdfUpload = multer({ storage: pdfStorage });

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pdf: { type: String, required: true }
});
const PdfModel = mongoose.model("pdfDetails", pdfSchema);

app.post("/upload-files", pdfUpload.single("file"), async (req, res) => {
  console.log("File upload request received");
  console.log("Uploaded file:", req.file);
  const title = req.body.title;
  const fileName = req.file.filename;
  try {
    await PdfModel.create({ title: title, pdf: fileName });
    console.log("File saved to database:", fileName);
    res.send({ status: "ok" });
  } catch (error) {
    console.error("Error saving file to database:", error);
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  console.log("Get files request received");
  try {
    const data = await PdfModel.find({});
    console.log("Files retrieved from database:", data);
    res.send({ status: "ok", data: data });
  } catch (error) {
    console.error("Error retrieving files from database:", error);
    res.json({ status: error });
  }
});


// User registration
app.post("/register", async (req, res) => {
  console.log("User registration request received");
  const { email, password } = req.body;
  try {
    const newUser = new UserModel({ email, password });
    await newUser.save();
    console.log("New user registered:", email);
    res.send({ status: "ok" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.json({ status: error });
  }
});

// User login
app.post("/login", async (req, res) => {
  console.log("User login request received");
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email, password });
    if (user) {
      console.log("User logged in:", email);
      res.send({ status: "ok", user: user });
    } else {
      console.log("Invalid credentials for user:", email);
      res.send({ status: "error", message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during user login:", error);
    res.json({ status: error });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});*/
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const dbURI = 'mongodb+srv://golusulaneethuchandra:meenag@cluster0.uj8kyom.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error(err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});
const UserModel = mongoose.model('User', userSchema);

// Media Model
const Media = mongoose.model('Media', new mongoose.Schema({
  name: { type: String, required: true },
  videos: [{ type: String }] // Array of video URLs
}));

// Audio Schema and Model
const audioSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  audioPath: { type: String, required: true }
});
const Audio = mongoose.model('Audio', audioSchema);

// Transcription Schema and Model
const transcriptionSchema = new mongoose.Schema({
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
  transcription: { type: String, required: true }
});
const Transcription = mongoose.model('Transcription', transcriptionSchema);

// Storage for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

async function transcribeVideo(videoPath, textFilePath, mediaId) {
  try {
    // Convert video to audio
    const audioPath = path.join(__dirname, 'audios', `${Date.now()}.mp3`);
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .audioBitrate(128)
        .save(audioPath)
        .on('end', () => {
          console.log('Audio extraction complete.');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error during audio extraction:', err);
          reject(err);
        });
    });

    // Send the audio file to the Flask server for transcription
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));

    const response = await axios.post('http://localhost:5000/transcribe', form, {
      headers: {
        ...form.getHeaders()
      }
    });
     
    

    const { transcription } = response.data;

    // Save the transcription to a text file
    fs.writeFileSync(textFilePath, transcription, 'utf8');
    console.log(`Transcription saved to ${textFilePath}`);

    // Save the transcription to the database
    const transcriptionData = {
      mediaId,
      transcription
    };
    
    await Transcription.create(transcriptionData);
    console.log('Transcription saved to the database');

  } catch (error) {
    console.error('Error during transcription:', error);
  }
}

// Routes
// GET all media
app.get('/api/v1/media/all', async (req, res) => {
  try {
    const medias = await Media.find();
    res.json(medias);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST upload media
app.post('/api/v1/media/upload', upload.array('videos', 12), async (req, res) => {
  try {
    const { name } = req.body;
    const videoPaths = req.files.map(file => `/${file.path}`);

    // Save uploaded videos to the database
    const newMedia = new Media({
      name,
      videos: videoPaths
    });
    await newMedia.save();

    // Convert uploaded videos to audio and store in the database
    const audioPromises = videoPaths.map((videoPath) => {
      return new Promise(async (resolve, reject) => {
        try {
          const videoFullPath = path.join(__dirname, videoPath);
          const audioOutput = path.join(__dirname, 'audios', path.basename(videoPath).replace(/\.[^.]+$/, '.mp3'));

          console.log(`Converting video: ${videoFullPath} to audio: ${audioOutput}`);

          ffmpeg(videoFullPath)
            .on('end', async () => {
              const audioPath = `/audios/${path.basename(audioOutput)}`;
              const newAudio = new Audio({
                mediaId: newMedia._id,
                audioPath
              });

              try {
                await newAudio.save();
                console.log(`Saved audio: ${audioPath}`);
                resolve(newAudio);
              } catch (dbError) {
                console.error('Error saving audio to database:', dbError);
                reject(dbError);
              }

              // Transcribe the audio and save transcription
              const textFilePath = path.join(__dirname, 'transcriptions', `${path.basename(videoPath, path.extname(videoPath))}.txt`);
              await transcribeVideo(audioOutput, textFilePath, newMedia._id);
            })
            .on('error', (error) => {
              console.error('Error during FFmpeg processing:', error);
              reject(error);
            })
            .save(audioOutput);
        } catch (error) {
          console.error('Error processing video:', error);
          reject(error);
        }
      });
    });

    await Promise.all(audioPromises);

    res.json(newMedia);
  } catch (err) {
    console.error('Error in /api/v1/media/upload route:', err);
    res.status(500).send('Server Error');
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audios', express.static(path.join(__dirname, 'audios')));
app.use('/transcriptions', express.static(path.join(__dirname, 'transcriptions')));
app.use('/files', express.static(path.join(__dirname, 'files')));

// Additional code for PDFs
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const pdfUpload = multer({ storage: pdfStorage });

const pdfSchema = new mongoose.Schema({
  title: { type: String, required: true },
  pdf: { type: String, required: true }
});
const PdfModel = mongoose.model("pdfDetails", pdfSchema);

app.post("/upload-files", pdfUpload.single("file"), async (req, res) => {
  console.log("File upload request received");
  console.log("Uploaded file:", req.file);
  const title = req.body.title;
  const fileName = req.file.filename;
  try {
    await PdfModel.create({ title: title, pdf: fileName });
    console.log("File saved to database:", fileName);
    res.send({ status: "ok" });
  } catch (error) {
    console.error("Error saving file to database:", error);
    res.json({ status: error });
  }
});

app.get("/get-files", async (req, res) => {
  console.log("Get files request received");
  try {
    const data = await PdfModel.find({});
    console.log("Files retrieved from database:", data);
    res.send({ status: "ok", data: data });
  } catch (error) {
    console.error("Error retrieving files from database:", error);
    res.json({ status: error });
  }
});

// User registration
app.post("/register", async (req, res) => {
  console.log("User registration request received");
  const { email, password } = req.body;
  try {
    const newUser = new UserModel({ email, password });
    await newUser.save();
    console.log("New user registered:", email);
    res.send({ status: "ok" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.json({ status: error });
  }
});

// User login
app.post("/login", async (req, res) => {
  console.log("User login request received");
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email, password });
    if (user) {
      console.log("User logged in:", email);
      res.send({ status: "ok", user: user });
    } else {
      console.log("Invalid credentials for user:", email);
      res.send({ status: "error", message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Error during user login:", error);
    res.json({ status: error });
  }
});

// Ensure directories exist
const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirectoryExistence(path.join(__dirname, 'uploads'));
ensureDirectoryExistence(path.join(__dirname, 'audios'));
ensureDirectoryExistence(path.join(__dirname, 'transcriptions'));
ensureDirectoryExistence(path.join(__dirname, 'files'));

// Start Server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
