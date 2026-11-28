// A database rule was broken -> what the client should hear.
// The key is the constraint name from YOUR migration. PostgreSQL names a
// foreign key "<table>_<column>_fkey" when the migration does not name it.
// Write one entry for each constraint a client can hit. Example:
//
//   uq_player_nickname: {
//     status: 409,
//     code: 'NICKNAME_TAKEN',
//     message: 'That nickname is already used in this game.',
//   },
//
// A constraint that is not listed here still answers 409, with the code CONFLICT.
module.exports = {
  players_session_id_nickname_unique: {
    status: 409,
    code: 'NICKNAME_TAKEN',
    message: 'That nickname is already used in this game.',
  },
  users_school_id_unique: {
    status: 409,
    code: 'SCHOOL_ID_TAKEN',
    message: 'That school ID is already registered.',
  },
  users_email_unique: {
    status: 409,
    code: 'EMAIL_TAKEN',
    message: 'That email is already registered.',
  },
  uq_answers_player_question: {
    status: 409,
    code: 'ANSWER_ALREADY_SUBMITTED',
    message: 'You have already answered this question.',
  },
  uq_answers_player_occurrence: {
    status: 409,
    code: 'ANSWER_ALREADY_SUBMITTED',
    message: 'You have already answered this question.',
  },
};
