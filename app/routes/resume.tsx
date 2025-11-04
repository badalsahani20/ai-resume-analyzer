import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router'
import ATS from '~/components/ATS';
import Details from '~/components/Details';
import Summary from '~/components/Summary';
import { usePuterStore } from '~/lib/puter';


export const meta = () => ([
    {title: 'Resumind | Review' },
    {name: 'Description', content: 'Detailed feedback for your resume'},
])
const Resume = () => {
    const {id} = useParams();
    const {auth, isLoading, fs, kv} = usePuterStore();
    const[imageUrl,setImageUrl] = useState<string | null>();
    const[resumeUrl,setResumeUrl] = useState<string | null>();
    const[feedback, setFeedback] = useState<Feedback | null>();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading &&!auth.isAuthenticated){
            navigate(`/auth?next=/resume/${id}`);
        }
    }, [auth.isAuthenticated, navigate]);

    useEffect(() => {
        const loadResume = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // ✅ Load from KV
                const resume = await kv.get(`resume:${id}`);

                if(!resume) {
                    setError("Resume not found");
                    return;
                }

                const data = JSON.parse(resume);

                // ✅ Load PDF
                if (data.resumePath) {
                    const resumeBlob = await fs.read(data.resumePath);
                    if(resumeBlob) {
                        const pdfBlob = new Blob([resumeBlob], {type: 'application/pdf'});
                        const resumeUrl = URL.createObjectURL(pdfBlob);
                        setResumeUrl(resumeUrl);
                    }
                }

                // ✅ Load Image
                if (data.imagePath) {
                    const imageBlob = await fs.read(data.imagePath);
                    if(imageBlob) {
                        const imageUrl = URL.createObjectURL(imageBlob);
                        setImageUrl(imageUrl);
                    } else {
                        console.log("❌ No image blob found");
                    }
                } else {
                    console.log("❌ No image path in data");
                }

                // ✅ Load Feedback
                if (data.feedback) {
                    setFeedback(data.feedback);
                }

            } catch (err) {
                setError("Failed to load resume data");
            } finally {
                setLoading(false);
            }
        }
        
        if (id) {
            loadResume();
        }
    }, [id, kv, fs]);

  return (
    <main className='pt-0!'>
        <nav className='resume-nav'>
            <Link to={'/'} className='back-button'>
                <img src="/icons/back.svg" alt="logo" className='w-2.5 h-2.5' />
                <span className='text-gray-800 text-sm font-semibold'>Back to Homepage</span>
            </Link>
        </nav>
        <div className='flex flex-row w-full max-lg:flex-col-reverse'>
            <section className="feedback-section bg-url('/images/bg-small.svg') bg-cover h-screen sticky top-0 items-center justify-center">
                {imageUrl && resumeUrl && (
                    <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit'>
                        <a href={resumeUrl} target='_blank' rel='noopener noreferrer'>
                            <img src={imageUrl} alt="resume" title='resume' className='w-full h-full object-contain rounded-2xl'/>
                        </a>
                    </div>
                )}
            </section>
            <section className='feedback-section'>
                <h2 className='text-4xl text-black font-bold'>Resume Review</h2>
                {feedback ? (
                    <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>
                        <Summary feedback={feedback} />
                        <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                        <Details feedback={feedback} />
                    </div>
                ) : (
                    <img src="/images/resume-scan-2.gif" className='w-full' alt="gif" />
                )}
            </section>
        </div>
    </main>
  )
}

export default Resume