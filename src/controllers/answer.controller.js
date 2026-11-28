// Translates between HTTP and the answer service. No SQL, no business rules.
const { matchedData } = require('express-validator');
const answerService = require('../services/answer.service');

function toAnswerJson(answer) {
  return {
    answer_id: answer.answer_id,
    question_id: answer.question_id,
    choice_id: answer.choice_id,
    answer_status: answer.answer_status,
    elapsed_ms: answer.elapsed_ms,
    submitted_at: answer.submitted_at,
  };
}

async function submit(req, res) {
  const { code } = matchedData(req, { locations: ['params'] });
  const data = matchedData(req, { locations: ['body'] });
  const answer = await answerService.submitAnswer(code, data, req.user);
  res.status(201).json({ answer: toAnswerJson(answer) });
}

module.exports = { submit };
