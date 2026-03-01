/**
 * Message entity for task communication
 * @typedef {Object} Message
 * @property {string} id - Firestore document ID
 * @property {string} task_id - Associated task ID
 * @property {string} task_title - Associated task title
 * @property {string} sender_email - Email of message sender
 * @property {string} sender_name - Name of message sender
 * @property {string} recipient_email - Email of message recipient
 * @property {string} recipient_name - Name of message recipient
 * @property {string} message - Message content
 * @property {string} created_date - ISO timestamp
 * @property {boolean} read - Whether message has been read
 */

export const Message = {
  // Fields that define a message
  fields: [
    'task_id',
    'task_title',
    'sender_email',
    'sender_name',
    'recipient_email',
    'recipient_name',
    'message',
    'created_date',
    'read'
  ]
};
