// Template ID Constants (template_id values in camdecmpsaux.email_template)

export const EMAIL_TEMPLATE_IDS = {
  SUBMISSION_CONFIRMATION: 200,
  SUBMISSION_FEEDBACK: 201,
  SUBMISSION_FAILURE_USER: 202,
  SUBMISSION_FAILURE_SUPPORT: 203,
  EVALUATION_QUEUEING_FAILURE_USER: 204,
  EVALUATION_QUEUEING_FAILURE_SUPPORT: 205,
  MASS_EVALUATION: 206,
  MATS_SUBMISSION: 207,
  SUBMISSION_QUEUEING_FAILURE_USER: 208,
  SUBMISSION_QUEUEING_FAILURE_SUPPORT: 209,
} as const;

// Type for template ID validation
export type EmailTemplateId = typeof EMAIL_TEMPLATE_IDS[keyof typeof EMAIL_TEMPLATE_IDS];

// Handlebars partials configuration for different template types
export const EMAIL_TEMPLATE_PARTIALS = {
  SUBMISSION_FEEDBACK: {
    basePath: 'templates/email/submissions/feedback/partials',
    partials: ['ADMNOVR', 'CRIT1', 'CRIT2', 'INFORM', 'NONCRIT', 'NONE'],
  },
  // Add other template types and their partials as needed
} as const;

// Type for partials configuration
export type EmailTemplatePartialsConfig = typeof EMAIL_TEMPLATE_PARTIALS;