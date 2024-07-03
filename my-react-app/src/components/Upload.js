import axios from 'axios';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import './upload.css';

function Upload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState("");
  const [allPdf, setAllPdf] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getPdf();
  }, []);

  const getPdf = async () => {
    try {
      const result = await axios.get("http://localhost:5000/get-files");
      console.log(result.data.data);
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
    console.log(title, file)
    try {
      const result = await axios.post(
        "http://localhost:5000/upload-files",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(result);
      if (result.data.status === "ok") {
        alert("Uploaded Successfully!!!!!");
        // Refresh the list of PDFs after successful upload
        getPdf();
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF. Please try again.');
    }
  };

  const showPdf = (pdf) => {
    window.open(`http://localhost:5000/files/${pdf}`, "_blank", "noreferrer");
  };

  const handleBack = () => {
    navigate('/uploadvd');
  };

  return (
    <div className="App">
      <form className="formStyle" onSubmit={submitPdf}>
        <h4>Upload PDF in React</h4><br/>
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
            style={{ backgroundColor: '#ffc107', color: 'black',border: 'none' }}
          >
            Back
          </button>
        </div>
      </form>

      <div className='uploaded'>
        <h4>Uploaded PDFs:</h4>
        <div className='output-div'>
          {allPdf === null
            ? "loading"
            : allPdf.map((data) => (
              <div className='inner-div' key={data._id}>
                <h6>Title: {data.title}</h6>
                <button className='btn btn-primary' onClick={() => showPdf(data.pdf)}>Show PDF</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Upload;



