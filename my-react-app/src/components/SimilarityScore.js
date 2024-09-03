import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const SimilarityScore = () => {
  const [similarityScore, setSimilarityScore] = useState(0); // Start from 0 for animation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimilarityScore = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/v1/similarity-score'); // Replace with your backend URL
        const score = response.data.similarity_score * 100; // Convert score to percentage
        setLoading(false);

        // Animate the similarity score from 0 to the fetched score
        let progress = 0;
        const increment = 1; // Increase the score by 1% at a time
        const interval = setInterval(() => {
          progress += increment;
          if (progress >= score) {
            progress = score;
            clearInterval(interval);
          }
          setSimilarityScore(progress);
        }, 20); // Adjust the speed of the animation by changing the interval time
      } catch (error) {
        console.error('Error fetching similarity score:', error);
        setError('Failed to fetch similarity score');
        setLoading(false);
      }
    };

    fetchSimilarityScore();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ width: '200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Similarity Score</h1>
      <CircularProgressbar
        value={similarityScore}
        text={`${similarityScore.toFixed(2)}%`}
        styles={buildStyles({
          pathTransition: "stroke-dashoffset 0.5s ease 0s", // Smooth animation for the progress
          pathColor: `rgba(62, 152, 199, ${similarityScore / 100})`,
          textColor: '#4a4a4a',
          trailColor: '#d6d6d6',
          backgroundColor: '#f8f9fa',
        })}
      />
    </div>
  );
};

export default SimilarityScore;
