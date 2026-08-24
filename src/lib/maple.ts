export function isMapleCompany(value?: string | null) {
  if (typeof value !== "string") {
    return false;
  }

  return value.trim().toLowerCase().includes("maple");
}

export function shouldSendMapleEmployerEmail(jobCompany?: string | null, employerCompanyName?: string | null) {
  return isMapleCompany(jobCompany) || isMapleCompany(employerCompanyName);
}
