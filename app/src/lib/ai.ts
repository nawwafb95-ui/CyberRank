export type AiFeedback = { type: 'summary' | 'hint'; text: string };

export async function requestAiFeedback(_args: { question: string; userAnswer: string | null; isCorrect: boolean }): Promise<AiFeedback> {
  await new Promise(r => setTimeout(r, 350));
  return _args.isCorrect
    ? { type: 'summary', text: 'Nice work! You captured the key concept correctly.' }
    : { type: 'hint', text: 'Consider which security property is being addressed.' };
}


