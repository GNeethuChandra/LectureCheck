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
app.use(express.static('public'));
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const dbURI = 'mongodb+srv://golusulaneethuchandra:meenag@cluster0.uj8kyom.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const ASSEMBLYAI_API_KEY = 'c41ebdf0831e43e2a699f76d980d4ef8'; // Replace with your actual AssemblyAI API key
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

app.get('/api/v1/media/all', async (req, res) => {
  try {
    const medias = await Media.find();
    res.json(medias);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


 // Transcription function using AssemblyAI
 async function transcribeAudio(audioFilePath, mediaId) {
   try {
     // Read audio file as a buffer
     const audioBuffer = fs.readFileSync(audioFilePath);

     // Upload the audio file to AssemblyAI
     const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioBuffer, {
       headers: {
         'authorization': ASSEMBLYAI_API_KEY,
         'content-type': 'application/octet-stream',
       }
     });

     const audioUrl = uploadResponse.data.upload_url;

     // Request transcription
     const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
       audio_url: audioUrl
     }, {
       headers: {
         'authorization': ASSEMBLYAI_API_KEY,
         'content-type': 'application/json',
       }
     });

     const transcriptId = transcriptResponse.data.id;

     // Poll for transcription completion
     let transcriptStatus = 'processing';
     let transcriptText = '';
     while (transcriptStatus === 'processing') {
       await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
       const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
         headers: {
           'authorization': ASSEMBLYAI_API_KEY,
         }
       });
       transcriptStatus = statusResponse.data.status;
       transcriptText = statusResponse.data.text;
     }

     // Save the transcription to the database
     if (transcriptStatus === 'completed') {
       const newTranscription = new Transcription({
         mediaId: mediaId,
         transcription: transcriptText
       });

       await newTranscription.save();
       console.log(`Saved transcription: ${transcriptText}`);

       const transcriptionFilePath = path.join(__dirname, 'transcription', `${path.basename(audioFilePath, '.mp3')}.txt`);
      fs.writeFileSync(transcriptionFilePath, transcriptText);
      console.log(`Transcription saved to file: ${transcriptionFilePath}`);
     } else {
       console.error('Transcription failed:', transcriptStatus);
     }
   } catch (error) {
     console.error('Error during transcription:', error);
   }
 }

 // POST upload videos route
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

                 // Transcribe audio to text using AssemblyAI
                 await transcribeAudio(audioOutput, newMedia._id);
               } catch (dbError) {
                 console.error('Error saving audio to database:', dbError);
                 reject(dbError);
               }
             })
             .on('error', (error) => {
               console.error('Error during FFmpeg processing:', error);
               reject(error);
             })
             .save(audioOutput);
         } catch (error) {
           console.error('Error during video to audio conversion:', error);
           reject(error);
         }
       });
     });

     await Promise.all(audioPromises);
     res.json({ message: 'Videos uploaded and processed successfully', media: newMedia });
   } catch (err) {
     console.error(err.message);
     res.status(500).send('Server Error');
   }
 });

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/audios', express.static(path.join(__dirname, 'audios')));
app.use('/transcription', express.static(path.join(__dirname, 'transcription')));
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
ensureDirectoryExistence(path.join(__dirname, 'transcription'));
ensureDirectoryExistence(path.join(__dirname, 'files'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

