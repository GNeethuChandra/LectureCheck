import axios from 'axios';
import React, { useEffect, useState } from 'react';

const PdfTextDisplay = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('/get-files');
        if (response.data.status === 'ok') {
          setFiles(response.data.data);
        } else {
          console.error('Error fetching files:', response.data.status);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div>
      <h1>PDF Files and Text</h1>
      {files.map(file => (
        <div key={file._id}>
          <h2>{file.title}</h2>
          <p>{file.text}</p>
        </div>
      ))}
    </div>
  );
};

export default PdfTextDisplay;
