from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# Initialize the SentenceTransformer model globally for efficiency
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

@app.route('/api/similarity', methods=['POST'])
def calculate_similarity():
    try:
        data = request.json
        transcription_texts = data.get('transcription_texts')
        pdf_texts = data.get('pdf_texts')

        if not transcription_texts or not pdf_texts:
            return jsonify({'error': 'Both transcription_texts and pdf_texts are required'}), 400

        # Calculate embeddings and cosine similarity
        embeddings = model.encode([transcription_texts, pdf_texts], convert_to_tensor=True)
        cosine_score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()

        return jsonify({'transcription_texts': transcription_texts, 'pdf_texts': pdf_texts, 'similarity_score': cosine_score})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)
