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

    try {
      setIsProcessing(true);
      setStatusText("Starting analysis...");
      console.log("✅ State updated: isProcessing = true");

      // Validate Puter.js services with proper type checking
      if (!fs?.upload || !ai?.feedback || !kv?.set) {
        throw new Error("Puter.js services not properly initialized");
      }

      // Step 1: File Upload
      setStatusText("Uploading the file...");
      console.log("📤 Attempting file upload...");
      console.log("📄 File details:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      const uploadedFile = await fs.upload([file]);
      console.log("✅ File upload result:", uploadedFile);

      if (!uploadedFile || typeof uploadedFile !== 'object') {
        throw new Error("File upload returned invalid response");
      }

      // Type assertion for uploaded file
      const uploadedFileWithPath = uploadedFile as UploadedFile;
      if (!uploadedFileWithPath.path) {
        console.error("❌ Uploaded file missing path:", uploadedFile);
        throw new Error("Uploaded file missing path property");
      }

      console.log("✅ File uploaded successfully. Path:", uploadedFileWithPath.path);
      setStatusText("File uploaded successfully!");

      // Step 2: PDF to Image Conversion
      setStatusText("Converting PDF to image...");
      console.log("🔄 Starting PDF to image conversion...");

      const imageFile = await convertPdfToImage(file);
      console.log("✅ PDF conversion result:", imageFile);

      if (!imageFile?.file || !(imageFile.file instanceof File)) {
        throw new Error("Failed to convert PDF to image - invalid file returned");
      }

      console.log("✅ Image conversion successful. File:", {
        name: imageFile.file.name,
        type: imageFile.file.type,
        size: imageFile.file.size
      });

      // Step 3: Upload Image
      setStatusText("Uploading converted image...");
      console.log("📤 Attempting image upload...");

      const uploadedImage = await fs.upload([imageFile.file]);
      console.log("✅ Image upload result:", uploadedImage);

      if (!uploadedImage || typeof uploadedImage !== 'object') {
        throw new Error("Image upload returned invalid response");
      }

      const uploadedImageWithPath = uploadedImage as UploadedFile;
      if (!uploadedImageWithPath.path) {
        throw new Error("Image upload returned no path");
      }

      console.log("✅ Image uploaded successfully. Path:", uploadedImageWithPath.path);

      // Step 4: Prepare Data
      setStatusText("Preparing data...");
      console.log("💾 Preparing data for storage...");

      const uuid = generateUUID();
      const data: AnalysisData = {
        id: uuid,
        resumePath: uploadedFileWithPath.path,
        imagePath: uploadedImageWithPath.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: "",
      };

      console.log("📊 Data to store:", data);

      // Step 5: Store Initial Data
      await kv.set(`resume-${uuid}`, JSON.stringify(data));
      console.log("✅ Initial data stored in KV");

      // Step 6: AI Analysis
      setStatusText("Analyzing resume with AI...");
      console.log("🤖 Starting AI analysis...");

      const feedback = await ai.feedback(
        uploadedFileWithPath.path,
        prepareInstructions({ jobTitle, jobDescription })
      );
      console.log("✅ AI feedback result:", feedback);

      if (!feedback?.message?.content) {
        throw new Error("AI analysis returned no content");
      }

      // Step 7: Process Feedback
      setStatusText("Processing feedback...");
      console.log("📝 Processing AI feedback...");

      let finalFeedback: any;
      try {
        const raw = typeof feedback.message.content === "string"
          ? feedback.message.content
          : (feedback.message.content as any[])?.[0]?.text;

        console.log("📄 Raw feedback text:", raw);

        if (typeof raw === 'string') {
          finalFeedback = JSON.parse(raw);
        } else {
          throw new Error("Feedback content is not a string");
        }
        console.log("✅ Parsed feedback:", finalFeedback);
      } catch (parseError) {
        console.error("❌ JSON parse failed, using raw text", parseError);
        finalFeedback = feedback.message.content;
        console.log("📄 Using raw feedback:", finalFeedback);
      }

      // Step 8: Update Data with Feedback
      const updatedData: AnalysisData = {
        ...data,
        feedback: finalFeedback
      };

      await kv.set(`resume-${uuid}`, JSON.stringify(updatedData));
      console.log("✅ Final data stored in KV");

      // Step 9: Complete
      setStatusText("Analysis complete! Redirecting...");
      console.log("🎉 Analysis complete! Data:", updatedData);

    } catch (error) {
      console.error("❌ Error in handleAnalyze:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setStatusText(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      console.log("🔚 handleAnalyze finished");
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
              <img src="/images/resume-scan.gif" className="w-full" alt="Processing resume" />
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
