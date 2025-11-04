import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import {ResumeCard} from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const {auth, kv} = usePuterStore();
  const [resumes, setResume] = useState<Resume[] | null>([]);
  const [loadingResume, setLoadingResume] = useState(false);
  const navigate = useNavigate();

  
  useEffect(() => {
    if (!auth.isAuthenticated){
      navigate('/auth?next=/');
    }
  }, [auth.isAuthenticated, navigate]);
  
  useEffect(() => {
      const loadResume = async () => {
        try {
          setLoadingResume(true);
          
          const resumes = (await kv.list('resume:*', true)) as KVItem[];
          const parsedResumes = resumes?.map((resume) => (
            JSON.parse(resume.value) as Resume
          ))
          setResume(parsedResumes || []);
          setLoadingResume(false);
        } catch (error) {
          setLoadingResume(false);
        }
      }
      loadResume();
  }, []);

  return <main className="bg-[url('./images/bg-main.svg')] bg-cover">
    <Navbar />
    <section className='main-section'>
      <div className='page-heading py-16'>
        <h1>Track your Applications and Resume Ratings</h1>
        {!loadingResume && resumes?.length === 0 ? (
          <h2>No resumes found. Upload your first Resume to get Feedback.</h2>
        ): (
          <h2>Review your submissions and get check AI-powered feedback</h2>
        )}
      </div>

      {loadingResume && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-[200px]" alt="" />
        </div>
      )}

      {!loadingResume && resumes && resumes.length > 0 && (
          <div className='resumes-section'>
            {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
            ))
            }
          </div>
      )}

      {!loadingResume && resumes && resumes.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          <Link to="/upload" className="primary-button w-fit text-xl font-semibold">Upload Resume</Link>
        </div>
      )}
    </section>

  </main>
}
