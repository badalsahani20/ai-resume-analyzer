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
  feedback: any; // You can replace 'any' with a more specific type
}

interface UploadedFile {
  path: string;
  // Add other properties that fs.upload returns
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
    console.log("🎯 handleAnalyze started");
    setIsProcessing(true);
    try {
      // Step 1: Upload PDF
      setStatusText("📤 Uploading your resume...");
      const uploadedFile = await fs.upload([file]);
      console.log("✅ File uploaded:", uploadedFile);

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
      console.log("✅ Uploaded Image");

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
      console.error(error);
      setError(error as string);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    console.log("✅ handleSubmit started");

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    console.log("📝 Form data:", {
      companyName,
      jobTitle,
      jobDescription,
      file: file ? file.name : "No file",
    });

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
      console.log("✅ handleAnalyze completed");
    } catch (error) {
      console.error("❌ handleAnalyze failed:", error);
    }
  };

  return (
    <main className="bg-[url('images/bg-main.svg')] bg-cover">
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

// Java Developer – Full Time

// 📍 Location: Bangalore / Remote
// 🕒 Experience: 0–2 years
// 🏢 Company: TechNova Solutions Pvt. Ltd.

// About the Role

// We are seeking a highly motivated Java Developer to join our engineering team. You will be responsible for designing, developing, and maintaining scalable backend applications using Java and modern frameworks. This is an excellent opportunity to grow in a fast-paced, product-focused environment and work with cutting-edge technologies.

// Responsibilities

// Develop and maintain backend services using Java, Spring Boot, and REST APIs

// Collaborate with cross-functional teams including UI, QA, DevOps, and Product

// Participate in the full SDLC: design, coding, testing, deployment, and maintenance

// Write clean, efficient, and well-documented code

// Troubleshoot and debug production issues

// Work with databases like MySQL / PostgreSQL / MongoDB

// Implement secure, scalable, and high-performance backend systems

// Participate in code reviews and contribute to team knowledge sharing

// Required Skills

// Solid understanding of Core Java, OOPs, Collections, Multithreading

// Hands-on experience with Spring Boot

// Experience building REST APIs

// Familiarity with SQL & relational databases

// Understanding of Git / CI-CD pipelines

// Knowledge of Data Structures & Algorithms

// Good problem-solving and debugging skills

// Good to Have

// Knowledge of Microservices Architecture

// Experience with Docker / Kubernetes / Cloud (AWS/GCP/Azure)

// Familiarity with JUnit / Mockito

// Frontend basics (React/Angular) – not required but a plus

// Education

// Bachelor's degree in Computer Science, Engineering, or related field (B.Tech/BCA/MCA preferred)

// Why Join Us

// Work on real-world scalable products

// Mentorship from senior engineers

// Learning & growth culture

// Hybrid/Remote work flexibility

// Health insurance & employee benefits

// If you're passionate about solving real-world engineering challenges and eager to build high-impact products, we'd love to meet you!

// 📧 Apply at: careers@technova.com

// 🌐 Website: www.technova.com
// ffd9e240-9664-4679-a611-2a0ce2a92bba
