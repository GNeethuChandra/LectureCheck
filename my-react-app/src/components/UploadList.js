import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URI = 'http://localhost:5000';

const UploadList = () => {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [medias, setMedias] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedias();
  }, []);

  const fetchMedias = async () => {
    try {
      const response = await axios.get(`${BACKEND_URI}/api/v1/media/all`);
      setMedias(response.data);
    } catch (error) {
      console.error('Error fetching medias:', error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) {
      alert('Please select a file and enter a title.');
      return;
    }

    const formData = new FormData();
    formData.append('videos', selectedFile);
    formData.append('name', title);

    try {
      await axios.post(`${BACKEND_URI}/api/v1/media/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Video uploaded successfully.');
      fetchMedias();
      setTitle('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video. Please try again.');
    }
  };

  const handleNext = () => {
    navigate('/upload');
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-6">
          <h2>Upload Video</h2>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title:</label>
            <input type="text" id="title" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="file" className="form-label">Choose a video file:</label>
            <input type="file" id="file" className="form-control" onChange={handleFileChange} />
          </div>
          <div className="d-flex justify-content-between">
            <button className="btn btn-primary" onClick={handleUpload}>Upload</button>
            <button className="btn btn-secondary" style={{ backgroundColor: '#ffc107', color: 'black', border: 'none' }} onClick={handleNext}>Next</button>
          </div>
        </div>
        <div className="col-md-6">
          <h2>Uploaded Videos</h2>
          <div className="video-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <div className="list-group">
              {medias && medias.length > 0 ? (
                medias.map((media) => (
                  <div key={media._id} className="list-group-item">
                    <h5 className="mb-1">Title: {media.name}</h5>
                    <div className="video-wrapper">
                      <video width="100%" height="auto" controls>
                        <source src={`${BACKEND_URI}${media.videos[0]}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                ))
              ) : (
                <p>No uploads available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadList;

