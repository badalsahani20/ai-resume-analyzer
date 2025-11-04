import React, { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

// Define types for our data
interface AnalysisData {
  id: string;
  resumePath: string;
  imagePath: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  feedback: any;
}

interface UploadedFile {
  path: string;
  [key: string]: any;
}

const Upload = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }): Promise<void> => {
    setIsProcessing(true);
    try {
      // Step 1: Upload PDF
      setStatusText("Getting Started...");
      setStatusText("📤 Uploading your resume...");
      const uploadedFile = await fs.upload([file]);

      if (!uploadedFile) {
        setStatusText("❌ Failed to upload resume");
        return;
      }

      // Step 2: Convert PDF to Image
      setStatusText("🔄 Converting PDF to preview image...");
      const imageFile = await convertPdfToImage(file);

      if (!imageFile.file) {
        setStatusText("❌ Failed to convert PDF to image");
        return;
      }

      // Step 3: Upload Image
      setStatusText("📤 Uploading preview image...");
      const uploadedImage = await fs.upload([imageFile.file]);

      if (!uploadedImage) {
        setStatusText("❌ Failed to upload preview image");
        return;
      }

      // Step 4: Prepare Data
      setStatusText("💾 Preparing your data...");
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: "",
      };

      // Step 5: Store Initial Data
      setStatusText("💾 Saving your information...");
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // Step 6: AI Analysis
      setStatusText("🤖 Analyzing your resume with AI...");
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobTitle, jobDescription })
      );

      if (!feedback) {
        setStatusText("❌ Failed to analyze resume");
        return;
      }

      // Step 7: Process Feedback
      setStatusText("📊 Processing analysis results...");
      const feedbackText =
        typeof feedback.message.content === "string"
          ? feedback.message.content
          : feedback.message.content[0].text;

      data.feedback = JSON.parse(feedbackText);

      // Step 8: Store Final Data
      setStatusText("💾 Saving analysis results...");
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // Step 9: Complete
      setStatusText("✅ Analysis complete! Redirecting to results...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief pause for user to read
      setIsProcessing(false);
      navigate(`/resume/${uuid}`);
    } catch (error) {
      setStatusText("❌ Something went wrong. Please try again.");
      setError(error as string);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) {
      alert("Please select a file first");
      return;
    }

    // Validate required fields
    if (!companyName?.trim() || !jobTitle?.trim() || !jobDescription?.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Handle file upload;
    try {
      await handleAnalyze({ companyName, jobTitle, jobDescription, file });
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                className="w-full"
                alt="Processing resume"
              />
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">
                  Please wait while we process your resume...
                </div>
              </div>
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}

          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
              noValidate
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  required
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  required
                ></textarea>
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button
                className="primary-button hover:transform hover:scale-105 transition duration-300"
                type="submit"
                disabled={!file}
              >
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
