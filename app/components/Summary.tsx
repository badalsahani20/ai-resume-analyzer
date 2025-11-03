import ScoreGauge from "./ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";

type CategoryProps = {
  title: string;
  score: number;
};

const Category = ({ title, score }: CategoryProps) => {
  const getScoreColor = () => {
    if (score > 70) return "text-green-600";
    if (score > 49) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
          <ScoreBadge score={score} />
        </div>
        <p className="text-2xl">
          <span className={getScoreColor()}>{score}</span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row items-center p-4 gap-8">
        <ScoreGauge score={feedback.overallScore} />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your Resume Score</h2>
          <p className="text-sm text-gray-500">
            This score is calculated on the variables listed below.
          </p>
        </div>
      </div>

      <Category title="Tone & style" score={feedback.toneAndStyle.score} />
      <Category title="Content" score={feedback.content.score} />
      <Category title="Skills" score={feedback.skills.score} />
      <Category title="Structure" score={feedback.structure.score} />
    </div>
  );
};

export default Summary;
