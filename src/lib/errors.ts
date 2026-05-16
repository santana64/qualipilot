export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides.") {
    super(message, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(message, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Vous devez être connecté.") {
    super(message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Votre role ne permet pas cette action.") {
    super(message, "FORBIDDEN");
  }
}

export class DomainError extends AppError {
  constructor(message = "Action impossible.") {
    super(message, "DOMAIN_ERROR");
  }
}

export class BillingError extends AppError {
  constructor(message = "Votre offre actuelle ne permet pas cette action.") {
    super(message, "BILLING_ERROR");
  }
}

export class EmailError extends AppError {
  constructor(message = "Service email non configuré.") {
    super(message, "EMAIL_ERROR");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Trop de tentatives. Réessayez plus tard.") {
    super(message, "RATE_LIMIT_ERROR");
  }
}

export function toPublicError(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message === "NEXT_REDIRECT") return error.message;
  if (error instanceof Error && !error.name.toLowerCase().includes("prisma") && error.message.length <= 180) {
    return error.message;
  }
  return "Une erreur est survenue. Réessayez ou vérifiez les informations saisies.";
}
