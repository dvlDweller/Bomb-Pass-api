// Answer business rules and authorization.
// The service receives validated data and the authenticated user, never req or res.
const gameSessionRepository = require('../repositories/game-session.repository');
const questionRepository = require('../repositories/question.repository');
const answerRepository = require('../repositories/answer.repository');
const sessionQuestionHistoryRepository = require('../repositories/session-question-history.repository');
const { sequelize } = require('../models');
const { notFound, forbidden, conflict, badRequest } = require('../errors/app-error');

function toAnswerDto(answer) {
  return {
    answer_id: answer.answer_id,
    question_id: answer.question_id,
    choice_id: answer.choice_id,
    answer_status: answer.answer_status,
    elapsed_ms: answer.elapsed_ms,
    submitted_at: answer.submitted_at,
  };
}

async function submitAnswer(code, data, user) {
  const transaction = await sequelize.transaction();
  try {
    const session = await gameSessionRepository.findByJoinCode(code, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!session) {
      throw notFound('SESSION_NOT_FOUND', `Session with join code ${code} not found.`);
    }

    if (session.status === 'ended') {
      throw conflict('SESSION_ENDED', 'This session has ended.');
    }
    if (session.status !== 'playing') {
      throw conflict('SESSION_NOT_PLAYING', 'This session is not currently playing.');
    }
    if (!session.current_question_id || !session.question_started_at) {
      throw conflict('NO_ACTIVE_QUESTION', 'This session does not have an active question.');
    }

    const player = await gameSessionRepository.findPlayerSeat(session.session_id, user.user_id, { transaction });
    if (!player || player.player_status !== 'ACTIVE') {
      throw forbidden('Only an active player in this session may answer.');
    }

    if (data.question_id !== session.current_question_id) {
      throw conflict('NOT_CURRENT_QUESTION', 'The submitted question is not the current question.');
    }

    const question = await questionRepository.findById(session.current_question_id, { transaction });
    if (!question) {
      throw notFound('QUESTION_NOT_FOUND', `Question ${session.current_question_id} not found.`);
    }

    const selectedChoice = (question.choices || []).find((choice) => choice.choice_id === data.choice_id);
    if (!selectedChoice) {
      throw badRequest('INVALID_CHOICE', 'The selected choice does not belong to this question.');
    }

    const startedAt = new Date(session.question_started_at);
    if (Number.isNaN(startedAt.getTime())) {
      throw conflict('NO_ACTIVE_QUESTION', 'This session does not have a valid active question.');
    }
    const elapsedMs = Date.now() - startedAt.getTime();
    if (elapsedMs < 0 || elapsedMs >= question.time_limit_seconds * 1000) {
      throw conflict('NO_ACTIVE_QUESTION', 'The answer window for this question has expired.');
    }

    const occurrence = await sessionQuestionHistoryRepository.findOccurrence(
      session.session_id,
      session.current_cycle_number,
      session.current_question_id,
      { transaction }
    );
    if (!occurrence) {
      throw conflict('NO_ACTIVE_QUESTION', 'This session does not have an active question occurrence.');
    }

    const isCorrect = selectedChoice.choice_index === question.correct_index;
    const answerStatus = isCorrect ? 'CORRECT' : 'INCORRECT';
    const points = isCorrect ? 10 : 0;

    const answer = await answerRepository.createAnswer({
      player_id: player.player_id,
      occurrence_id: occurrence.occurrence_id,
      question_id: question.question_id,
      choice_id: data.choice_id,
      answer_status: answerStatus,
      elapsed_ms: elapsedMs,
    }, { transaction });

    if (points > 0) {
      await player.increment('score', { by: points, transaction });
    }

    await transaction.commit();
    return toAnswerDto(answer);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { submitAnswer };
