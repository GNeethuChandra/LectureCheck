import axios from 'axios';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import './upload.css';

function Upload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState("");
  const [allPdf, setAllPdf] = useState(null);
  const [similarityScore, setSimilarityScore] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    getPdf();
  }, []);

  const getPdf = async () => {
    try {
      const result = await axios.get("http://localhost:5000/get-files");
      setAllPdf(result.data.data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
  };

  const submitPdf = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);
    try {
      const result = await axios.post(
        "http://localhost:5000/upload-files",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (result.data.status === "ok") {
        alert("Uploaded Successfully!!!!!");
        setSimilarityScore(result.data.similarityScore);
        getPdf(); // Refresh the list of PDFs after successful upload
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF. Please try again.');
    }
  };

  const deletePdf = async (pdfId) => {
    try {
      const result = await axios.delete(`http://localhost:5000/delete-file/${pdfId}`);
      if (result.data.status === "ok") {
        alert("Deleted Successfully!!!!!");
        setAllPdf(allPdf.filter((pdf) => pdf._id !== pdfId)); // Update state to remove the deleted PDF
      } else {
        alert('Error deleting PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      alert('Error deleting PDF. Please try again.');
    }
  };

  const showPdf = (pdf) => {
    window.open(`http://localhost:5000/files/${pdf}`, "_blank", "noreferrer");
  };

  const handleBack = () => {
    navigate('/uploadvd');
  };
  const handleNext = () => {
    navigate('/similarity-score', { state: { similarityScore } });
  };

  return (
    <div className="App">
      <form className="formStyle" onSubmit={submitPdf}>
        <h4>Upload PDF</h4><br/>
        <input
          type="text"
          className="form-control"
          placeholder="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br/>
        <input
          type="file"
          className="form-control"
          accept="application/pdf"
          required
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br/>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-primary" type='submit'>
            Submit
          </button>
          <button 
            className="btn btn-orangishyellow" 
            onClick={handleBack}
            style={{ backgroundColor: '#ffc107', color: 'black', border: 'none' }}
          >
            Back
          </button>
          <button
            className="btn btn-success"
            type="button"
            onClick={handleNext}
            disabled={similarityScore === null} // Disable until similarity score is available
          >
            Next
          </button>
        </div>
      </form>

      <div className='uploaded'>
        <h4>Uploaded PDFs:</h4>
        <div className='output-div'>
          {allPdf === null
            ? "loading"
            : allPdf.map((data) => (
              <div className='inner-div' key={data._id} style={{ marginBottom: '20px' }}>
                <button 
                  className='btn btn-primary' 
                  onClick={() => showPdf(data.pdf)}
                >
                  Show PDF
                  <span 
                    className='delete-icon' 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      deletePdf(data._id); 
                    }}
                  >
                    x
                  </span>
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Upload;
