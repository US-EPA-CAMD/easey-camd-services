import * as Handlebars from 'handlebars';

export function registerSubmissionHelpers() {
  // Register the eq helper
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Register the notEquals helper
  Handlebars.registerHelper('notEquals', function(a, b) {
    return a !== b;
  });
}