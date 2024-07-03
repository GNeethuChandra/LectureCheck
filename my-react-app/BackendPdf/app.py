from flask import Flask, request, jsonify
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa
import os

app = Flask(__name__)

# Load model and processor
processor = WhisperProcessor.from_pretrained("openai/whisper-tiny.en")
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny.en")

# Function to load and preprocess the audio file
def load_audio(file_path):
    audio, sampling_rate = librosa.load(file_path, sr=16000)  # Load and resample to 16kHz
    return audio, sampling_rate

# Function to chunk audio
def chunk_audio(audio, chunk_length=30):
    sampling_rate = 16000
    chunk_length_samples = chunk_length * sampling_rate
    return [audio[i:i + chunk_length_samples] for i in range(0, len(audio), chunk_length_samples)]

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Save the uploaded file
        file_path = os.path.join("uploads", file.filename)
        file.save(file_path)

        # Load and process the audio file
        audio, sampling_rate = load_audio(file_path)
        audio_chunks = chunk_audio(audio)

        full_transcription = []

        # Transcribe each audio chunk
        for chunk in audio_chunks:
            input_features = processor(chunk, sampling_rate=sampling_rate, return_tensors="pt").input_features
            predicted_ids = model.generate(input_features)
            transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
            full_transcription.append(transcription)

        final_transcription = " ".join(full_transcription)

        # Remove the uploaded file after processing
        os.remove(file_path)

        return jsonify({"transcription": final_transcription})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Ensure the 'uploads' directory exists
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(debug=True)
