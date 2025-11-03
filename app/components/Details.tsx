import ScoreBadge from './ScoreBadge'
import { cn } from '~/lib/utils'
// import { T } from 'node_modules/react-router/dist/development/index-react-server-client-B0vnxMMk.mjs'
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from './Accordion';
// import Accordion from './Accordion'

interface DetailsProps {
  feedback: Feedback
}

interface CategoryHeaderProps {
  title: string
  categoryScore: number
}
const CategoryHeader = ({title, categoryScore}: CategoryHeaderProps) => {
  return (
    <div className='flex flex-row gap-4 items-center py-2'>
      <p className='text-2xl font-semibold'>{title}</p>
      <ScoreBadge score={categoryScore} />
    </div>
  )
};

interface Tip {
  type: "good" | "improve";
  tip: string;
  explanation: string;
}

interface CategoryContentProps {
  tips: Tip[];
}
const CategoryContent = ({tips} : CategoryContentProps) => {
  return (
    <div className='flex flex-col gap-4 items-center w-full'>
      <div className='bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4'>
          {tips.map((tip, index) => (
            <div className='flex flex-row gap-2 items-center' key={index}>
              <img src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"} alt="score" className='size-5' />
              <p className='text-xl text-gray-500'>{tip.tip}</p>
            </div>
          ))}
      </div>
      <div className='flex flex-col gap-4 w-full'>
          {tips.map((tip, index) => (
            <div className={cn("flex flex-col gap-2 rounded-2xl p-4",tip.type === "good" ? "bg-green-50 border border-green-200 text-green-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700")}>
              <div className='flex flex-row gap-2 items-center'>
                <img src={tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"} alt="score" className='size-5' />
                <p>{tip.explanation}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const Details = ({feedback}: DetailsProps) => {
  return (
    <div className='flex flex-col gap-4 w-full'>
      <Accordion>
        <AccordionItem id='tone-style'>
          <AccordionHeader itemId='tone-style'>
            <CategoryHeader title='Tone & Style' categoryScore={feedback.toneAndStyle.score} />
          </AccordionHeader>
          <AccordionContent itemId='tone-style'>
            <CategoryContent tips={feedback.toneAndStyle.tips} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id='content'>
          <AccordionHeader itemId='content'>
            <CategoryHeader title='content' categoryScore={feedback.content.score} />
          </AccordionHeader>
          <AccordionContent itemId='content'>
            <CategoryContent tips={feedback.content.tips} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id='structure'>
          <AccordionHeader itemId='structure'>
            <CategoryHeader title='structure' categoryScore={feedback.structure.score} />
          </AccordionHeader>
          <AccordionContent itemId='structure'>
            <CategoryContent tips={feedback.structure.tips} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id='skills'>
          <AccordionHeader itemId='skills'>
            <CategoryHeader title='skills' categoryScore={feedback.skills.score} />
          </AccordionHeader>
          <AccordionContent itemId='skills'>
            <CategoryContent tips={feedback.skills.tips} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default Details